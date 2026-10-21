import { useEffect, useState } from "react";
import { Check, Loader2, RotateCcw, Settings, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { APPLE_IAP_ENABLED, purchaseProduct, restorePurchases, manageSubscriptions, onNativePurchaseEvent } from "@/lib/appleIap";

const APPLE_PRODUCTS_UI = [
  {
    id: "pro_monthly",
    name: "Pro Monthly",
    price: "$39.99",
    cadence: "/month",
    trial: "7-day free trial",
    highlight: true,
    cta: "Start Free Trial",
    features: [
      "10 AI inspections / month",
      "Full AI defect detection",
      "Repair-cost estimates",
      "GPS issue mapping",
      "Pro PDF & capital reports",
    ],
  },
];

export default function ApplePurchases() {
  const { toast } = useToast();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const refresh = async (sync = false) => {
    try {
      const res = await base44.functions.invoke(
        "apple-subscription-status",
        sync ? { action: "sync" } : {}
      );
      setStatus(res?.data || null);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh(false);
    const off = onNativePurchaseEvent((type) => {
      if (type === "sitelens:purchase-completed" || type === "sitelens:restore-completed") {
        refresh(true);
      }
    });
    return off;
  }, []);

  const handlePurchase = async (id) => {
    setBusy(id);
    try {
      // StoreKit purchase via the native bridge. Entitlement is granted only
      // by the RevenueCat webhook / server sync — never by this response.
      await purchaseProduct(id);
      await refresh(true);
      toast({ title: "Purchase complete", description: "Your access has been updated." });
    } catch (err) {
      toast({
        title: "Purchase not completed",
        description: err?.message || "The purchase was canceled or could not be completed.",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await restorePurchases();
      await refresh(true);
      toast({ title: "Purchases restored", description: "Your access has been re-verified." });
    } catch (err) {
      toast({
        title: "Restore failed",
        description: err?.message || "Could not restore purchases. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Server-verified subscription status */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : status && (status.subscriptionActive || status.credits > 0) ? (
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-teal-400/10 shrink-0">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
          </div>
          <p className="text-sm font-semibold">
            {status.inTrial
              ? `Pro trial · ${status.trialAvailable ? "1 report included" : "trial report used"}`
              : status.subscriptionActive
                ? `Pro (${status.proPeriod === "annual" ? "Annual" : "Monthly"}) · ${status.proRemaining}/10 reports left this period`
                : `Free plan · ${status.credits} report credit${status.credits === 1 ? "" : "s"}`}
            {status.subscriptionActive && status.credits > 0 ? ` · ${status.credits} extra credit${status.credits === 1 ? "" : "s"}` : ""}
          </p>
        </div>
      ) : null}

      {/* Apple product cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {APPLE_PRODUCTS_UI.map((p) => (
          <div
            key={p.id}
            className={`relative bg-card rounded-2xl border p-5 flex flex-col ${
              p.highlight ? "border-teal-400/50 shadow-lg shadow-teal-400/10" : "border-border"
            }`}
          >
            <div className="mb-3">
              <h3 className="font-semibold">{p.name}</h3>
              {p.trial && (
                <p className="text-xs font-semibold" style={{ color: "#2dd4bf" }}>
                  {p.trial}
                </p>
              )}
            </div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold">{p.price}</span>
              {p.cadence && <span className="text-sm text-muted-foreground">{p.cadence}</span>}
            </div>
            <ul className="space-y-1.5 mb-5 flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 shrink-0" style={{ color: "#2dd4bf" }} />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className="w-full rounded-xl gap-2 min-h-[44px]"
              variant={p.highlight ? "default" : "outline"}
              disabled={!APPLE_IAP_ENABLED || busy !== null}
              onClick={() => handlePurchase(p.id)}
            >
              {busy === p.id ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
              ) : (
                <><Sparkles className="w-4 h-4" /> {p.cta}</>
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* Restore Purchases (required by Apple) + Manage Subscription */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="rounded-xl gap-2 min-h-[44px]"
          onClick={handleRestore}
          disabled={restoring}
        >
          {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          {restoring ? "Restoring…" : "Restore Purchases"}
        </Button>
        <Button
          variant="outline"
          className="rounded-xl gap-2 min-h-[44px]"
          onClick={() => manageSubscriptions()}
        >
          <Settings className="w-4 h-4" />
          Manage Subscription
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Payments are processed by Apple through your App Store account. Subscriptions renew automatically until canceled in your App Store settings, at least 24 hours before the period ends.{" "}
        <a className="underline" href="/terms">Terms</a> · <a className="underline" href="/privacy">Privacy</a>
      </p>
    </div>
  );
}