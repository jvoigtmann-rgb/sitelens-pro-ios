import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import PptxGenJS from 'npm:pptxgenjs@3.12.0';

// ── Palette ───────────────────────────────────────────────────────────────────
const DARK_BG  = '040d1a';
const DARK2    = '0f172a';
const TEAL     = '2dd4bf';
const TEAL_DK  = '14b8a6';
const WHITE    = 'FFFFFF';
const S300     = 'cbd5e1';
const S400     = '94a3b8';
const S500     = '64748b';
const ORANGE   = 'f97316';
const BLUE     = '3b82f6';
const PURPLE   = '8b5cf6';

// Slide canvas: LAYOUT_WIDE = 13.33 × 7.5 in
const W = 13.33;

// ── Tiny helpers ──────────────────────────────────────────────────────────────
const txt = (s, text, opts) => s.addText(text, { fontFace: 'Calibri', wrap: true, ...opts });

const eyebrow = (s, text, color = TEAL) =>
  txt(s, text, { x: 0.6, y: 0.28, w: W - 1.2, h: 0.3, fontSize: 9, bold: true, color, charSpacing: 4 });

const h1 = (s, text, y = 0.62, color = WHITE, size = 34) =>
  txt(s, text, { x: 0.6, y, w: W - 1.2, h: 1.1, fontSize: size, bold: true, color, autoFit: true });

const pill = (s, pres, x, y, w, h, fill, border = null) =>
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.13,
    fill: { color: fill },
    line: border ? { color: border, width: 0.8 } : { color: fill, width: 0 },
  });

// ── Slide 1 – Cover ───────────────────────────────────────────────────────────
function s1(pres) {
  const s = pres.addSlide();
  s.background = { color: DARK_BG };

  // Subtle teal glow
  s.addShape(pres.ShapeType.ellipse, { x: 10, y: -1, w: 5.5, h: 5.5,
    fill: { color: TEAL, transparency: 93 }, line: { color: TEAL, transparency: 100 } });

  // Logo box
  pill(s, pres, 6.17, 0.55, 1.0, 1.0, TEAL_DK);
  txt(s, 'SL', { x: 6.17, y: 0.55, w: 1.0, h: 1.0,
    fontSize: 26, bold: true, color: DARK_BG, align: 'center', valign: 'middle' });

  txt(s, 'SiteLens', { x: 1.5, y: 1.75, w: W - 3, h: 1.1,
    fontSize: 54, bold: true, color: WHITE, align: 'center', fontFace: 'Calibri' });

  txt(s, 'CAPTURE  ·  ANALYZE  ·  MAP  ·  REPORT', { x: 1.5, y: 2.95, w: W - 3, h: 0.38,
    fontSize: 11, bold: true, color: TEAL, align: 'center', charSpacing: 3 });

  txt(s, 'AI-powered property inspection platform that turns site photos into professional reports in minutes.',
    { x: 2.8, y: 3.45, w: W - 5.6, h: 0.8, fontSize: 13, color: S300, align: 'center' });

  txt(s, 'Seed Round  ·  April 2026', { x: 1.5, y: 4.5, w: W - 3, h: 0.35, fontSize: 10, color: S500, align: 'center' });
  txt(s, 'Confidential — For Investor Use Only', { x: 1.5, y: 4.88, w: W - 3, h: 0.3, fontSize: 9, color: S500, align: 'center' });
}

// ── Slide 2 – Problem ─────────────────────────────────────────────────────────
function s2(pres) {
  const s = pres.addSlide();
  s.background = { color: DARK2 };
  eyebrow(s, 'THE PROBLEM', ORANGE);
  h1(s, 'Property inspections are broken.', 0.62, WHITE, 32);

  const items = [
    { icon: '⏱', t: 'Hours of Manual Work', d: 'Inspectors spend 4–8 hours writing reports per property — time that doesn\'t scale.' },
    { icon: '📋', t: 'Inconsistent Quality',  d: 'Reports vary by inspector skill. No standardized format, missed issues, unclear cost estimates.' },
    { icon: '💸', t: 'Expensive & Slow',      d: 'Traditional PCAs cost $3K–$15K and take 2–3 weeks. Deals move faster than reports.' },
    { icon: '📍', t: 'No Spatial Context',    d: 'Issues are listed but never mapped to their location within the property.' },
  ];

  const cw = 6.0, ch = 1.95;
  const xs = [0.5, 6.83];
  const ys = [1.72, 3.78];
  items.forEach((item, i) => {
    const x = xs[i % 2], y = ys[Math.floor(i / 2)];
    pill(s, pres, x, y, cw, ch, '0a1628', ORANGE + '55');
    txt(s, item.icon, { x: x + 0.18, y: y + 0.15, w: 0.6, h: 0.55, fontSize: 22 });
    txt(s, item.t, { x: x + 0.18, y: y + 0.72, w: cw - 0.35, h: 0.38, fontSize: 13, bold: true, color: WHITE });
    txt(s, item.d, { x: x + 0.18, y: y + 1.12, w: cw - 0.35, h: 0.72, fontSize: 10, color: S400 });
  });
}

// ── Slide 3 – Solution ────────────────────────────────────────────────────────
function s3(pres) {
  const s = pres.addSlide();
  s.background = { color: DARK_BG };
  eyebrow(s, 'THE SOLUTION');
  h1(s, 'Upload photos. AI does the rest.', 0.62, WHITE, 32);

  const steps = [
    { n: '01', t: 'Capture', d: 'Inspector takes site photos on any device. GPS metadata extracted automatically.' },
    { n: '02', t: 'Analyze', d: 'Claude AI identifies every visible defect, assigns severity, and estimates repair costs per local market.' },
    { n: '03', t: 'Report',  d: 'Branded, print-ready PDF with executive summary, capital budget, narratives, and photo gallery — in minutes.' },
  ];

  steps.forEach((step, i) => {
    const y = 1.78 + i * 1.7;
    txt(s, step.n, { x: 0.6, y, w: 0.75, h: 0.52, fontSize: 24, bold: true, color: TEAL, transparency: 35 });
    txt(s, step.t, { x: 1.5, y: y + 0.06, w: 4.0, h: 0.42, fontSize: 15, bold: true, color: WHITE });
    txt(s, step.d, { x: 1.5, y: y + 0.52, w: W - 2.2, h: 0.9, fontSize: 11, color: S400 });
    if (i < 2) {
      s.addShape(pres.ShapeType.line, { x: 0.6, y: y + 1.56, w: W - 1.2, h: 0,
        line: { color: TEAL + '22', width: 0.5 } });
    }
  });
}

// ── Slide 4 – Product ─────────────────────────────────────────────────────────
function s4(pres) {
  const s = pres.addSlide();
  s.background = { color: DARK2 };
  eyebrow(s, 'PRODUCT');
  h1(s, 'The SiteLens Platform', 0.62, WHITE, 30);

  const features = [
    { t: 'AI Photo Analysis',      d: 'Claude vision model detects issues, severities, and repair costs from raw site photos.' },
    { t: 'Auto-Generated Reports', d: 'Branded PDF with cover, exec summary, narrative, capital budget, and photo gallery.' },
    { t: 'GPS Issue Mapping',      d: 'Every photo is geo-tagged and plotted on an interactive map.' },
    { t: 'Portfolio Dashboard',    d: 'Aggregate view of all issues across all properties with filter and sort.' },
  ];

  features.forEach((f, i) => {
    const y = 1.68 + i * 1.32;
    pill(s, pres, 0.5, y, W - 1.0, 1.12, '0a1628', TEAL + '30');
    s.addShape(pres.ShapeType.roundRect, { x: 0.72, y: y + 0.31, w: 0.5, h: 0.5, rectRadius: 0.08,
      fill: { color: TEAL_DK, transparency: 75 }, line: { color: TEAL_DK, transparency: 100 } });
    txt(s, f.t, { x: 1.42, y: y + 0.12, w: 4.5, h: 0.38, fontSize: 13, bold: true, color: WHITE });
    txt(s, f.d, { x: 1.42, y: y + 0.55, w: W - 2.1, h: 0.5, fontSize: 10.5, color: S400 });
  });
}

// ── Slide 5 – How It Works ────────────────────────────────────────────────────
function s5(pres) {
  const s = pres.addSlide();
  s.background = { color: DARK_BG };
  eyebrow(s, 'HOW IT WORKS');
  h1(s, 'From site to report in under 10 minutes.', 0.62, WHITE, 28);

  const steps = [
    { icon: '📸', t: 'Upload Photos',  d: 'Drag & drop, mobile camera, or bulk upload.' },
    { icon: '🤖', t: 'AI Analysis',    d: 'Claude identifies defects, severity & cost.' },
    { icon: '📄', t: 'Report Draft',   d: 'Narrative sections auto-generated.' },
    { icon: '📤', t: 'Export & Share', d: 'Branded PDF, print-ready in minutes.' },
  ];

  const cw = 2.85, ch = 2.35, gap = 0.28;
  const totalW = steps.length * cw + (steps.length - 1) * gap;
  const x0 = (W - totalW) / 2;

  steps.forEach((step, i) => {
    const x = x0 + i * (cw + gap);
    pill(s, pres, x, 1.72, cw, ch, '0a1f35', TEAL + '44');
    txt(s, step.icon, { x, y: 1.86, w: cw, h: 0.65, fontSize: 28, align: 'center' });
    txt(s, step.t,    { x: x + 0.1, y: 2.55, w: cw - 0.2, h: 0.38, fontSize: 12, bold: true, color: WHITE, align: 'center' });
    txt(s, step.d,    { x: x + 0.15, y: 2.97, w: cw - 0.3, h: 0.85, fontSize: 9.5, color: S400, align: 'center' });
    if (i < steps.length - 1) {
      txt(s, '→', { x: x + cw + 0.02, y: 2.65, w: gap, h: 0.38, fontSize: 14, color: TEAL + '99', align: 'center' });
    }
  });

  pill(s, pres, 0.6, 4.3, W - 1.2, 0.52, '0a1f35', TEAL + '44');
  txt(s, 'Traditional PCA: 2–3 weeks · $3K–$15K     vs     SiteLens: Under 10 min · <$50',
    { x: 0.6, y: 4.3, w: W - 1.2, h: 0.52, fontSize: 11, color: S300, align: 'center', valign: 'middle' });
}

// ── Slide 6 – Features ────────────────────────────────────────────────────────
function s6(pres) {
  const s = pres.addSlide();
  s.background = { color: DARK2 };
  eyebrow(s, 'KEY FEATURES');
  h1(s, 'Built for real estate professionals.', 0.62, WHITE, 28);

  const features = [
    { t: 'Multi-Asset Class',    d: 'Residential, multifamily, commercial, industrial & land — each with tailored AI prompts.' },
    { t: 'Cost Estimation',      d: 'Local market-adjusted repair cost ranges per issue. Aggregated capital budget table.' },
    { t: 'AI Narratives',        d: 'Executive summary, operations assessment, and market context — all AI-drafted and editable.' },
    { t: 'GPS Mapping',          d: 'Issues are geo-tagged and plotted on an interactive map with severity color coding.' },
    { t: 'Portfolio Dashboard',  d: 'Aggregate issue tracking across all properties. Filter, sort, and export.' },
    { t: 'Branded Reports',      d: 'Custom cover photos, inspector name, report purpose. Print-ready PDF export.' },
  ];

  const cw = 3.9, ch = 1.42, gap = 0.27;
  features.forEach((f, i) => {
    const col = i % 3, row = Math.floor(i / 2);
    // Layout: 2 rows × 3 cols
    const r = Math.floor(i / 3), c = i % 3;
    const x = 0.5 + c * (cw + gap);
    const y = 1.68 + r * (ch + 0.22);
    pill(s, pres, x, y, cw, ch, '0a1222', TEAL + '28');
    s.addShape(pres.ShapeType.ellipse, { x: x + 0.22, y: y + 0.3, w: 0.32, h: 0.32,
      fill: { color: TEAL }, line: { color: TEAL, transparency: 100 } });
    txt(s, f.t, { x: x + 0.68, y: y + 0.16, w: cw - 0.82, h: 0.38, fontSize: 12, bold: true, color: WHITE });
    txt(s, f.d, { x: x + 0.68, y: y + 0.58, w: cw - 0.82, h: 0.76, fontSize: 9.5, color: S400 });
  });
}

// ── Slide 7 – Market ──────────────────────────────────────────────────────────
function s7(pres) {
  const s = pres.addSlide();
  s.background = { color: DARK_BG };
  eyebrow(s, 'MARKET OPPORTUNITY');
  h1(s, 'A massive, underserved market.', 0.62, WHITE, 30);

  const segs = [
    { v: '$42B',   l: 'Total Addressable Market',         d: 'US commercial real estate inspection & due diligence market',        c: TEAL },
    { v: '$8.5B',  l: 'Serviceable Addressable Market',   d: 'Property condition assessments, PCNA, and due diligence reports annually', c: BLUE },
    { v: '$850M',  l: 'Serviceable Obtainable Market',    d: '10% of SAM — tech-forward CRE firms adopting AI inspection tools',  c: PURPLE },
  ];

  const cw = 3.97, gap = 0.3;
  const x0 = (W - (3 * cw + 2 * gap)) / 2;

  segs.forEach((seg, i) => {
    const x = x0 + i * (cw + gap);
    pill(s, pres, x, 1.62, cw, 2.0, '0a1628', seg.c + '55');
    txt(s, seg.v, { x, y: 1.72, w: cw, h: 0.72, fontSize: 38, bold: true, color: seg.c, align: 'center' });
    txt(s, seg.l, { x: x + 0.15, y: 2.46, w: cw - 0.3, h: 0.34, fontSize: 11, bold: true, color: WHITE, align: 'center' });
    txt(s, seg.d, { x: x + 0.15, y: 2.84, w: cw - 0.3, h: 0.65, fontSize: 9.5, color: S400, align: 'center' });
  });

  const stats = [
    { v: '500K+',   l: 'PCAs conducted annually in the US' },
    { v: '$8K',     l: 'Average cost of a traditional PCA' },
    { v: '18 days', l: 'Average turnaround time today' },
  ];
  stats.forEach((st, i) => {
    const x = x0 + i * (cw + gap);
    pill(s, pres, x, 3.82, cw, 0.9, '0a1222', TEAL + '20');
    txt(s, st.v, { x, y: 3.88, w: cw, h: 0.38, fontSize: 22, bold: true, color: WHITE, align: 'center' });
    txt(s, st.l, { x, y: 4.28, w: cw, h: 0.32, fontSize: 9, color: S500, align: 'center' });
  });
}

// ── Slide 8 – Traction ────────────────────────────────────────────────────────
function s8(pres) {
  const s = pres.addSlide();
  s.background = { color: DARK2 };
  eyebrow(s, 'TRACTION');
  h1(s, 'Built, shipped, gaining momentum.', 0.62, WHITE, 30);

  const items = [
    { t: 'Working product',     d: 'Full-stack AI inspection platform live and in use.' },
    { t: 'Multi-asset support', d: 'Residential, multifamily, commercial, industrial & land.' },
    { t: 'AI-powered reports',  d: 'End-to-end narrative generation using Claude.' },
    { t: 'PDF export',          d: 'Print-ready branded reports with capital budget and photo gallery.' },
    { t: 'Mobile-first design', d: 'Designed for inspectors in the field on any device.' },
  ];

  items.forEach((item, i) => {
    const y = 1.68 + i * 0.96;
    s.addShape(pres.ShapeType.ellipse, { x: 0.6, y: y + 0.12, w: 0.3, h: 0.3,
      fill: { color: TEAL }, line: { color: TEAL, transparency: 100 } });
    txt(s, item.t, { x: 1.12, y, w: 3.1, h: 0.5, fontSize: 13, bold: true, color: WHITE });
    txt(s, '—  ' + item.d, { x: 4.3, y: y + 0.06, w: W - 4.85, h: 0.5, fontSize: 12, color: S400 });
    if (i < items.length - 1) {
      s.addShape(pres.ShapeType.line, { x: 0.6, y: y + 0.72, w: W - 1.2, h: 0,
        line: { color: TEAL + '18', width: 0.5 } });
    }
  });
}

// ── Slide 9 – Business Model ──────────────────────────────────────────────────
function s9(pres) {
  const s = pres.addSlide();
  s.background = { color: DARK_BG };
  eyebrow(s, 'BUSINESS MODEL');
  h1(s, 'SaaS subscription with usage-based upsides.', 0.62, WHITE, 26);

  const tiers = [
    { n: 'Starter',    price: '$49/mo',  desc: 'Solo inspector or small team',   fs: ['10 inspections/mo', 'PDF export', 'AI analysis', 'Email support'],                   hi: false },
    { n: 'Pro',        price: '$199/mo', desc: 'Active inspection firms',         fs: ['50 inspections/mo', 'White-label reports', 'Portfolio dashboard', 'Priority support'], hi: true  },
    { n: 'Enterprise', price: 'Custom',  desc: 'REIT, lender, advisory firm',     fs: ['Unlimited inspections', 'API access', 'SSO & team management', 'Dedicated CSM'],      hi: false },
  ];

  const cw = 3.9, gap = 0.3;
  const x0 = (W - (3 * cw + 2 * gap)) / 2;

  tiers.forEach((tier, i) => {
    const x = x0 + i * (cw + gap);
    pill(s, pres, x, 1.55, cw, 5.6, tier.hi ? '0a2a2a' : '0a1628', tier.hi ? TEAL : TEAL + '30');

    let ty = 1.72;
    if (tier.hi) {
      txt(s, 'MOST POPULAR', { x, y: ty, w: cw, h: 0.28, fontSize: 7.5, bold: true, color: TEAL, align: 'center', charSpacing: 2 });
      ty += 0.32;
    } else { ty += 0.32; }

    txt(s, tier.n,     { x, y: ty,        w: cw, h: 0.42, fontSize: 20, bold: true, color: WHITE, align: 'center' }); ty += 0.48;
    txt(s, tier.desc,  { x: x+0.15, y: ty, w: cw-0.3, h: 0.32, fontSize: 10, color: S400, align: 'center' });         ty += 0.38;
    txt(s, tier.price, { x, y: ty,        w: cw, h: 0.55, fontSize: 26, bold: true, color: tier.hi ? TEAL : WHITE, align: 'center' }); ty += 0.62;

    tier.fs.forEach(f => {
      txt(s, '✓  ' + f, { x: x + 0.28, y: ty, w: cw - 0.42, h: 0.38, fontSize: 10.5, color: S300 });
      ty += 0.4;
    });
  });
}

// ── Slide 10 – Team ───────────────────────────────────────────────────────────
function s10(pres) {
  const s = pres.addSlide();
  s.background = { color: DARK2 };
  eyebrow(s, 'THE TEAM');
  h1(s, 'Deep expertise at the intersection of CRE & AI.', 0.62, WHITE, 26);

  const members = [
    { init: 'JD', name: 'Founder & CEO',    color: TEAL,   bio: '10+ years CRE acquisitions & asset management. Former VP at a top-10 institutional fund.' },
    { init: 'AM', name: 'CTO',              color: BLUE,   bio: 'Ex-Google engineer. AI/ML specialist. Led computer vision projects at scale.' },
    { init: 'SR', name: 'Head of Product',  color: PURPLE, bio: 'Former inspection software PM. Deep domain knowledge of the PCA workflow.' },
  ];

  const cw = 3.9, gap = 0.3;
  const x0 = (W - (3 * cw + 2 * gap)) / 2;

  members.forEach((m, i) => {
    const x = x0 + i * (cw + gap);
    pill(s, pres, x, 1.58, cw, 3.0, '0a1222', '1e3a5f');

    // Avatar
    s.addShape(pres.ShapeType.ellipse, { x: x + cw/2 - 0.52, y: 1.78, w: 1.04, h: 1.04,
      fill: { color: m.color, transparency: 76 }, line: { color: m.color, width: 1.2, transparency: 42 } });
    txt(s, m.init, { x: x + cw/2 - 0.52, y: 1.78, w: 1.04, h: 1.04,
      fontSize: 20, bold: true, color: WHITE, align: 'center', valign: 'middle' });

    txt(s, m.name, { x, y: 2.96, w: cw, h: 0.4, fontSize: 13, bold: true, color: WHITE, align: 'center' });
    txt(s, m.bio,  { x: x+0.2,  y: 3.42, w: cw-0.4, h: 0.95, fontSize: 10, color: S400, align: 'center' });
  });

  const pillars = [
    { v: 'CRE', l: 'Domain expertise' },
    { v: 'AI/ML', l: 'Technical depth' },
    { v: 'SaaS', l: 'GTM playbook' },
  ];
  pillars.forEach((p, i) => {
    const x = x0 + i * (cw + gap);
    pill(s, pres, x, 4.78, cw, 0.58, '0a1f1f', TEAL + '30');
    txt(s, p.v + '  ·  ' + p.l, { x, y: 4.78, w: cw, h: 0.58,
      fontSize: 11, color: TEAL, align: 'center', valign: 'middle' });
  });
}

// ── Handler ───────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const pres = new PptxGenJS();
    pres.layout = 'LAYOUT_WIDE';
    pres.title = 'SiteLens Pitch Deck';
    pres.subject = 'Seed Round · April 2026';

    s1(pres); s2(pres); s3(pres); s4(pres); s5(pres);
    s6(pres); s7(pres); s8(pres); s9(pres); s10(pres);

    const base64 = await pres.write({ outputType: 'base64' });
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    return new Response(bytes.buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="SiteLens-AI-Pitch-Deck.pptx"',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});