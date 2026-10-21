import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trash2, Loader2, Printer, Pencil, Check, X, MapPin, Download, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import ReportSummary from "../components/ReportSummary";
import ReportCover from "../components/ReportCover";
import PhotoIssueCard from "../components/PhotoIssueCard";
import PhotoMap from "../components/PhotoMap";
import NarrativeSection from "../components/NarrativeSection";
import EditablePhotoBlock from "../components/EditablePhotoBlock";
import CapitalBudgetSummary from "../components/CapitalBudgetSummary";
import AddPhotosToReport from "../components/AddPhotosToReport";
import ExecutiveDashboard from "../components/ExecutiveDashboard";
import moment from "moment";


export default function ReportView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [customSections, setCustomSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [hiddenSections, setHiddenSections] = useState([]);

  const hideSection = async (key) => {
    const updated = [...hiddenSections, key];
    setHiddenSections(updated);
    await base44.entities.InspectionReport.update(report.id, { hidden_sections: updated });
    setReport(prev => ({ ...prev, hidden_sections: updated }));
  };

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const [reportData, photosData, sectionsData] = await Promise.all([
        base44.entities.InspectionReport.filter({ id, created_by: user.email }),
        base44.entities.InspectionPhoto.filter({ report_id: id }),
        base44.entities.InspectionSection.filter({ report_id: id }),
      ]);
      const r = reportData[0] || null;
      setReport(r);
      setPhotos(photosData);
      setCustomSections(sectionsData.filter(s => s.active !== false).sort((a, b) => a.order - b.order));
      setHiddenSections(r?.hidden_sections || []);
      setLoading(false);
    };
    load();
  }, [id]);

  const updateReportField = async (field, value) => {
    await base44.entities.InspectionReport.update(report.id, { [field]: value });
    setReport((prev) => ({ ...prev, [field]: value }));
  };

  // Snapshot the on-screen Leaflet map so it can be embedded in the PDF/DOCX exports
  const captureMapImage = async () => {
    const el = document.getElementById("report-photo-map");
    if (!el) return null;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(el, { useCORS: true, logging: false, scale: 2 });
      return canvas.toDataURL("image/jpeg", 0.92);
    } catch {
      return null;
    }
  };

  const handleDownloadPdf = async () => {
    setExporting(true);
    const { exportReportToPdf } = await import("@/utils/exportPdf");
    const mapImage = await captureMapImage();
    await exportReportToPdf(report.title || "inspection-report", report, photos, hiddenSections, mapImage);
    setExporting(false);
  };

  const handleDownloadDocx = async () => {
    setExportingDocx(true);
    const { exportReportToDocx } = await import("@/utils/exportDocx");
    const mapImage = await captureMapImage();
    await exportReportToDocx(report.title || "inspection-report", report, photos, hiddenSections, customSections, mapImage);
    setExportingDocx(false);
  };

  const handleAddSection = async () => {
    const name = prompt("Section title:");
    if (!name?.trim()) return;
    const newSection = await base44.entities.InspectionSection.create({
      report_id: report.id,
      name: name.trim(),
      notes: "",
      order: customSections.length,
      active: true,
    });
    setCustomSections(prev => [...prev, newSection]);
  };

  const handleUpdateCustomSection = async (sectionId, notes) => {
    await base44.entities.InspectionSection.update(sectionId, { notes });
    setCustomSections(prev => prev.map(s => s.id === sectionId ? { ...s, notes } : s));
  };

  const handleDeleteCustomSection = async (sectionId) => {
    await base44.entities.InspectionSection.update(sectionId, { active: false });
    setCustomSections(prev => prev.filter(s => s.id !== sectionId));
  };

  const handleDelete = async () => {
    if (!confirm("Delete this inspection report? This cannot be undone.")) return;
    setDeleting(true);
    for (const photo of photos) {
      await base44.entities.InspectionPhoto.delete(photo.id);
    }
    await base44.entities.InspectionReport.delete(report.id);
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Report not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  const hasMap = photos.some((p) => p.lat && p.lng);
  let sectionNum = 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top action bar */}
      <div className="flex items-start justify-end gap-2 flex-wrap print-hide">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2"
            onClick={handleAddSection}
          >
            <PlusCircle className="w-4 h-4" />
            Add Section
          </Button>
          <AddPhotosToReport
            report={report}
            onPhotosAdded={(newPhotos) => setPhotos(prev => [...prev, ...newPhotos])}
          />
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2"
            onClick={handleDownloadDocx}
            disabled={exportingDocx}
          >
            {exportingDocx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exportingDocx ? "Generating..." : "Download .docx"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2"
            onClick={handleDownloadPdf}
            disabled={exporting}
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? "Generating PDF..." : "Download PDF"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete report"
            className="rounded-xl min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </Button>
      </div>

      {/* Printable area */}
      <div id="printable-report" className="space-y-0 bg-card rounded-2xl border border-border overflow-hidden shadow-sm">

        {/* Cover Page */}
        <ReportCover report={report} onUpdate={(updates) => setReport(prev => ({ ...prev, ...updates }))} />

        {/* Executive Dashboard — Page 2 */}
        {!hiddenSections.includes("executive_dashboard") && (
          <ExecutiveDashboard
            report={report}
            photos={photos}
            onUpdate={(updates) => setReport(prev => ({ ...prev, ...updates }))}
          />
        )}

        {/* Body pages — running header like the PDF */}
        <div className="flex items-center gap-3 px-4 sm:px-8 py-2.5 border-t-2 border-b border-border bg-card">
          <span className="text-xs font-extrabold tracking-wide text-[#1e2d4d] dark:text-foreground uppercase">
            {report.prepared_by || "Site Observation Report"}
          </span>
          <span className="text-border text-xs">|</span>
          <span className="text-xs text-muted-foreground">
            Site Observation Report — {report.title}{report.city_state ? `, ${report.city_state}` : ""}
          </span>
        </div>

        {/* Sub-header: SITE OBSERVATION + address + purpose */}
        <div className="px-4 sm:px-8 pt-6 pb-4 border-b border-slate-100">
          <h1 className="font-display text-3xl font-extrabold text-[#1e2d4d] dark:text-foreground uppercase tracking-wide">Site Observation</h1>
          <p className="text-base font-bold text-[#c9a227] mt-1">
            {report.title}{report.city_state ? ` · ${report.city_state}` : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {report.report_purpose}{report.inspection_date ? ` · ${report.inspection_date}` : ""}
          </p>
          <div className="mt-3 h-px bg-border" />
        </div>

        {/* Stats */}
        <div className="px-4 sm:px-8 py-6 bg-muted border-b border-border">
          <ReportSummary report={report} photoCount={photos.length} />
        </div>

        <div className="px-4 sm:px-8 py-8 space-y-8">

          {(() => {
            const allNarrative = [
              { key: "executive_summary", title: "General Observations", field: "executive_summary", placeholder: "Click to add general observations..." },
              { key: "operations_summary", title: "Operations & Physical Building", field: "operations_summary", placeholder: "Click to add operations notes..." },
              { key: "building_summary", title: "Condition Observations", field: "building_summary", placeholder: "Click to add condition observations..." },
              { key: "notes", title: "Inspector Notes", field: "notes", placeholder: "Click to add inspector notes..." },
              { key: "market_summary", title: "Market Context", field: "market_summary", placeholder: "Click to add market context..." },
            ];
            const visible = allNarrative.filter(s => !hiddenSections.includes(s.key));
            return visible.map((s, idx) => (
              <NarrativeSection
                key={s.key}
                number={idx + 1}
                title={s.title}
                content={report[s.field]}
                placeholder={s.placeholder}
                onSave={(v) => updateReportField(s.field, v)}
                onDelete={() => hideSection(s.key)}
                report={report}
                photos={photos}
              />
            ));
          })()}

          {/* Custom Sections */}
          {customSections.map((section, idx) => {
            const narrativeCount = [
              "executive_summary", "operations_summary", "building_summary", "notes", "market_summary"
            ].filter(k => !hiddenSections.includes(k)).length;
            return (
              <NarrativeSection
                key={section.id}
                number={narrativeCount + idx + 1}
                title={section.name}
                content={section.notes}
                placeholder="Click the pencil icon to add content..."
                onSave={(v) => handleUpdateCustomSection(section.id, v)}
                onDelete={() => handleDeleteCustomSection(section.id)}
                report={report}
                photos={photos}
              />
            );
          })}

          {/* Capital Budget Summary */}
          <div id="capital-budget-section">
          {(() => {
            const narrativeCount = [
              "executive_summary", "operations_summary", "building_summary", "notes", "market_summary"
            ].filter(k => !hiddenSections.includes(k)).length;
            return (
              <CapitalBudgetSummary
                photos={photos}
                number={narrativeCount + customSections.length + 1}
              />
            );
          })()}
          </div>

          <div id="report-body-after-capital">
          {/* Photo Locations Map */}
          {hasMap && !hiddenSections.includes("photo_locations") && (() => {
            const narrativeCount = [
              "executive_summary", "operations_summary", "building_summary", "notes", "market_summary"
            ].filter(k => !hiddenSections.includes(k)).length;
            const num = narrativeCount + customSections.length + 2;
            return (
              <div>
                <div className="pb-2 border-b-2 border-[#c9a227] mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl font-bold text-[#1e2d4d] dark:text-foreground">{num}. Photo Locations</h2>
                    <MapPin className="w-4 h-4 text-[#c9a227]" />
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Remove section" className="h-7 w-7 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive" onClick={() => hideSection("photo_locations")}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <PhotoMap photos={photos} id="report-photo-map" />
              </div>
            );
          })()}

          {/* All Photos — full width with italic captions like the PDF */}
          {!hiddenSections.includes("all_photos") && (() => {
            const narrativeCount = [
              "executive_summary", "operations_summary", "building_summary", "notes", "market_summary"
            ].filter(k => !hiddenSections.includes(k)).length;
            const photoLocNum = (hasMap && !hiddenSections.includes("photo_locations")) ? 1 : 0;
            const num = narrativeCount + customSections.length + photoLocNum + 2;
            return <div>
            <div className="pb-2 border-b-2 border-[#c9a227] mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-[#1e2d4d] dark:text-foreground">{num}. All Photos</h2>
              <Button variant="ghost" size="icon" aria-label="Remove section" className="h-7 w-7 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive" onClick={() => hideSection("all_photos")}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            {photos.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No photos on this report.</p>
            ) : (
              <div className="space-y-8">
                {photos.map((photo, idx) => (
                  <EditablePhotoBlock
                    key={photo.id}
                    photo={photo}
                    photoIndex={idx}
                    onPhotoUpdated={(updated) => setPhotos(prev => prev.map(p => p.id === updated.id ? updated : p))}
                    onPhotoDeleted={(deletedId) => setPhotos(prev => prev.filter(p => p.id !== deletedId))}
                  />
                ))}
              </div>
            )}
          </div>;
          })()}

          {/* Footer */}
          <div className="border-t border-border pt-4 text-xs text-muted-foreground text-center">
            Confidential — For Internal Use Only · {moment(report.created_date).format("MMMM D, YYYY")}
          </div>
          </div>{/* end report-body-after-capital */}
        </div>
      </div>
    </div>
  );
}

function EditableText({ content, onSave, placeholder, rows = 4 }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(content || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(value);
    setSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="space-y-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={rows}
          className="text-sm resize-none"
          placeholder={placeholder}
          autoFocus
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 px-3 text-xs">
            {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-7 px-3 text-xs">
            <X className="w-3 h-3 mr-1" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative cursor-pointer rounded-lg hover:bg-muted -mx-2 px-2 py-1 transition-colors"
      onClick={() => { setValue(content || ""); setEditing(true); }}
    >
      {content ? (
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{content}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic">{placeholder}</p>
      )}
      <Pencil className="absolute top-2 right-2 w-3.5 h-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
