import { useState, useEffect } from "react";
import { Pencil, Check, X, Loader2, Sparkles, Trash2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import VoiceTextArea from "@/components/VoiceTextArea";
import { base44 } from "@/api/base44Client";

export default function NarrativeSection({ number, title, content, onSave, onDelete, placeholder, report, photos }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(content || "");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!editing) setValue(content || "");
  }, [content]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(value);
    setSaving(false);
    setEditing(false);
  };

  const isExecutiveSummary = title?.toLowerCase().includes("executive");
  const isMarketSummary = title?.toLowerCase().includes("market");
  const isOperations = title?.toLowerCase().includes("operations");
  const isBulletSection = ["general", "condition", "inspector"].some(k => title?.toLowerCase().includes(k));

  const ASSET_CONTEXT = {
    residential: {
      desc: "single-family or small residential property",
      engineeringFocus: "roof, foundation, structural framing, moisture intrusion, HVAC, electrical panel, plumbing",
      lifeSafety: "egress paths, smoke/CO detectors, GFCI outlets, stair handrails, window guards",
      marketProfile: "owner-occupied or rental residential asset; valued by comparable sales, condition, and neighborhood rental demand",
    },
    multifamily: {
      desc: "multifamily residential building (apartments or condos)",
      engineeringFocus: "building envelope, common area systems, boiler/HVAC, elevator, fire suppression, utility risers, roof deck",
      lifeSafety: "fire sprinklers, fire doors, exit signage, emergency lighting, stairwell egress, elevator compliance, ADA access",
      marketProfile: "income-producing multifamily asset; valued on NOI/cap rate, occupancy, rent growth, and operating expense ratio",
    },
    commercial: {
      desc: "commercial office, retail, or mixed-use property",
      engineeringFocus: "roof membrane, MEP systems, electrical distribution, storefront glazing, restrooms, parking lot, structural frame",
      lifeSafety: "fire sprinkler system, fire alarm, exit signage, emergency lighting, ADA compliance, occupant load compliance",
      marketProfile: "commercial income property; valued on in-place rents, lease term, tenant credit, vacancy, and cap rate vs. market",
    },
    industrial: {
      desc: "industrial, warehouse, or manufacturing facility",
      engineeringFocus: "floor slab load capacity, dock equipment, crane rails, overhead doors, 3-phase electrical, ventilation, drainage",
      lifeSafety: "sprinkler coverage, hazmat compliance, emergency eyewash/shower stations, exit lighting, dock safety locks",
      marketProfile: "industrial/logistics asset; valued on clear height, dock count, power capacity, lease term, and submarket vacancy",
    },
    land: {
      desc: "vacant land or development site",
      engineeringFocus: "grading, drainage, soil conditions, utilities availability, access roads, environmental indicators",
      lifeSafety: "site access safety, erosion control, environmental contamination indicators",
      marketProfile: "development land; valued on entitlements, zoning, utility access, topography, and comparable land sales",
    },
  };

  const ctx = ASSET_CONTEXT[report?.property_type] || ASSET_CONTEXT.commercial;

  const handleGenerate = async (mode = "generate") => {
    setGenerating(true);
    const issuesSummary = (photos || [])
      .flatMap(p => (p.issues || []).map(i => `- [${i.severity}] ${i.title}: ${i.description || ""}`))
      .join("\n");

    const existingText = (value || "").trim();
    const isImproving = existingText.length > 0;

    let prompt;

    if (mode === "expand") {
      prompt = `You are a senior professional writer for commercial real estate site observation reports. Expand and elaborate the following "${title}" section for a ${ctx.desc}.

Property: ${report?.title || ""}
Address: ${report?.address || ""} ${report?.city_state || ""}

Current text to expand:
"""
${existingText}
"""

Rewrite this section with substantially more depth and detail. For each observation, elaborate on what it means for the property, why it matters (financial, safety, or operational implications), and a recommended action or timeframe. Do NOT invent new findings, issues, or facts that are not already in the current text. ${isBulletSection ? "Keep the bullet-point format, one bullet per observation, each bullet 2-3 sentences." : "Keep the paragraph structure."} Output plain text only, no headings, no URLs.`;
    } else if (isImproving) {
      prompt = `You are a senior professional writer and editor for commercial real estate site observation reports. Improve and rewrite the following "${title}" section for a ${ctx.desc}.

Property: ${report?.title || ""}
Address: ${report?.address || ""} ${report?.city_state || ""}

Current text to improve:
"""
${existingText}
"""

Rewrite this text to be clearer, more professional, and more concise. Fix grammar, tighten phrasing, and improve flow. Preserve all factual content and the original meaning — do not invent new findings or add information that isn't in the current text. ${isBulletSection ? "Keep the bullet-point format if present." : "Keep the paragraph structure."} Output plain text only, no headings, no URLs, no markdown.`;
    } else if (isExecutiveSummary) {
      prompt = `You are a senior commercial real estate advisor writing the executive summary for a site observation report on a ${ctx.desc}.

Property: ${report?.title || ""}
Address: ${report?.address || ""} ${report?.city_state || ""}
Asset type: ${ctx.desc}
Market profile: ${ctx.marketProfile}
Inspector quick notes: ${report?.quick_notes || "None provided"}
Key issues detected:
${issuesSummary || "No issues detected"}

Write EXACTLY 4-6 short bullet points summarizing this property. Each bullet must be a single sentence of 15 words or less, starting with "• ". Cover: (1) asset class and overall physical condition, (2) the most critical issues observed (one bullet per major issue), (3) a direct investment opinion/risk call as the final bullet. Be punchy and opinionated like a seasoned acquisitions professional. No fluff, no generic statements, no paragraphs. Output ONLY the bullet points, plain text, no headings, no URLs.`;
    } else if (isMarketSummary) {
      prompt = `You are a professional commercial real estate analyst writing the market context section for a site observation report on a ${ctx.desc}.

Property: ${report?.title || ""}
Address: ${report?.address || ""} ${report?.city_state || ""}
Asset type: ${ctx.desc}
Market profile: ${ctx.marketProfile}
Inspector notes: ${report?.quick_notes || "None provided"}

Write 2-3 concise sentences describing where this specific asset type sits in its local market. Cover: (1) submarket dynamics for ${ctx.desc} assets in this location, (2) how assets of this class typically perform (vacancy, demand, rent trends), and (3) any macro or local factor affecting value or repositioning potential. Use real market knowledge specific to this asset class and location. Output plain text only, no headings, bullet points, or URLs.`;
    } else if (isOperations) {
      const systems = ctx.desc.includes("land")
        ? ["Grading & Drainage", "Utilities", "Access & Roads", "Environmental"]
        : ["Exterior & Building Envelope", "Roof", "HVAC", "Plumbing", "Electrical", "Fire / Life Safety", "Interior Common Areas", "Elevators & Vertical Transport", "Site & Parking"];

      prompt = `You are a senior property condition assessor specializing in ${ctx.desc} assets. Write the "Operations & Physical Building" section of a formal site observation report.

Property: ${report?.title || ""}
Address: ${report?.address || ""} ${report?.city_state || ""}
Asset type: ${ctx.desc}
Inspector notes: ${report?.quick_notes || "None provided"}
Detected issues from photos:
${issuesSummary || "No issues detected"}

Write a concise assessment organized by the following building systems. For each system, write 1-2 sentences describing the observed condition. If no information is available for a system, write "No observations." Format each system EXACTLY as: the system name followed by a colon, then the narrative on the same line (e.g. "Roof: The flat membrane roof..."). Number each system sequentially (e.g. "1. Roof: ..."). Each system on its own line. Do not skip systems. Base any cost references on current contractor rates in ${report?.city_state || "the US"}.

Systems to cover:
${systems.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Output plain text only. No markdown, no asterisks, no bullet points, no URLs.`;
    } else {
      prompt = `You are a senior property condition assessor specializing in ${ctx.desc} assets. Write the "${title}" section of a formal site observation report.

Property: ${report?.title || ""}
Address: ${report?.address || ""} ${report?.city_state || ""}
Asset type: ${ctx.desc}
Engineering focus for this asset type: ${ctx.engineeringFocus}
Life safety standards: ${ctx.lifeSafety}
Inspector notes: ${report?.quick_notes || "None provided"}
Detected issues from photos:
${issuesSummary || "No issues detected"}

${isBulletSection
  ? `Write a concise list of key observations as SHORT bullet points (5-8 words each, max one short sentence). Start each bullet with "• ". Group by building system if multiple systems are present. Keep each point brief and direct. Output plain text only, no headings, no URLs.`
  : `Write a professional, concise narrative applying the correct engineering and life safety standards for a ${ctx.desc}. Where costs are referenced, base estimates on current contractor rates in ${report?.city_state || "the US"}, adjusting for local labor and material costs. Output plain text only, no headings, bullet points, or URLs.`
}`;
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
      model: "claude_opus_4_6",
    });

    const raw = typeof result === "string" ? result : result?.text || "";
    // Strip URLs and website references
    const generated = raw
      .replace(/https?:\/\/[^\s)>\]"']*/g, "")
      .replace(/www\.[^\s)>\]"']*/g, "")
      .replace(/\b(?:visit|see|available at|source:|via|from)\s+[^\s)>\]"']*\.[a-z]{2,}[^\s)>\]"']*/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    setValue(generated);
    setEditing(true);
    setGenerating(false);
    // Auto-save generated content so it persists on reload
    await onSave(generated);
  };

  return (
    <div className="bg-card overflow-hidden">
      {/* Section header — PDF style: navy bold with gold underline */}
      <div className="pb-2 border-b-2 border-[#c9a227] mb-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-primary">
            {number && <span className="mr-1">{number}.</span>}
            {title}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-primary gap-1"
              onClick={() => handleGenerate()}
              disabled={generating || saving}
            >
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {generating ? "SiteLens assisting..." : (value || content) ? "Improve" : "AI Assist"}
            </Button>
            {(value || content) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-primary gap-1"
                onClick={() => handleGenerate("expand")}
                disabled={generating || saving}
              >
                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Maximize2 className="w-3 h-3" />}
                Expand
              </Button>
            )}
            {!editing ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 min-h-[44px] min-w-[44px] text-muted-foreground"
                onClick={() => { setValue(content || ""); setEditing(true); }}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7 min-h-[44px] min-w-[44px] text-green-600" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 min-h-[44px] min-w-[44px] text-muted-foreground" onClick={() => setEditing(false)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive"
                onClick={onDelete}
                title="Remove section"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="py-3">
        {editing ? (
          <VoiceTextArea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={6}
            placeholder={placeholder}
            className="text-sm resize-none"
          />
        ) : content ? (
          isOperations ? (
            <div className="text-sm text-muted-foreground space-y-6">
              {(() => {
                let sysNum = 0;
                const lines = content.split("\n").filter(Boolean);
                return lines.map((line, i) => {
                  const numMatch = line.match(/^(\d+)\.\s+([A-Za-z][^:]{2,50}):\s*(.*)/);
                  const match = !numMatch && line.match(/^\*\*(.+?):\*\*\s*(.*)/);
                  const plainMatch = !numMatch && !match && line.match(/^([A-Z][^:]{2,50}):\s*(.*)/);
                  if (numMatch || match || plainMatch) {
                    sysNum++;
                    const label = numMatch ? numMatch[2] : match ? match[1] : plainMatch[1];
                    const body = numMatch ? numMatch[3] : match ? match[2] : plainMatch[2];
                    return (
                      <div key={i} className="border-l-2 border-[#c9a227]/60 pl-4">
                        <p className="font-bold text-primary text-sm mb-1.5">
                          <span className="text-[#c9a227] mr-1">{sysNum}.</span> {label}
                        </p>
                        <p className="leading-relaxed text-muted-foreground">{body}</p>
                      </div>
                    );
                  }
                  return <p key={i} className="pl-4 text-muted-foreground">{line}</p>;
                });
              })()}
            </div>
          ) : isBulletSection ? (
            <ul className="text-sm text-muted-foreground space-y-3">
              {content.split("\n").filter(Boolean).map((line, i) => {
                const text = line.replace(/^•\s*/, "").trim();
                // Check if line starts with a label (e.g. "Roof:" or "1. Roof:")
                const labelMatch = text.match(/^(?:(\d+)\.\s+)?([A-Z][^:]{2,40}):\s*(.*)/);
                if (labelMatch) {
                  const num = labelMatch[1];
                  const label = labelMatch[2];
                  const body = labelMatch[3];
                  return (
                    <li key={i} className="border-l-2 border-[#c9a227]/60 pl-4 py-0.5">
                      <p className="font-bold text-primary text-sm mb-0.5">
                        {num && <span className="text-[#c9a227] mr-1">{num}.</span>}{label}
                      </p>
                      {body && <p className="leading-snug text-muted-foreground">{body}</p>}
                    </li>
                  );
                }
                return (
                  <li key={i} className="flex gap-2 items-start">
                    <span className="text-[#c9a227] font-bold shrink-0 mt-0.5">•</span>
                    <span className="leading-snug">{text}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{content}</p>
          )
        ) : (
          <p className="text-sm text-muted-foreground italic">{placeholder || "Click the pencil icon to add content."}</p>
        )}
      </div>
    </div>
  );
}