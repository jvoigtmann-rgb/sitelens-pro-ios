import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ImageRun,
} from "docx";

async function urlToArrayBuffer(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

async function fetchImageDimensions(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 600, height: 400 });
    img.src = url;
  });
}

function goldRule() {
  return new Paragraph({
    border: {
      bottom: { color: "C9A227", space: 1, style: BorderStyle.SINGLE, size: 12 },
    },
    spacing: { after: 160 },
  });
}

function sectionHeading(num, title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 80 },
    children: [
      new TextRun({
        text: num ? `${num}.  ${title}` : title,
        bold: true,
        color: "1E2D4D",
        size: 26,
        font: "Calibri",
      }),
    ],
  });
}

function bodyParagraph(text) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text,
        size: 20,
        font: "Calibri",
        color: "1E293B",
      }),
    ],
  });
}

function narrativeBlock(num, title, content) {
  if (!content) return [];
  const paras = content.split("\n").filter((l) => l.trim());
  return [
    sectionHeading(num, title),
    goldRule(),
    ...paras.map((p) => bodyParagraph(p)),
  ];
}

function statsTable(report, photoCount) {
  const approxCost =
    report.total_approx_cost ||
    (report.total_cost_min > 0 || report.total_cost_max > 0
      ? Math.round(((report.total_cost_min || 0) + (report.total_cost_max || 0)) / 2)
      : 0);

  const stats = [
    { label: "Photos", value: String(photoCount) },
    { label: "Total Issues", value: String(report.total_issues || 0) },
    { label: "Critical", value: String(report.critical_issues || 0) },
    { label: "Approx. Cost", value: approxCost > 0 ? `~$${approxCost.toLocaleString()}` : "—" },
  ];

  const cells = stats.map(
    (s) =>
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        shading: { fill: "F0F3F8" },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: s.value, bold: true, size: 24, color: "1E2D4D", font: "Calibri" })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: s.label, size: 16, color: "64748B", font: "Calibri" })],
          }),
        ],
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: cells })],
  });
}

async function photoBlock(photo, idx) {
  const paragraphs = [];

  if (photo.photo_url) {
    const buf = await urlToArrayBuffer(photo.photo_url);
    if (buf) {
      const dims = await fetchImageDimensions(photo.photo_url);
      // Scale to max ~500px wide equivalent in EMU (1px ~ 9525 EMU)
      const maxWidthEmu = 5500000;
      const ratio = dims.width / dims.height;
      const widthEmu = maxWidthEmu;
      const heightEmu = Math.round(widthEmu / ratio);

      paragraphs.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new ImageRun({
              data: buf,
              transformation: { width: Math.round(widthEmu / 9525), height: Math.round(heightEmu / 9525) },
              type: "jpg",
            }),
          ],
        })
      );
    }
  }

  // Caption
  const caption = `Photo ${idx + 1}${photo.room_area ? ` – ${photo.room_area}` : ""}${photo.analysis ? `. ${photo.analysis}` : ""}`;
  paragraphs.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: caption, italics: true, size: 18, color: "64748B", font: "Calibri" })],
    })
  );

  // Issues
  for (const iss of photo.issues || []) {
    const sevLabel = iss.severity ? `[${iss.severity.toUpperCase()}] ` : "";
    const costStr =
      iss.cost_min > 0 || iss.cost_max > 0
        ? `  ~$${Math.round(((iss.cost_min || 0) + (iss.cost_max || 0)) / 2).toLocaleString()}`
        : "";
    paragraphs.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: sevLabel, bold: true, size: 18, color: "C2410C", font: "Calibri" }),
          new TextRun({ text: iss.title || "", bold: true, size: 18, color: "1E293B", font: "Calibri" }),
          new TextRun({ text: costStr, size: 18, color: "15803D", font: "Calibri" }),
        ],
      })
    );
    if (iss.description) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 60 },
          indent: { left: 360 },
          children: [new TextRun({ text: iss.description, size: 17, color: "64748B", font: "Calibri" })],
        })
      );
    }
  }

  paragraphs.push(new Paragraph({ spacing: { after: 200 } }));
  return paragraphs;
}

export async function exportReportToDocx(reportTitle = "inspection-report", report, photos, hiddenSections = [], customSections = [], mapImage = null) {
  const children = [];

  // ── Title block
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: "SITE OBSERVATION REPORT", bold: true, size: 18, color: "C9A227", font: "Calibri" })],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: report.title || "Inspection Report", bold: true, size: 48, color: "1E2D4D", font: "Calibri" })],
    })
  );

  if (report.city_state) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: report.city_state, italics: true, size: 24, color: "64748B", font: "Calibri" })],
      })
    );
  }

  if (report.report_purpose || report.inspection_date) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: [report.report_purpose, report.inspection_date].filter(Boolean).join("  ·  "),
            size: 20,
            color: "64748B",
            font: "Calibri",
          }),
        ],
      })
    );
  }

  if (report.prepared_by) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 320 },
        children: [
          new TextRun({ text: "Prepared by: ", size: 20, color: "64748B", font: "Calibri" }),
          new TextRun({ text: report.prepared_by, bold: true, size: 20, color: "1E2D4D", font: "Calibri" }),
        ],
      })
    );
  }

  // ── Stats table
  children.push(statsTable(report, (photos || []).length));
  children.push(new Paragraph({ spacing: { after: 240 } }));

  // ── Narrative sections
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
      children.push(...narrativeBlock(sectionNum++, s.title, report[s.field]));
    }
  }

  // ── Custom sections
  for (const section of customSections) {
    children.push(...narrativeBlock(sectionNum++, section.name, section.notes));
  }

  // ── Photo Locations map
  if (mapImage && !hiddenSections.includes("photo_locations")) {
    children.push(sectionHeading(sectionNum, "Photo Locations"), goldRule());
    const byteString = atob(mapImage.split(",")[1]);
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
    const dims = await fetchImageDimensions(mapImage);
    const maxWpx = 600;
    let wpx = dims.width || 600, hpx = dims.height || 400;
    if (wpx > maxWpx) { hpx = Math.round((hpx * maxWpx) / wpx); wpx = maxWpx; }
    children.push(
      new Paragraph({
        spacing: { after: 240 },
        children: [new ImageRun({ data: bytes, transformation: { width: wpx, height: hpx }, type: "jpg" })],
      })
    );
    sectionNum++;
  }

  // ── Photos
  if (!hiddenSections.includes("all_photos") && photos?.length > 0) {
    children.push(sectionHeading(sectionNum, "All Photos"), goldRule());
    for (let i = 0; i < photos.length; i++) {
      const blocks = await photoBlock(photos[i], i);
      children.push(...blocks);
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 20 },
        },
      },
    },
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${(reportTitle || "report").replace(/[^a-z0-9]/gi, "_")}.docx`;

  // iOS Safari / WebView: use FileReader to get a data URL and open in new tab
  const isIOS = /ipad|iphone|ipod/i.test(navigator.userAgent) || 
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIOS) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(
          `<html><body style="margin:0;background:#000">
            <p style="color:#fff;font-family:sans-serif;padding:16px">
              Tap the share icon → "Save to Files" to download <strong>${filename}</strong>
            </p>
            <iframe src="${dataUrl}" style="width:100%;height:90vh;border:none"></iframe>
          </body></html>`
        );
      }
    };
    reader.readAsDataURL(blob);
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}