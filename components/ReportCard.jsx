import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle, Clock, ArrowRight, Building2 } from "lucide-react";
import moment from "moment";

export default function ReportCard({ report }) {
  const isCompleted = report.status === "completed";

  return (
    <Link
      to={`/report/${report.id}`}
      className="group block bg-card rounded-xl border border-border p-5 transition-all duration-200 hover:shadow-lg hover:shadow-black/5 hover:border-teal-500/30"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0 mt-0.5">
          <Building2 className="w-5 h-5 text-teal-500" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-semibold text-foreground truncate group-hover:text-teal-500 transition-colors text-sm">
            {report.title}
          </h3>
          {report.city_state && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{report.city_state}</p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
            {/* Status */}
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              isCompleted
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-amber-500/10 text-amber-600"
            }`}>
              {isCompleted
                ? <CheckCircle className="w-3 h-3" />
                : <Clock className="w-3 h-3" />}
              {isCompleted ? "Completed" : "In Progress"}
            </span>

            {/* Property type */}
            <span className="text-xs text-muted-foreground capitalize">{report.property_type || "residential"}</span>

            {/* Time */}
            <span className="text-xs text-muted-foreground">{moment(report.created_date).fromNow()}</span>
          </div>
        </div>

        {/* Issues + arrow */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {report.total_issues > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
              <AlertTriangle className="w-3 h-3" />
              <span className="text-xs font-bold">{report.total_issues}</span>
            </div>
          )}
          <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}