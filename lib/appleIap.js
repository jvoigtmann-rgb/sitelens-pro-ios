// Apple In-App Purchase client bridge.
//
// The native iOS wrapper (e.g. Capacitor) injects window.SiteLensNative before
// the web app loads. All purchases go through StoreKit via the bridge, and
// entitlements are NEVER taken from client claims — the RevenueCat webhook
// and the server-side apple-subscription-status function are the only sources
// of truth.

// Feature flag — mirrors base44/shared/appleProducts.ts. Flip BOTH together.
export const APPLE_IAP_ENABLED = true;

export function getNativeBridge() {
  if (typeof window === "undefined") return null;
  const bridge = window.SiteLensNative;
  if (bridge && typeof bridge === "object" && bridge.isNative === true) return bridge;
  return null;
}

export function isNativeApp() {
  return getNativeBridge() !== null;
}

export async function purchaseProduct(appleProductId) {
  const bridge = getNativeBridge();
  if (!bridge || typeof bridge.purchase !== "function") {
    throw new Error("Purchases are only available in the SiteLens iOS app.");
  }
  return bridge.purchase(appleProductId);
}

export async function restorePurchases() {
  const bridge = getNativeBridge();
  if (!bridge || typeof bridge.restore !== "function") {
    throw new Error("Restore Purchases is only available in the SiteLens iOS app.");
  }
  return bridge.restore();
}

// Manage Subscription — opens Apple's subscription management screen.
// Prefers the wrapper's native sheet (iOS 15+); falls back to Apple's own
// subscriptions page, which is a permitted link inside the app.
export function manageSubscriptions() {
  const bridge = getNativeBridge();
  if (bridge && typeof bridge.manageSubscriptions === "function") {
    return bridge.manageSubscriptions();
  }
  window.open("https://apps.apple.com/account/subscriptions", "_blank");
  return Promise.resolve();
}

// The wrapper dispatches window events after native purchase/restore activity
// so any screen can react without polling:
//   "sitelens:purchase-completed"  detail: { productIdentifier }
//   "sitelens:purchase-failed"     detail: { productIdentifier, message }
//   "sitelens:restore-completed"   detail: { success }
export function onNativePurchaseEvent(handler) {
  const types = ["sitelens:purchase-completed", "sitelens:purchase-failed", "sitelens:restore-completed"];
  const wrapped = (e) => handler(e.type, e.detail || {});
  types.forEach((t) => window.addEventListener(t, wrapped));
  return () => types.forEach((t) => window.removeEventListener(t, wrapped));
}