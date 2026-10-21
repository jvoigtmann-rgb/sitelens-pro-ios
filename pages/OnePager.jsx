import { Camera, Zap, FileText, Share2, MapPin, BarChart2, Shield, DollarSign, Users, Smartphone, CheckCircle2 } from "lucide-react";

const TEAL = "#2dd4bf";
const DARK = "#040d1a";
const DARK2 = "#0a1628";
const DARK3 = "#0f1f3a";

export default function OnePager() {
  return (
    <div className="min-h-screen font-sans" style={{ background: DARK, color: "#fff" }}>

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-16 border-b border-white/10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10"
            style={{ background: `radial-gradient(circle, ${TEAL} 0%, transparent 70%)` }} />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src="https://media.base44.com/images/public/69dd169eb39b0ed1546dd22e/c091f8c08_IMG_0290.png"
              alt="SiteLens" className="w-14 h-14 rounded-xl object-cover" />
            <span className="font-display text-4xl font-extrabold">
              <span className="text-white">Site</span><span style={{ color: TEAL }}>Lens</span>
            </span>
          </div>
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: TEAL }}>
            Capture · Analyze · Map · Report
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            Property inspections,<br />
            <span style={{ color: TEAL }}>automated.</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto leading-relaxed">
            AI-powered inspection platform that turns site photos into professional, print-ready reports in under 10 minutes.
          </p>
          <div className="mt-6 inline-flex items-center gap-3 px-5 py-2.5 rounded-full border text-sm"
            style={{ borderColor: "rgba(45,212,191,0.3)", background: "rgba(45,212,191,0.07)" }}>
            <span className="text-slate-400">Traditional PCA: <strong className="text-white">2–3 weeks · $3K–$15K</strong></span>
            <span className="text-slate-600 mx-1">vs</span>
            <span style={{ color: TEAL }} className="font-bold">SiteLens: Under 10 min · &lt;$50</span>
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ── */}
      <section className="px-6 py-14 border-b border-white/10" style={{ background: DARK2 }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold tracking-[0.25em] uppercase mb-2" style={{ color: TEAL }}>The Problem</p>
          <h2 className="font-display text-3xl font-extrabold text-white mb-8">Property inspections are broken.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "Hours of Manual Work", desc: "Inspectors spend 4–8 hours writing reports per property — time that doesn't scale." },
              { title: "Inconsistent Quality", desc: "Reports vary by inspector skill. No standardized format, missed issues, unclear cost estimates." },
              { title: "Expensive & Slow", desc: "Traditional PCAs cost $3K–$15K and take 2–3 weeks. Deals move faster than reports." },
              { title: "No Spatial Context", desc: "Issues are listed but never mapped to their location within the property." },
            ].map((p) => (
              <div key={p.title} className="rounded-xl p-5 border border-white/8" style={{ background: DARK3 }}>
                <p className="font-bold text-white mb-1">{p.title}</p>
                <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-6 py-14 border-b border-white/10">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold tracking-[0.25em] uppercase mb-2" style={{ color: TEAL }}>The Solution</p>
          <h2 className="font-display text-3xl font-extrabold text-white mb-8">Upload photos. The platform does the rest.</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { n: "01", icon: Camera, title: "Capture", desc: "Take site photos on any device. GPS metadata extracted automatically." },
              { n: "02", icon: Zap, title: "Analyze", desc: "AI identifies every visible defect, assigns severity, and estimates repair costs." },
              { n: "03", icon: FileText, title: "Report", desc: "Branded PDF with executive summary, capital budget, and photo gallery." },
              { n: "04", icon: Share2, title: "Export", desc: "Print-ready PDF delivered in minutes. No manual writing required." },
            ].map((s) => (
              <div key={s.n} className="rounded-xl p-5 border border-white/8 flex flex-col gap-3" style={{ background: DARK2 }}>
                <span className="text-2xl font-extrabold" style={{ color: TEAL }}>{s.n}</span>
                <s.icon className="w-5 h-5" style={{ color: TEAL }} />
                <div>
                  <p className="font-bold text-white text-sm">{s.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KEY FEATURES ── */}
      <section className="px-6 py-14 border-b border-white/10" style={{ background: DARK2 }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold tracking-[0.25em] uppercase mb-2" style={{ color: TEAL }}>Key Features</p>
          <h2 className="font-display text-3xl font-extrabold text-white mb-8">Built for real estate professionals.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Zap, title: "AI Photo Analysis", desc: "Vision model detects issues, severities, and repair costs from raw site photos." },
              { icon: FileText, title: "Auto-Generated Reports", desc: "Branded PDF with cover, exec summary, narrative, capital budget, and photo gallery." },
              { icon: MapPin, title: "GPS Issue Mapping", desc: "Every photo is geo-tagged and plotted on an interactive satellite map." },
              { icon: BarChart2, title: "Portfolio Dashboard", desc: "Aggregate issue tracking across all properties. Filter, sort, and export." },
              { icon: DollarSign, title: "Cost Estimation", desc: "Local market-adjusted repair cost ranges per issue. Aggregated capital budget." },
              { icon: Shield, title: "Multi-Asset Class", desc: "Residential, multifamily, commercial, industrial & land — each with tailored prompts." },
            ].map((f) => (
              <div key={f.title} className="rounded-xl p-5 border border-white/8" style={{ background: DARK3 }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: `${TEAL}22` }}>
                  <f.icon className="w-4 h-4" style={{ color: TEAL }} />
                </div>
                <p className="font-bold text-white text-sm mb-1">{f.title}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPETITIVE TABLE ── */}
      <section className="px-6 py-14 border-b border-white/10">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold tracking-[0.25em] uppercase mb-2" style={{ color: TEAL }}>Why SiteLens Wins</p>
          <h2 className="font-display text-3xl font-extrabold text-white mb-8">vs. traditional approaches.</h2>
          <div className="overflow-x-auto touch-scroll rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: DARK2 }}>
                  <th className="text-left px-4 py-3 text-slate-400 font-semibold">Capability</th>
                  <th className="px-4 py-3 text-slate-400 font-semibold text-center">Traditional PCA</th>
                  <th className="px-4 py-3 text-slate-400 font-semibold text-center">Legacy Software</th>
                  <th className="px-4 py-3 font-bold text-center rounded-tr-xl" style={{ color: TEAL, background: `${TEAL}18` }}>SiteLens</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Inspection Time", "2–3 Weeks", "Days", "<10 Minutes"],
                  ["AI Defect Detection", "✗", "Limited", "✓"],
                  ["Repair Cost Estimates", "Manual", "Manual", "Auto-Generated"],
                  ["Executive Narratives", "Manual", "Basic Templates", "AI Drafted"],
                  ["GPS Issue Mapping", "✗", "Limited", "✓"],
                  ["Capital Budget", "Spreadsheet", "Export Required", "Auto-Generated"],
                  ["Portfolio Dashboard", "✗", "Basic", "Enterprise Ready"],
                  ["Mobile Field Workflow", "Partial", "✓", "Optimized"],
                ].map(([cap, trad, legacy, sl], i) => (
                  <tr key={cap} style={{ background: i % 2 === 0 ? DARK : DARK2 }}>
                    <td className="px-4 py-3 text-slate-300">{cap}</td>
                    <td className="px-4 py-3 text-center text-slate-500">{trad}</td>
                    <td className="px-4 py-3 text-center text-slate-500">{legacy}</td>
                    <td className="px-4 py-3 text-center font-bold" style={{ color: TEAL, background: `${TEAL}10` }}>{sl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-sm font-bold mt-6" style={{ color: TEAL }}>
            SiteLens doesn't simply digitize inspections — it automates analysis, documentation, and property intelligence.
          </p>
        </div>
      </section>

      {/* ── TRACTION ── */}
      <section className="px-6 py-14 border-b border-white/10" style={{ background: DARK2 }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold tracking-[0.25em] uppercase mb-2" style={{ color: TEAL }}>Traction</p>
          <h2 className="font-display text-3xl font-extrabold text-white mb-8">Built, tested. Ready to launch.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "Working product — Full-stack inspection platform live and in use.",
              "Multi-asset support — Residential, multifamily, commercial, industrial & land.",
              "AI-powered reports — End-to-end narrative generation using generative AI.",
              "PDF export — Print-ready branded reports with capital budget and photo gallery.",
              "Mobile-first — Designed for inspectors in the field on any device.",
            ].map((item) => {
              const [bold, rest] = item.split(" — ");
              return (
                <div key={bold} className="flex items-start gap-3 rounded-xl p-4 border border-white/8" style={{ background: DARK3 }}>
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: TEAL }} />
                  <p className="text-sm text-slate-300"><strong className="text-white">{bold}</strong> — {rest}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOUNDER ── */}
      <section className="px-6 py-14 border-b border-white/10">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold tracking-[0.25em] uppercase mb-2" style={{ color: TEAL }}>Founder</p>
          <h2 className="font-display text-3xl font-extrabold text-white mb-6">Built by someone who lived the problem.</h2>
          <div className="rounded-xl border border-white/10 p-6" style={{ background: DARK2 }}>
            <p className="text-slate-300 leading-relaxed mb-5">
              25+ years leading commercial real estate operations, construction, capital planning, and property inspections at institutional scale.
            </p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex gap-2"><span style={{ color: TEAL }}>•</span> Led inspection, construction, and capital projects across tens of thousands of multifamily units and millions of SF of office space.</li>
              <li className="flex gap-2"><span style={{ color: TEAL }}>•</span> Experienced firsthand the cost, inconsistency, and delays of traditional property inspections.</li>
              <li className="flex gap-2"><span style={{ color: TEAL }}>•</span> Built SiteLens as an industry operator solving a business problem — not a software engineer solving a technical one.</li>
              <li className="flex gap-2"><span style={{ color: TEAL }}>•</span> Working product already generating professional inspection reports in minutes.</li>
            </ul>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {["25+ Years CRE Leadership", "Working AI Product", "Inspection & Property Intelligence", "Launch Ready"].map((tag) => (
                <div key={tag} className="rounded-lg border border-white/10 px-3 py-2.5 text-xs font-semibold text-center text-white"
                  style={{ background: DARK3 }}>{tag}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 py-8 text-center" style={{ background: DARK }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="https://media.base44.com/images/public/69dd169eb39b0ed1546dd22e/c091f8c08_IMG_0290.png"
            alt="SiteLens" className="w-7 h-7 rounded-lg object-cover" />
          <span className="font-bold text-lg">
            <span className="text-white">Site</span><span style={{ color: TEAL }}>Lens</span>
          </span>
        </div>
        <p className="text-xs text-slate-500">Confidential — For Internal Use Only</p>
        <p className="text-xs font-bold mt-1" style={{ color: TEAL }}>
          Commercial Real Estate Expertise + Artificial Intelligence = The Next Generation of Property Intelligence
        </p>
      </footer>
    </div>
  );
}