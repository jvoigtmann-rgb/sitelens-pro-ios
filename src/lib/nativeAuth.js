import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { buildProviderLoginUrl } from '@/lib/nativeEnv';

// Open native provider login without depending on the RevenueCat purchase bridge.
// The bridge is optional for sign-in, but authentication still requires the
// verified Base44 callback and a valid session token.
export async function startNativeProviderAuth(provider, appId) {
  if (Capacitor.getPlatform() !== 'ios' || !Capacitor.isNativePlatform()) {
    throw new Error('Native sign-in is only available in the iOS app.');
  }
  if (!appId) throw new Error('Base44 app ID is missing.');
  const url = buildProviderLoginUrl(provider, appId);
  await Browser.open({ url });
}

export function parseAuthCallbackToken(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'sitelenspro:' || parsed.hostname !== 'auth') return null;
    return parsed.searchParams.get('access_token');
  } catch {
    return null;
  }
}
