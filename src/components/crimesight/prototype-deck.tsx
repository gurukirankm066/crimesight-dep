'use client'

import Image from 'next/image'
import {
  Shield,
  Map,
  Network,
  Brain,
  BarChart3,
  FileText,
  Radio,
  Users,
  Snowflake,
  Printer,
  X,
  Monitor,
  MessageSquare,
  Mic,
  Search,
  Zap,
  Database,
  Code2,
  Layers,
  Cpu,
  Globe,
  Server,
  Smartphone,
  Sparkles,
} from 'lucide-react'

interface PrototypeDeckProps {
  onClose: () => void
}

/* ── Shared Styles ── */
const slideBase =
  'deck-slide relative bg-[#030712] text-slate-200 overflow-hidden'

const headingAccent = 'text-emerald-400'

const gridPattern = (
  <div
    className="absolute inset-0 opacity-[0.03] pointer-events-none"
    style={{
      backgroundImage:
        'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
    }}
  />
)

const emeraldGlow = (
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[2px] bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
)

const emeraldGlowBottom = (
  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
)

/* ── Slide 1: Title ── */
function Slide1() {
  return (
    <div className={`${slideBase} flex flex-col items-center justify-center`}>
      {gridPattern}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.03] via-transparent to-transparent pointer-events-none" />

      {/* Shield */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150" />
        <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
          <Shield className="size-12 text-emerald-400" strokeWidth={1.5} />
        </div>
      </div>

      {/* Title */}
      <h1 className="relative text-5xl font-black tracking-[0.2em] text-white mb-3">
        CRIME<span className={headingAccent}>SIGHT</span>{' '}
        <span className={headingAccent}>AI</span>
      </h1>
      <div className="relative w-32 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent mb-6" />

      <p className="relative text-lg text-slate-300 tracking-wide mb-2">
        AI-Powered Crime Analytics & Intelligence Platform
      </p>
      <p className="relative text-base text-emerald-400/80 tracking-widest font-medium">
        Karnataka State Police Datathon 2026
      </p>

      {/* Bottom tagline */}
      <div className="absolute bottom-12 left-0 right-0 text-center">
        <p className="text-xs text-slate-600 tracking-[0.3em] uppercase">
          Empowering Data-Driven Policing
        </p>
      </div>
    </div>
  )
}

/* ── Slide 2: Problem Statement ── */
function Slide2() {
  const problems = [
    {
      icon: '📊',
      title: 'Volume Overload',
      desc: 'Karnataka processes 500,000+ FIRs annually across 31 districts — far beyond manual analytical capacity.',
    },
    {
      icon: '🔗',
      title: 'Siloed Intelligence',
      desc: 'Critical intelligence about repeat offenders and crime networks remains hidden in disconnected databases.',
    },
    {
      icon: '⏳',
      title: 'Reactive Policing',
      desc: 'Patrol allocation is reactive, not predictive — officers respond to incidents instead of preventing them.',
    },
    {
      icon: '❄️',
      title: 'Cold Case Backlog',
      desc: 'Cold cases pile up without systematic revival mechanisms, leaving victims without justice.',
    },
    {
      icon: '🔍',
      title: 'No Cross-District Visibility',
      desc: 'Manual analysis is slow, error-prone, and cannot detect cross-district crime patterns or offender networks.',
    },
  ]

  return (
    <div className={`${slideBase} flex flex-col`}>
      {gridPattern}
      {emeraldGlow}

      {/* Header */}
      <div className="relative px-12 pt-14 pb-8">
        <p className="text-xs text-emerald-400 tracking-[0.3em] uppercase font-medium mb-2">
          Understanding the Problem
        </p>
        <h2 className="text-3xl font-bold text-white tracking-wide">
          The <span className={headingAccent}>Challenge</span>
        </h2>
        <div className="w-16 h-[2px] bg-emerald-500 mt-3" />
      </div>

      {/* Problem Cards */}
      <div className="relative flex-1 px-12 pb-12 flex flex-col gap-5">
        {problems.map((p, i) => (
          <div
            key={i}
            className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]"
          >
            <span className="text-2xl mt-0.5 shrink-0">{p.icon}</span>
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">{p.title}</h3>
              <p className="text-[13px] text-slate-400 leading-relaxed">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {emeraldGlowBottom}
    </div>
  )
}

/* ── Slide 3: Our Solution — 8 Modules ── */
function Slide3() {
  const modules = [
    { icon: Map, emoji: '🗺️', name: 'Crime Map', desc: 'District-level heat visualization' },
    { icon: Network, emoji: '🔗', name: 'Network Intelligence', desc: 'Link 230+ repeat offenders' },
    { icon: Brain, emoji: '🧠', name: 'AI Analysis', desc: 'Anomaly detection & risk scoring' },
    { icon: BarChart3, emoji: '📊', name: 'Crime Trends', desc: 'Temporal & spatial patterns' },
    { icon: FileText, emoji: '📋', name: 'Case Management', desc: 'Track 500+ cases end-to-end' },
    { icon: Radio, emoji: '🚔', name: 'Predictive Patrol', desc: 'ML-based hotspot forecasting' },
    { icon: Users, emoji: '👮', name: 'Officer Intelligence', desc: 'Performance leaderboards' },
    { icon: Snowflake, emoji: '❄️', name: 'Cold Case Revival', desc: 'AI-powered case matching' },
  ]

  return (
    <div className={`${slideBase} flex flex-col`}>
      {gridPattern}
      {emeraldGlow}

      <div className="relative px-12 pt-14 pb-6">
        <p className="text-xs text-emerald-400 tracking-[0.3em] uppercase font-medium mb-2">
          Our Approach
        </p>
        <h2 className="text-3xl font-bold text-white tracking-wide">
          Introducing <span className={headingAccent}>CrimeSight AI</span>
        </h2>
        <div className="w-16 h-[2px] bg-emerald-500 mt-3" />
        <p className="text-sm text-slate-400 mt-3">
          A comprehensive, AI-powered analytics platform with 8 integrated modules
        </p>
      </div>

      <div className="relative flex-1 px-12 pb-12">
        <div className="grid grid-cols-2 gap-4 h-full">
          {modules.map((m, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/20 transition-colors"
            >
              <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <m.icon className="size-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{m.emoji}</span>
                  <h3 className="text-sm font-semibold text-white">{m.name}</h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {emeraldGlowBottom}
    </div>
  )
}

/* ── Slide 4: Technology Architecture ── */
function Slide4() {
  const sections = [
    {
      label: 'Frontend',
      icon: Code2,
      items: ['Next.js 16 (App Router)', 'TypeScript 5', 'Tailwind CSS 4', 'Framer Motion'],
    },
    {
      label: 'UI Framework',
      icon: Layers,
      items: ['shadcn/ui Components', 'Recharts Data Viz', 'Lucide Icons', 'Responsive Dark Theme'],
    },
    {
      label: 'Backend',
      icon: Server,
      items: ['22 REST API Endpoints', 'Prisma ORM', 'Server-Side Rendering', 'Streaming Responses'],
    },
    {
      label: 'Database',
      icon: Database,
      items: ['PostgreSQL (Supabase)', '24 Normalized Tables', '8,353 Seeded Records', 'Relation Integrity'],
    },
    {
      label: 'AI / Analytics',
      icon: Cpu,
      items: ['Natural Language Processing', 'Anomaly Detection', 'Similarity Scoring', 'Risk Prediction'],
    },
    {
      label: 'Infrastructure',
      icon: Globe,
      items: ['31 Districts Covered', 'Real-Time Data', 'Mobile Responsive', 'Production Ready'],
    },
  ]

  return (
    <div className={`${slideBase} flex flex-col`}>
      {gridPattern}
      {emeraldGlow}

      <div className="relative px-12 pt-14 pb-6">
        <p className="text-xs text-emerald-400 tracking-[0.3em] uppercase font-medium mb-2">
          Under the Hood
        </p>
        <h2 className="text-3xl font-bold text-white tracking-wide">
          Technology <span className={headingAccent}>Architecture</span>
        </h2>
        <div className="w-16 h-[2px] bg-emerald-500 mt-3" />
      </div>

      <div className="relative flex-1 px-12 pb-12">
        <div className="grid grid-cols-2 gap-5 h-full">
          {sections.map((s, i) => (
            <div
              key={i}
              className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10">
                  <s.icon className="size-4 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-wide">{s.label}</h3>
              </div>
              <ul className="space-y-1.5">
                {s.items.map((item, j) => (
                  <li key={j} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-500/60 shrink-0" />
                    <span className="text-[12px] text-slate-400">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {emeraldGlowBottom}
    </div>
  )
}

/* ── Screenshot Slide Helper ── */
function ScreenshotSlide({
  title,
  subtitle,
  leftSrc,
  leftCaption,
  rightSrc,
  rightCaption,
  leftPlaceholder,
  rightPlaceholder,
}: {
  title: string
  subtitle: string
  leftSrc?: string
  leftCaption: string
  rightSrc?: string
  rightCaption: string
  leftPlaceholder?: { icon: React.FC<{ className?: string }>; text: string }
  rightPlaceholder?: { icon: React.FC<{ className?: string }>; text: string }
}) {
  return (
    <div className={`${slideBase} flex flex-col`}>
      {gridPattern}
      {emeraldGlow}

      <div className="relative px-12 pt-14 pb-5">
        <p className="text-xs text-emerald-400 tracking-[0.3em] uppercase font-medium mb-2">
          Module Showcase
        </p>
        <h2 className="text-3xl font-bold text-white tracking-wide">
          {title}
        </h2>
        <div className="w-16 h-[2px] bg-emerald-500 mt-3" />
        <p className="text-sm text-slate-400 mt-2">{subtitle}</p>
      </div>

      <div className="relative flex-1 px-12 pb-12 grid grid-cols-2 gap-6">
        {/* Left */}
        <div className="flex flex-col">
          <div className="flex-1 rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
            {leftSrc ? (
              <Image
                src={leftSrc}
                alt={leftCaption}
                fill
                className="object-cover object-top"
                unoptimized
              />
            ) : leftPlaceholder ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <leftPlaceholder.icon className="size-7 text-emerald-400" />
                </div>
                <p className="text-sm text-slate-400 text-center">{leftPlaceholder.text}</p>
              </div>
            ) : null}
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center font-medium">{leftCaption}</p>
        </div>

        {/* Right */}
        <div className="flex flex-col">
          <div className="flex-1 rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
            {rightSrc ? (
              <Image
                src={rightSrc}
                alt={rightCaption}
                fill
                className="object-cover object-top"
                unoptimized
              />
            ) : rightPlaceholder ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <rightPlaceholder.icon className="size-7 text-emerald-400" />
                </div>
                <p className="text-sm text-slate-400 text-center">{rightPlaceholder.text}</p>
              </div>
            ) : null}
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center font-medium">{rightCaption}</p>
        </div>
      </div>

      {emeraldGlowBottom}
    </div>
  )
}

/* ── Slide 5: Crime Map & Network Intelligence ── */
function Slide5() {
  return (
    <ScreenshotSlide
      title="Crime Map & Network Intelligence"
      subtitle="Geospatial visualization and offender network analysis"
      leftSrc="/demo-home.png"
      leftCaption="Crime Map — District-level heat visualization of Karnataka"
      rightSrc="/demo-network.png"
      rightCaption="Network Intelligence — 230+ repeat offenders linked across crime types"
    />
  )
}

/* ── Slide 6: AI Analysis & Crime Trends ── */
function Slide6() {
  return (
    <ScreenshotSlide
      title="AI Analysis & Crime Trends"
      subtitle="Machine learning-powered insights and temporal pattern recognition"
      leftSrc="/demo-ai.png"
      leftCaption="AI Analysis — Anomaly detection, risk scoring, and automated insights"
      rightSrc="/demo-trends.png"
      rightCaption="Crime Trends — Temporal and spatial crime pattern visualization"
    />
  )
}

/* ── Slide 7: Case Management & Predictive Patrol ── */
function Slide7() {
  return (
    <ScreenshotSlide
      title="Case Management & Predictive Patrol"
      subtitle="End-to-end case tracking and ML-based patrol optimization"
      leftSrc="/demo-cases.png"
      leftCaption="Case Management — Track 500+ FIR cases with full lifecycle management"
      rightSrc="/screenshot-patrol.png"
      rightCaption="Predictive Patrol — Time-slider hotspot forecasting across 31 districts"
    />
  )
}

/* ── Slide 8: Officer Intelligence & Cold Cases ── */
function Slide8() {
  return (
    <ScreenshotSlide
      title="Officer Intelligence & Cold Case Revival"
      subtitle="Performance analytics and AI-powered unsolved case matching"
      leftSrc="/screenshot-officers.png"
      leftCaption="Officer Intelligence — Performance leaderboards across 50 officers, 62 units"
      rightSrc="/screenshot-cold-cases.png"
      rightCaption="Cold Case Revival — AI matching of 174 cold cases with 20 active case connections"
    />
  )
}

/* ── Slide 9: Special Features ── */
function Slide9() {
  const features = [
    {
      icon: Monitor,
      title: 'Command Center Mode',
      desc: 'Press F to enter full-screen situational awareness with live stats across all 31 districts. Auto-rotating views provide real-time operational overview.',
      tag: 'F KEY',
    },
    {
      icon: MessageSquare,
      title: 'AI Chat Bar',
      desc: 'Natural language queries about crimes, suspects, and trends. Ask anything in plain English and get instant data-driven answers from the platform.',
      tag: 'NLP',
    },
    {
      icon: Mic,
      title: 'Voice FIR',
      desc: 'Hands-free FIR filing using speech-to-text technology. Record the incident narrative, auto-extract crime type and district, then review and submit.',
      tag: 'SPEECH',
    },
    {
      icon: Search,
      title: 'Case Cracker',
      desc: 'AI-powered case analysis that suggests linked suspects, area patterns, vehicle links, property matches, and time-based connections for any case.',
      tag: 'AI',
    },
  ]

  return (
    <div className={`${slideBase} flex flex-col`}>
      {gridPattern}
      {emeraldGlow}

      <div className="relative px-12 pt-14 pb-6">
        <p className="text-xs text-emerald-400 tracking-[0.3em] uppercase font-medium mb-2">
          Beyond the Basics
        </p>
        <h2 className="text-3xl font-bold text-white tracking-wide">
          Special <span className={headingAccent}>Features</span>
        </h2>
        <div className="w-16 h-[2px] bg-emerald-500 mt-3" />
        <p className="text-sm text-slate-400 mt-2">
          Innovative capabilities that set CrimeSight AI apart
        </p>
      </div>

      <div className="relative flex-1 px-12 pb-12 grid grid-cols-2 gap-5">
        {features.map((f, i) => (
          <div
            key={i}
            className="flex flex-col p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] relative overflow-hidden"
          >
            {/* Accent corner */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.03] rounded-bl-[60px] pointer-events-none" />

            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <f.icon className="size-5 text-emerald-400" />
              </div>
              <span className="text-[9px] font-bold text-emerald-400/70 tracking-[0.2em] bg-emerald-500/10 px-2 py-0.5 rounded">
                {f.tag}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
            <p className="text-[12px] text-slate-400 leading-relaxed flex-1">{f.desc}</p>
          </div>
        ))}
      </div>

      {emeraldGlowBottom}
    </div>
  )
}

/* ── Slide 10: Data & Impact Metrics ── */
function Slide10() {
  const metrics = [
    { value: '8,353', label: 'Records across 24 tables', sublabel: 'Comprehensive crime database' },
    { value: '500+', label: 'FIR cases tracked', sublabel: 'End-to-end lifecycle' },
    { value: '31', label: 'Districts covered', sublabel: 'All of Karnataka' },
    { value: '230+', label: 'Repeat offenders identified', sublabel: 'Network intelligence' },
    { value: '22', label: 'API endpoints', sublabel: 'RESTful architecture' },
    { value: '8', label: 'Analytical modules', sublabel: 'Integrated platform' },
    { value: '174', label: 'Cold cases analyzed', sublabel: 'AI case matching' },
    { value: '100%', label: 'Responsive design', sublabel: 'Field-ready deployment' },
  ]

  return (
    <div className={`${slideBase} flex flex-col`}>
      {gridPattern}
      {emeraldGlow}

      <div className="relative px-12 pt-14 pb-6">
        <p className="text-xs text-emerald-400 tracking-[0.3em] uppercase font-medium mb-2">
          By the Numbers
        </p>
        <h2 className="text-3xl font-bold text-white tracking-wide">
          Data & <span className={headingAccent}>Impact</span> Metrics
        </h2>
        <div className="w-16 h-[2px] bg-emerald-500 mt-3" />
      </div>

      <div className="relative flex-1 px-12 pb-12">
        <div className="grid grid-cols-4 gap-4 h-full">
          {metrics.map((m, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center"
            >
              <p className="text-3xl font-black text-emerald-400 tabular-nums mb-1">
                {m.value}
              </p>
              <p className="text-[12px] font-semibold text-white mb-0.5">{m.label}</p>
              <p className="text-[10px] text-slate-500">{m.sublabel}</p>
            </div>
          ))}
        </div>
      </div>

      {emeraldGlowBottom}
    </div>
  )
}

/* ── Slide 11: Thank You ── */
function Slide11() {
  return (
    <div className={`${slideBase} flex flex-col items-center justify-center`}>
      {gridPattern}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent pointer-events-none" />

      {/* Shield */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-emerald-500/15 blur-3xl rounded-full scale-200" />
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
          <Shield className="size-10 text-emerald-400" strokeWidth={1.5} />
        </div>
      </div>

      <h1 className="relative text-5xl font-black tracking-[0.15em] text-white mb-4">
        THANK <span className={headingAccent}>YOU</span>
      </h1>
      <div className="relative w-24 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent mb-6" />

      <p className="relative text-lg text-slate-300 tracking-wide text-center max-w-md mb-2">
        CrimeSight AI — Empowering Data-Driven Policing in Karnataka
      </p>
      <p className="relative text-sm text-slate-500 text-center max-w-lg">
        An AI-powered platform transforming crime analytics through intelligent
        visualization, predictive intelligence, and automated case management.
      </p>

      {/* Bottom info */}
      <div className="absolute bottom-12 flex flex-col items-center gap-2">
        <div className="flex items-center gap-4 text-[10px] text-slate-600 tracking-[0.2em] uppercase">
          <span>Karnataka State Police</span>
          <span className="w-1 h-1 rounded-full bg-emerald-500/40" />
          <span>Datathon 2026</span>
          <span className="w-1 h-1 rounded-full bg-emerald-500/40" />
          <span>Team CrimeSight</span>
        </div>
        <p className="text-[9px] text-slate-700 tracking-wider">
          Built with Next.js 16 • TypeScript • PostgreSQL • Tailwind CSS • shadcn/ui
        </p>
      </div>
    </div>
  )
}

/* ── Main Deck Component ── */
export default function PrototypeDeck({ onClose }: PrototypeDeckProps) {
  return (
    <div className="deck-container fixed inset-0 z-[100] bg-[#030712] overflow-y-auto">
      {/* Print-specific styles */}
      <style>{`
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .deck-slide {
            page-break-after: always !important;
            break-after: page !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            position: relative !important;
            display: flex !important;
          }
          .deck-slide:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .no-print {
            display: none !important;
          }
          .deck-container {
            overflow: visible !important;
            position: static !important;
            background: #030712 !important;
          }
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-[#0a0f1a]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <Shield className="size-4 text-emerald-400" />
          <span className="text-sm font-bold tracking-wider text-white">
            CRIME<span className="text-emerald-400">SIGHT</span> AI
          </span>
          <span className="text-[10px] text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded tracking-wider">
            PROTOTYPE DECK
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[10px] text-slate-500 mr-2">
            11 slides • Print to PDF
          </span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wider hover:bg-emerald-500/20 transition-colors"
          >
            <Printer className="size-3.5" />
            SAVE AS PDF
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Slides */}
      <div className="flex flex-col items-center gap-0">
        <Slide1 />
        <Slide2 />
        <Slide3 />
        <Slide4 />
        <Slide5 />
        <Slide6 />
        <Slide7 />
        <Slide8 />
        <Slide9 />
        <Slide10 />
        <Slide11 />
      </div>
    </div>
  )
}