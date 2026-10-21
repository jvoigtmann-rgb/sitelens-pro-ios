import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Sparkles, AlertCircle, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import VoiceTextArea from "../components/VoiceTextArea";
import PropertyTypeSelect from "../components/PropertyTypeSelect";
import { base44 } from "@/api/base44Client";
import PhotoUploader from "../components/PhotoUploader";
import PhotoIssueCard from "../components/PhotoIssueCard";
import LocationPickerMap from "../components/LocationPickerMap";
import { isNativeApp, APPLE_IAP_ENABLED } from "@/lib/appleIap";

export default function NewInspection() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [cityState, setCityState] = useState("");
  const [reportPurpose, setReportPurpose] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [propertyType, setPropertyType] = useState("residential");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [reportCreated, setReportCreated] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [error, setError] = useState(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savedReportId, setSavedReportId] = useState(null);
  const [draftSaved, setDraftSaved] = useState(false);

  // Free (first) report only: cap how many photos can be analyzed, since each
  // photo triggers a paid LLM call. Pro and credit users are uncapped.
  const FREE_PHOTO_LIMIT = 15;
  const [freeReportEligible, setFreeReportEligible] = useState(false);
  const photoLimit = freeReportEligible ? FREE_PHOTO_LIMIT : null;

  useEffect(() => {
    base44.auth.me()
      .then((u) => setFreeReportEligible(u?.role !== "admin" && u?.plan !== "pro" && u?.free_report_used !== true))
      .catch(() => {});
  }, []);

  const handlePhotoUploaded = (url, name, gps) => {
    if (photoLimit && photos.filter((p) => p.status !== "error").length >= photoLimit) {
      setError(`Your free report includes up to ${photoLimit} photos. Start a Pro trial or buy credits to analyze more.`);
      return;
    }
    const roomGuess = name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
    setPhotos((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        photo_url: url,
        room_area: roomGuess,
        status: "uploading",
        issues: [],
        lat: gps?.lat || null,
        lng: gps?.lng || null,
      },
    ]);
    setTimeout(() => {
      setPhotos((prev) => prev.map((p) => p.photo_url === url ? { ...p, status: "ready" } : p));
    }, 500);
  };

  const handleDeletePhoto = (photoId) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleLocationSet = (photoId, lat, lng) => {
    setPhotos((prev) => prev.map((p) => p.id === photoId ? { ...p, lat, lng } : p));
  };

  // Save the report (and any uploaded photos) as an in-progress draft the user
  // can reopen later from the Reports list. No AI analysis, no entitlement used.
  const handleSaveDraft = async () => {
    if (!title.trim()) {
      setError("Please enter a property name or address before saving.");
      return;
    }
    setError(null);
    setSavingDraft(true);
    try {
      const report = await base44.entities.InspectionReport.create({
        title: title.trim(),
        city_state: cityState.trim(),
        report_purpose: reportPurpose.trim(),
        prepared_by: preparedBy.trim(),
        property_type: propertyType,
        notes: notes.trim(),
        status: "in_progress",
        total_issues: 0,
        critical_issues: 0,
      });
      const toSave = photos.filter((p) => p.status !== "error");
      if (toSave.length > 0) {
        await base44.entities.InspectionPhoto.bulkCreate(toSave.map((p) => ({
          report_id: report.id,
          photo_url: p.photo_url,
          room_area: p.room_area,
          issues: [],
          status: "draft",
          lat: p.lat || null,
          lng: p.lng || null,
        })));
      }
      setSavedReportId(report.id);
      setDraftSaved(true);
    } catch (err) {
      console.error("Draft save failed:", err);
      setError(`Could not save draft: ${err?.message || "Unknown error"}`);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleAnalyze = async () => {
    if (photos.length === 0) return;
    if (!title.trim()) {
      setError("Please enter a property name or address before analyzing.");
      return;
    }
    setError(null);
    setAnalyzing(true);
    try {
      const user = await base44.auth.me();
      const isAdmin = user?.role === "admin";
      const isPro = user?.plan === "pro";
      const credits = Number(user?.credits || 0);
      const PRO_MONTHLY_REPORTS = 10;
      const PRO_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

      // Decide whether this inspection is allowed, and what entitlement to consume
      // once the report record is successfully created.
      let consume = null;
      if (isAdmin) {
        // Admin (developer) accounts: unlimited testing, no entitlement consumed
      } else if (isNativeApp() && APPLE_IAP_ENABLED) {
        // iOS native app: server-side verified Apple (RevenueCat) entitlement.
        // The consume action validates and decrements the allowance on the
        // server; purchase claims from the client are never trusted.
        let appleResult;
        try {
          const res = await base44.functions.invoke("apple-subscription-status", { action: "consume" });
          appleResult = res?.data;
        } catch (err) {
          console.warn("Apple entitlement check failed", err);
        }
        if (!appleResult?.allowed) {
          setError(
            appleResult?.reason === "out_of_inspections"
              ? "You're out of inspections. Restore purchases or buy more reports to continue."
              : "We couldn't verify your subscription. Please restore purchases and try again."
          );
          setAnalyzing(false);
          return;
        }
        // Allowance was consumed server-side; nothing to update on the user record.
      } else if (isPro) {
        const now = Date.now();
        const trialUntil = user?.pro_trial_until ? new Date(user.pro_trial_until).getTime() : 0;
        const inTrial = trialUntil > 0 && now < trialUntil;
        if (inTrial) {
          // Trial: one inspection total during the trial window.
          const trialUsed = Number(user?.trial_reports_used || 0);
          if (trialUsed < 1) {
            consume = { trial_reports_used: trialUsed + 1 };
          } else if (credits > 0) {
            consume = { credits: Math.max(0, credits - 1) };
          }
        } else {
          const periodStart = user?.pro_period_start ? new Date(user.pro_period_start).getTime() : 0;
          const periodExpired = !periodStart || now - periodStart > PRO_PERIOD_MS;
          const used = periodExpired ? 0 : Number(user?.pro_reports_used || 0);
          if (used < PRO_MONTHLY_REPORTS) {
            consume = {
              pro_reports_used: used + 1,
              pro_period_start: periodExpired ? new Date().toISOString() : user.pro_period_start,
            };
          } else if (credits > 0) {
            consume = { credits: Math.max(0, credits - 1) };
          }
        }
      } else if (user?.free_report_used !== true) {
        consume = { free_report_used: true };
      } else if (credits > 0) {
        consume = { credits: Math.max(0, credits - 1) };
      }

      if (!consume && !isAdmin) {
        setError("You're out of inspections. Start a Pro trial or buy extra reports to continue.");
        setAnalyzing(false);
        return;
      }

    const report = await base44.entities.InspectionReport.create({
      title: title.trim(),
      city_state: cityState.trim(),
      report_purpose: reportPurpose.trim(),
      prepared_by: preparedBy.trim(),
      property_type: propertyType,
      notes: notes.trim(),
      status: "in_progress",
      total_issues: 0,
      critical_issues: 0,
    });

    setReportCreated(true);

    if (consume) {
      try { await base44.auth.updateMe(consume); }
      catch (e) { console.warn("Could not update entitlement", e); }
    }

    const results = [];

    const analyzePhoto = async (photo) => {
      setPhotos((prev) => prev.map((p) => p.id === photo.id ? { ...p, status: "analyzing" } : p));
      try {
      const assetContext = {
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
      const ctx = assetContext[propertyType] || assetContext.commercial;

      const analysis = await base44.integrations.Core.InvokeLLM({
        model: "claude_sonnet_4_6",
        prompt: `You are a senior property condition assessor specializing in ${ctx.desc} properties. Apply maintenance, engineering, and life safety principles specific to this asset type when evaluating the photo.

Property type: ${ctx.desc}
Area/Room: ${photo.room_area || "Unknown"}

Engineering focus areas for this asset type: ${ctx.engineering}
Life safety focus areas: ${ctx.lifeSafety}
General maintenance focus: ${ctx.focus}

Analyze this photo and identify all visible issues, defects, or deferred maintenance items. For each issue:
- Apply the relevant maintenance, engineering, or life safety standard for a ${ctx.desc}
- Assign severity (critical = immediate life safety or structural risk, high = major system failure within 1-2 years, medium = functional degradation, low = cosmetic/minor)
- Provide a single approximate repair/remediation cost in USD based on current contractor labor and material rates in ${cityState || "the US"} for this building type. Adjust for local cost-of-living and market conditions (e.g. coastal cities are higher cost, rural markets lower).

Only report issues you can clearly and directly see in the photo. Do NOT infer or assume issues that are not visibly evident. For each issue, assign a confidence level: "high" = clearly visible defect, "medium" = probable but partially obscured, "low" = speculative or unclear. Be specific and concise.

MANDATORY RULE for structural issues: if an issue involves structural elements, foundation, framing, or settling/settlement (e.g. cracks, foundation movement, sagging, structural deflection), you MUST append this exact sentence to the end of its description: "A licensed professional should be consulted regarding this issue." For such issues, set cost_min and cost_max as a wide range reflecting that costs cannot be reliably estimated until a licensed professional (structural engineer or similar) evaluates it.`,
        file_urls: [photo.photo_url],
        response_json_schema: {
          type: "object",
          properties: {
            room_area: { type: "string", description: "Best guess of the room/area shown" },
            summary: { type: "string", description: "Brief overall assessment" },
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  description: { type: "string" },
                  cost_min: { type: "number", description: "Low-end repair cost estimate in USD" },
                  cost_max: { type: "number", description: "High-end repair cost estimate in USD" },
                  confidence: { type: "string", enum: ["low", "medium", "high"], description: "How clearly visible and certain this issue is from the photo" },
                },
              },
            },
          },
        },
      });

      const issues = (analysis.issues || []).filter(i => i.confidence !== "low");
      results.push({
        count: issues.length,
        critical: issues.filter((iss) => iss.severity === "critical").length,
        totalCost: issues.reduce((s, iss) => s + (iss.cost_max || iss.cost_min || 0), 0),
      });

      await base44.entities.InspectionPhoto.create({
        report_id: report.id,
        photo_url: photo.photo_url,
        room_area: analysis.room_area || photo.room_area,
        analysis: analysis.summary || "",
        issues,
        status: "completed",
        lat: photo.lat || null,
        lng: photo.lng || null,
      });

      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photo.id
            ? { ...p, status: "completed", room_area: analysis.room_area || p.room_area, issues, analysis: analysis.summary }
            : p
        )
      );
      } catch (err) {
        console.error("Photo analysis failed:", err);
        setPhotos((prev) => prev.map((p) => p.id === photo.id ? { ...p, status: "error" } : p));
      }
    };

    // Process one at a time to avoid network errors
    for (const photo of photos) {
      await analyzePhoto(photo);
    }

    try {
      await base44.entities.InspectionReport.update(report.id, {
        status: "completed",
        total_issues: results.reduce((s, r) => s + r.count, 0),
        critical_issues: results.reduce((s, r) => s + r.critical, 0),
        total_approx_cost: results.reduce((s, r) => s + r.totalCost, 0),
      });
    } catch (updateErr) {
      console.warn("Could not update report summary stats:", updateErr);
    }

    setAnalyzing(false);
    setSavedReportId(report.id);
    setDraftSaved(false);
    } catch (err) {
      console.error("Analysis failed:", err);
      setError(`Analysis failed: ${err?.message || "Unknown error"}. Please try again.`);
      setAnalyzing(false);
      setReportCreated(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <p className="text-sm text-muted-foreground">Upload photos and AI will analyze them for issues</p>

      {/* Property Details */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Property Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Property Name / Street Address</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Property name"
              autoComplete="new-password"
              disabled={analyzing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cityState">City, State</Label>
            <Input
              id="cityState"
              value={cityState}
              onChange={(e) => setCityState(e.target.value)}
              placeholder="City, state"
              autoComplete="new-password"
              disabled={analyzing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preparedBy">Prepared By</Label>
            <Input
              id="preparedBy"
              value={preparedBy}
              onChange={(e) => setPreparedBy(e.target.value)}
              placeholder="Prepared by"
              autoComplete="new-password"
              disabled={analyzing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reportPurpose">Report Purpose</Label>
            <Input
              id="reportPurpose"
              value={reportPurpose}
              onChange={(e) => setReportPurpose(e.target.value)}
              placeholder=""
              autoComplete="new-password"
              disabled={analyzing}
            />
          </div>
          <div className="space-y-2">
            <Label>Property Type</Label>
            <PropertyTypeSelect value={propertyType} onChange={setPropertyType} disabled={analyzing} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <VoiceTextArea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder=""
            rows={3}
            disabled={analyzing}
          />
        </div>
      </div>

      {/* Photo Upload */}
      <div className="space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Photos ({photos.filter(p => p.status === 'ready' || p.status === 'completed').length} ready)
          {photoLimit && (
            <span className="ml-2 text-amber-600 normal-case font-medium">
              · {photos.filter((p) => p.status !== "error").length}/{photoLimit} on free report
            </span>
          )}
        </h2>
        <PhotoUploader onPhotoUploaded={handlePhotoUploaded} disabled={analyzing} />
      </div>

      {/* Location Map */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Photo Locations (optional)
            </h2>
            <button
              type="button"
              className="text-xs text-primary underline"
              onClick={() => setShowMap((v) => !v)}
            >
              {showMap ? "Hide map" : "Pin on map"}
            </button>
          </div>
          {showMap && <LocationPickerMap photos={photos} onLocationSet={handleLocationSet} />}
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {photos.map((photo) => (
            <PhotoIssueCard
              key={photo.id}
              photo={photo}
              onDelete={!analyzing ? handleDeletePhoto : undefined}
            />
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Action Buttons */}
      {!reportCreated && !savedReportId && (photos.length > 0 || title.trim()) && (
        <div className="sticky bottom-16 sm:bottom-4 z-40 px-1 space-y-2">
          {photos.length > 0 && (
            <Button
              size="lg"
              className="w-full rounded-xl shadow-2xl shadow-primary/30 gap-2 h-14 text-base"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  SiteLens analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analyze {photos.length} Photo{photos.length > 1 ? "s" : ""} with AI
                </>
              )}
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            className="w-full rounded-xl h-12 gap-2"
            onClick={handleSaveDraft}
            disabled={savingDraft || analyzing}
          >
            {savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save as Draft
          </Button>
        </div>
      )}

      {/* Saved / Complete Confirmation */}
      {savedReportId && !analyzing && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto text-green-600" />
          <div>
            <p className="font-semibold">{draftSaved ? "Draft saved" : "Analysis complete"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {draftSaved
                ? "Find it under Reports any time to pick up where you left off."
                : "Your report is ready to view."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button className="rounded-xl" onClick={() => navigate(`/report/${savedReportId}`)}>
              {draftSaved ? "Open Draft" : "View Report"}
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => navigate("/reports")}>
              Go to Reports
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
