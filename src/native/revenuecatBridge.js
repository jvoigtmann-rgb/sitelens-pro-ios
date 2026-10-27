import { Capacitor } from '@capacitor/core';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { base44 } from '@/api/base44Client';

const API_KEY = import.meta.env.VITE_REVENUECAT_APPLE_PUBLIC_KEY;
const PRODUCT_IDS = [
  'pro_monthly',
  'report_1',
  'report_3'
];
let configured = false;
let identity = null;
function event(type, detail = {}) { window.dispatchEvent(new CustomEvent(type, { detail })); }

async function identify() {
  const user = await base44.auth.me();
  if (!user?.id) throw new Error('Sign in to SiteLens Pro before purchasing.');
  if (identity !== user.id) {
    await Purchases.logIn({ appUserID: String(user.id) });
    identity = user.id;
  }
}
async function setup() {
  if (!configured) {
    if (!API_KEY?.startsWith('appl_')) throw new Error('RevenueCat Apple public key is missing.');
    await Purchases.configure({ apiKey: API_KEY });
    configured = true;
  }
  await identify();
}

// Installed synchronously before React renders, so pricing never shows Wix checkout
// in the native iOS app, even if SDK setup or network calls fail.
export function installNativeBridge() {
  if (Capacitor.getPlatform() !== 'ios' || !Capacitor.isNativePlatform()) return;
  window.SiteLensNative = {
    isNative: true,
    async purchase(productIdentifier) {
      if (!PRODUCT_IDS.includes(productIdentifier) throw new Error('Unknown Apple subscription product.');
      await setup();
      const { offerings } = await Purchases.getOfferings();
      const packages = offerings?.current?.availablePackages || [];
      const selected = packages.find(p => p.product?.identifier === productIdentifier);
      if (!selected) throw new Error('The Apple subscription is not available. Check the RevenueCat offering and App Store Connect.');
      try {
        const result = await Purchases.purchasePackage({ aPackage: selected });
        event('sitelens:purchase-completed', { productIdentifier });
        return result;
      } catch (e) {
        event('sitelens:purchase-failed', { productIdentifier, message: String(e?.message || e) });
        throw e;
      }
    },
    async restore() {
      await setup();
      const result = await Purchases.restorePurchases();
      event('sitelens:restore-completed', { success: true });
      return result;
    },
    async manageSubscriptions() {
      // Capacitor Browser could be used; this opens Apple's own subscription page.
      window.open('https://apps.apple.com/account/subscriptions', '_blank');
    },
  };
}
