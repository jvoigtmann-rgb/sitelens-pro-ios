import { useState } from "react";
import { Pencil, Check, X, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SeverityBadge from "./SeverityBadge";
import SeveritySelect from "./SeveritySelect";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";

function IssueEditor({ issue, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(issue.title || "");
  const [desc, setDesc] = useState(issue.description || "");
  const [severity, setSeverity] = useState(issue.severity || "low");
  const [approxCost, setApproxCost] = useState(issue.approx_cost ?? issue.cost_min ?? "");

  const handleSave = () => {
    onSave({ ...issue, title, description: desc, severity, approx_cost: Number(approxCost) || 0 });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="border border-amber-200 rounded-lg p-3 bg-amber-50 space-y-2">
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Issue title" className="h-7 text-xs" />
        <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" rows={2} className="text-xs resize-none" />
        <div className="flex items-center gap-2 flex-wrap">
          <SeveritySelect value={severity} onChange={setSeverity} />
          <Input type="number" value={approxCost} onChange={e => setApproxCost(e.target.value)} placeholder="Approx cost $" className="h-7 text-xs w-32" />
          <Button size="icon" variant="ghost" aria-label="Save issue" className="min-h-[44px] min-w-[44px] text-green-600" onClick={handleSave}><Check className="w-4 h-4" /></Button>
          <Button size="icon" variant="ghost" aria-label="Cancel issue edit" className="min-h-[44px] min-w-[44px] text-muted-foreground" onClick={() => setEditing(false)}><X className="w-4 h-4" /></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 text-xs text-muted-foreground group">
      <AlertTriangle className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
      <span className="flex-1">
        <SeverityBadge severity={issue.severity} />
        <span className="ml-1.5 font-medium">{issue.title}</span>
        {issue.description && <span className="text-muted-foreground/80"> — {issue.description}</span>}
        {(issue.approx_cost || issue.cost_min) && (
          <span className="text-green-700 ml-1.5 font-medium">
            ~${(issue.approx_cost || Math.round(((issue.cost_min || 0) + (issue.cost_max || 0)) / 2)).toLocaleString()}
          </span>
        )}
      </span>
      <div className="flex gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} aria-label="Edit issue" className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground/40 hover:text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={onDelete} aria-label="Delete issue" className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground/40 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

export default function EditablePhotoBlock({ photo, photoIndex, onPhotoUpdated, onPhotoDeleted }) {
  const [editingCaption, setEditingCaption] = useState(false);
  const [caption, setCaption] = useState(photo.room_area || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const issues = photo.issues || [];

  // Optimistic update with rollback if the API call fails
  const savePhoto = async (updates) => {
    const previous = photo;
    onPhotoUpdated && onPhotoUpdated({ ...photo, ...updates });
    setSaving(true);
    try {
      await base44.entities.InspectionPhoto.update(photo.id, updates);
    } catch (err) {
      console.error("Photo update failed, rolling back:", err);
      onPhotoUpdated && onPhotoUpdated(previous);
      toast({ title: "Update failed", description: "Reverted to previous value.", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleSaveCaption = async () => {
    await savePhoto({ room_area: caption });
    setEditingCaption(false);
  };

  const handleIssueUpdate = async (idx, updated) => {
    const newIssues = issues.map((iss, i) => (i === idx ? updated : iss));
    await savePhoto({ issues: newIssues });
  };

  const handleIssueDelete = async (idx) => {
    const newIssues = issues.filter((_, i) => i !== idx);
    await savePhoto({ issues: newIssues });
  };

  const handleDeletePhoto = async () => {
    if (!confirm("Delete this photo and all its issues from the report?")) return;
    setDeleting(true);
    try {
      await base44.entities.InspectionPhoto.delete(photo.id);
      onPhotoDeleted && onPhotoDeleted(photo.id);
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleting(false);
    }
  };

  const handleAddIssue = async () => {
    const newIssues = [...issues, { title: "New Issue", description: "", severity: "low", approx_cost: 0 }];
    await savePhoto({ issues: newIssues });
  };

  return (
    <div>
      {/* Photo */}
      <div className="relative w-full overflow-hidden rounded-sm bg-muted group/photo" style={{ maxHeight: 480 }}>
        <img src={photo.photo_url} alt={photo.room_area || `Photo ${photoIndex + 1}`} className="w-full object-cover" style={{ maxHeight: 480 }} />
        <button
          onClick={handleDeletePhoto}
          disabled={deleting}
          aria-label="Delete photo"
          className="absolute top-2 right-2 bg-black/40 hover:bg-red-600 rounded-full min-h-[44px] min-w-[44px] inline-flex items-center justify-center transition-colors"
          title="Delete photo"
        >
          {deleting ? <span className="w-4 h-4 block border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Caption row — italic note only */}
      <div className="mt-2 px-1 flex items-start gap-2 group">
        {editingCaption ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              autoFocus
              value={caption}
              onChange={e => setCaption(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSaveCaption()}
              className="flex-1 text-xs border-b border-border outline-none bg-transparent text-muted-foreground py-0.5"
              placeholder="Room / area label..."
            />
            <button onClick={handleSaveCaption} aria-label="Save caption" className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
            <button onClick={() => setEditingCaption(false)} aria-label="Cancel caption edit" className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <>
            <p className="flex-1 text-xs text-muted-foreground italic leading-relaxed">
              <span className="font-medium not-italic text-muted-foreground">Photo {photoIndex + 1}</span>
              {photo.room_area ? ` – ${photo.room_area}` : ""}
              {photo.analysis ? `. ${photo.analysis}` : ""}
            </p>
            <button
              aria-label="Edit caption"
              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-muted-foreground shrink-0 mt-0.5 inline-flex items-center justify-center min-h-[44px] min-w-[44px]"
              onClick={() => { setCaption(photo.room_area || ""); setEditingCaption(true); }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <div className="mt-2 pl-2 border-l-2 border-[#c9a227] space-y-2">
          {issues.map((iss, i) => (
            <IssueEditor
              key={i}
              issue={iss}
              onSave={(updated) => handleIssueUpdate(i, updated)}
              onDelete={() => handleIssueDelete(i)}
            />
          ))}
        </div>
      )}

      {/* Add issue button */}
      <button
        onClick={handleAddIssue}
        className="mt-2 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors min-h-[44px]"
      >
        <Plus className="w-3.5 h-3.5" /> Add issue
      </button>
    </div>
  );
}
