import { base44 } from "@/api/base44Client";
import { isNativeShell } from "@/lib/nativeEnv";

// Signs the user out.
//
// Website: unchanged — the SDK clears the token and clears the server session
// cookie via /api/apps/auth/logout.
//
// Bundled app: that same call navigates the WebView to the website, so the
// local session is dropped here instead and the app reloads on its own bundled
// assets, landing on the login screen. The reload re-initialises the SDK
// without a token.
export function signOut(redirectUrl) {
  if (!isNativeShell()) {
    base44.auth.logout(redirectUrl);
    return;
  }
  try {
    window.localStorage.removeItem("base44_access_token");
    window.localStorage.removeItem("token");
  } catch {
    // storage unavailable — the reload still drops the in-memory session
  }
  window.location.replace("/login");
}
