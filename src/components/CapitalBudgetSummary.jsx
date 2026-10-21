import SeverityBadge from "./SeverityBadge";
import { DollarSign } from "lucide-react";

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const SEVERITY_YEAR = { critical: 1, high: 2, medium: 4, low: 7 };
const YEARS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function CapitalBudgetSummary({ photos, number }) {
  const allIssues = (photos || []).flatMap((photo) =>
    (photo.issues || []).map((iss) => ({
      ...iss,
      location: photo.room_area || null,
    }))
  );

  const issuesWithCost = allIssues
    .map((iss) => ({
      ...iss,
      cost: iss.approx_cost || Math.round(((iss.cost_min || 0) + (iss.cost_max || 0)) / 2),
      year: SEVERITY_YEAR[iss.severity] ?? 5,
    }))
    .filter((iss) => iss.title)
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4));

  // Deduplicate by issue title — count each distinct issue's repair cost only once,
  // even when the same issue appears across multiple photos.
  const byTitle = new Map();
  issuesWithCost.forEach((iss) => {
    const key = iss.title.trim().toLowerCase();
    const existing = byTitle.get(key);
    if (!existing) {
      byTitle.set(key, { ...iss, locations: iss.location ? [iss.location] : [] });
    } else if (iss.location && !existing.locations.includes(iss.location)) {
      existing.locations.push(iss.location);
    }
  });
  const deduped = Array.from(byTitle.values());

  const total = deduped.reduce((s, iss) => s + (iss.cost || 0), 0);

  // Year column totals
  const yearTotals = {};
  YEARS.forEach((y) => {
    yearTotals[y] = deduped
      .filter((iss) => iss.year === y)
      .reduce((s, iss) => s + (iss.cost || 0), 0);
  });

  if (deduped.length === 0) return null;

  return (
    <div className="bg-card overflow-hidden space-y-4">
      <div className="pb-2 border-b-2 border-[#c9a227] flex items-center gap-2">
        <h2 className="font-display text-xl font-bold text-primary">
          {number && <span className="mr-1">{number}.</span>}
          Capital Budget Summary
        </h2>
        <DollarSign className="w-4 h-4 text-[#c9a227]" />
      </div>

      {/* Mobile: stacked cards instead of the wide table */}
      <div className="md:hidden space-y-3">
        {deduped.map((iss, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground leading-tight flex-1">{iss.title}</p>
              <SeverityBadge severity={iss.severity} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{iss.locations.join(", ") || "—"}</span>
              <span className="text-muted-foreground">Yr {iss.year}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Est. cost</span>
              <span className="text-sm font-semibold text-green-700">
                {iss.cost > 0 ? `$${iss.cost.toLocaleString()}` : "—"}
              </span>
            </div>
          </div>
        ))}
        <div className="bg-muted/40 border border-border rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs font-bold text-primary uppercase tracking-wide">Total</span>
          <span className="text-sm font-bold text-primary">${total.toLocaleString()}</span>
        </div>
      </div>

      {/* Desktop: landscape matrix — issues as rows, years as columns */}
      <div className="hidden md:block overflow-x-auto touch-scroll">
        <table className="w-full text-xs border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="py-2 px-3 text-left font-semibold tracking-wide w-40">Issue</th>
              <th className="py-2 px-2 text-left font-semibold tracking-wide w-24">Location</th>
              <th className="py-2 px-2 text-left font-semibold tracking-wide w-20">Severity</th>
              {YEARS.map((y) => (
                <th key={y} className="py-2 px-2 text-center font-semibold w-14">Yr {y}</th>
              ))}
              <th className="py-2 px-3 text-right font-semibold tracking-wide w-20">Total</th>
            </tr>
          </thead>
          <tbody>
            {deduped.map((iss, i) => (
              <tr key={i} className={`border-t border-border ${i % 2 === 0 ? "bg-card" : "bg-muted/30"}`}>
                <td className="py-2 px-3 font-medium text-foreground leading-tight">{iss.title}</td>
                <td className="py-2 px-2 text-muted-foreground">{iss.locations.join(", ") || "—"}</td>
                <td className="py-2 px-2"><SeverityBadge severity={iss.severity} /></td>
                {YEARS.map((y) => (
                  <td key={y} className="py-2 px-2 text-center">
                    {iss.year === y && iss.cost > 0 ? (
                      <span className="font-semibold text-green-700">${iss.cost.toLocaleString()}</span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                ))}
                <td className="py-2 px-3 text-right font-semibold text-green-800">
                  {iss.cost > 0 ? `$${iss.cost.toLocaleString()}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-primary bg-muted/40">
              <td colSpan={3} className="py-2.5 px-3 font-bold text-primary text-xs uppercase tracking-wide">
                Annual Total
              </td>
              {YEARS.map((y) => (
                <td key={y} className="py-2.5 px-2 text-center font-bold text-primary">
                  {yearTotals[y] > 0 ? `$${yearTotals[y].toLocaleString()}` : "—"}
                </td>
              ))}
              <td className="py-2.5 px-3 text-right font-bold text-primary">
                ${total.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-muted-foreground italic">
        Year assignments based on severity: Critical = Yr 1 · High = Yr 2 · Medium = Yr 4 · Low = Yr 7
      </p>
    </div>
  );
}
