import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Check, Sparkles, Loader2, Zap, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import ApplePurchases from "@/components/ApplePurchases";
import { isNativeApp } from "@/lib/appleIap";

const PRO_MONTHLY_REPORTS = 10;
const PRO_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

function computeEntitlement(u) {
  const isPro = u?.plan === "pro";
  const credits = Number(u?.credits || 0);
  const freeReportUsed = u?.free_report_used === true;
  const trialUntil = u?.pro_trial_until ? new Date(u.pro_trial_until).getTime() : 0;
  const inTrial = isPro && trialUntil > 0 && Date.now() < trialUntil;
  const trialUsed = Number(u?.trial_reports_used || 0);
  const periodStart = u?.pro_period_start ? new Date(u.pro_period_start).getTime() : 0;
  const periodExpired = !periodStart || Date.now() - periodStart > PRO_PERIOD_MS;
  const used = periodExpired ? 0 : Number(u?.pro_reports_used || 0);
  return { isPro, credits, freeReportUsed, inTrial, trialUsed, proRemaining: Math.max(0, PRO_MONTHLY_REPORTS - used) };
}

export default function Pricing() {
  const navigate = useNavigate();
  const [ent, setEnt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  // Inside the verified native iOS wrapper, Apple In-App Purchases are shown
  // and the Wix/Base44 web checkout is hidden (App Store guideline 3.1.1).
  const native = isNativeApp();

  useEffect(() => {
    base44.auth.me()
      .then((u) => { setEnt(computeEntitlement(u)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleBuy = async (productId) => {
    setPurchasing(productId);
    try {
      const res = await base44.functions.invoke("create-checkout", { productId });
      if (res?.data?.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Checkout failed", err);
      alert("Could not start checkout. Please try again.");
      setPurchasing(null);
    }
  };

  const products = [
    {
      id: "pro_monthly",
      name: "Pro Monthly",
      price: "$39.99",
      period: "/month",
      tagline: "For professionals",
      type: "subscription",
      trial: "7-day free trial",
      features: [
        "10 AI inspections / month",
        "Full AI defect detection",
        "Severity & risk scoring",
        "Repair-cost estimates",
        "GPS issue mapping",
        "Pro PDF & capital-planning reports",
      ],
      highlight: true,
      cta: "Start free trial",
    },
    {
      id: "report_1",
      name: "1 Extra Report",
      price: "$14.99",
      period: "",
      tagline: "Pay as you go",
      type: "one_time",
      features: ["1 inspection report", "Never expires", "All Pro analysis features", "No subscription"],
      cta: "Buy 1 report",
    },
    {
      id: "report_3",
      name: "3 Extra Reports",
      price: "$29.99",
      period: "",
      tagline: "Best value credits",
      type: "one_time",
      features: ["3 inspection reports", "Save 33% vs single", "Never expires", "All Pro analysis features"],
      cta: "Buy 3 reports",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold">Plans &amp; Credits</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Professional property intelligence, priced for it</p>
        </div>
      </div>

      {/* First-report-free banner */}
      <div className="rounded-xl border border-teal-400/30 bg-teal-400/5 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-teal-400/10 shrink-0">
          <FileText className="w-5 h-5 text-teal-400" />
        </div>
        <p className="text-sm text-foreground">
          <span className="font-semibold">Your first inspection report is free.</span>{" "}
          <span className="text-muted-foreground">See SiteLens build a full report before you ever pay.</span>
        </p>
      </div>

      {/* Entitlement status */}
      {!loading && ent && (
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-teal-400/10">
            <CreditCard className="w-5 h-5 text-teal-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {ent.isPro && ent.inTrial
                ? `Pro trial · ${ent.trialUsed >= 1 ? "trial report used" : "1 report included"}`
                : ent.isPro
                  ? `Pro plan · ${ent.proRemaining}/${PRO_MONTHLY_REPORTS} reports left this month`
                  : ent.freeReportUsed === false && ent.credits <= 0
                    ? "Free plan · 1 free report available"
                    : `Free plan · ${ent.credits} report credits`}
            </p>
            <p className="text-xs text-muted-foreground">
              {ent.isPro && ent.inTrial
                ? "Trial includes 1 inspection; subscribe to keep going with 10/month"
                : ent.isPro
                  ? "Extra reports beyond the monthly allowance use your credits"
                  : "Each inspection uses 1 credit (or your free report)"}
            </p>
          </div>
        </div>
      )}

      {/* Product cards — Apple In-App Purchases inside the verified native iOS
          wrapper; Base44 Payments (Wix) web checkout everywhere else. */}
      {native ? (
        <ApplePurchases />
      ) : (
      <div className="grid md:grid-cols-3 gap-5">
        {products.map((p) => {
          const isCurrentPlan = p.type === "subscription" && ent?.isPro;
          return (
            <div
              key={p.id}
              className={`relative bg-card rounded-2xl border p-6 flex flex-col ${
                p.highlight ? "border-teal-400/50 shadow-lg shadow-teal-400/10" : "border-border"
              }`}
            >
              {p.highlight && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full text-[#0a1628]"
                  style={{ background: "#2dd4bf" }}
                >
                  Most popular
                </span>
              )}
              <div className="mb-4">
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <p className="text-xs text-muted-foreground">{p.tagline}</p>
              </div>
              {p.trial && (
                <p className="text-xs font-semibold mb-1" style={{ color: "#2dd4bf" }}>
                  {p.trial}
                </p>
              )}
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3xl font-bold">{p.price}</span>
                {p.period && <span className="text-sm text-muted-foreground">{p.period}</span>}
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 shrink-0" style={{ color: "#2dd4bf" }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full rounded-xl gap-2"
                disabled={purchasing !== null || isCurrentPlan}
                onClick={() => handleBuy(p.id)}
                variant={p.highlight ? "default" : "outline"}
                style={p.highlight ? { background: "linear-gradient(135deg, #2dd4bf, #14b8a6)", color: "#0a1628" } : {}}
              >
                {purchasing === p.id ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
                ) : isCurrentPlan ? (
                  "Current plan"
                ) : p.highlight ? (
                  <><Sparkles className="w-4 h-4" /> {p.cta}</>
                ) : (
                  <><Zap className="w-4 h-4" /> {p.cta}</>
                )}
              </Button>
            </div>
          );
        })}
      </div>
      )}

      {!native && (
        <p className="text-center text-xs text-muted-foreground">
          Secure checkout powered by Base44 Payments. Pro trial is free for 7 days (1 inspection), then $39.99/month.
        </p>
      )}
    </div>
  );
}
