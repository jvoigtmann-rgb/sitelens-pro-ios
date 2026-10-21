import { useState, useRef } from "react";
import { Loader2, Camera, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const ASSET_CONTEXT = {
  residential: {
    desc: "single-family or small residential property",
    focus: "roofing, HVAC, plumbing, electrical panels, foundation, weatherproofing, egress, smoke/CO detectors, stairs and railings",
    lifeSafety: "egress paths, smoke detectors, CO detectors, GFCI outlets near water, stair handrails, window guards",
    engineering: "roof decking, structural framing, foundation settlement, moisture intrusion, load-bearing walls",
  },
  multifamily: {
    desc: "multifamily residential building (apartments/condos)",
    focus: "common area systems, fire suppression, elevator, boiler/HVAC, hallways, unit entry doors, parking, exterior envelope",
    lifeSafety: "fire sprinklers, fire doors, exit signage, stairwell pressurization, emergency lighting, elevator certificates, ADA compliance",
    engineering: "structural deck, parapet walls, façade, waterproofing, mechanical rooms, utility risers",
  },
  commercial: {
    desc: "commercial office, retail, or mixed-use property",
    focus: "roof membrane, HVAC/MEP systems, electrical distribution, storefront glazing, restrooms, ADA compliance, parking lot",
    lifeSafety: "sprinkler system, fire alarm panel, exit signage, emergency lighting, ADA access routes, occupant load compliance",
    engineering: "structural steel/concrete, roof deck, curtain wall, loading dock, utility infrastructure",
  },
  industrial: {
    desc: "industrial, warehouse, or manufacturing facility",
    focus: "dock equipment, crane rails, heavy floor slabs, overhead doors, electrical service (3-phase), HVAC/ventilation, drainage",
    lifeSafety: "hazmat storage compliance, sprinkler coverage, emergency eyewash/shower stations, exit lighting, dock safety locks",
    engineering: "column spacing, floor slab condition/load rating, roof structure, heavy equipment pads, utility capacity",
  },
  land: {
    desc: "vacant land or development site",
    focus: "grading/drainage, soil conditions, existing utilities, environmental indicators, fencing, access roads",
    lifeSafety: "site access safety, environmental contamination indicators, erosion control",
    engineering: "topography, apparent soil bearing capacity, drainage patterns, easement encroachments",
  },
};

const extractGps = (file) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const view = new DataView(e.target.result);
    if (view.getUint16(0) !== 0xFFD8) return resolve(null);
    let offset = 2;
    while (offset < view.byteLength) {
      if (view.getUint16(offset) === 0xFFE1) {
        const exifLen = view.getUint16(offset + 2);
        const exifData = new DataView(e.target.result, offset + 4, exifLen - 2);
        if (exifData.getUint32(0) !== 0x45786966) return resolve(null);
        const little = exifData.getUint16(6) === 0x4949;
        const ifdOffset = exifData.getUint32(10, little) + 6;
        const numEntries = exifData.getUint16(ifdOffset, little);
        let gpsOffset = null;
        for (let i = 0; i < numEntries; i++) {
          const entryOffset = ifdOffset + 2 + i * 12;
          if (exifData.getUint16(entryOffset, little) === 0x8825) {
            gpsOffset = exifData.getUint32(entryOffset + 8, little) + 6;
          }
        }
        if (!gpsOffset) return resolve(null);
        const gpsEntries = exifData.getUint16(gpsOffset, little);
        let latRef, lat, lngRef, lng;
        const toDecimal = (rationals) => rationals[0] + rationals[1] / 60 + rationals[2] / 3600;
        const readRationals = (off) => [0, 1, 2].map(i => {
          const n = exifData.getUint32(off + i * 8, little);
          const d = exifData.getUint32(off + i * 8 + 4, little);
          return d ? n / d : 0;
        });
        for (let i = 0; i < gpsEntries; i++) {
          const e = gpsOffset + 2 + i * 12;
          const tag = exifData.getUint16(e, little);
          const valOff = exifData.getUint32(e + 8, little) + 6;
          if (tag === 1) latRef = String.fromCharCode(exifData.getUint8(e + 8));
          else if (tag === 2) lat = toDecimal(readRationals(valOff));
          else if (tag === 3) lngRef = String.fromCharCode(exifData.getUint8(e + 8));
          else if (tag === 4) lng = toDecimal(readRationals(valOff));
        }
        if (lat != null && lng != null) return resolve({ lat: latRef === "S" ? -lat : lat, lng: lngRef === "W" ? -lng : lng });
        return resolve(null);
      }
      offset += 2 + view.getUint16(offset + 2);
    }
    resolve(null);
  };
  reader.readAsArrayBuffer(file);
});

const compressImage = (file) => new Promise((resolve) => {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const MAX = 2400;
    let { width, height } = img;
    if (width > MAX || height > MAX) {
      if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
      else { width = Math.round(width * MAX / height); height = MAX; }
    }
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    canvas.getContext("2d").drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })), "image/jpeg", 0.92);
  };
  img.src = url;
});

export default function AddPhotosToReport({ report, onPhotosAdded }) {
  // staged = uploaded but not yet analyzed
  const [staged, setStaged] = useState([]); // [{ file_url, room_area, gps }]
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef(null);

  const handleFiles = async (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;
    setUploading(true);
    const newStaged = [];
    for (const file of imageFiles) {
      const [compressed, gps] = await Promise.all([compressImage(file), extractGps(file)]);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: compressed });
      const roomGuess = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      newStaged.push({ file_url, room_area: roomGuess, gps });
    }
    setStaged(prev => [...prev, ...newStaged]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (staged.length === 0) return;
    setAnalyzing(true);
    setProgress({ current: 0, total: staged.length });
    const ctx = ASSET_CONTEXT[report.property_type] || ASSET_CONTEXT.commercial;
    const newPhotos = [];

    for (let i = 0; i < staged.length; i++) {
      const { file_url, room_area, gps } = staged[i];
      setProgress({ current: i + 1, total: staged.length });

      const analysis = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_1_pro",
        prompt: `You are a senior property condition assessor specializing in ${ctx.desc} properties.

Property type: ${ctx.desc}
Area/Room: ${room_area}
Engineering focus: ${ctx.engineering}
Life safety focus: ${ctx.lifeSafety}
General maintenance focus: ${ctx.focus}

Analyze this photo and identify all visible issues, defects, or deferred maintenance items. For each issue assign severity (critical/high/medium/low) and provide a cost estimate for ${report.city_state || "the US"}.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            room_area: { type: "string" },
            summary: { type: "string" },
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  description: { type: "string" },
                  cost_min: { type: "number" },
                  cost_max: { type: "number" },
                },
              },
            },
          },
        },
      });

      const issues = analysis.issues || [];
      const saved = await base44.entities.InspectionPhoto.create({
        report_id: report.id,
        photo_url: file_url,
        room_area: analysis.room_area || room_area,
        analysis: analysis.summary || "",
        issues,
        status: "completed",
        lat: gps?.lat || null,
        lng: gps?.lng || null,
      });
      newPhotos.push(saved);
    }

    // Update report totals
    const allPhotos = await base44.entities.InspectionPhoto.filter({ report_id: report.id });
    const totalIssues = allPhotos.flatMap(p => p.issues || []);
    await base44.entities.InspectionReport.update(report.id, {
      total_issues: totalIssues.length,
      critical_issues: totalIssues.filter(i => i.severity === "critical").length,
      total_approx_cost: totalIssues.reduce((s, i) => s + (i.cost_max || i.cost_min || 0), 0),
    });

    setAnalyzing(false);
    setProgress({ current: 0, total: 0 });
    setStaged([]);
    onPhotosAdded(newPhotos);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(Array.from(e.target.files))}
      />

      {/* Step 1: Add photos button */}
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl gap-2"
        disabled={uploading || analyzing}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <><Loader2 className="w-4 h-4 animate-spin" />Uploading...</>
        ) : (
          <><Camera className="w-4 h-4" />Add Photos</>
        )}
      </Button>

      {/* Step 2: staged preview + analyze button */}
      {staged.length > 0 && !analyzing && (
        <>
          <div className="flex items-center gap-1">
            {staged.map((s, i) => (
              <div key={i} className="relative group">
                <img src={s.file_url} className="w-8 h-8 rounded object-cover border border-border" />
                <button
                  onClick={() => setStaged(prev => prev.filter((_, idx) => idx !== i))}
                  aria-label="Remove photo"
                  className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white rounded-full text-xs items-center justify-center hidden group-hover:flex"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            className="rounded-xl gap-2"
            onClick={handleAnalyze}
          >
            <Sparkles className="w-4 h-4" />
            Analyze {staged.length} Photo{staged.length > 1 ? "s" : ""} with AI
          </Button>
        </>
      )}

      {analyzing && (
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="w-4 h-4 animate-spin" />
          SiteLens analyzing {progress.current}/{progress.total}...
        </span>
      )}
    </div>
  );
}
