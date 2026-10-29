import { useEffect } from "react";
import { NATIVE_AUTH_SCHEME } from "@/lib/nativeEnv";

// Loaded inside the system auth session (ASWebAuthenticationSession) after
// Apple/Google sign-in. Forwards the freshly issued token to the bundled app
// through the sitelenspro:// scheme.
//
// No trace is left behind: the token is stripped from the address bar before
// the hand-off, the hand-off uses location.replace() so no history entry
// pointing at a custom scheme is kept, and the token is never logged.
export default function NativeAuthCallback() {
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    // app-params.js may already have moved ?access_token into storage.
    const token = search.get("access_token") || window.localStorage.getItem("base44_access_token");
    if (!token) return;
    window.history.replaceState({}, document.title, window.location.pathname);
    window.location.replace(`${NATIVE_AUTH_SCHEME}://auth?access_token=${encodeURIComponent(token)}`);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-6 text-sm text-muted-foreground">
      Completing sign-in…
    </div>
  );
}
