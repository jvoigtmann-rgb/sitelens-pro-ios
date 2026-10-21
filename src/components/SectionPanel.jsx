import { useState, useRef } from "react";
import { Loader2, ChevronDown, ChevronUp, Sparkles, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";
import SectionPhoto from "./SectionPhoto";

export default function SectionPanel({ section, photos, reportId, onRemove, onPhotosChange, onNotesChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const [notes, setNotes] = useState(section.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef(null);
  const notesTimer = useRef(null);

  const lastSavedNotes = useRef(section.notes || "");
  const handleNotesChange = (val) => {
    setNotes(val);
    clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(async () => {
      setSavingNotes(true);
      onNotesChange(section.id, val);
      try {
        await base44.entities.InspectionSection.update(section.id, { notes: val });
        lastSavedNotes.current = val;
      } catch (err) {
        console.error("Notes save failed, rolling back:", err);
        setNotes(lastSavedNotes.current);
        onNotesChange(section.id, lastSavedNotes.current);
        toast({ title: "Update failed", description: "Reverted to previous value.", variant: "destructive" });
      }
      setSavingNotes(false);
    }, 1000);
  };

  const handleFileUpload = async (files) => {
    if (!files.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newPhoto = await base44.entities.InspectionPhoto.create({
        report_id: reportId,
        section_id: section.id,
        photo_url: file_url,
        room_area: section.name,
        status: "analyzing",
      });
      onPhotosChange("add", newPhoto);

      // AI analyze
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional property inspector analyzing a photo from the "${section.name}" section.
Identify any visible issues, defects, or concerns. For each issue provide a title, severity (low/medium/high/critical), description, and estimated repair cost range in USD.
Be specific and professional. If no issues are visible, return an empty issues array.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  severity: { type: "string" },
                  description: { type: "string" },
                  cost_min: { type: "number" },
                  cost_max: { type: "number" }
                }
              }
            }
          }
        }
      });

      const updated = await base44.entities.InspectionPhoto.update(newPhoto.id, {
        issues: result.issues || [],
        status: "completed",
      });
      onPhotosChange("update", updated);
    }
    setUploading(false);
  };

  const handleGenerateNotes = async () => {
    setGenerating(true);
    const issuesList = photos
      .flatMap(p => (p.issues || []).map(i => `- [${i.severity?.toUpperCase()}] ${i.title}: ${i.description}`))
      .join("\n");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a professional property inspector writing the "${section.name}" section of a site observation report.

Current inspector notes: ${notes || "(none)"}
Issues found in photos: ${issuesList || "(none)"}

Write a concise, professional narrative for this section. 2-4 paragraphs. Be specific about conditions observed. Use formal inspection report language.`,
    });

    const generated = typeof result === "string" ? result : (result?.content || "");
    await base44.entities.InspectionSection.update(section.id, { notes: generated });
    setNotes(generated);
    onNotesChange(section.id, generated);
    setGenerating(false);
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted border-b border-border">
        <button
          className="flex items-center gap-2 font-semibold text-foreground text-sm flex-1 text-left"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
          {section.name}
          <span className="text-xs font-normal text-muted-foreground ml-1">({photos.length} photo{photos.length !== 1 ? "s" : ""})</span>
        </button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Remove section"
          className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive shrink-0"
          onClick={() => onRemove(section.id)}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-4">
          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Section Notes</p>
              <div className="flex items-center gap-2">
                {savingNotes && <span className="text-xs text-muted-foreground">Saving...</span>}
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[44px] px-2 text-xs gap-1 text-muted-foreground"
                  onClick={handleGenerateNotes}
                  disabled={generating}
                >
                  {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {generating ? "Writing..." : "Generate with AI"}
                </Button>
              </div>
            </div>
            {generating ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-3">
                <Loader2 className="w-4 h-4 animate-spin" /> Writing section narrative...
              </div>
            ) : (
              <Textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                rows={3}
                placeholder={`Add notes for ${section.name}...`}
                className="text-sm resize-none"
              />
            )}
          </div>

          {/* Photos — inline report style */}
          {photos.length > 0 && (
            <div className="divide-y divide-border">
              {photos.map((photo, idx) => (
                <SectionPhoto
                  key={photo.id}
                  photo={photo}
                  photoNumber={idx + 1}
                  onDelete={async (pid) => {
                    onPhotosChange("delete", { id: pid });
                    try {
                      await base44.entities.InspectionPhoto.delete(pid);
                    } catch (err) {
                      console.error("Photo delete failed, rolling back:", err);
                      onPhotosChange("add", photo);
                      toast({ title: "Update failed", description: "Reverted to previous value.", variant: "destructive" });
                    }
                  }}
                  onUpdate={async (photoId, updates) => {
                    const previous = photo;
                    onPhotosChange("update", { ...photo, ...updates });
                    try {
                      await base44.entities.InspectionPhoto.update(photoId, updates);
                    } catch (err) {
                      console.error("Photo update failed, rolling back:", err);
                      onPhotosChange("update", previous);
                      toast({ title: "Update failed", description: "Reverted to previous value.", variant: "destructive" });
                    }
                  }}
                />
              ))}
            </div>
          )}

          {/* Upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs rounded-lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              {uploading ? "Uploading & Analyzing..." : "Add Photos"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
