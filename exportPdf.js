import { jsPDF } from "jspdf";

// ─── Colors ──────────────────────────────────────────────────────────────────
const NAVY = [30, 45, 77];
const GOLD = [201, 162, 39];
const WHITE = [255, 255, 255];
const LIGHT_GRAY = [240, 243, 248];
const MID_GRAY = [100, 116, 139];
const DARK_TEXT = [30, 41, 59];
const GREEN = [21, 128, 61];
const RED = [185, 28, 28];
const ORANGE = [194, 65, 12];
const YELLOW_TEXT = [133, 100, 4];
const ROW_ALT = [248, 250, 252];

// ─── Page dimensions ─────────────────────────────────────────────────────────
const PW = 210, PH = 297; // portrait
const LW = 297, LH = 210; // landscape
const M = 14;

// ─── Page Manager ────────────────────────────────────────────────────────────
// Wraps jsPDF so every page add is explicit about orientation.
// This prevents the "landscape bleeds into subsequent pages" bug.
class PdfBuilder {
  constructor() {
    this.doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    this.pageOrientations = ["portrait"]; // page 1
  }

  // Add a portrait page and set it as current
  addPortraitPage() {
    this.doc.addPage("a4", "portrait");
    this.pageOrientations.push("portrait");
    return this;
  }

  // Add a landscape page and set it as current
  addLandscapePage() {
    this.doc.addPage("a4", "landscape");
    this.pageOrientations.push("landscape");
    return this;
  }

  get currentPage() {
    return this.doc.getNumberOfPages();
  }

  get currentOrientation() {
    return this.pageOrientations[this.currentPage - 1] || "portrait";
  }

  get width() {
    return this.currentOrientation === "landscape" ? LW : PW;
  }

  get height() {
    return this.currentOrientation === "landscape" ? LH : PH;
  }

  // Check if we need a new portrait page; create one if needed
  ensureSpace(needed, margin = M) {
    const y = this.doc.lastAutoTable ? this.doc.lastAutoTable.finalY : null;
    return this; // placeholder — callers manage y directly
  }

  save(filename) {
    this.doc.save(filename);
  }
}

// ─── Font / draw helpers ─────────────────────────────────────────────────────
function setFont(builder, size, style = "normal", color = DARK_TEXT) {
  builder.doc.setFontSize(size);
  builder.doc.setFont("helvetica", style);
  builder.doc.setTextColor(...color);
}

function hRule(builder, x, y, w, color = GOLD, thickness = 0.6) {
  builder.doc.setDrawColor(...color);
  builder.doc.setLineWidth(thickness);
  builder.doc.line(x, y, x + w, y);
}

function rect(builder, x, y, w, h, color) {
  builder.doc.setFillColor(...color);
  builder.doc.rect(x, y, w, h, "F");
}

/** Load a URL, draw through canvas to strip EXIF rotation, return normalized data URL */
async function urlToDataUrl(url) {
  try {
    return await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  } catch {
    return null;
  }
}

/** Add an image at (x, y) with max dimensions, return height consumed */
function drawImage(builder, dataUrl, x, y, maxW, maxH) {
  try {
    const fmt = dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const nW = img.naturalWidth || img.width;
        const nH = img.naturalHeight || img.height;
        if (!nW || !nH) { resolve(0); return; }
        const ratio = nW / nH;
        let w = maxW;
        let h = w / ratio;
        if (h > maxH) { h = maxH; w = h * ratio; }
        if (w > maxW) { w = maxW; h = w / ratio; }
        try {
          builder.doc.addImage(dataUrl, fmt, x, y, w, h, undefined, "NONE");
        } catch {}
        resolve(h);
      };
      img.onerror = () => resolve(0);
      img.src = dataUrl;
    });
  } catch {
    return Promise.resolve(0);
  }
}

// ─── Running header ──────────────────────────────────────────────────────────
function drawRunningHeader(builder, report) {
  const w = builder.width;
  rect(builder, 0, 0, w, 8, NAVY);
  setFont(builder, 6.5, "bold", GOLD);
  builder.doc.text((report.prepared_by || "Site Observation Report").toUpperCase(), M, 5.5);
  setFont(builder, 6.5, "normal", [148, 163, 184]);
  builder.doc.text(
    `${report.title || ""}${report.city_state ? ` · ${report.city_state}` : ""}`,
    w - M, 5.5, { align: "right" }
  );
}

// ─── Executive Dashboard page ────────────────────────────────────────────────
function buildExecutiveDashboard(builder, report, photos) {
  const w = PW;
  const TABLE_BORDER = [178, 178, 178];

  builder.addPortraitPage();
  let y = M + 4;

  // Header
  setFont(builder, 11, "bold", NAVY);
  builder.doc.text("SITE OBSERVATION REPORT", w / 2, y, { align: "center" });
  y += 8;
  hRule(builder, w / 2 - 30, y, 60, GOLD, 0.5);
  y += 8;

  // Property name
  setFont(builder, 14, "bold", DARK_TEXT);
  builder.doc.text(report.title || "—", M, y);
  y += 6;
  if (report.city_state) {
    setFont(builder, 10, "normal", MID_GRAY);
    builder.doc.text(report.city_state, M, y);
    y += 6;
  }
  y += 4;

  // Executive Dashboard metrics
  const allIssues = (photos || []).flatMap(p => p.issues || []);
  const criticalCount = allIssues.filter(i => i.severity === "critical").length;
  const immediateCost = allIssues
    .filter(i => i.severity === "critical" || i.severity === "high")
    .reduce((s, i) => s + (i.cost_max || i.cost_min || 0), 0);

  const metrics = [
    ["Overall Condition", report.overall_condition || "—"],
    ["Deferred Maintenance", report.deferred_maintenance || "—"],
    ["CapEx Risk", report.capex_risk || "—"],
    ["Immediate Repairs", immediateCost ? `$${immediateCost.toLocaleString()}` : "$0"],
    ["Critical Issues", String(criticalCount)],
    ["Photos Reviewed", String((photos || []).length)],
  ];

  setFont(builder, 12, "bold", NAVY);
  builder.doc.text("General Observations", M, y);
  y += 4;
  hRule(builder, M, y, w - M * 2, GOLD, 0.5);
  y += 6;

  const colW = (w - M * 2) / 2;
  const rowH = 7;
  metrics.forEach((m, i) => {
    if (i % 2 === 1) rect(builder, M, y, w - M * 2, rowH, [248, 250, 252]);
    setFont(builder, 9, "normal", DARK_TEXT);
    builder.doc.text(m[0], M + 2, y + 5);
    setFont(builder, 9, "bold", NAVY);
    builder.doc.text(m[1], M + colW + 2, y + 5);
    builder.doc.setDrawColor(...TABLE_BORDER);
    builder.doc.setLineWidth(0.2);
    builder.doc.line(M, y + rowH, w - M, y + rowH);
    y += rowH;
  });
  builder.doc.line(M, y - rowH * metrics.length, M, y);
  builder.doc.line(M + colW, y - rowH * metrics.length, M + colW, y);
  builder.doc.line(w - M, y - rowH * metrics.length, w - M, y);
  y += 8;

  // Investment Opinion
  if (report.investment_opinion) {
    setFont(builder, 12, "bold", NAVY);
    builder.doc.text("Executive Summary", M, y);
    y += 4;
    hRule(builder, M, y, w - M * 2, GOLD, 0.5);
    y += 6;
    setFont(builder, 9, "normal", DARK_TEXT);
    const lines = builder.doc.splitTextToSize(report.investment_opinion, w - M * 2);
    lines.forEach((line) => {
      if (y + 5 > PH - M) { builder.addPortraitPage(); drawRunningHeader(builder, report); y = M + 6; }
      builder.doc.text(line, M, y);
      y += 5;
    });
    y += 6;
  }

}

// ─── Cover page ──────────────────────────────────────────────────────────────
async function buildCover(builder, report) {
  const w = PW;
  // Header bar
  rect(builder, 0, 0, w, 10, NAVY);
  setFont(builder, 7.5, "bold", GOLD);
  builder.doc.text((report.prepared_by || "Site Observation Report").toUpperCase(), M, 6.5);

  let y = 18;

  // Cover photo
  if (report.cover_photo_url) {
    const dataUrl = await urlToDataUrl(report.cover_photo_url);
    if (dataUrl) {
      const maxW = w - M * 2;
      const imgEl = new Image();
      await new Promise(r => { imgEl.onload = r; imgEl.onerror = r; imgEl.src = dataUrl; });
      const ratio = (imgEl.naturalWidth || 1) / (imgEl.naturalHeight || 1);
      let imgW = maxW, imgH = imgW / ratio;
      if (imgH > 90) { imgH = 90; imgW = imgH * ratio; }
      const imgX = M + (maxW - imgW) / 2;
      const drawn = await drawImage(builder, dataUrl, imgX, y, imgW, imgH);
      y += drawn + 4;
    }
  }

  hRule(builder, M, y, w - M * 2, GOLD, 1.2);
  y += 8;

  setFont(builder, 9, "bold", NAVY);
  builder.doc.text("SITE OBSERVATION REPORT", w / 2, y, { align: "center" });
  y += 6;

  hRule(builder, w / 2 - 28, y, 56, GOLD, 0.5);
  y += 10;

  setFont(builder, 22, "bold", NAVY);
  const titleLines = builder.doc.splitTextToSize(report.title || "Inspection Report", w - M * 4);
  builder.doc.text(titleLines, w / 2, y, { align: "center" });
  y += titleLines.length * 10 + 2;

  if (report.city_state) {
    setFont(builder, 11, "italic", MID_GRAY);
    builder.doc.text(report.city_state, w / 2, y, { align: "center" });
    y += 8;
  }

  hRule(builder, w / 2 - 28, y, 56, GOLD, 0.5);
  y += 10;

  if (report.report_purpose) {
    setFont(builder, 10, "bold", NAVY);
    builder.doc.text(report.report_purpose, w / 2, y, { align: "center" });
    y += 6;
  }
  if (report.inspection_date) {
    setFont(builder, 9, "normal", MID_GRAY);
    builder.doc.text(report.inspection_date, w / 2, y, { align: "center" });
    y += 8;
  }

  setFont(builder, 8, "normal", MID_GRAY);
  builder.doc.text("Prepared by:", w / 2, y, { align: "center" });
  y += 5;
  setFont(builder, 9, "bold", NAVY);
  builder.doc.text(report.prepared_by || "—", w / 2, y, { align: "center" });
  y += 12;

  // Confidential bar
  rect(builder, M, PH - 22, w - M * 2, 12, NAVY);
  setFont(builder, 7, "bold", GOLD);
  builder.doc.text("CONFIDENTIAL — FOR INTERNAL USE ONLY", w / 2, PH - 14, { align: "center" });
}

// ─── Stats bar ───────────────────────────────────────────────────────────────
function buildStats(builder, report, photoCount, y) {
  const w = PW;
  const approxCost = report.total_approx_cost ||
    (report.total_cost_min > 0 || report.total_cost_max > 0
      ? Math.round(((report.total_cost_min || 0) + (report.total_cost_max || 0)) / 2)
      : 0);

  const stats = [
    { label: "Photos", value: String(photoCount) },
    { label: "Total Issues", value: String(report.total_issues || 0) },
    { label: "Critical", value: String(report.critical_issues || 0) },
    { label: "Approx. Cost", value: approxCost > 0 ? `~$${approxCost.toLocaleString()}` : "—" },
  ];

  const boxW = (w - M * 2) / 4;
  rect(builder, M, y, w - M * 2, 18, LIGHT_GRAY);
  stats.forEach((s, i) => {
    const cx = M + i * boxW + boxW / 2;
    setFont(builder, 11, "bold", NAVY);
    builder.doc.text(s.value, cx, y + 8, { align: "center" });
    setFont(builder, 7, "normal", MID_GRAY);
    builder.doc.text(s.label, cx, y + 14, { align: "center" });
  });
  return y + 22;
}

// ─── Section header ──────────────────────────────────────────────────────────
function sectionHeader(builder, num, title, y) {
  const w = PW;
  setFont(builder, 13, "bold", NAVY);
  builder.doc.text(num ? `${num}.  ${title}` : title, M, y);
  hRule(builder, M, y + 2, w - M * 2, GOLD, 0.7);
  return y + 10;
}

// ─── Page break helper (portrait) ─────────────────────────────────────────────
function portraitPageBreak(builder) {
  builder.addPortraitPage();
  drawRunningHeader(builder, builder._report);
  return M + 6;
}

// ─── Narrative section ───────────────────────────────────────────────────────
function buildNarrative(builder, num, title, content, y) {
  const w = PW;
  const maxY = PH - M;
  if (!content) return y;

  if (y + 30 > maxY) y = portraitPageBreak(builder);
  y = sectionHeader(builder, num, title, y);

  const lineH = 5;
  const paragraphs = content.split(/\n/).filter(l => l.trim());

  paragraphs.forEach((para) => {
    if (y + 12 > maxY) y = portraitPageBreak(builder);

    const numMatch = para.match(/^(\d+)\.\s+([^:]+?)(?::\s*(.*))?$/);
    if (numMatch) {
      const label = `${numMatch[1]}. ${numMatch[2]}${numMatch[3] ? ":" : ""}`;
      const body = numMatch[3] || "";
      setFont(builder, 9, "bold", DARK_TEXT);
      builder.doc.text(label, M, y);
      y += lineH;
      if (body) {
        setFont(builder, 9, "normal", DARK_TEXT);
        const bodyLines = builder.doc.splitTextToSize(body, w - M * 2);
        bodyLines.forEach((bl) => {
          if (y + lineH + 2 > maxY) y = portraitPageBreak(builder);
          builder.doc.text(bl, M, y);
          y += lineH;
        });
      }
      y += 2;
    } else {
      setFont(builder, 9, "normal", DARK_TEXT);
      const lines = builder.doc.splitTextToSize(para, w - M * 2);
      lines.forEach((line) => {
        if (y + lineH + 2 > maxY) y = portraitPageBreak(builder);
        builder.doc.text(line, M, y);
        y += lineH;
      });
    }
  });
  return y + 6;
}

// ─── Capital Budget (landscape page) ──────────────────────────────────────────
function buildCapitalBudget(builder, photos) {
  const SEVERITY_YEAR = { critical: 1, high: 2, medium: 4, low: 7 };
  const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
  const YEARS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const rawIssues = (photos || []).flatMap((p) =>
    (p.issues || []).map((iss) => ({
      ...iss,
      location: p.room_area || "—",
      cost: iss.approx_cost || Math.round(((iss.cost_min || 0) + (iss.cost_max || 0)) / 2),
      year: SEVERITY_YEAR[iss.severity] ?? 5,
    }))
  ).filter((i) => i.title)
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4));

  // Deduplicate by issue title — count each distinct issue's repair cost only once,
  // even when the same issue appears across multiple photos.
  const byTitle = new Map();
  rawIssues.forEach((iss) => {
    const key = (iss.title || "").trim().toLowerCase();
    const existing = byTitle.get(key);
    if (!existing) {
      byTitle.set(key, { ...iss, locations: iss.location && iss.location !== "—" ? [iss.location] : [] });
    } else if (iss.location && iss.location !== "—" && !existing.locations.includes(iss.location)) {
      existing.locations.push(iss.location);
    }
  });
  const allIssues = Array.from(byTitle.values());

  if (allIssues.length === 0) return;

  // ── Switch to a fresh landscape page ──
  builder.addLandscapePage();
  const w = LW;
  const h = LH;
  const lm = 12;

  // Header bar
  rect(builder, 0, 0, w, 10, NAVY);
  setFont(builder, 7.5, "bold", GOLD);
  builder.doc.text("CAPITAL BUDGET SUMMARY", lm, 6.5);

  let y = 18;
  setFont(builder, 14, "bold", NAVY);
  builder.doc.text("Capital Budget Summary", lm, y);
  hRule(builder, lm, y + 2, w - lm * 2, GOLD, 0.7);
  y += 12;

  // Column widths
  const issueW = 52;
  const locW = 32;
  const sevW = 22;
  const totalW = 20;
  const yrW = (w - lm * 2 - issueW - locW - sevW - totalW) / YEARS.length;

  // Header row
  rect(builder, lm, y, w - lm * 2, 8, NAVY);
  setFont(builder, 7, "bold", WHITE);
  let cx = lm + 2;
  builder.doc.text("Issue", cx, y + 5.5); cx += issueW;
  builder.doc.text("Location", cx, y + 5.5); cx += locW;
  builder.doc.text("Severity", cx, y + 5.5); cx += sevW;
  YEARS.forEach((yr) => {
    builder.doc.text(`Yr ${yr}`, cx + yrW / 2, y + 5.5, { align: "center" });
    cx += yrW;
  });
  builder.doc.text("Total", cx + totalW / 2, y + 5.5, { align: "center" });
  y += 8;

  const rowH = 7;
  const sevColors = { critical: RED, high: ORANGE, medium: YELLOW_TEXT, low: GREEN };

  allIssues.forEach((iss, i) => {
    if (y + rowH > h - 20) return;
    if (i % 2 === 1) rect(builder, lm, y, w - lm * 2, rowH, ROW_ALT);

    cx = lm + 2;
    setFont(builder, 7, "normal", DARK_TEXT);
    builder.doc.text(builder.doc.splitTextToSize(iss.title, issueW - 2)[0], cx, y + 5); cx += issueW;
    const locStr = iss.locations.join(", ") || "—";
    builder.doc.text(builder.doc.splitTextToSize(locStr, locW - 2)[0], cx, y + 5); cx += locW;

    const sevCol = sevColors[iss.severity] || MID_GRAY;
    setFont(builder, 6.5, "bold", sevCol);
    builder.doc.text((iss.severity || "").toUpperCase(), cx, y + 5); cx += sevW;

    YEARS.forEach((yr) => {
      if (iss.year === yr && iss.cost > 0) {
        setFont(builder, 7, "bold", GREEN);
        builder.doc.text(`$${iss.cost.toLocaleString()}`, cx + yrW / 2, y + 5, { align: "center" });
      } else {
        setFont(builder, 7, "normal", [203, 213, 225]);
        builder.doc.text("—", cx + yrW / 2, y + 5, { align: "center" });
      }
      cx += yrW;
    });

    setFont(builder, 7, "bold", [21, 100, 50]);
    builder.doc.text(iss.cost > 0 ? `$${iss.cost.toLocaleString()}` : "—", cx + totalW / 2, y + 5, { align: "center" });
    y += rowH;
  });

  // Totals row
  const total = allIssues.reduce((s, i) => s + (i.cost || 0), 0);
  const yearTotals = {};
  YEARS.forEach((yr) => {
    yearTotals[yr] = allIssues.filter((i) => i.year === yr).reduce((s, i) => s + (i.cost || 0), 0);
  });

  rect(builder, lm, y, w - lm * 2, rowH + 1, [224, 231, 240]);
  cx = lm + 2;
  setFont(builder, 7.5, "bold", NAVY);
  builder.doc.text("Annual Total", cx, y + 5.5); cx += issueW + locW + sevW;
  YEARS.forEach((yr) => {
    if (yearTotals[yr] > 0) {
      builder.doc.text(`$${yearTotals[yr].toLocaleString()}`, cx + yrW / 2, y + 5.5, { align: "center" });
    } else {
      setFont(builder, 7, "normal", [203, 213, 225]);
      builder.doc.text("—", cx + yrW / 2, y + 5.5, { align: "center" });
      setFont(builder, 7.5, "bold", NAVY);
    }
    cx += yrW;
  });
  builder.doc.text(`$${total.toLocaleString()}`, cx + totalW / 2, y + 5.5, { align: "center" });

  y += rowH + 6;
  setFont(builder, 7, "italic", MID_GRAY);
  builder.doc.text("Year assignments based on severity: Critical = Yr 1 · High = Yr 2 · Medium = Yr 4 · Low = Yr 7", lm, y);
}

// ─── Photos section (portrait) ────────────────────────────────────────────────
async function buildPhotos(builder, photos, startNum, report) {
  const w = PW;
  const maxY = PH - M;
  if (!photos || photos.length === 0) return;

  // ── Always start photos on a fresh portrait page ──
  builder.addPortraitPage();
  drawRunningHeader(builder, report);
  let y = M + 6;

  y = sectionHeader(builder, startNum, "All Photos", y);

  for (let idx = 0; idx < photos.length; idx++) {
    const photo = photos[idx];

    // Pre-compute image dimensions
    let dataUrl = null;
    let imgW = 0, imgH = 0, imgX = M;
    if (photo.photo_url) {
      dataUrl = await urlToDataUrl(photo.photo_url);
      if (dataUrl) {
        const maxW = w - M * 2;
        const imgEl = new Image();
        await new Promise(r => { imgEl.onload = r; imgEl.onerror = r; imgEl.src = dataUrl; });
        const ratio = (imgEl.naturalWidth || 1) / (imgEl.naturalHeight || 1);
        imgW = maxW; imgH = imgW / ratio;
        if (imgH > 75) { imgH = 75; imgW = imgH * ratio; }
        if (imgW > 130) { imgW = 130; imgH = imgW / ratio; }
        imgX = M + (maxW - imgW) / 2;
      }
    }

    const issueCount = (photo.issues || []).length;
    const estHeight = (dataUrl ? imgH + 3 : 0) + 10 + issueCount * 14;

    if (y + estHeight > maxY) {
      builder.addPortraitPage();
      drawRunningHeader(builder, report);
      y = M + 6;
    }

    // Draw image
    if (dataUrl && imgW > 0) {
      const drawn = await drawImage(builder, dataUrl, imgX, y, imgW, imgH);
      y += drawn + 3;
    }

    // Caption
    setFont(builder, 8, "italic", MID_GRAY);
    const caption = `Photo ${idx + 1}${photo.room_area ? ` – ${photo.room_area}` : ""}${photo.analysis ? `. ${photo.analysis}` : ""}`;
    const captionLines = builder.doc.splitTextToSize(caption, w - M * 2);
    captionLines.forEach((line) => {
      if (y + 4.5 > maxY) {
        builder.addPortraitPage();
        drawRunningHeader(builder, report);
        y = M + 6;
      }
      builder.doc.text(line, M, y);
      y += 4.5;
    });
    y += 2;

    // Issues
    for (const iss of (photo.issues || [])) {
      const sevCol = { critical: RED, high: ORANGE, medium: YELLOW_TEXT, low: GREEN }[iss.severity] || MID_GRAY;
      const cost = iss.approx_cost || Math.round(((iss.cost_min || 0) + (iss.cost_max || 0)) / 2);
      const costStr = cost > 0 ? `~$${cost.toLocaleString()}` : "";

      if (y + 5 > maxY) {
        builder.addPortraitPage();
        drawRunningHeader(builder, report);
        y = M + 6;
      }

      setFont(builder, 6.5, "bold", sevCol);
      builder.doc.text(`[${(iss.severity || "").toUpperCase()}]`, M + 3, y);
      setFont(builder, 7.5, "bold", DARK_TEXT);
      builder.doc.text(iss.title || "", M + 22, y);
      if (costStr) {
        setFont(builder, 7, "bold", GREEN);
        builder.doc.text(costStr, w - M - 2, y, { align: "right" });
      }
      y += 5;

      if (iss.description) {
        setFont(builder, 7, "normal", MID_GRAY);
        const descLines = builder.doc.splitTextToSize(iss.description, w - M * 2 - 25);
        for (const dl of descLines) {
          if (y + 4 > maxY) {
            builder.addPortraitPage();
            drawRunningHeader(builder, report);
            y = M + 6;
          }
          builder.doc.text(dl, M + 22, y);
          y += 4;
        }
      }
      y += 2;
    }

    y += 6;
    if (idx < photos.length - 1) {
      if (y + 5 > maxY) {
        builder.addPortraitPage();
        drawRunningHeader(builder, report);
        y = M + 6;
      }
      hRule(builder, M, y, w - M * 2, [226, 232, 240], 0.3);
      y += 5;
    }
  }
}

// ─── Running headers on all portrait pages (except cover) ─────────────────────
function addRunningHeadersToAllPortrait(builder, report) {
  const total = builder.currentPage;
  for (let i = 2; i <= total; i++) {
    if (builder.pageOrientations[i - 1] === "landscape") continue;
    builder.doc.setPage(i);
    drawRunningHeader(builder, report);
  }
}

// ─── Main entry ───────────────────────────────────────────────────────────────
export async function exportReportToPdf(reportTitle = "inspection-report", report, photos, hiddenSections = [], mapImage = null) {
  const builder = new PdfBuilder();
  builder._report = report;

  // ── Cover (portrait, page 1) ──
  await buildCover(builder, report);

  // ── Executive Dashboard (portrait, page 2) ──
  if (!hiddenSections.includes("executive_dashboard")) {
    buildExecutiveDashboard(builder, report, photos);
  }

  // ── Body page (portrait) ──
  builder.addPortraitPage();
  drawRunningHeader(builder, report);
  let y = M + 6;

  const w = PW;

  // Sub-header
  setFont(builder, 18, "bold", NAVY);
  builder.doc.text("Site Observation", M, y + 6);
  y += 8;
  setFont(builder, 10, "bold", GOLD);
  builder.doc.text(`${report.title || ""}${report.city_state ? ` · ${report.city_state}` : ""}`, M, y + 4);
  y += 6;
  if (report.report_purpose || report.inspection_date) {
    setFont(builder, 8, "normal", MID_GRAY);
    builder.doc.text([report.report_purpose, report.inspection_date].filter(Boolean).join(" · "), M, y + 4);
    y += 4;
  }
  hRule(builder, M, y + 4, w - M * 2);
  y += 10;

  // Stats
  y = buildStats(builder, report, (photos || []).length, y);

  // Narrative sections
  const narratives = [
    { key: "executive_summary", title: "General Observations", field: "executive_summary" },
    { key: "operations_summary", title: "Operations & Physical Building", field: "operations_summary" },
    { key: "building_summary", title: "Condition Observations", field: "building_summary" },
    { key: "notes", title: "Inspector Notes", field: "notes" },
    { key: "market_summary", title: "Market Context", field: "market_summary" },
  ].filter((s) => !hiddenSections.includes(s.key));

  let sectionNum = 1;
  for (const s of narratives) {
    if (report[s.field]) {
      y = buildNarrative(builder, sectionNum++, s.title, report[s.field], y);
    }
  }

  // ── Capital Budget (landscape) ──
  if (!hiddenSections.includes("capital_budget")) {
    buildCapitalBudget(builder, photos);
  }

  // ── Photo Locations map (portrait) ──
  const includeMap = mapImage && !hiddenSections.includes("photo_locations");
  if (includeMap) {
    builder.addPortraitPage();
    drawRunningHeader(builder, report);
    let my = M + 6;
    my = sectionHeader(builder, sectionNum + 1, "Photo Locations", my);
    const imgEl = new Image();
    await new Promise((r) => { imgEl.onload = r; imgEl.onerror = r; imgEl.src = mapImage; });
    const ratio = (imgEl.naturalWidth || 1) / (imgEl.naturalHeight || 1);
    const maxW = w - M * 2;
    const maxH = PH - M * 2 - 25;
    let iw = maxW, ih = iw / ratio;
    if (ih > maxH) { ih = maxH; iw = ih * ratio; }
    const ix = M + (maxW - iw) / 2;
    await drawImage(builder, mapImage, ix, my, iw, ih);
  }

  // ── Photos (portrait) ──
  if (!hiddenSections.includes("all_photos")) {
    await buildPhotos(builder, photos, sectionNum + (includeMap ? 2 : 1), report);
  }

  // ── Running headers on all portrait interior pages ──
  addRunningHeadersToAllPortrait(builder, report);

  // ── Save ──
  builder.save(`${(reportTitle || "report").replace(/[^a-z0-9]/gi, "_")}.pdf`);
}