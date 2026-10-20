import { useState } from "react";
import { Trash2, Pencil, Check, X, AlertTriangle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import SeverityBadge from "./SeverityBadge";
import { useIsMobile } from "@/hooks/use-mobile";

export default function SectionPhoto({ photo, photoNumber, onDelete, onUpdate }) {
  const [editingCaption, setEditingCaption] = useState(false);
  const [caption, setCaption] = useState(photo.room_area || "");
  const isMobile = useIsMobile();

  const handleSaveCaption = async () => {
    await onUpdate(photo.id, { room_area: caption });
    setEditingCaption(false);
  };

  const issues = photo.issues || [];
  const hasIssues = issues.length > 0;

  // Build auto-caption from issues if no room_area description
  const autoCaption = hasIssues
    ? issues.map(i => `${i.title}${i.description ? `: ${i.description}` : ""}`).join(". ")
    : "No issues identified.";

  const displayCaption = photo.room_area || autoCaption;

  return (
    <div className="my-6">
      {/* Full-width photo */}
      <div className="relative bg-muted overflow-hidden rounded-sm border border-border">
        <img
          src={photo.photo_url}
          alt={displayCaption}
          className="w-full object-cover"
          style={{ maxHeight: 480 }}
        />
        {onDelete && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 h-7 w-7 bg-black/30 hover:bg-black/50 text-white rounded-full"
            onClick={() => onDelete(photo.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Caption — italic, small, like the report */}
      <div className="mt-2 px-1 flex items-start gap-2 group">
        {editingCaption ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              autoFocus
              value={caption}
              onChange={e => setCaption(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSaveCaption()}
              className="flex-1 text-xs border-b border-border outline-none bg-transparent text-muted-foreground py-0.5"
              placeholder="Photo caption / description..."
            />
            <button onClick={handleSaveCaption} className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] text-green-600 hover:text-green-700">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setEditingCaption(false)} className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <p className="flex-1 text-xs text-muted-foreground italic leading-relaxed">
              <span className="font-medium not-italic text-muted-foreground">Photo {photoNumber}</span>
              {displayCaption ? ` — ${displayCaption}` : ""}
            </p>
            {onUpdate && (
              <button
                className={`transition-opacity inline-flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground/40 hover:text-muted-foreground shrink-0 mt-0.5 ${isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                onClick={() => { setCaption(photo.room_area || ""); setEditingCaption(true); }}
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Issues inline — subtle, below caption */}
      {hasIssues && (
        <div className="mt-2 px-1 space-y-1">
          {issues.map((issue, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
              <span>
                <SeverityBadge severity={issue.severity} />
                <span className="ml-1.5 font-medium">{issue.title}</span>
                {issue.description && <span className="text-muted-foreground/80"> — {issue.description}</span>}
                {(issue.cost_min || issue.cost_max) && (
                  <span className="text-green-700 ml-1.5 font-medium">
                    ${(issue.cost_min || 0).toLocaleString()}–${(issue.cost_max || 0).toLocaleString()}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}