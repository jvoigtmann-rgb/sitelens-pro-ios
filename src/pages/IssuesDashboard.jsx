import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Loader2, AlertTriangle, ChevronRight, ChevronDown, DollarSign, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SeverityBadge from "../components/SeverityBadge";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

function issueCost(issue) {
  if (issue.approx_cost) return issue.approx_cost;
  return Math.round(((issue.cost_min || 0) + (issue.cost_max || 0)) / 2);
}

export default function IssuesDashboard() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [expanded, setExpanded] = useState({});

  const load = useCallback(async () => {
    const [allPhotos, allReports] = await Promise.all([
      base44.entities.InspectionPhoto.list("-created_date", 500),
      base44.entities.InspectionReport.list("-created_date", 200),
    ]);
    const reportMap = Object.fromEntries(allReports.map(r => [r.id, r]));

    // Build issue list grouped by report
    const byReport = {};
    allPhotos.forEach(photo => {
      const report = reportMap[photo.report_id];
      if (!report) return;
      if (!byReport[photo.report_id]) {
        byReport[photo.report_id] = { report, issues: [] };
      }
      (photo.issues || []).forEach(iss => {
        if (!iss.title) return;
        byReport[photo.report_id].issues.push({
          ...iss,
          location: photo.room_area || null,
          photo_url: photo.photo_url || null,
          cost: issueCost(iss),
        });
      });
    });

    const groupArray = Object.values(byReport)
      .filter(g => g.issues.length > 0)
      .sort((a, b) => (new Date(b.report.created_date) - new Date(a.report.created_date)));

    setGroups(groupArray);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const { refreshing } = usePullToRefresh(load);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  const totalIssues = groups.reduce((s, g) => s + g.issues.length, 0);
  const totalCost = groups.reduce(
    (s, g) => s + g.issues.reduce((s2, i) => s2 + (i.cost || 0), 0), 0
  );

  return (
    <div className="space-y-4">
      {refreshing && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Refreshing…
        </div>
      )}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Issues</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {totalIssues} issue{totalIssues !== 1 ? "s" : ""} across {groups.length} report{groups.length !== 1 ? "s" : ""} · Est. ${totalCost.toLocaleString()}
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
          <AlertTriangle className="w-12 h-12 opacity-30 mb-3" />
          <p className="text-sm">No issues found.</p>
          <p className="text-xs mt-1 opacity-70">Run an inspection and analyze photos to surface issues here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ report, issues }) => {
            const reportTotal = issues.reduce((s, i) => s + (i.cost || 0), 0);
            const sorted = [...issues].sort((a, b) =>
              (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4)
            );
            return (
              <div key={report.id} className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Report header */}
                <Link
                  to={`/report/${report.id}`}
                  className="flex items-center justify-between px-4 py-3 bg-muted hover:bg-muted/70 transition-colors border-b border-border"
                >
                  <div>
                    <p className="font-semibold text-foreground">{report.title}</p>
                    {report.city_state && (
                      <p className="text-xs text-muted-foreground">{report.city_state}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-700">${reportTotal.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{issues.length} issue{issues.length !== 1 ? "s" : ""}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>

                {/* Issue list */}
                <div className="divide-y divide-border">
                  {sorted.map((iss, i) => {
                    const key = `${report.id}-${i}`;
                    const isOpen = expanded[key];
                    return (
                      <div key={i}>
                        <button
                          onClick={() => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                        >
                          <SeverityBadge severity={iss.severity} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{iss.title}</p>
                            {iss.description && !isOpen && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{iss.description}</p>
                            )}
                            {iss.location && (
                              <p className="text-xs text-muted-foreground/70 mt-0.5">{iss.location}</p>
                            )}
                          </div>
                          {iss.cost > 0 && (
                            <div className="flex items-center gap-1 text-sm font-semibold text-green-700 shrink-0">
                              <DollarSign className="w-3.5 h-3.5" />
                              {iss.cost.toLocaleString()}
                            </div>
                          )}
                          <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 flex flex-col sm:flex-row gap-4">
                            {iss.photo_url && (
                              <img
                                src={iss.photo_url}
                                alt={iss.title}
                                className="w-full sm:w-48 h-40 object-cover rounded-lg border border-border shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0 space-y-2">
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</p>
                                <p className="text-sm text-foreground mt-1">{iss.description || "No notes."}</p>
                              </div>
                              {iss.remediation_status && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</p>
                                  <p className="text-sm text-foreground mt-1 capitalize">{iss.remediation_status}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
