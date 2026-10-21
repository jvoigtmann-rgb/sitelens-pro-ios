import { useState } from "react";
import { Loader2, AlertTriangle, CheckCircle, XCircle, Trash2, DollarSign, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SeverityBadge from "./SeverityBadge";

function IssueRow({ issue, editable, onSave }) {
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(issue.description || "");
  const [costMin, setCostMin] = useState(issue.cost_min ?? "");
  const [costMax, setCostMax] = useState(issue.cost_max ?? "");

  const handleSave = () => {
    onSave({ ...issue, description: desc, cost_min: Number(costMin) || 0, cost_max: Number(costMax) || 0 });
    setEditing(false);
  };

  return (
    <div className="flex items-start gap-2.5">
      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-accent shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{issue.title}</span>
          <SeverityBadge severity={issue.severity} />
          {editable && !editing && (
            <button onClick={() => setEditing(true)} aria-label="Edit issue" className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground ml-auto">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {editing ? (
          <div className="mt-1.5 space-y-2">
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              className="text-xs resize-none"
              placeholder="Description"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Cost ($):</span>
              <Input
                type="number"
                value={costMin}
                onChange={(e) => setCostMin(e.target.value)}
                placeholder="Min"
                className="h-7 text-xs"
              />
              <span className="text-xs text-muted-foreground">–</span>
              <Input
                type="number"
                value={costMax}
                onChange={(e) => setCostMax(e.target.value)}
                placeholder="Max"
                className="h-7 text-xs"
              />
              <Button size="icon" variant="ghost" aria-label="Save issue" className="min-h-[44px] min-w-[44px] text-green-600 shrink-0" onClick={handleSave}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" aria-label="Cancel edit" className="min-h-[44px] min-w-[44px] text-muted-foreground shrink-0" onClick={() => setEditing(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{issue.description}</p>
            {(issue.cost_min > 0 || issue.cost_max > 0) && (
              <div className="flex items-center gap-1 mt-1 text-xs text-green-700 font-medium">
                <DollarSign className="w-3 h-3" />
                Est. ${(issue.cost_min || 0).toLocaleString()} – ${(issue.cost_max || 0).toLocaleString()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function PhotoIssueCard({ photo, onDelete, onUpdate }) {
  const statusConfig = {
    uploading: { icon: Loader2, label: "Uploading...", spin: true },
    analyzing: { icon: Loader2, label: "SiteLens analyzing...", spin: true },
    ready: null,
    completed: null,
    error: { icon: XCircle, label: "Analysis failed — tap to retry" },
  };

  const config = statusConfig[photo.status] ?? null;
  const Icon = config?.icon;
  const issues = photo.issues || [];

  const handleIssueSave = (idx, updated) => {
    const newIssues = issues.map((iss, i) => (i === idx ? updated : iss));
    onUpdate && onUpdate(photo.id, newIssues);
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-black/5">
      {/* Photo */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        <img src={photo.photo_url} alt={photo.room_area || "Inspection photo"} className="w-full h-full object-cover" />
        {config && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
            <div className="flex items-center gap-2 text-white bg-black/30 px-4 py-2 rounded-full">
              <Icon className={`w-4 h-4 ${config.spin ? "animate-spin" : ""}`} />
              <span className="text-sm font-medium">{config.label}</span>
            </div>
          </div>
        )}
        {onDelete && (
          <Button
            size="icon"
            variant="ghost"
            aria-label="Delete photo"
            className="absolute top-2 right-2 h-8 w-8 min-h-[44px] min-w-[44px] bg-black/30 hover:bg-black/50 text-white rounded-full"
            onClick={() => onDelete(photo.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {photo.room_area && (
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{photo.room_area}</p>
        )}

        {photo.status === "completed" && issues.length === 0 && (
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">No issues found</span>
          </div>
        )}

        {issues.length > 0 && (
          <div className="space-y-2.5">
            {issues.map((issue, idx) => (
              <IssueRow
                key={idx}
                issue={issue}
                editable={!!onUpdate}
                onSave={(updated) => handleIssueSave(idx, updated)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
