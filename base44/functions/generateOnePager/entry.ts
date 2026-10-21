import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.0.0';

// ── Palette ───────────────────────────────────────────────────────────────────
const NAVY   = [4, 13, 26];
const NAVY2  = [10, 22, 40];
const TEAL   = [45, 212, 191];
const WHITE  = [255, 255, 255];
const S300   = [203, 213, 225];
const S400   = [148, 163, 184];
const S500   = [100, 116, 139];
const LIGHT  = [245, 247, 250];
const BORDER = [226, 232, 240];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });
    const W = 8.5;
    const H = 11;
    const M = 0.5;

    const rect = (x, y, w, h, color) => {
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(x, y, w, h, 'F');
    };
    const text = (str, x, y, opts = {}) => {
      const { size = 9, color = S400, bold = false, align = 'left', lineHeight = 0.14 } = opts;
      doc.setFontSize(size);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(str, x, y, { align, lineHeight });
    };

    let y = 0;

    // ══ HEADER BANNER ══
    rect(0, 0, W, 0.85, NAVY);
    text('Site', M, 0.42, { size: 22, color: WHITE, bold: true });
    text('Lens', M + 0.6, 0.42, { size: 22, color: TEAL, bold: true });
    text('Capture  ·  Analyze  ·  Map  ·  Report', W - M, 0.52, { size: 7.5, color: TEAL, bold: true, align: 'right' });
    y = 0.85;

    // ══ HERO ══
    y += 0.28;
    text('Property Inspections, Automated.', M, y + 0.2, { size: 17, color: NAVY, bold: true });
    y += 0.38;
    text('AI-powered inspection platform that turns site photos into professional,', M, y + 0.14, { size: 8.5, color: S500 });
    text('print-ready reports in under 10 minutes.', M, y + 0.28, { size: 8.5, color: S500 });
    y += 0.42;

    rect(M, y, W - 2 * M, 0.32, NAVY2);
    text('Traditional PCA:  2-3 weeks  ·  $3K-$15K', M + 0.15, y + 0.21, { size: 7.5, color: S300 });
    text('vs', W / 2, y + 0.21, { size: 7.5, color: S500, align: 'center' });
    text('SiteLens:  Under 10 min  ·  <$50', W - M - 0.15, y + 0.21, { size: 7.5, color: TEAL, bold: true, align: 'right' });
    y += 0.5;

    // ══ PROBLEM ══
    text('THE PROBLEM', M, y, { size: 7, color: TEAL, bold: true });
    y += 0.08;
    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
    doc.setLineWidth(0.005);
    doc.line(M, y, W - M, y);
    y += 0.16;

    const problems = [
      ['Hours of Manual Work', 'Inspectors spend 4-8 hours writing reports per property.'],
      ['Inconsistent Quality', 'Reports vary by inspector skill. No standardized format.'],
      ['Expensive & Slow', 'Traditional PCAs cost $3K-$15K and take 2-3 weeks.'],
      ['No Spatial Context', 'Issues listed but never mapped to their location.'],
    ];
    const colW = (W - 2 * M - 0.15) / 2;
    problems.forEach((p, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const px = M + col * (colW + 0.15);
      const py = y + row * 0.42;
      rect(px, py, colW, 0.36, LIGHT);
      text('-', px + 0.08, py + 0.15, { size: 8, color: TEAL, bold: true });
      text(p[0], px + 0.2, py + 0.15, { size: 7.5, color: NAVY, bold: true });
      text(p[1], px + 0.2, py + 0.28, { size: 6.5, color: S500 });
    });
    y += 0.42 * 2 + 0.12;

    // ══ HOW IT WORKS ══
    text('THE SOLUTION', M, y, { size: 7, color: TEAL, bold: true });
    y += 0.08;
    doc.line(M, y, W - M, y);
    y += 0.16;

    const steps = [
      ['01', 'Capture', 'Take site photos. GPS metadata extracted automatically.'],
      ['02', 'Analyze', 'AI identifies defects, severity & repair costs.'],
      ['03', 'Report', 'Branded PDF with summary, budget & photos.'],
      ['04', 'Export', 'Print-ready PDF in minutes. No manual writing.'],
    ];
    const stepW = (W - 2 * M - 0.3) / 4;
    steps.forEach((s, i) => {
      const sx = M + i * (stepW + 0.1);
      rect(sx, y, stepW, 0.55, NAVY2);
      text(s[0], sx + 0.08, y + 0.18, { size: 11, color: TEAL, bold: true });
      text(s[1], sx + 0.08, y + 0.34, { size: 7.5, color: WHITE, bold: true });
      text(s[2], sx + 0.08, y + 0.48, { size: 5.5, color: S400, lineHeight: 0.08 });
    });
    y += 0.7;

    // ══ KEY FEATURES ══
    text('KEY FEATURES', M, y, { size: 7, color: TEAL, bold: true });
    y += 0.08;
    doc.line(M, y, W - M, y);
    y += 0.16;

    const features = [
      ['AI Photo Analysis', 'Vision model detects issues, severities & repair costs from photos.'],
      ['Auto-Generated Reports', 'Branded PDF with cover, exec summary, capital budget & gallery.'],
      ['GPS Issue Mapping', 'Every photo geo-tagged and plotted on interactive satellite map.'],
      ['Portfolio Dashboard', 'Aggregate issue tracking across all properties. Filter & export.'],
      ['Cost Estimation', 'Local market-adjusted repair cost ranges. Aggregated capital budget.'],
      ['Multi-Asset Class', 'Residential, multifamily, commercial, industrial & land.'],
    ];
    const fColW = (W - 2 * M - 0.15) / 2;
    features.forEach((f, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const fx = M + col * (fColW + 0.15);
      const fy = y + row * 0.32;
      text('>', fx, fy + 0.12, { size: 7, color: TEAL, bold: true });
      text(f[0], fx + 0.13, fy + 0.12, { size: 7, color: NAVY, bold: true });
      text(f[1], fx + 0.13, fy + 0.22, { size: 6, color: S500 });
    });
    y += 0.32 * 3 + 0.08;

    // ══ COMPETITIVE TABLE ══
    text('WHY SITELENS WINS', M, y, { size: 7, color: TEAL, bold: true });
    y += 0.08;
    doc.line(M, y, W - M, y);
    y += 0.16;

    const tableW = W - 2 * M;
    const c1 = tableW * 0.4;
    const c2 = tableW * 0.2;
    const c3 = tableW * 0.2;
    const c4 = tableW * 0.2;

    rect(M, y, tableW, 0.22, NAVY2);
    text('Capability', M + 0.08, y + 0.15, { size: 6.5, color: S400, bold: true });
    text('Traditional PCA', M + c1 + c2 / 2, y + 0.15, { size: 6.5, color: S400, align: 'center' });
    text('Legacy Software', M + c1 + c2 + c3 / 2, y + 0.15, { size: 6.5, color: S400, align: 'center' });
    text('SiteLens', M + c1 + c2 + c3 + c4 / 2, y + 0.15, { size: 6.5, color: TEAL, bold: true, align: 'center' });
    y += 0.22;

    const rows = [
      ['Inspection Time', '2-3 Weeks', 'Days', '<10 Min'],
      ['AI Defect Detection', 'X', 'Limited', 'Yes'],
      ['Repair Cost Estimates', 'Manual', 'Manual', 'Auto'],
      ['Executive Narratives', 'Manual', 'Basic', 'AI Drafted'],
      ['GPS Issue Mapping', 'X', 'Limited', 'Yes'],
      ['Capital Budget', 'Spreadsheet', 'Export', 'Auto-Gen'],
    ];
    rows.forEach((r, i) => {
      if (i % 2 === 0) rect(M, y, tableW, 0.18, LIGHT);
      text(r[0], M + 0.08, y + 0.13, { size: 6.5, color: NAVY });
      text(r[1], M + c1 + c2 / 2, y + 0.13, { size: 6.5, color: S500, align: 'center' });
      text(r[2], M + c1 + c2 + c3 / 2, y + 0.13, { size: 6.5, color: S500, align: 'center' });
      text(r[3], M + c1 + c2 + c3 + c4 / 2, y + 0.13, { size: 6.5, color: TEAL, bold: true, align: 'center' });
      y += 0.18;
    });
    y += 0.12;

    // ══ TRACTION + FOUNDER ══
    const halfW = (W - 2 * M - 0.15) / 2;

    text('TRACTION', M, y, { size: 7, color: TEAL, bold: true });
    y += 0.08;
    doc.line(M, y, M + halfW, y);
    let yL = y + 0.16;
    const traction = [
      'Working product - live and in use',
      'Multi-asset: residential to industrial',
      'AI-powered narrative generation',
      'Print-ready branded PDF reports',
      'Mobile-first field workflow',
    ];
    traction.forEach((t) => {
      text('V', M, yL, { size: 6.5, color: TEAL, bold: true });
      text(t, M + 0.13, yL, { size: 6.5, color: S400 });
      yL += 0.14;
    });

    const xR = M + halfW + 0.15;
    text('FOUNDER', xR, y, { size: 7, color: TEAL, bold: true });
    doc.line(xR, y + 0.08, xR + halfW, y + 0.08);
    let yR = y + 0.16;
    const founder = [
      '25+ years CRE leadership',
      'Inspections at institutional scale',
      'Built by an operator, not an engineer',
      'Working AI product already shipping',
      'Launch-ready platform',
    ];
    founder.forEach((t) => {
      text('>', xR, yR, { size: 6.5, color: TEAL, bold: true });
      text(t, xR + 0.13, yR, { size: 6.5, color: S400 });
      yR += 0.14;
    });

    y = Math.max(yL, yR) + 0.15;

    // ══ FOOTER ══
    rect(0, H - 0.4, W, 0.4, NAVY);
    text('Site', M, H - 0.16, { size: 9, color: WHITE, bold: true });
    text('Lens', M + 0.42, H - 0.16, { size: 9, color: TEAL, bold: true });
    text('CRE Expertise + Artificial Intelligence = Next Gen Property Intelligence', W - M, H - 0.16, { size: 6.5, color: TEAL, align: 'right' });

    // ── Upload to storage & return URL ──
    const pdfBytes = doc.output('arraybuffer');
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const file = new File([blob], 'SiteLens-One-Pager.pdf', { type: 'application/pdf' });
    const result = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    return Response.json({ file_url: result.file_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});