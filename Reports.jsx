import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Loader2, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import ReportCard from "../components/ReportCard";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    const user = await base44.auth.me();
    const data = await base44.entities.InspectionReport.filter({ created_by: user.email }, "-created_date", 50);
    setReports(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const { refreshing } = usePullToRefresh(fetchReports);

  return (
    <div className="space-y-6">
      {refreshing && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Refreshing…
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">All Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {reports.length} inspection{reports.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link to="/new-inspection">
          <Button className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" />
            New
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-border">
          <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No reports yet</p>
          <Link to="/new-inspection">
            <Button className="mt-4 gap-2 rounded-xl">
              <Plus className="w-4 h-4" />
              Create your first inspection
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}