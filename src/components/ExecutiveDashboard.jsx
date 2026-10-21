import { useState } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function ExecutiveDashboard({ report, photos, onUpdate }) {
  const [generating, setGenerating] = useState(false);
  const [optimistic, setOptimistic] = useState(null);

  const allIssues = photos.flatMap(p => p.issues || []);
  const criticalCount = allIssues.filter(i => i.severity === "critical").length;
  const highCount = allIssues.filter(i => i.severity === "high").length;
  const immediateRepairCost = allIssues
    .filter(i => i.severity === "critical" || i.severity === "high")
    .reduce((s, i) => s + (i.cost_max || i.cost_min || 0), 0);

  // Local estimates shown optimistically while the LLM confirms
  const localGrade = criticalCount > 0 ? "D" : highCount > 2 || allIssues.length > 10 ? "C" : allIssues.length > 0 ? "B" : "A";
  const localDeferred = criticalCount + highCount >= 3 ? "High" : allIssues.length > 3 ? "Medium" : "Low";
  const localCapex = immediateRepairCost > 50000 ? "High" : immediateRepairCost > 10000 ? "Medium" : "Low";

  const optimisticMetrics = optimistic || {};
  const metrics = [
    { label: "Overall Condition", value: optimisticMetrics.overall_condition || report.overall_condition || "—" },
    { label: "Deferred Maintenance", value: optimisticMetrics.deferred_maintenance || report.deferred_maintenance || "—" },
    { label: "CapEx Risk", value: optimisticMetrics.capex_risk || report.capex_risk || "—" },
    { label: "Immediate Repairs", value: immediateRepairCost ? `$${immediateRepairCost.toLocaleString()}` : "$0" },
    { label: "Critical Issues", value: criticalCount },
    { label: "Photos Reviewed", value: photos.length },
  ];

  const handleGenerate = async () => {
    setGenerating(true);
    // Optimistic: show locally calculated metrics while the LLM confirms
    setOptimistic({
      overall_condition: localGrade,
      deferred_maintenance: localDeferred,
      capex_risk: localCapex,
    });
    try {
      const issueSummary = allIssues.map(i => ({
        title: i.title,
        severity: i.severity,
        cost_min: i.cost_min,
        cost_max: i.cost_max,
        description: i.description,
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior property condition assessor. Based on the inspection data below, generate an executive dashboard for a ${report.property_type} property.

Property: ${report.title}, ${report.city_state || ""}
Total photos reviewed: ${photos.length}
Total issues found: ${allIssues.length}
Critical issues: ${criticalCount}
High severity issues: ${highCount}

Issues detail:
${JSON.stringify(issueSummary, null, 2)}

Provide:
1. An overall condition letter grade (A, B, C, D, or F) based on severity and count of issues.
2. Deferred maintenance level (Low, Medium, or High).
3. CapEx risk level (Low, Medium, or High) based on total estimated costs.
4. A professional investment opinion paragraph (3-5 sentences) summarizing the property condition and its implications for underwriting.`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_condition: { type: "string", enum: ["A", "B", "C", "D", "F"] },
            deferred_maintenance: { type: "string", enum: ["Low", "Medium", "High"] },
            capex_risk: { type: "string", enum: ["Low", "Medium", "High"] },
            investment_opinion: { type: "string" },
          },
        },
      });

      const updates = {
        overall_condition: result.overall_condition,
        deferred_maintenance: result.deferred_maintenance,
        capex_risk: result.capex_risk,
        investment_opinion: result.investment_opinion,
      };
      await base44.entities.InspectionReport.update(report.id, updates);
      onUpdate(updates);
    } finally {
      setOptimistic(null);
      setGenerating(false);
    }
  };

  const hasContent = !!report.investment_opinion;

  return (
    <div className="bg-card border-b border-border">
      {/* Page header */}
      <div className="px-4 sm:px-8 pt-8 pb-4 text-center border-b border-border">
        <h1 className="text-lg font-extrabold uppercase tracking-wide text-primary">
          Site Observation Report
        </h1>
      </div>

      {/* Property name */}
      <div className="px-4 sm:px-8 py-4 border-b border-border">
        <h2 className="text-xl font-bold text-foreground">{report.title}</h2>
        {report.city_state && <p className="text-sm text-muted-foreground">{report.city_state}</p>}
      </div>

      <div className="px-4 sm:px-8 py-6 space-y-6">
        {/* Generate button */}
        <div className="flex justify-end print-hide">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl gap-2"
            onClick={handleGenerate}
            disabled={generating || photos.length === 0}
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : hasContent ? <RefreshCw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {generating ? "SiteLens analyzing..." : hasContent ? "Regenerate" : "Generate Dashboard"}
          </Button>
        </div>

        {photos.length === 0 && !hasContent && (
          <p className="text-sm text-muted-foreground italic text-center py-8">
            Add and analyze photos to generate the executive dashboard.
          </p>
        )}

        {/* Executive Dashboard table */}
        <div>
          <h3 className="text-base font-bold mb-2 text-primary">General Observations</h3>
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.label} className="border-b border-border">
                  <td className="py-2 px-3 font-medium text-muted-foreground w-1/2">
                    {m.label}
                  </td>
                  <td className="py-2 px-3 font-bold text-foreground">
                    {m.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Investment Opinion */}
        {report.investment_opinion && (
          <div>
            <h3 className="text-base font-bold mb-2 text-primary">Executive Summary</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{report.investment_opinion}</p>
          </div>
        )}

      </div>
    </div>
  );
}
