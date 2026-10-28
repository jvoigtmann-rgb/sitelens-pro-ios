// Absolute web origin for the bundled Capacitor iOS shell.
//
// The native app runs the built bundle from the local asset server
// (capacitor://localhost), so every Base44 URL must be absolute: relative
// `/api/...` requests would hit the asset server, and a relative OAuth
// `from_url` would be rejected as "Domain is not valid".
//
// Every branch here is inert outside the native shell — the website is
// untouched.

export const APP_WEB_ORIGIN = "https://app.sitelens-pro.com";

// https landing page the platform returns to after Apple/Google sign-in.
export const NATIVE_AUTH_CALLBACK = `${APP_WEB_ORIGIN}/native-callback`;

// Custom scheme registered in Info.plist; hands the token back to the app.
export const NATIVE_AUTH_SCHEME = "sitelenspro";

export function isNativeShell() {
  if (typeof window === "undefined") return false;
  const cap = window.Capacitor;
  if (cap && typeof cap.isNativePlatform === "function" && cap.isNativePlatform()) return true;
  // A plain WKWebView wrapper that only injects the bridge.
  return Boolean(window.SiteLensNative && window.SiteLensNative.isNative === true);
}

// Same shape the SDK builds in loginWithProvider(), but absolute and with an
// https from_url on the registered custom domain instead of the WebView origin.
export function buildProviderLoginUrl(provider, appId) {
  const providerPath = provider === "google" ? "" : `/${provider}`;
  return `${APP_WEB_ORIGIN}/api/apps/auth${providerPath}/login`
    + `?app_id=${appId}&from_url=${encodeURIComponent(NATIVE_AUTH_CALLBACK)}`;
}
