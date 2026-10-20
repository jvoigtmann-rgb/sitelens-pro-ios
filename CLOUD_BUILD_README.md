# SiteLens Pro iOS — cloud build starter

**Status: starter project, not yet verified or ready for App Review.**

Bundle ID: `com.base6a92d4567d7a3a8b4ec54b7b.app`.

## What is included
- Original Base44 React/Vite export and backend source files (backend is still hosted by Base44).
- Capacitor iOS configuration and native RevenueCat purchase/restore bridge.
- Codemagic starter workflow that generates the iOS project in the cloud.

## Before running a build
1. Upload these extracted files to a **private** GitHub repository, not the ZIP itself.
2. Connect the repo in Codemagic; configure Apple Developer signing for the existing bundle ID.
3. Set `VITE_BASE44_APP_ID` and any additional `VITE_BASE44_*` variables required by the exported Base44 app in Codemagic (do not put secret REST keys in client code).
4. Check RevenueCat offering `default` includes the actual Apple `pro_monthly` product.
5. Check the current RevenueCat Capacitor SDK API against the pinned package version; install/compile in CI. Version ranges are provisional and have not been dependency-resolved here.
6. Confirm backend RevenueCat `app_user_id` exactly matches Base44 `user.id`. If the backend expects another identifier, adjust both ends before purchases.
7. Test Apple sign-in in the Capacitor WebView. Base44 OAuth redirects may need a native-compatible redirect flow.
8. Verify all web checkout routes and external checkout links are inaccessible in iOS; server-side rules should not rely on a client flag.
9. Verify privacy policy, terms, price/trial disclosures, account deletion, restore, and subscription management.
10. The original App Store submission was build 2. Ensure new build number > 2 (starter sets 3); adjust if another build has since been uploaded.

## Security and important caveats
- Public RevenueCat `appl_` key is suitable for app distribution. Secret REST and webhook tokens must remain only in Base44 secure server secrets.
- Do not assume that successful native purchase means premium access until the Base44 webhook/sync confirms the matching user.
- Base44 export may depend on hosted auth and Base44 environment values; a successful Vite build does **not** prove sign-in or purchase works.
- Cloud compilation and physical TestFlight tests are still required. No App Store acceptance is guaranteed.
- If a version of RevenueCat's Capacitor SDK exposes different method names or response shapes, revise `src/native/revenuecatBridge.js` accordingly.
