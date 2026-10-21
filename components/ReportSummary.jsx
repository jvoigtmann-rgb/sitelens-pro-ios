import { AlertTriangle, CheckCircle, Camera, AlertCircle, DollarSign } from "lucide-react";

export default function ReportSummary({ report, photoCount }) {
  const approxCost = report.total_approx_cost || (report.total_cost_min > 0 || report.total_cost_max > 0
    ? Math.round(((report.total_cost_min || 0) + (report.total_cost_max || 0)) / 2)
    : 0);
  const hasCost = approxCost > 0;

  const stats = [
    {
      label: "Photos",
      value: photoCount,
      icon: Camera,
      color: "text-primary",
      bg: "bg-primary/10",
      display: photoCount,
    },
    {
      label: "Total Issues",
      value: report.total_issues || 0,
      icon: AlertTriangle,
      color: "text-accent",
      bg: "bg-accent/10",
      display: report.total_issues || 0,
    },
    {
      label: "Critical",
      value: report.critical_issues || 0,
      icon: AlertCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      display: report.critical_issues || 0,
    },
    {
      label: "Approx. Capital Cost",
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
      display: hasCost ? `~$${approxCost.toLocaleString()}` : "—",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card rounded-xl border border-border p-4 text-center"
        >
          <div className={`inline-flex p-2.5 rounded-xl ${stat.bg} mb-2`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <p className="text-xl font-bold text-foreground leading-tight">{stat.display}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}