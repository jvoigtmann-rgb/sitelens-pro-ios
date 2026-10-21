import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, FileText, ArrowRight, Building2, AlertTriangle, CheckCircle, MapPin, RefreshCw, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import ReportCard from "../components/ReportCard";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    const user = await base44.auth.me();
    const data = await base44.entities.InspectionReport.filter({ created_by: user.email }, "-created_date", 10);
    setReports(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const { refreshing } = usePullToRefresh(fetchReports);

  const totalIssues = reports.reduce((acc, r) => acc + (r.total_issues || 0), 0);
  const completedCount = reports.filter(r => r.status === "completed").length;
  const [locationCount, setLocationCount] = useState(0);
  const [entitlement, setEntitlement] = useState({ plan: "free", credits: 0, freeReportUsed: false, proRemaining: 10, inTrial: false });

  useEffect(() => {
    base44.auth.me()
      .then((u) => {
        const PRO_MONTHLY_REPORTS = 10;
        const PRO_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
        const periodStart = u?.pro_period_start ? new Date(u.pro_period_start).getTime() : 0;
        const periodExpired = !periodStart || Date.now() - periodStart > PRO_PERIOD_MS;
        const used = periodExpired ? 0 : Number(u?.pro_reports_used || 0);
        const trialUntil = u?.pro_trial_until ? new Date(u.pro_trial_until).getTime() : 0;
        setEntitlement({
          plan: u?.plan || "free",
          credits: Number(u?.credits || 0),
          freeReportUsed: u?.free_report_used === true,
          proRemaining: Math.max(0, PRO_MONTHLY_REPORTS - used),
          inTrial: u?.plan === "pro" && trialUntil > 0 && Date.now() < trialUntil,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    base44.entities.InspectionPhoto.list("-created_date", 500).then(photos => {
      setLocationCount(photos.filter(p => p.lat && p.lng).length);
    });
  }, []);

  const kpis = [
    {
      label: "Total Reports",
      value: reports.length,
      icon: Building2,
      color: "text-teal-400",
      bg: "bg-teal-400/10",
      link: "/reports",
    },
    {
      label: "Completed",
      value: completedCount,
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      link: "/reports",
    },
    {
      label: "Total Issues",
      value: totalIssues,
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      link: "/issues",
    },
    {
      label: "Locations",
      value: locationCount,
      icon: MapPin,
      color: "text-sky-400",
      bg: "bg-sky-400/10",
      link: "/locations",
    },
  ];

  return (
    <div className="space-y-8">
      {refreshing && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Refreshing…
        </div>
      )}
      {/* Hero Banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 sm:p-12"
        style={{ background: "linear-gradient(135deg, #0a1628 0%, #0d2240 60%, #0a3352 100%)" }}
      >
        {/* Subtle teal glow */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #2dd4bf 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            {/* Logo lockup */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl font-extrabold tracking-tight flex items-center">
                <span className="text-white">Site</span>
                <span style={{ color: "#2dd4bf" }}>Lens</span>
                <span className="ml-2 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md" style={{ background: "#2dd4bf", color: "#0a1628" }}>Pro</span>
              </span>
            </div>
            <p className="text-sm font-bold tracking-[0.2em] uppercase mb-3" style={{ color: "#2dd4bf" }}>
              Capture. Analyze. Map. Report.
            </p>
            <p className="text-slate-300 max-w-md text-sm leading-relaxed">
              Upload site photos and let AI detect property issues, estimate costs, and generate professional inspection reports in minutes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors"
            >
              <CreditCard className="w-4 h-4" style={{ color: "#2dd4bf" }} />
              {entitlement.plan === "pro"
                ? (entitlement.inTrial ? "Pro trial" : `Pro · ${entitlement.proRemaining}/10`)
                : entitlement.freeReportUsed === false && entitlement.credits <= 0
                  ? "1 free report"
                  : `${entitlement.credits} credits`}
            </Link>
            <Link to="/new-inspection">
              <Button
                size="lg"
                className="gap-2 font-semibold rounded-xl text-[#0a1628]"
                style={{ background: "linear-gradient(135deg, #2dd4bf, #14b8a6)", boxShadow: "0 4px 24px rgba(45,212,191,0.35)" }}
              >
                <Plus className="w-5 h-5" />
                New Inspection
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <Link key={kpi.label} to={kpi.link} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3 transition-all duration-200 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${kpi.bg}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Recent Reports */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg text-foreground">Recent Reports</h2>
          <Link
            to="/reports"
            className="text-sm flex items-center gap-1 transition-colors font-medium"
            style={{ color: "#2dd4bf" }}
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No inspections yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Start your first inspection to see reports here</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
