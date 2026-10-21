import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import {
  isAppleSubscriptionProduct,
  isAppleConsumableProduct,
  appleProductCredits,
  appleProductPeriod,
} from '../../shared/appleProducts.ts';

// RevenueCat webhook receiver.
// - Authenticated with the Authorization header configured in the RevenueCat
//   dashboard (REVENUECAT_WEBHOOK_AUTH_TOKEN). Fail closed when unset/mismatched.
//   That bearer token is the ONLY authentication requirement; HMAC signing is not
//   enforced (so RevenueCat's signing toggle must stay off, or be left unset).
// - Only POST is accepted (RevenueCat's method). Any other method is answered with
//   405 and logged, so a misconfigured URL is easy to spot in the function logs.
// - Idempotent: RevenueCat retries reuse the same event id; processed ids are kept
//   on the subscriber record and duplicates are skipped.
// - The only accepted user identity is event.app_user_id, which the native wrapper
//   sets to the authenticated Base44 user id. Anonymous ids are skipped.

const RECENT_EVENT_IDS = 50;

function constantTimeEqual(a, b) {
  const x = String(a);
  const y = String(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

export default async function(req) {
  try {
    // Read the raw body once, then parse it as JSON after authentication passes.
    const rawBody = await req.text();
    const method = (req.method || "POST").toUpperCase();
    console.log(`[rc-webhook] ${method} request received (url: ${req.url})`);
    if (method !== "POST") {
      console.warn(`[rc-webhook] rejected: ${method} is not supported`);
      return Response.json(
        {
          error: "Method not allowed",
          method,
          hint: "RevenueCat webhooks must POST to this URL",
        },
        { status: 405 }
      );
    }

    const authToken = secrets.get("REVENUECAT_WEBHOOK_AUTH_TOKEN");
    if (!authToken) {
      console.error("[rc-webhook] REVENUECAT_WEBHOOK_AUTH_TOKEN secret is not set; rejecting event");
      return Response.json({ error: "Webhook not configured" }, { status: 503 });
    }
    const authHeader = req.headers.get("authorization") || "";
    if (!constantTimeEqual(authHeader.trim(), authToken.trim())) {
      console.warn("[rc-webhook] rejected: invalid Authorization header");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const event = body?.event || {};
    const type = event.type;
    if (!type) return Response.json({ error: "Missing event type" }, { status: 400 });
    if (type === "TEST") {
      console.log("[rc-webhook] TEST event acknowledged");
      return Response.json({ received: true });
    }

    // Only process events for our known Apple products.
    const productId = event.product_id;
    const knownProduct = isAppleSubscriptionProduct(productId) || isAppleConsumableProduct(productId);
    if (!knownProduct) {
      console.log(`[rc-webhook] skipping ${type}: unknown product_id ${productId}`);
      return Response.json({ received: true });
    }

    // Bind to a Base44 account. The wrapper sets the RevenueCat app_user_id to
    // the Base44 user id at login; anonymous/unbound ids are never processed.
    const appUserId = event.app_user_id;
    if (!appUserId || String(appUserId).startsWith("$RC")) {
      console.log(`[rc-webhook] skipping ${type}: app_user_id is not a bound Base44 user id`);
      return Response.json({ received: true });
    }

    const base44 = createClientFromRequest(req);
    const users = await base44.asServiceRole.entities.User.filter({ id: appUserId });
    if (!users || users.length === 0) {
      console.log(`[rc-webhook] skipping ${type}: no Base44 user for app_user_id ${appUserId}`);
      return Response.json({ received: true });
    }

    const existing = await base44.asServiceRole.entities.AppleSubscription.filter({
      base44_user_id: appUserId,
    });
    const record = existing[0] || null;

    // Idempotency: RevenueCat retries (same event id) are skipped.
    const eventId = event.id ? String(event.id) : null;
    const seen = record?.processed_event_ids || [];
    if (eventId && seen.includes(eventId)) {
      console.log(`[rc-webhook] duplicate event ${eventId}; ignored`);
      return Response.json({ received: true, duplicate: true });
    }

    const nowIso = new Date().toISOString();
    const expiresIso = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null;
    const periodType = String(event.period_type || "").toUpperCase();
    const updates = {};

    switch (type) {
      case "INITIAL_PURCHASE": {
        if (isAppleSubscriptionProduct(productId)) {
          const trial = periodType === "TRIAL" || periodType === "INTRO";
          updates.pro_product_id = productId;
          updates.pro_period = appleProductPeriod(productId);
          updates.pro_status = trial ? "trial" : "active";
          if (expiresIso) updates.pro_expires_at = expiresIso;
          if (trial) {
            updates.trial_reports_used = 0;
          } else {
            updates.paid_period_reports_used = 0;
            updates.paid_period_started_at = nowIso;
          }
          updates.canceled_at = null;
          updates.billing_issue_at = null;
        } else {
          updates.credits = Number(record?.credits || 0) + appleProductCredits(productId);
        }
        break;
      }
      case "RENEWAL": {
        if (isAppleSubscriptionProduct(productId)) {
          updates.pro_status = "active";
          updates.pro_product_id = productId;
          updates.pro_period = appleProductPeriod(productId);
          if (expiresIso) updates.pro_expires_at = expiresIso;
          // A new billing period resets the 10-report allowance.
          updates.paid_period_reports_used = 0;
          updates.paid_period_started_at = nowIso;
          updates.canceled_at = null;
          updates.billing_issue_at = null;
        }
        break;
      }
      case "PRODUCT_CHANGE": {
        if (isAppleSubscriptionProduct(productId)) {
          updates.pro_product_id = productId;
          updates.pro_period = appleProductPeriod(productId);
        }
        break;
      }
      case "SUBSCRIPTION_EXTENDED": {
        if (isAppleSubscriptionProduct(productId) && expiresIso) updates.pro_expires_at = expiresIso;
        break;
      }
      case "EXPIRATION": {
        updates.pro_status = "expired";
        updates.canceled_at = null;
        updates.billing_issue_at = null;
        break;
      }
      case "CANCELLATION": {
        // Auto-renew turned off or a refund. Do NOT revoke access before the
        // paid period ends — access naturally stops once pro_expires_at passes.
        updates.canceled_at = nowIso;
        if (isAppleConsumableProduct(productId)) {
          // Refunded consumable: claw back the credits it granted.
          updates.credits = Math.max(0, Number(record?.credits || 0) - appleProductCredits(productId));
        } else if (event.expiration_at_ms && event.expiration_at_ms <= Date.now()) {
          updates.pro_status = "expired";
        }
        break;
      }
      case "UNCANCELLATION": {
        updates.canceled_at = null;
        break;
      }
      case "BILLING_ISSUE": {
        // A failed charge is not an expiration — keep access until expiry.
        updates.billing_issue_at = nowIso;
        break;
      }
      case "REFUND_REVERSED":
      case "TRANSFER":
      case "TEMPORARY_ENTITLEMENT_GRANT": {
        // State for these is re-derived on the next purchase/renewal or via the
        // server-side status sync; acknowledge so RevenueCat does not retry.
        console.log(`[rc-webhook] ${type} acknowledged; state re-syncs on next lifecycle event`);
        return Response.json({ received: true });
      }
      default: {
        console.log(`[rc-webhook] ignored unhandled event type ${type}`);
        return Response.json({ received: true });
      }
    }

    updates.environment = event.environment === "SANDBOX" ? "SANDBOX" : "PRODUCTION";
    updates.last_event_at = nowIso;
    if (eventId) updates.processed_event_ids = [...seen, eventId].slice(-RECENT_EVENT_IDS);

    if (record) {
      await base44.asServiceRole.entities.AppleSubscription.update(record.id, updates);
    } else {
      await base44.asServiceRole.entities.AppleSubscription.create({
        base44_user_id: appUserId,
        pro_status: "expired",
        pro_period: "none",
        credits: 0,
        trial_reports_used: 0,
        paid_period_reports_used: 0,
        ...updates,
      });
    }
    console.log(`[rc-webhook] processed ${type} for user ${appUserId} product ${productId}`);
    return Response.json({ received: true });
  } catch (error) {
    console.error("[rc-webhook] error:", error?.message || error);
    return Response.json({ error: error?.message || "Webhook error" }, { status: 500 });
  }
}