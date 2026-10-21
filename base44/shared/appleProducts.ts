// Apple In-App Purchase (RevenueCat) shared configuration.
// Used by: base44/functions/revenuecat-webhook and apple-subscription-status.
// The frontend copy of the flag lives in src/lib/appleIap.js — flip BOTH together.

// Master feature flag. While false, Apple/RevenueCat entitlements never grant
// report access and the Apple purchase UI stays disabled. Enabled for the
// Capacitor iOS build; must be validated with a sandbox purchase before
// resubmitting to the App Store.
export const APPLE_IAP_ENABLED = true;

// RevenueCat entitlement identifier — must match the RevenueCat dashboard.
export const APPLE_ENTITLEMENT_ID = "sitelens_pro_premium";

export const PRO_MONTHLY_REPORTS = 10;
export const TRIAL_REPORTS = 1;
export const PRO_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

// Apple product identifiers — must match App Store Connect and RevenueCat exactly.
// Only products that exist in App Store Connect AND RevenueCat. pro_monthly
// is the confirmed auto-renewable subscription with a 7-day introductory trial.
// Re-add consumable report packs here once they are created in App Store
// Connect and linked in RevenueCat, using their exact Apple product ids.
export const APPLE_PRODUCTS = {
  pro_monthly: { type: "subscription", period: "monthly", priceDisplay: "$39.99", trialDays: 7 },
};

export function isAppleSubscriptionProduct(productId) {
  return !!productId && APPLE_PRODUCTS[productId]?.type === "subscription";
}

export function isAppleConsumableProduct(productId) {
  return !!productId && APPLE_PRODUCTS[productId]?.type === "consumable";
}

export function appleProductCredits(productId) {
  return isAppleConsumableProduct(productId) ? APPLE_PRODUCTS[productId].credits : 0;
}

export function appleProductPeriod(productId) {
  return isAppleSubscriptionProduct(productId) ? APPLE_PRODUCTS[productId].period : null;
}

// Derives the current allowance from a stored AppleSubscription record.
// Access is bound to pro_expires_at, so stale "active" statuses never grant
// access after the paid period ends.
export function computeAppleAllowance(record) {
  const now = Date.now();
  const expiresAtMs = record.pro_expires_at ? new Date(record.pro_expires_at).getTime() : 0;
  const subscriptionActive =
    (record.pro_status === "active" || record.pro_status === "trial") && expiresAtMs > now;
  const inTrial = subscriptionActive && record.pro_status === "trial";
  const trialReportsUsed = Number(record.trial_reports_used || 0);
  let proRemaining = 0;
  if (subscriptionActive && !inTrial) {
    const periodStartMs = record.paid_period_started_at ? new Date(record.paid_period_started_at).getTime() : 0;
    const periodExpired = !periodStartMs || now - periodStartMs > PRO_PERIOD_MS;
    const used = periodExpired ? 0 : Number(record.paid_period_reports_used || 0);
    proRemaining = Math.max(0, PRO_MONTHLY_REPORTS - used);
  }
  return {
    subscriptionActive,
    inTrial,
    trialAvailable: inTrial && trialReportsUsed < TRIAL_REPORTS,
    trialReportsUsed,
    proRemaining,
    credits: Number(record.credits || 0),
    proExpiresAt: record.pro_expires_at || null,
    proPeriod: record.pro_period || "none",
    environment: record.environment || "PRODUCTION",
  };
}