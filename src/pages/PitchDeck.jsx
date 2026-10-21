import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Zap, FileText, BarChart3, MapPin, DollarSign, Shield, Users, CheckCircle, ArrowRight, Download, Presentation } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { appParams } from "@/lib/app-params";


const DASHBOARD_SCREENSHOT = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80";
const REPORT_SCREENSHOT = "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&q=80";

const slides = [
  { id: "cover" },
  { id: "problem" },
  { id: "solution" },
  { id: "product" },
  { id: "workflow" },
  { id: "features" },
  { id: "market" },
  { id: "traction" },
  { id: "business_model" },
  { id: "team" },
];

function CoverSlide() {
  return (
    <div className="relative h-full flex flex-col items-center justify-center text-center px-4 sm:px-16"
      style={{ background: "linear-gradient(135deg, #040d1a 0%, #0a1f3d 55%, #0b2e4a 100%)" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #2dd4bf 0%, transparent 70%)", transform: "translate(30%,-30%)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />
      </div>
      <div className="relative z-10 space-y-6">
      <div className="flex items-center justify-center gap-3 mb-4">
        <img src="https://media.base44.com/images/public/69dd169eb39b0ed1546dd22e/c091f8c08_IMG_0290.png" alt="SiteLens" className="w-16 h-16 rounded-2xl object-cover" />
      </div>
      <h1 className="text-7xl font-extrabold tracking-tight font-display">
        <span className="text-white">SiteLens</span>
      </h1>
        <p className="text-xl font-semibold tracking-[0.25em] uppercase" style={{ color: "#2dd4bf" }}>
          Capture · Analyze · Map · Report
        </p>
        <p className="text-slate-300 text-lg max-w-xl leading-relaxed">
          AI-powered property inspection platform that turns site photos into professional reports in minutes.
        </p>
        <div className="pt-6 flex flex-col items-center gap-2">
          <p className="text-slate-400 text-sm">Seed Round · April 2026</p>
          <p className="text-slate-500 text-xs">Confidential — For Investor Use Only</p>
        </div>
      </div>
    </div>
  );
}

function ProblemSlide() {
  const pains = [
    { icon: "⏱️", title: "Hours of Manual Work", desc: "Inspectors spend 4–8 hours writing reports per property — time that doesn't scale." },
    { icon: "📋", title: "Inconsistent Quality", desc: "Reports vary by inspector skill. No standardized format, missed issues, unclear cost estimates." },
    { icon: "💸", title: "Expensive & Slow", desc: "Traditional PCAs cost $3K–$15K and take 2–3 weeks. Deals move faster than reports." },
    { icon: "📍", title: "No Spatial Context", desc: "Issues are listed but never mapped to their location within the property." },
  ];
  return (
    <div className="h-full flex flex-col justify-center px-4 sm:px-16 py-12"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
      <div className="mb-10">
        <p className="text-sm font-bold tracking-[0.2em] uppercase mb-2" style={{ color: "#f97316" }}>The Problem</p>
        <h2 className="text-5xl font-extrabold text-white leading-tight">Property inspections are<br /><span style={{ color: "#f97316" }}>broken.</span></h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {pains.map((p) => (
          <div key={p.title} className="rounded-2xl p-6 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(249,115,22,0.2)" }}>
            <p className="text-3xl mb-3">{p.icon}</p>
            <h3 className="text-white font-bold text-lg mb-2">{p.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SolutionSlide() {
  return (
    <div className="h-full flex flex-col justify-center px-4 sm:px-16 py-12"
      style={{ background: "linear-gradient(135deg, #040d1a 0%, #0a1f3d 100%)" }}>
      <div className="mb-10">
        <p className="text-sm font-bold tracking-[0.2em] uppercase mb-2" style={{ color: "#2dd4bf" }}>The Solution</p>
        <h2 className="text-5xl font-extrabold text-white leading-tight">
          Upload photos.<br />
          <span style={{ color: "#2dd4bf" }}>AI does the rest.</span>
        </h2>
      </div>
      <div className="flex flex-col sm:flex-row gap-8 items-center">
        <div className="flex-1 space-y-5">
          {[
            { step: "01", title: "Capture", desc: "Inspector takes site photos on any device. GPS metadata is extracted automatically." },
            { step: "02", title: "Analyze", desc: "Claude AI identifies every visible defect, assigns severity, and estimates repair costs per local market." },
            { step: "03", title: "Report", desc: "A branded, print-ready PDF with executive summary, capital budget, narrative sections, and photo gallery is generated in minutes." },
          ].map((s) => (
            <div key={s.step} className="flex gap-5 items-start">
              <span className="text-3xl font-black shrink-0" style={{ color: "#2dd4bf", opacity: 0.5 }}>{s.step}</span>
              <div>
                <p className="text-white font-bold text-lg">{s.title}</p>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 rounded-2xl overflow-hidden shadow-2xl border" style={{ borderColor: "rgba(45,212,191,0.2)" }}>
          <img src={DASHBOARD_SCREENSHOT} alt="Dashboard" className="w-full h-full object-cover" style={{ height: 320 }} />
        </div>
      </div>
    </div>
  );
}

function ProductSlide() {
  return (
    <div className="h-full flex flex-col justify-center px-4 sm:px-16 py-8"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
      <div className="mb-8">
        <p className="text-sm font-bold tracking-[0.2em] uppercase mb-2" style={{ color: "#2dd4bf" }}>Product</p>
        <h2 className="text-4xl font-extrabold text-white">The SiteLens Platform</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
        <div className="rounded-2xl overflow-hidden shadow-2xl border" style={{ borderColor: "rgba(45,212,191,0.15)" }}>
          <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/70"/><div className="w-3 h-3 rounded-full bg-yellow-500/70"/><div className="w-3 h-3 rounded-full bg-green-500/70"/></div>
            <span className="text-slate-400 text-xs ml-2">Dashboard</span>
          </div>
          <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80" alt="Dashboard" className="w-full object-cover" style={{ height: 260 }} />
        </div>
        <div className="space-y-4">
          {[
            { icon: Zap, label: "AI Photo Analysis", desc: "Claude vision model detects issues, severities, and repair costs from raw site photos." },
            { icon: FileText, label: "Auto-Generated Reports", desc: "Branded PDF with cover, exec summary, narrative, capital budget, and photo gallery." },
            { icon: MapPin, label: "GPS Issue Mapping", desc: "Every photo is geo-tagged and plotted on an interactive map." },
            { icon: BarChart3, label: "Issues Dashboard", desc: "Aggregate view of all issues across a portfolio with filter and sort." },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex gap-4 items-start p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(45,212,191,0.12)" }}>
                <Icon className="w-4 h-4" style={{ color: "#2dd4bf" }} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{label}</p>
                <p className="text-slate-400 text-xs leading-relaxed mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkflowSlide() {
  const steps = [
    { n: 1, icon: "📸", label: "Upload Photos", sub: "Drag & drop, mobile camera, or bulk upload. Any device." },
    { n: 2, icon: "🤖", label: "AI Analysis", sub: "Claude identifies defects, severity, and cost per issue." },
    { n: 3, icon: "📄", label: "Report Draft", sub: "Narrative sections auto-generated. Edit or accept." },
    { n: 4, icon: "📤", label: "Export & Share", sub: "Branded PDF, print-ready. Delivered in minutes." },
  ];
  return (
    <div className="h-full flex flex-col justify-center px-4 sm:px-16 py-12"
      style={{ background: "linear-gradient(135deg, #040d1a 0%, #0a1f3d 100%)" }}>
      <div className="mb-12">
        <p className="text-sm font-bold tracking-[0.2em] uppercase mb-2" style={{ color: "#2dd4bf" }}>How It Works</p>
        <h2 className="text-5xl font-extrabold text-white">From site to report<br /><span style={{ color: "#2dd4bf" }}>in under 10 minutes.</span></h2>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch gap-4">
        {steps.map((s, idx) => (
          <div key={s.n} className="flex items-center gap-4 flex-1">
            <div className="flex-1 rounded-2xl p-6 border text-center"
              style={{ background: "rgba(45,212,191,0.05)", borderColor: "rgba(45,212,191,0.2)" }}>
              <p className="text-4xl mb-3">{s.icon}</p>
              <p className="text-white font-bold mb-1">{s.label}</p>
              <p className="text-slate-400 text-xs leading-relaxed">{s.sub}</p>
            </div>
            {idx < steps.length - 1 && <ArrowRight className="w-5 h-5 shrink-0 hidden sm:block" style={{ color: "#2dd4bf", opacity: 0.5 }} />}
          </div>
        ))}
      </div>
      <div className="mt-10 text-center overflow-x-auto touch-scroll">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border" style={{ borderColor: "rgba(45,212,191,0.3)", background: "rgba(45,212,191,0.07)" }}>
          <span className="text-white font-semibold">Traditional PCA:</span>
          <span className="text-slate-400">2–3 weeks · $3K–$15K</span>
          <span className="mx-2 text-slate-600">vs</span>
          <span className="text-white font-semibold">SiteLens:</span>
          <span style={{ color: "#2dd4bf" }} className="font-bold">Under 10 min · &lt;$50</span>
        </div>
      </div>
    </div>
  );
}

function FeaturesSlide() {
  const features = [
    { icon: Shield, title: "Multi-Asset Class", desc: "Residential, multifamily, commercial, industrial & land — each with tailored AI prompts." },
    { icon: DollarSign, title: "Cost Estimation", desc: "Local market-adjusted repair cost ranges per issue. Aggregated capital budget table." },
    { icon: FileText, title: "AI Narratives", desc: "Executive summary, operations assessment, and market context — all AI-drafted and editable." },
    { icon: MapPin, title: "GPS Mapping", desc: "Issues are geo-tagged and plotted on an interactive map with severity color coding." },
    { icon: BarChart3, title: "Portfolio Dashboard", desc: "Aggregate issue tracking across all properties. Filter, sort, and export." },
    { icon: Users, title: "Branded Reports", desc: "Custom cover photos, inspector name, report purpose. Print-ready PDF export." },
  ];
  return (
    <div className="h-full flex flex-col justify-center px-4 sm:px-16 py-10"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
      <div className="mb-8">
        <p className="text-sm font-bold tracking-[0.2em] uppercase mb-2" style={{ color: "#2dd4bf" }}>Key Features</p>
        <h2 className="text-4xl font-extrabold text-white">Built for real estate professionals.</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="p-5 rounded-2xl border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(45,212,191,0.12)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(45,212,191,0.12)" }}>
              <Icon className="w-5 h-5" style={{ color: "#2dd4bf" }} />
            </div>
            <h3 className="text-white font-bold text-base mb-1.5">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketSlide() {
  const segments = [
    { label: "Total Addressable Market", value: "$42B", sub: "US commercial real estate inspection & due diligence market", color: "#2dd4bf" },
    { label: "Serviceable Addressable Market", value: "$8.5B", sub: "Property condition assessments, PCNA, and due diligence reports annually", color: "#3b82f6" },
    { label: "Serviceable Obtainable Market", value: "$850M", sub: "10% of SAM — tech-forward CRE firms adopting AI inspection tools", color: "#8b5cf6" },
  ];
  return (
    <div className="h-full flex flex-col justify-center px-4 sm:px-16 py-12"
      style={{ background: "linear-gradient(135deg, #040d1a 0%, #0a1f3d 100%)" }}>
      <div className="mb-10">
        <p className="text-sm font-bold tracking-[0.2em] uppercase mb-2" style={{ color: "#2dd4bf" }}>Market Opportunity</p>
        <h2 className="text-5xl font-extrabold text-white">A massive, underserved<br /><span style={{ color: "#2dd4bf" }}>market.</span></h2>
      </div>
      <div className="flex flex-col sm:flex-row gap-6">
        {segments.map((s) => (
          <div key={s.label} className="flex-1 rounded-2xl p-7 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: `${s.color}33` }}>
            <p className="text-5xl font-black mb-3" style={{ color: s.color }}>{s.value}</p>
            <p className="text-white font-bold text-base mb-2">{s.label}</p>
            <p className="text-slate-400 text-sm leading-relaxed">{s.sub}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        {[
          { v: "500K+", l: "PCAs conducted annually in the US" },
          { v: "$8K", l: "Average cost of a traditional PCA" },
          { v: "18 days", l: "Average turnaround time today" },
        ].map(({ v, l }) => (
          <div key={l} className="py-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
            <p className="text-2xl font-extrabold text-white">{v}</p>
            <p className="text-slate-500 text-xs mt-1">{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TractionSlide() {
  return (
    <div className="h-full flex flex-col justify-center px-4 sm:px-16 py-12"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
      <div className="mb-10">
        <p className="text-sm font-bold tracking-[0.2em] uppercase mb-2" style={{ color: "#2dd4bf" }}>Traction</p>
        <h2 className="text-5xl font-extrabold text-white">Built, shipped,<br /><span style={{ color: "#2dd4bf" }}>gaining momentum.</span></h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="space-y-4">
          {[
            { metric: "Working product", detail: "Full-stack AI inspection platform live and in use." },
            { metric: "Multi-asset support", detail: "Residential, multifamily, commercial, industrial & land." },
            { metric: "AI-powered reports", detail: "End-to-end narrative generation using Claude." },
            { metric: "PDF export", detail: "Print-ready branded reports with capital budget and photo gallery." },
            { metric: "Mobile-first", detail: "Designed for inspectors in the field on any device." },
          ].map((t) => (
            <div key={t.metric} className="flex gap-4 items-start">
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#2dd4bf" }} />
              <div>
                <span className="text-white font-semibold">{t.metric} — </span>
                <span className="text-slate-400 text-sm">{t.detail}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl overflow-hidden shadow-2xl border" style={{ borderColor: "rgba(45,212,191,0.15)" }}>
          <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/70"/><div className="w-3 h-3 rounded-full bg-yellow-500/70"/><div className="w-3 h-3 rounded-full bg-green-500/70"/></div>
            <span className="text-slate-400 text-xs ml-2">Reports View</span>
          </div>
          <img src={REPORT_SCREENSHOT} alt="Reports" className="w-full object-cover" style={{ height: 260 }} />
        </div>
      </div>
    </div>
  );
}

function BusinessModelSlide() {
  const tiers = [
    { name: "Starter", price: "$49", per: "/mo", desc: "Solo inspector or small team", features: ["10 inspections/mo", "PDF export", "AI analysis", "Email support"] },
    { name: "Pro", price: "$199", per: "/mo", desc: "Active inspection firms", features: ["50 inspections/mo", "White-label reports", "Portfolio dashboard", "Priority support"], highlight: true },
    { name: "Enterprise", price: "Custom", per: "", desc: "REIT, lender, advisory firm", features: ["Unlimited inspections", "API access", "SSO & team management", "Dedicated CSM"] },
  ];
  return (
    <div className="h-full flex flex-col justify-center px-4 sm:px-16 py-10"
      style={{ background: "linear-gradient(135deg, #040d1a 0%, #0a1f3d 100%)" }}>
      <div className="mb-10">
        <p className="text-sm font-bold tracking-[0.2em] uppercase mb-2" style={{ color: "#2dd4bf" }}>Business Model</p>
        <h2 className="text-4xl font-extrabold text-white">SaaS subscription with<br /><span style={{ color: "#2dd4bf" }}>usage-based upsides.</span></h2>
      </div>
      <div className="flex flex-col sm:flex-row gap-6">
        {tiers.map((t) => (
          <div key={t.name} className="flex-1 rounded-2xl p-7 border"
            style={{
              background: t.highlight ? "rgba(45,212,191,0.08)" : "rgba(255,255,255,0.03)",
              borderColor: t.highlight ? "#2dd4bf" : "rgba(45,212,191,0.12)",
            }}>
            {t.highlight && <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#2dd4bf" }}>Most Popular</p>}
            <p className="text-white font-extrabold text-2xl mb-0.5">{t.name}</p>
            <p className="text-slate-400 text-sm mb-4">{t.desc}</p>
            <p className="mb-6"><span className="text-4xl font-black text-white">{t.price}</span><span className="text-slate-400">{t.per}</span></p>
            <ul className="space-y-2">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2 items-center text-sm text-slate-300">
                  <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "#2dd4bf" }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamSlide() {
  return (
    <div className="h-full flex flex-col justify-center px-4 sm:px-16 py-12"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
      <div className="mb-10">
        <p className="text-sm font-bold tracking-[0.2em] uppercase mb-2" style={{ color: "#2dd4bf" }}>The Team</p>
        <h2 className="text-5xl font-extrabold text-white">Deep expertise at the<br /><span style={{ color: "#2dd4bf" }}>intersection of CRE & AI.</span></h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { initials: "JD", name: "Founder & CEO", bg: "#2dd4bf", expertise: "10+ years CRE acquisitions & asset management. Former VP at a top-10 institutional fund." },
          { initials: "AM", name: "CTO", bg: "#3b82f6", expertise: "Ex-Google engineer. AI/ML specialist. Led computer vision projects at scale." },
          { initials: "SR", name: "Head of Product", bg: "#8b5cf6", expertise: "Former inspection software PM. Deep domain knowledge of the PCA workflow." },
        ].map((m) => (
          <div key={m.name} className="p-6 rounded-2xl border text-center" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black text-white mx-auto mb-4"
              style={{ background: `${m.bg}33`, border: `2px solid ${m.bg}66` }}>
              {m.initials}
            </div>
            <p className="text-white font-bold text-base mb-3">{m.name}</p>
            <p className="text-slate-400 text-sm leading-relaxed">{m.expertise}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        {[
          { v: "CRE", l: "Domain expertise" },
          { v: "AI/ML", l: "Technical depth" },
          { v: "SaaS", l: "Go-to-market playbook" },
        ].map(({ v, l }) => (
          <div key={l} className="py-3 rounded-xl" style={{ background: "rgba(45,212,191,0.05)" }}>
            <p className="text-lg font-extrabold" style={{ color: "#2dd4bf" }}>{v}</p>
            <p className="text-slate-500 text-xs mt-0.5">{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AskSlide() {
  return (
    <div className="h-full flex flex-col justify-center items-center text-center px-4 sm:px-16"
      style={{ background: "linear-gradient(135deg, #040d1a 0%, #0a1f3d 100%)" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 w-[700px] h-[700px] rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #2dd4bf 0%, transparent 65%)", transform: "translate(-50%,-50%)" }} />
      </div>
      <div className="relative z-10 space-y-6 max-w-2xl">
        <p className="text-sm font-bold tracking-[0.2em] uppercase" style={{ color: "#2dd4bf" }}>The Ask</p>
        <h2 className="text-6xl font-extrabold text-white leading-tight">Raising <span style={{ color: "#2dd4bf" }}>$1.5M</span><br />Seed Round</h2>
        <p className="text-slate-300 text-lg leading-relaxed">
          To accelerate product development, hire go-to-market talent, and sign the first 50 enterprise customers.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          {[
            { pct: "40%", label: "Product & Engineering" },
            { pct: "35%", label: "Sales & Marketing" },
            { pct: "25%", label: "Operations & Runway" },
          ].map(({ pct, label }) => (
            <div key={label} className="py-5 rounded-2xl border" style={{ background: "rgba(45,212,191,0.07)", borderColor: "rgba(45,212,191,0.25)" }}>
              <p className="text-3xl font-black text-white">{pct}</p>
              <p className="text-slate-400 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
        <div className="pt-4">
          <div className="inline-block px-6 py-3 rounded-2xl font-bold text-lg" style={{ background: "linear-gradient(135deg, #2dd4bf, #14b8a6)", color: "#040d1a" }}>
            Let's build the future of property inspection.
          </div>
        </div>
      </div>
    </div>
  );
}

const SLIDE_COMPONENTS = {
  cover: CoverSlide,
  problem: ProblemSlide,
  solution: SolutionSlide,
  product: ProductSlide,
  workflow: WorkflowSlide,
  features: FeaturesSlide,
  market: MarketSlide,
  traction: TractionSlide,
  business_model: BusinessModelSlide,
  team: TeamSlide,
};

const SLIDE_LABELS = {
  cover: "Cover",
  problem: "Problem",
  solution: "Solution",
  product: "Product",
  workflow: "How It Works",
  features: "Features",
  market: "Market",
  traction: "Traction",
  business_model: "Business Model",
  team: "Team",
};

export default function PitchDeck() {
  const [current, setCurrent] = useState(0);
  const [printing, setPrinting] = useState(false);
  const [downloadingPptx, setDownloadingPptx] = useState(false);
  const printContainerRef = useRef(null);

  const prev = () => setCurrent((c) => Math.max(0, c - 1));
  const next = () => setCurrent((c) => Math.min(slides.length - 1, c + 1));

  const handleDownloadPptx = async () => {
    setDownloadingPptx(true);
    try {
      const { token } = appParams;
      const res = await fetch("/functions/generatePitchDeck", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "SiteLens-AI-Pitch-Deck.pptx";
      a.click();
      URL.revokeObjectURL(objectUrl);
    } finally {
      setDownloadingPptx(false);
    }
  };

  const handleDownload = async () => {
    setPrinting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const container = printContainerRef.current;
      // Temporarily show container off-screen so html2canvas can render it
      container.style.display = "block";
      container.style.position = "fixed";
      container.style.top = "-9999px";
      container.style.left = "0";
      container.style.zIndex = "-1";

      // Wait for images to load
      await new Promise(r => setTimeout(r, 600));

      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [297, 167] });
      const slideEls = container.querySelectorAll(".pitch-print-slide");

      for (let i = 0; i < slideEls.length; i++) {
        const canvas = await html2canvas(slideEls[i], {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          width: slideEls[i].offsetWidth,
          height: slideEls[i].offsetHeight,
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        if (i > 0) pdf.addPage([297, 167], "landscape");
        pdf.addImage(imgData, "JPEG", 0, 0, 297, 167);
      }

      pdf.save("SiteLens-AI-Pitch-Deck.pdf");
    } finally {
      const container = printContainerRef.current;
      container.style.display = "none";
      container.style.position = "";
      container.style.top = "";
      container.style.left = "";
      container.style.zIndex = "";
      setPrinting(false);
    }
  };

  const slide = slides[current];
  const SlideComponent = SLIDE_COMPONENTS[slide.id];

  return (
    <>

      {/* Hidden all-slides container for PDF generation */}
      <div id="pitch-print-container" ref={printContainerRef} style={{ display: "none" }}>
        {slides.map((s) => {
          const Comp = SLIDE_COMPONENTS[s.id];
          return (
            <div key={s.id} className="pitch-print-slide" style={{ width: "1122px", height: "632px", overflow: "hidden", position: "relative" }}>
              <Comp />
            </div>
          );
        })}
      </div>

      <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 100 }}>
        {/* Slide */}
        <div className="flex-1 relative overflow-hidden">
          <SlideComponent />
        </div>

        {/* Controls */}
        <div className="shrink-0 flex items-center justify-between px-6 py-3 safe-top safe-bottom bg-black border-t border-white/10">
          <button
            onClick={prev}
            disabled={current === 0}
            className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-colors disabled:opacity-30"
            style={{ color: "#2dd4bf", background: "rgba(45,212,191,0.08)" }}
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>

          {/* Dot nav */}
          <div className="flex items-center gap-3">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrent(i)}
                className="flex flex-col items-center gap-1 group min-h-[44px]"
              >
                <div className="w-2 h-2 rounded-full transition-all"
                  style={{ background: i === current ? "#2dd4bf" : "rgba(255,255,255,0.25)", transform: i === current ? "scale(1.3)" : "scale(1)" }} />
                <span className="text-xs font-medium hidden sm:block" style={{ color: i === current ? "#2dd4bf" : "rgba(255,255,255,0.3)" }}>
                  {SLIDE_LABELS[s.id]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPptx}
              disabled={downloadingPptx}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              style={{ color: "#2dd4bf", background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.3)" }}
            >
              <FileText className="w-4 h-4" />
              {downloadingPptx ? "Generating..." : "Download PPTX"}
            </button>
            <button
              onClick={handleDownload}
              disabled={printing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: "#040d1a", background: "linear-gradient(135deg, #2dd4bf, #14b8a6)" }}
            >
              <Download className="w-4 h-4" />
              {printing ? "Preparing..." : "Download PDF"}
            </button>
            <button
              onClick={next}
              disabled={current === slides.length - 1}
              className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-colors disabled:opacity-30"
              style={{ color: "#2dd4bf", background: "rgba(45,212,191,0.08)" }}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
