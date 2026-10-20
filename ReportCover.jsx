import { useState, useRef } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import moment from "moment";

export default function ReportCover({ report, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleCoverUpload = async (file) => {
    if (!file) return;
    // Optimistic: show a local preview immediately, roll back if the upload fails
    const previousUrl = report.cover_photo_url || "";
    const previewUrl = URL.createObjectURL(file);
    onUpdate({ cover_photo_url: previewUrl });
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.InspectionReport.update(report.id, { cover_photo_url: file_url });
      onUpdate({ cover_photo_url: file_url });
    } catch (err) {
      console.error("Cover upload failed, rolling back:", err);
      onUpdate({ cover_photo_url: previousUrl });
    } finally {
      setUploading(false);
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleRemoveCover = async () => {
    await base44.entities.InspectionReport.update(report.id, { cover_photo_url: "" });
    onUpdate({ cover_photo_url: "" });
  };

  const inspDate = report.inspection_date || moment(report.created_date).format("MMMM D, YYYY");

  return (
    <div className="bg-card text-foreground font-sans">
      {/* Header bar — bold company name | report subtitle */}
      <div className="flex items-center gap-3 px-4 sm:px-8 py-2.5 border-b border-border">
        <span className="text-xs font-extrabold tracking-wide text-[#1e2d4d] dark:text-foreground uppercase">
          {report.prepared_by || "Site Observation Report"}
        </span>
        <span className="text-border text-xs">|</span>
        <span className="text-xs text-muted-foreground">
          Site Observation Report — {report.title}{report.city_state ? `, ${report.city_state}` : ""}
        </span>
      </div>

      {/* Cover photo */}
      <div className="relative mx-8 mt-5 bg-muted overflow-hidden rounded-sm" style={{ height: 340 }}>
        {report.cover_photo_url ? (
          <>
            <img src={report.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            )}
            <button
              aria-label="Remove cover photo"
              onClick={handleRemoveCover}
              className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-2 right-2 bg-black/40 hover:bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" /> Change photo
            </button>
          </>
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Camera className="w-10 h-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground font-medium">Click to upload cover photo</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Recommended: exterior hero shot</p>
              </>
            )}
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleCoverUpload(e.target.files[0])}
        />
      </div>

      {/* Gold rule */}
      <div className="mx-8 mt-4 h-[2px] bg-[#c9a227]" />

      {/* Cover body — centered, matches HGMC layout */}
      <div className="flex flex-col items-center text-center px-4 sm:px-8 py-12 space-y-0">
        <p className="text-base font-bold tracking-widest uppercase text-[#1e2d4d] dark:text-foreground mb-6 letter-spacing-wide">
          Site Observation Report
        </p>

        <div className="w-56 h-px bg-[#c9a227] mb-8" />

        <h1 className="font-display text-4xl font-bold text-[#1e2d4d] dark:text-foreground mb-2">{report.title}</h1>
        {report.city_state && (
          <p className="font-display text-xl italic text-muted-foreground mb-8">{report.city_state}</p>
        )}

        <div className="w-56 h-px bg-[#c9a227] mb-8" />

        {report.report_purpose && (
          <p className="text-base font-bold text-[#1e2d4d] dark:text-foreground mb-1">{report.report_purpose}</p>
        )}
        <p className="text-sm text-muted-foreground mb-10">{inspDate}</p>

        <div className="mt-2">
          <p className="text-xs text-muted-foreground">Prepared by:</p>
          <p className="text-sm font-bold text-[#1e2d4d] dark:text-foreground mt-0.5">{report.prepared_by || "—"}</p>
        </div>
      </div>

      {/* Confidential bar */}
      <div className="mx-8 bg-[#1e2d4d] py-3 text-center">
        <p className="text-xs font-bold tracking-widest text-[#c9a227] uppercase">
          Confidential — For Internal Use Only
        </p>
      </div>

      {/* Page footer */}
      <div className="flex justify-between items-center px-4 sm:px-8 py-3 border-t border-border mt-6">
        <span className="text-xs text-muted-foreground">
          {report.report_purpose && `${report.report_purpose}  ·  `}{inspDate}
        </span>
      </div>
    </div>
  );
}