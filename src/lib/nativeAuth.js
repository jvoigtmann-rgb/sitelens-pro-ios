import { buildProviderLoginUrl } from "@/lib/nativeEnv";

// Starts Apple/Google sign-in inside the bundled native shell.
//
// The bridge opens the Base44 login URL in ASWebAuthenticationSession; the
// platform returns to https://app.sitelens-pro.com/native-callback, which
// forwards the token to sitelenspro://auth and NativeAuthListener installs it.
export async function startNativeProviderAuth(provider, appId) {
  const bridge = window.SiteLensNative;
  if (!bridge || typeof bridge.openAuthSession !== "function") {
    throw new Error("Sign-in is unavailable in this build. Please update the app.");
  }
  await bridge.openAuthSession(buildProviderLoginUrl(provider, appId));
}

// Tokens are only accepted from our own scheme, never from an arbitrary URL.
export function parseAuthCallbackToken(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "sitelenspro:") return null;
    return parsed.searchParams.get("access_token");
  } catch {
    return null;
  }
}
