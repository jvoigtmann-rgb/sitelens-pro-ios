import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import {
  APPLE_IAP_ENABLED,
  APPLE_ENTITLEMENT_ID,
  PRO_MONTHLY_REPORTS,
  PRO_PERIOD_MS,
  computeAppleAllowance,
  isAppleSubscriptionProduct,
  appleProductPeriod,
} from '../../shared/appleProducts.ts';

// Apple subscription status endpoint for the authenticated Base44 user.
// Actions (payload { action }):
//   "status"  — read the stored, webhook-written entitlement state (default).
//   "sync"    — re-verify against the RevenueCat REST API and persist the
//               verified state. Used by Restore Purchases and after a native
//               purchase; never trusts client purchase claims.
//   "consume" — server-side entitlement check + atomic consumption of one
//               report allowance for Apple subscribers. Gated by the
//               APPLE_IAP_ENABLED feature flag and used by New Inspection so
//               report limits cannot be bypassed through direct API requests.
//
// Account association: the native wrapper uses the Base44 user id as the
// RevenueCat app_user_id, so this function derives identity purely from the
// authenticated session (base44.auth.me()) — never from client-supplied ids.

function parseMs(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && /^\d+$/.test(String(value))) return asNumber;
  const asDate = new Date(value).getTime();
  return Number.isFinite(asDate) ? asDate : 0;
}

async function fetchRevenueCatSubscriber(apiKey, appUserId) {
  const res = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Platform": "ios",
      },
      signal: AbortSignal.timeout(10000),
    }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`RevenueCat API error ${res.status}`);
  const data = await res.json();
  return data?.subscriber || null;
}

const EMPTY_ALLOWANCE = {
  subscriptionActive: false,
  inTrial: false,
  trialAvailable: false,
  trialReportsUsed: 0,
  proRemaining: 0,
  credits: 0,
  proExpiresAt: null,
  proPeriod: "none",
  environment: "PRODUCTION",
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    let payload = {};
    try {
      payload = await req.json();
    } catch {
      payload = {};
    }
    const action = payload.action || "status";

    const existing = await base44.asServiceRole.entities.AppleSubscription.filter({
      base44_user_id: user.id,
    });
    let record = existing[0] || null;

    if (action === "sync") {
      const apiKey = secrets.get("REVENUECAT_REST_API_KEY");
      if (!apiKey) {
        console.error("[apple-status] REVENUECAT_REST_API_KEY secret is not set");
        return Response.json({ error: "Subscription service not configured" }, { status: 503 });
      }
      const subscriber = await fetchRevenueCatSubscriber(apiKey, user.id);
      const now = Date.now();
      const updates = { last_verified_at: new Date().toISOString() };

      const entitlement = subscriber?.entitlements?.[APPLE_ENTITLEMENT_ID];
      const entExpiresMs = parseMs(entitlement?.expires_date);
      if (entitlement && entExpiresMs > now) {
        updates.pro_status = "active";
        updates.pro_expires_at = new Date(entExpiresMs).toISOString();
        if (isAppleSubscriptionProduct(entitlement.product_identifier)) {
          updates.pro_product_id = entitlement.product_identifier;
          updates.pro_period = appleProductPeriod(entitlement.product_identifier);
        }
      } else if (record) {
        updates.pro_status = "expired";
      }

      // Trial detection from the subscription's period type.
      const subscriptions = subscriber?.subscriptions || {};
      for (const subProductId of Object.keys(subscriptions)) {
        if (!isAppleSubscriptionProduct(subProductId)) continue;
        const sub = subscriptions[subProductId];
        const subExpiresMs = parseMs(sub.expires_date);
        const inTrial =
          (sub.period_type === "TRIAL" || sub.period_type === "INTRO") && subExpiresMs > now;
        if (inTrial) {
          updates.pro_status = "trial";
          updates.pro_expires_at = new Date(subExpiresMs).toISOString();
          updates.pro_product_id = subProductId;
          updates.pro_period = appleProductPeriod(subProductId);
        }
        break;
      }

      if (record) {
        record = await base44.asServiceRole.entities.AppleSubscription.update(record.id, updates);
      } else if (updates.pro_status && updates.pro_status !== "expired") {
        record = await base44.asServiceRole.entities.AppleSubscription.create({
          base44_user_id: user.id,
          pro_status: "expired",
          credits: 0,
          trial_reports_used: 0,
          paid_period_reports_used: 0,
          ...updates,
        });
      }
    }

    if (action === "consume") {
      if (!APPLE_IAP_ENABLED) {
        return Response.json({ allowed: false, reason: "apple_iap_disabled" });
      }
      if (user.role === "admin") {
        return Response.json({ allowed: true, source: "admin" });
      }
      if (!record) {
        return Response.json({ allowed: false, reason: "out_of_inspections" });
      }
      const allowance = computeAppleAllowance(record);
      const updates = {};
      let source = null;
      const now = Date.now();

      if (allowance.trialAvailable) {
        updates.trial_reports_used = allowance.trialReportsUsed + 1;
        source = "trial";
      } else if (allowance.subscriptionActive && !allowance.inTrial) {
        const periodStartMs = record.paid_period_started_at
          ? new Date(record.paid_period_started_at).getTime()
          : 0;
        const periodExpired = !periodStartMs || now - periodStartMs > PRO_PERIOD_MS;
        const used = periodExpired ? 0 : Number(record.paid_period_reports_used || 0);
        if (used < PRO_MONTHLY_REPORTS) {
          updates.paid_period_reports_used = periodExpired ? 1 : used + 1;
          if (periodExpired) updates.paid_period_started_at = new Date().toISOString();
          source = "pro";
        }
      }
      if (!source && allowance.credits > 0) {
        updates.credits = allowance.credits - 1;
        source = "credits";
      }
      if (!source) {
        return Response.json({ allowed: false, reason: "out_of_inspections" });
      }
      await base44.asServiceRole.entities.AppleSubscription.update(record.id, updates);
      console.log(`[apple-status] consumed 1 report allowance for ${user.id} from ${source}`);
      return Response.json({ allowed: true, source });
    }

    const allowance = record ? computeAppleAllowance(record) : EMPTY_ALLOWANCE;
    return Response.json({ appleIapEnabled: APPLE_IAP_ENABLED, ...allowance });
  } catch (error) {
    console.error("[apple-status] error:", error?.message || error);
    return Response.json({ error: error?.message || "Status error" }, { status: 500 });
  }
}