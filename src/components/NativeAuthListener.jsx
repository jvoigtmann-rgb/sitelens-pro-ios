import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { parseAuthCallbackToken } from "@/lib/nativeAuth";

// Receives the token handed back by the system auth session and installs it as
// the bundled app's session (localStorage + axios Authorization, via setToken).
//
// Bridge contract:
//   window.SiteLensNative.openAuthSession(url) -> Promise
//   window.SiteLensNative.getInitialAuthCallback() -> Promise<string | null>
//   window event "sitelens:auth-callback"  detail: { url }
const RETRY_MS = 200;
const MAX_ATTEMPTS = 10;

export default function NativeAuthListener() {
  const { checkAppState } = useAuth();

  useEffect(() => {
 

    let handled = false;

    const finish = async (url) => {
      if (handled) return;
      const token = parseAuthCallbackToken(url);
      if (!token) return;
      handled = true;
      base44.auth.setToken(token);
      await checkAppState();
      window.location.replace("/");
    };

    // The bridge is injected after the WebView boots and can reject until the
    // plugin is registered, so a cold-start callback is read with retries
    // rather than a single call.
    const readInitialCallback = async () => {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const bridge = window.SiteLensNative;
        if (bridge && typeof bridge.getInitialAuthCallback === "function") {
          try {
            const url = await bridge.getInitialAuthCallback();
            if (url) return url;
          } catch {
            // bridge not ready yet — retry
          }
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
      }
      return null;
    };

    const onCallback = (event) => finish(event.detail?.url);
    window.addEventListener("sitelens:auth-callback", onCallback);
    let nativeListener;

    let listenerCancelled = false;

CapacitorApp.addListener("appUrlOpen", ({ url }) => {
  if (url?.startsWith("sitelenspro://auth")) {
    finish(url);
  }
}).then((listener) => {
  if (listenerCancelled) {
    listener.remove();
  } else {
    nativeListener = listener;
  }
}).catch((error) => {
  console.error("Native auth listener error:", error);
});

  readInitialCallback()
    .then((url) => {
      if (url) finish(url);
    })
    .catch(() => {});

  CapacitorApp.getLaunchUrl()
    .then(({ url }) => {
      if (url?.startsWith("sitelenspro://auth")) {
        finish(url);
      }
    })
    .catch((error) => {
      console.error("Native auth launch URL error:", error);
    });

    // App was already running when the scheme opened (auth session dismissed
    // early): the pending callback shows up once it becomes visible again.
    const onVisible = () => {
      if (handled || document.visibilityState !== "visible") return;
      const bridge = window.SiteLensNative;
      if (!bridge || typeof bridge.getInitialAuthCallback !== "function") return;
      Promise.resolve(bridge.getInitialAuthCallback())
        .then((url) => { if (url) finish(url); })
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("sitelens:auth-callback", onCallback);
      document.removeEventListener("visibilitychange", onVisible);
      listenerCancelled = true;
      nativeListener?.remove();    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
