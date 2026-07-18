'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import {
  Shield, X, ChevronRight, Users, MapPin, FileText, Network,
  CheckCircle2, ArrowRight, Eye, Crosshair, Clock,
  Lock, Car, Upload, Archive, Loader2, Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { DEMO_NARRATIVE_ARCS, DEMO_CASES, getArcSuspects, getDemoDistrictName } from '@/lib/demo-data'
import { useCrimeSightStore } from '@/lib/store'

interface IntelligenceBriefingProps { open: boolean; onClose: () => void }
const TOTAL_STEPS = 5
const stepLabels = [
  'Operation Brief',
  'Suspect Network',
  'Threat Assessment',
  'Action Plan',
  'Dispatch & Archive',
]

const sevStyle: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/40',
  high: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  medium: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
}
const sevDot: Record<string, string> = {
  critical: 'bg-red-400', high: 'bg-amber-400', medium: 'bg-yellow-300',
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm ${className}`}>{children}</div>
}

type StepProps = { active: boolean; onClose: () => void }
const ARC = DEMO_NARRATIVE_ARCS[0]
const ARC_CASES = DEMO_CASES.filter(c => (ARC.caseIds as readonly string[]).includes(c.ROWID))
const ARC_SUSPECTS = getArcSuspects(ARC.id)
const ARC_TIMELINE = ['Initiated', 'Under Investigation', 'Active Pursuit']

// ── STEP 1: Operation Overview ──
function StepOverview({ active }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Eye className="size-4 text-emerald-400" />
          <span className="text-[10px] text-emerald-400/80 tracking-[0.25em] uppercase font-medium">
            Step 1 of {TOTAL_STEPS}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px] px-1.5 py-0 font-bold uppercase tracking-widest border">
            <Lock className="size-3 mr-1" /> Classified: RESTRICTED
          </Badge>
          <Badge className={`${ARC.status.includes('CRITICAL') ? sevStyle.critical : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'} text-[10px] px-1.5 py-0 font-bold uppercase tracking-widest border`}>
            {ARC.status}
          </Badge>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-wider leading-tight">
          OPERATION BLACK LOTUS
        </h2>
        <p className="text-xs text-slate-400">
          Lead Officer: <span className="text-white font-medium">{ARC.leadOfficer}</span>
        </p>
      </div>

      <GlassCard className="p-4 border-amber-500/15 bg-amber-500/[0.03]">
        <p className="text-sm text-slate-300 leading-relaxed">
          An inter-district narcotics and arms trafficking network operating between coastal Karnataka and Bengaluru. Six FIRs span three districts. Kingpin{' '}
          <span className="text-red-400 font-semibold">Ravi Shetty</span> remains at large while ₹3.8 crore in suspicious transactions surface through shell companies. This is Operation Black Lotus.
        </p>
      </GlassCard>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'FIRs Linked', value: ARC_CASES.length, icon: FileText },
          { label: 'Suspects', value: ARC_SUSPECTS.length, icon: Users },
          { label: 'Districts', value: ARC.districts.length, icon: MapPin },
        ].map(s => (
          <GlassCard key={s.label} className="p-3 text-center">
            <s.icon className="size-4 text-emerald-400/60 mx-auto mb-1.5" />
            <p className="font-mono text-xl font-bold text-white">{s.value}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Operation Progress</p>
        <div className="flex items-center gap-0">
          {ARC_TIMELINE.map((label, i) => (
            <div key={label} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  i <= 2 ? 'bg-emerald-500 text-white' : 'bg-white/[0.06] text-slate-600'
                }`}>
                  {i < 2 ? <CheckCircle2 className="size-3.5" /> : i + 1}
                </div>
                <span className={`text-[10px] text-center leading-tight ${i <= 2 ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {label}
                </span>
              </div>
              {i < ARC_TIMELINE.length - 1 && (
                <div className={`flex-1 h-[2px] mx-1 -mt-5 ${i < 2 ? 'bg-emerald-500/60' : 'bg-white/[0.06]'}`} />
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

// ── STEP 2: Entity Network ──
function StepEntityNetwork({ active, onClose }: StepProps) {
  const navigateToArcNetwork = useCrimeSightStore(s => s.navigateToArcNetwork)

  // Get unique suspects with their roles derived from case data
  const uniqueSuspects = useMemo(() => {
    const seen = new Map<string, typeof ARC_SUSPECTS[number]>()
    for (const s of ARC_SUSPECTS) {
      if (!seen.has(s.suspect_name)) seen.set(s.suspect_name, s)
    }
    return Array.from(seen.values())
  }, [])

  // Connection lines: co-accused pairs sharing a case
  const connections = useMemo(() => {
    const pairs: { a: string; b: string; fir: string }[] = []
    for (const c of ARC_CASES) {
      const names = ARC_SUSPECTS
        .filter(s => s.case_rowid === c.ROWID)
        .map(s => s.suspect_name)
      for (let i = 0; i < names.length; i++)
        for (let j = i + 1; j < names.length; j++)
          pairs.push({ a: names[i], b: names[j], fir: c.fir_number })
    }
    return pairs
  }, [])

  const arrestBadge = (status: string) => {
    if (status === 'Arrested') return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] px-1.5 py-0 border font-bold">{status}</Badge>
    if (status === 'In Custody') return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px] px-1.5 py-0 border font-bold">{status}</Badge>
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[10px] px-1.5 py-0 border font-bold">{status}</Badge>
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Network className="size-4 text-emerald-400" />
          <span className="text-[10px] text-emerald-400/80 tracking-[0.25em] uppercase font-medium">Step 2 of {TOTAL_STEPS}</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-wide">Entity <span className="text-emerald-400">Network</span></h2>
        <p className="text-sm text-slate-400 mt-1">{uniqueSuspects.length} suspects linked across {ARC_CASES.length} FIRs.</p>
      </div>

      {/* Suspects */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
        {uniqueSuspects.map((suspect, i) => {
          const relatedCase = ARC_CASES.find(c => c.ROWID === suspect.case_rowid)
          return (
            <motion.div
              key={suspect.ROWID}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + i * 0.08 }}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                  <Users className="size-3.5 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-white font-semibold truncate">{suspect.suspect_name}</p>
                    {suspect.is_repeat_offender && (
                      <Badge className="bg-red-500/15 text-red-400 text-[9px] px-1 py-0 border border-red-500/30">REPEAT</Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">{suspect.occupation} — {relatedCase ? getDemoDistrictName(relatedCase.district_rowid) : ''}</p>
                </div>
              </div>
              {arrestBadge(suspect.arrest_status)}
            </motion.div>
          )
        })}
      </div>

      {/* Links */}
      <GlassCard className="p-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Known Connections</p>
        <div className="space-y-1.5">
          {connections.map((conn, i) => (
            <p key={i} className="text-xs text-slate-400 leading-relaxed">
              <span className="text-amber-400">{conn.a}</span> and <span className="text-amber-400">{conn.b}</span>{' '}
              co-accused in <span className="text-emerald-400 font-mono text-[10px]">{conn.fir}</span>
            </p>
          ))}
        </div>
      </GlassCard>

      <button
        onClick={() => { navigateToArcNetwork(ARC.id); onClose() }}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-300 hover:bg-white/[0.06] hover:border-white/[0.15] transition-all group"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Network className="size-4" /> View Full Network Graph
        </span>
        <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  )
}

// ── STEP 3: Intelligence Assessment ──
function StepAssessment({ active }: StepProps) {
  const findings = useMemo(() => [
    {
      severity: 'critical', icon: <MapPin className="size-4 text-red-400" />,
      title: 'Cross-District Operation',
      desc: `Suspects active in ${ARC.districts[0]} and ${ARC.districts[1]}. Narcotics originate from ${ARC.districts[2]} via NH-66 corridor, routed through Mysuru before distribution in Bengaluru.`,
    },
    {
      severity: 'high', icon: <Car className="size-4 text-amber-400" />,
      title: 'Vehicle Link: KA-05-MJ-7821',
      desc: 'White Tata Ace registered to Imtiaz Ahmed connected to FIR/2025/KSP/0147 and FIR/2025/KSP/0148. Vehicle intercepted at Nazarbad check post with 4.62 kg contraband.',
    },
    {
      severity: 'high', icon: <Clock className="size-4 text-amber-400" />,
      title: 'Temporal Pattern: Night Operations',
      desc: 'Incidents cluster between 20:00–02:00 hrs. Arms seizure (FIR/0149) at 03:45, narcotics surveillance at 00:30. Suggests coordinated after-dark logistics chain.',
    },
    {
      severity: 'critical', icon: <Users className="size-4 text-red-400" />,
      title: 'Repeat Offender: Ravi Shetty',
      desc: 'Flagged in 2 prior cases (FIR/0147, FIR/0150). Operates through shell companies — ₹3.8 crore traced through 14 bank accounts. Currently absconding with NBW issued.',
    },
  ], [])

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Zap className="size-4 text-amber-400" />
          <span className="text-[10px] text-amber-400/80 tracking-[0.25em] uppercase font-medium">Step 3 of {TOTAL_STEPS}</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-wide">Intelligence <span className="text-amber-400">Assessment</span></h2>
        <p className="text-sm text-slate-400 mt-1">{findings.length} specific intelligence findings for Operation Black Lotus.</p>
      </div>

      <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
        {findings.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: active ? i * 0.1 : 0 }}
            className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">{f.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Badge className={`${sevStyle[f.severity]} text-[10px] px-1.5 py-0 font-bold uppercase tracking-widest border`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sevDot[f.severity]} mr-1`} />
                    {f.severity}
                  </Badge>
                  <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ── STEP 4: Recommended Actions ──
function StepActions({ active }: StepProps) {
  const [executed, setExecuted] = useState<Set<string>>(new Set())

  const actions = useMemo(() => [
    {
      id: 'apprehend', priority: 'critical' as const, icon: <Crosshair className="size-4 text-red-400" />,
      title: `Apprehend Ravi Shetty — Kingpin`,
      desc: 'Last known: No. 47, 2nd Cross, Padmanabhanagar, Bengaluru. Non-bailable warrant issued. Coordinate with Bengaluru City Police for raid operation.',
    },
    {
      id: 'coordinate', priority: 'high' as const, icon: <MapPin className="size-4 text-amber-400" />,
      title: `Coordinate with Mysuru City CP`,
      desc: 'Joint operation needed for suspect Imtiaz Ahmed, last traced near Bengaluru satellite town. Mysuru SP has partial surveillance footage from Nazarbad PS.',
    },
    {
      id: 'anpr', priority: 'high' as const, icon: <Car className="size-4 text-amber-400" />,
      title: 'ANPR Alert on KA-05-MJ-7821',
      desc: 'White Tata Ace — issue ANPR alert across state borders (Kerala, Goa, Maharashtra). Vehicle used in narcotics transport on Bengaluru-Mysuru corridor.',
    },
    {
      id: 'escalate', priority: 'medium' as const, icon: <Shield className="size-4 text-yellow-300" />,
      title: 'Forward Intelligence Brief to DGP Office',
      desc: '₹3.8 crore financial trail and inter-state arms nexus warrant DGP-level escalation. Recommend constituting SIT under IG-level officer.',
    },
  ], [])

  const handleExecute = (id: string, label: string) => {
    setExecuted(prev => new Set(prev).add(id))
    toast.success(`Action executed: ${label}`, { description: 'Notification sent to relevant units.' })
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Crosshair className="size-4 text-emerald-400" />
          <span className="text-[10px] text-emerald-400/80 tracking-[0.25em] uppercase font-medium">Step 4 of {TOTAL_STEPS}</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-wide">Recommended <span className="text-emerald-400">Actions</span></h2>
        <p className="text-sm text-slate-400 mt-1">Prioritized operational directives for Operation Black Lotus.</p>
      </div>

      <div className="space-y-3">
        {actions.map((action, i) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: active ? i * 0.1 : 0 }}
            className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04]">
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-[10px] text-slate-600">{String(i + 1).padStart(2, '0')}</span>
                  <Badge className={`${sevStyle[action.priority]} text-[10px] px-1.5 py-0 font-bold uppercase tracking-widest border`}>
                    {action.priority}
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold text-white">{action.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">{action.desc}</p>
                <div className="mt-2">
                  {executed.has(action.id) ? (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Executed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleExecute(action.id, action.title)}
                      className="text-[11px] font-medium px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                    >
                      Execute
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ── STEP 5: Export & Disseminate ──
function StepExport({ active }: StepProps) {
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [forwarded, setForwarded] = useState(false)
  const [archived, setArchived] = useState(false)

  const handleGenerate = () => {
    setGenerating(true)
    setGenerated(false)
    setTimeout(() => { setGenerating(false); setGenerated(true) }, 2000)
  }

  const handleForward = () => {
    setForwarded(true)
    toast.success('Intelligence brief forwarded to DGP Office', { description: 'Recipient: Office of the Director General of Police, Karnataka' })
  }

  const handleArchive = () => {
    setArchived(true)
    toast.success('Briefing archived in SCRB Records', { description: 'Classification: RESTRICTED — Operation Black Lotus' })
  }

  const now = new Date()
  const timestamp = `${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span className="text-[10px] text-emerald-400/80 tracking-[0.25em] uppercase font-medium">Step 5 of {TOTAL_STEPS}</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-wide">Export & <span className="text-emerald-400">Disseminate</span></h2>
      </div>

      <GlassCard className="p-5 border-emerald-500/15 bg-emerald-500/[0.03] text-center">
        <FileText className="size-8 text-emerald-400/60 mx-auto mb-2" />
        <p className="text-sm font-semibold text-white">Operation Black Lotus — Intelligence Brief Ready</p>
        <p className="text-[10px] text-slate-500 mt-1">{ARC_CASES.length} FIRs · {ARC_SUSPECTS.length} suspects · {ARC.districts.length} districts</p>
      </GlassCard>

      <div className="space-y-3">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-500/50 transition-all disabled:opacity-60 disabled:cursor-wait"
        >
          {generating ? (
            <><Loader2 className="size-4 animate-spin" /> Generating PDF Briefing...</>
          ) : generated ? (
            <><CheckCircle2 className="size-4" /> Briefing Generated ✓</>
          ) : (
            <><Upload className="size-4" /> Generate PDF Briefing</>
          )}
        </button>

        <button
          onClick={handleForward}
          className={`w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl border transition-all ${
            forwarded
              ? 'bg-amber-500/5 border-amber-500/20 text-amber-400/60'
              : 'bg-transparent border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50'
          }`}
        >
          <ArrowRight className="size-4" />
          {forwarded ? 'Forwarded to DGP Office ✓' : 'Forward to DGP Office'}
        </button>

        <button
          onClick={handleArchive}
          className={`w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl border transition-all ${
            archived
              ? 'bg-slate-500/5 border-slate-500/20 text-slate-400/60'
              : 'bg-transparent border-slate-500/30 text-slate-300 hover:bg-white/[0.04] hover:border-white/[0.15]'
          }`}
        >
          <Archive className="size-4" />
          {archived ? 'Archived in SCRB Records ✓' : 'Archive in SCRB Records'}
        </button>
      </div>

      <p className="text-[10px] text-slate-600 text-center tracking-wider">
        Briefing prepared by CrimeSight AI v2.0 — {timestamp}
      </p>
    </div>
  )
}

// ── MAIN COMPONENT ──
const stepComponents: React.FC<StepProps>[] = [StepOverview, StepEntityNetwork, StepAssessment, StepActions, StepExport]

export default function IntelligenceBriefing({ open, onClose }: IntelligenceBriefingProps) {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [mounted, setMounted] = useState(false)
  const portalRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setMounted(true)
    if (!portalRef.current) {
      portalRef.current = document.createElement('div')
      portalRef.current.id = 'intel-briefing-portal'
      document.body.appendChild(portalRef.current)
    }
    return () => {
      if (portalRef.current?.parentNode) {
        portalRef.current.parentNode.removeChild(portalRef.current)
        portalRef.current = null
      }
    }
  }, [])

  const goNext = useCallback(() => {
    setStep(c => (c < TOTAL_STEPS - 1 ? c + 1 : c))
    setDirection(1)
  }, [])

  const goPrev = useCallback(() => {
    setStep(c => (c > 0 ? c - 1 : c))
    setDirection(-1)
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, goNext, goPrev, onClose])

  if (!open) return null

  const StepComponent = stepComponents[step]
  const isLast = step === TOTAL_STEPS - 1
  const isFirst = step === 0

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        key={`briefing-step-${step}`}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-2xl mx-auto bg-[#0a0f1a] rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/50 overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent z-10" />
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />

        {/* Header */}
        <div className="relative px-6 pt-5 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-emerald-400" />
              <span className="text-[10px] text-slate-500 tracking-[0.2em] uppercase font-semibold">Intelligence Briefing</span>
            </div>
            <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20 transition-colors" aria-label="Close briefing">
              <X className="size-4" />
            </button>
          </div>

          {/* Steps */}
          <div className="flex items-center gap-2 mb-1">
            {stepLabels.map((label, i) => (
              <button
                key={label}
                onClick={() => { setDirection(i > step ? 1 : -1); setStep(i) }}
                className="flex items-center gap-1.5 group"
                aria-label={`Go to step ${i + 1}: ${label}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                  i === step ? 'bg-emerald-500 text-white scale-110' : i < step ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.06] text-slate-600 group-hover:bg-white/[0.1]'
                }`}>
                  {i < step ? <CheckCircle2 className="size-3" /> : i + 1}
                </div>
                <span className={`text-[10px] hidden sm:inline transition-colors ${i === step ? 'text-emerald-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Progress */}
          <div className="h-[1px] bg-white/[0.06]">
            <motion.div className="h-full bg-emerald-500" initial={false} animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>

        {/* Body */}
        <div className="relative px-6 py-6 min-h-[400px] max-h-[70vh] overflow-y-auto custom-scrollbar">
          <motion.div key={step} initial={{ opacity: 0, x: direction * 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
            <StepComponent active={true} onClose={onClose} />
          </motion.div>
        </div>

        {/* Nav */}
        <div className="relative px-6 pb-5 pt-2 border-t border-white/[0.04]">
          <div className="flex items-center justify-between">
            <button onClick={goPrev} disabled={isFirst} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-20 disabled:cursor-not-allowed">
              <ChevronRight className="size-4 rotate-180" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <span className="text-[10px] text-slate-600 tracking-wider">{stepLabels[step]}</span>
            <button onClick={goNext} disabled={isLast} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-colors disabled:opacity-20 disabled:cursor-not-allowed">
              <span className="hidden sm:inline">{isLast ? 'Done' : 'Next'}</span>
              {!isLast && <ChevronRight className="size-4" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )

  return mounted && portalRef.current ? createPortal(modal, portalRef.current) : null
}