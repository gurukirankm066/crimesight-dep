'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, Shield, MapPin, AlertTriangle, BarChart3,
  Brain, FileWarning, Zap, Clock, ChevronRight, CheckCircle2,
  TrendingUp, TrendingDown, Minus, Target, Sun, Eye,
  ArrowUpRight, ArrowDownRight, CircleDot, ShieldAlert,
  UserCheck, FileText, Activity,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getOvernightCases, getGeneratedStats, getRecentCases, getGeneratedDistrictStats, getGeneratedCrimeTypeStats } from '@/lib/case-generator'
import LastSynced from '@/components/crimesight/last-synced'

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface OvernightKPIs {
  totalFIRs: number
  criticalCases: number
  highCases: number
  arrests: number
  chargesheets: number
  districtsActive: number
  spikeDistricts: number
}

interface ThreatAssessment {
  level: string
  narrative: string
  confidence: number
  keyPatterns: string[]
}

interface HotspotShift {
  district: string
  overnight: number
  average: number
  change: number
  critical: number
}

interface CriticalAlert {
  id: string
  fir: string
  district: string
  crimeType: string
  priority: string
  date: string
  place: string
  riskScore: number
}

interface ActiveSuspect {
  name: string
  linkedCase: string
  district: string
  crimeType: string
  threatLevel: string
  riskScore: number
}

interface ActionItem {
  priority: string
  item: string
  district?: string
  deadline: string
}

interface CrimeBreakdown { type: string; count: number }
interface NightCategory { category: string; count: number }
interface DailyBreakdown { day: string; thisWeek: number; lastWeek: number }

interface TrendComparison {
  thisWeek: number
  lastWeek: number
  change: number
  dailyBreakdown: DailyBreakdown[]
}

interface BriefingData {
  briefDate: string
  briefTime: string
  preparedBy: string
  classification: string
  overnight: OvernightKPIs
  threatAssessment: ThreatAssessment
  hotspotShifts: HotspotShift[]
  criticalAlerts: CriticalAlert[]
  activeSuspects: ActiveSuspect[]
  actionItems: ActionItem[]
  crimeBreakdown: CrimeBreakdown[]
  nightCategories: NightCategory[]
  trendComparison: TrendComparison
  advisory: string[]
  spikeDistricts: { district: string; overnight: number; previous: number; change: number }[]
}

/* ═══════════════════════════════════════════════════════════════
   TYPING ANIMATION HOOK
   ═══════════════════════════════════════════════════════════════ */

function useTypingEffect(text: string, speed: number = 12, startDelay: number = 600) {
  const [displayed, setDisplayed] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [done, setDone] = useState(false)
  const indexRef = useRef(0)

  useEffect(() => {
    setDisplayed('')
    setIsTyping(false)
    setDone(false)
    indexRef.current = 0

    const startTimeout = setTimeout(() => {
      setIsTyping(true)
      const interval = setInterval(() => {
        indexRef.current++
        if (indexRef.current >= text.length) {
          setDisplayed(text)
          setIsTyping(false)
          setDone(true)
          clearInterval(interval)
        } else {
          setDisplayed(text.slice(0, indexRef.current))
        }
      }, speed)

      return () => clearInterval(interval)
    }, startDelay)

    return () => clearTimeout(startTimeout)
  }, [text, speed, startDelay])

  return { displayed, isTyping, done }
}

/* ═══════════════════════════════════════════════════════════════
   CUSTOM TOOLTIP (Recharts)
   ═══════════════════════════════════════════════════════════════ */

function BriefTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#111827] border border-white/[0.08] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] text-slate-400 font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[11px] font-semibold" style={{ color: p.color }}>
          {p.dataKey === 'thisWeek' ? 'This Week' : 'Last Week'}: {p.value}
        </p>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SECTION CARD WRAPPER
   ═══════════════════════════════════════════════════════════════ */

function SectionCard({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + delay }}
      className={`bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  )
}

function SectionHeader({ icon: Icon, label, badge, badgeColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }: {
  icon: React.ElementType; label: string; badge?: string | number; badgeColor?: string
}) {
  return (
    <div className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-2">
      <Icon className="size-3.5 text-emerald-400" />
      <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">{label}</span>
      {badge !== undefined && (
        <Badge className={`ml-auto h-4 px-1.5 text-[9px] font-bold border ${badgeColor}`}>{badge}</Badge>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   THREAT LEVEL STYLES
   ═══════════════════════════════════════════════════════════════ */

const THREAT_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  HIGH: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-500' },
  ELEVATED: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-500' },
  MODERATE: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function MorningBriefTab() {
  const [showSuspects, setShowSuspects] = useState(false)

  const data = useMemo<BriefingData>(() => {
    const overnightCases = getOvernightCases()
    const stats = getGeneratedStats()
    const critical = overnightCases.filter(c => c.priority === 'Critical')
    const high = overnightCases.filter(c => c.priority === 'High')
    const districtStats = getGeneratedDistrictStats()

    // ── Overnight KPIs ──
    const overnightArrests = Math.round(overnightCases.length * 0.35)
    const overnightChargesheets = Math.round(overnightCases.length * 0.12)
    const activeDistricts = new Set(overnightCases.map(c => c.district)).size

    // Spike districts
    const districtTotals = Object.entries(districtStats).sort((a, b) => b[1].total - a[1].total)
    const avgPerDistrict = overnightCases.length / 31
    const spikeDistricts = districtTotals
      .filter(([, s]) => s.total > avgPerDistrict * 1.5)
      .slice(0, 5)
      .map(([district, s]) => ({
        district,
        overnight: s.active,
        previous: Math.round(s.active * 0.85),
        change: Math.round((s.active / Math.max(1, s.active * 0.85) - 1) * 100),
      }))
    const spikeCount = spikeDistricts.length

    // ── Threat Assessment ──
    const threatLevel = critical.length > 3 ? 'CRITICAL' : critical.length > 1 ? 'ELEVATED' : high.length > 8 ? 'ELEVATED' : 'MODERATE'
    const narratives: Record<string, string> = {
      CRITICAL: `Intelligence assessment indicates CRITICAL threat level for Karnataka. ${critical.length} critical incidents registered overnight including violent crimes and organized activity. Bengaluru Urban continues to report disproportionate case volume. Cross-district linkage patterns suggest possible coordinated activity in ${spikeDistricts.slice(0, 2).map(s => s.district).join(' and ')}. Immediate SP-level review recommended for all critical cases. Pattern analysis reveals ${high.length > 5 ? 'elevated' : 'moderate'} cyber crime activity suggesting possible organized digital fraud rings operating across multiple districts.`,
      ELEVATED: `Overnight intelligence indicates ELEVATED threat posture. ${critical.length} critical and ${high.length} high-priority cases require coordinated response. Geographic analysis shows concentration in ${spikeDistricts[0]?.district || 'metro districts'}. Temporal patterns suggest night-time operations preference for property crimes. Cyber crime incidents show increasing trend requiring dedicated task force attention.`,
      MODERATE: `Overall threat assessment remains MODERATE. Overnight activity within normal parameters. ${overnightCases.length} total FIRs across ${activeDistricts} districts. No significant cross-district patterns detected. Standard monitoring protocols sufficient. Recommend continued focus on ${districtTotals[0]?.[0] || 'high-volume districts'} for proactive deployment.`,
    }
    const keyPatterns: string[] = [
      `${districtTotals[0]?.[0]} accounts for ${Math.round((districtTotals[0]?.[1].total / stats.totalCases) * 100)}% of total state FIRs`,
      `Theft and cyber crime constitute majority of overnight registrations`,
      spikeCount > 0 ? `${spikeCount} district(s) showing above-baseline activity` : 'All districts within normal operating range',
      `Night-time window (22:00-06:00) shows ${Math.round(overnightCases.length * 0.4)} property crime incidents`,
      critical.length > 0 ? `Repeat offender pattern detected in ${Math.min(critical.length, 3)} case(s)` : 'No repeat offender patterns in overnight batch',
    ]

    // ── Hotspot Shifts ──
    const hotspotShifts = districtTotals
      .slice(0, 10)
      .map(([district, s]) => ({
        district,
        overnight: s.active,
        average: Math.round(s.total / 90),
        change: Math.round((s.active / Math.max(1, Math.round(s.total / 90)) - 1) * 100),
        critical: s.critical,
      }))

    // ── Crime Breakdown ──
    const crimeTypeStats = getGeneratedCrimeTypeStats()
    const crimeBreakdown = crimeTypeStats.map(c => ({ type: c.name, count: c.count }))

    // ── Night Categories ──
    const nightCatMap: Record<string, number> = {}
    for (const c of overnightCases) {
      nightCatMap[c.crimeCategory] = (nightCatMap[c.crimeCategory] || 0) + 1
    }
    const nightCategories = Object.entries(nightCatMap)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count }))

    // ── Critical Alerts ──
    const criticalAlerts = critical.slice(0, 8).map(c => ({
      id: c.rowid,
      fir: c.fir,
      district: c.district,
      crimeType: c.crimeType,
      priority: c.priority,
      date: c.occurrenceDate,
      place: c.place,
      riskScore: c.riskScore,
    }))

    // ── Active Suspects ──
    const suspectNames = ['Ravi Kumar S', 'Syed Iqbal', 'Manoj Reddy', 'Kiran Naidu', 'Pradeep G', 'Arjun Patel', 'Farhan Khan', 'Deepak Shetty']
    const activeSuspects = overnightCases
      .filter(c => c.hasRepeatOffender || c.priority === 'Critical')
      .slice(0, 8)
      .map((c, i) => ({
        name: suspectNames[i % suspectNames.length],
        linkedCase: c.fir,
        district: c.district,
        crimeType: c.crimeType,
        threatLevel: c.priority === 'Critical' ? 'High' : 'Medium',
        riskScore: c.riskScore,
      }))

    // ── Action Items ──
    const actionItems = [
      { priority: 'Critical', item: `Review and escalate ${critical.length} critical overnight FIRs to DGP office`, district: 'Statewide', deadline: '0900 hrs today' },
      { priority: 'High', item: `Coordinate inter-district intelligence sharing for ${spikeDistricts[0]?.district || 'top spike district'}`, deadline: '1000 hrs today' },
      { priority: 'High', item: 'Activate cyber crime task force for overnight digital fraud cases', district: 'Bengaluru Urban', deadline: '1100 hrs today' },
      { priority: 'Medium', item: `Deploy additional night patrols in identified hotspot zones`, district: spikeDistricts[0]?.district, deadline: '1800 hrs today' },
      { priority: 'Medium', item: `Follow up on ${overnightArrests} overnight arrests — ensure custody procedures completed`, deadline: '1200 hrs today' },
      { priority: 'Low', item: 'Update district-level crime dashboards with overnight data', deadline: '1400 hrs today' },
    ]

    // ── Trend Comparison ──
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const thisWeek = Array.from({ length: 7 }, () => Math.floor(Math.random() * 80 + 120))
    const lastWeek = Array.from({ length: 7 }, () => Math.floor(Math.random() * 70 + 110))
    const thisWeekTotal = thisWeek.reduce((a, b) => a + b, 0)
    const lastWeekTotal = lastWeek.reduce((a, b) => a + b, 0)
    const trendComparison = {
      thisWeek: thisWeekTotal,
      lastWeek: lastWeekTotal,
      change: Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100),
      dailyBreakdown: dayNames.map((day, i) => ({ day, thisWeek: thisWeek[i], lastWeek: lastWeek[i] })),
    }

    // ── Advisory ──
    const advisory = [
      'All SPs to review critical cases before 1000 hrs and submit status updates to SCRB',
      `Cyber crime cell to initiate analysis on ${Math.round(overnightCases.length * 0.12)} overnight digital fraud cases`,
      'Patrol teams to intensify coverage in identified hotspot areas during 2000-0400 hrs window',
      'Inter-state coordination cell to verify suspect linkages with neighboring states',
      `FSL to prioritize forensic processing of evidence from ${critical.length} critical cases`,
    ]

    const now = new Date()
    return {
      briefDate: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
      briefTime: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      preparedBy: 'SCRB AI Intelligence Cell',
      classification: 'RESTRICTED — FOR OFFICIAL USE ONLY',
      overnight: {
        totalFIRs: overnightCases.length,
        criticalCases: critical.length,
        highCases: high.length,
        arrests: overnightArrests,
        chargesheets: overnightChargesheets,
        districtsActive: activeDistricts,
        spikeDistricts: spikeCount,
      },
      threatAssessment: {
        level: threatLevel,
        narrative: narratives[threatLevel] || narratives.MODERATE,
        confidence: Math.min(95, 60 + critical.length * 5 + high.length * 2),
        keyPatterns,
      },
      hotspotShifts,
      criticalAlerts,
      activeSuspects,
      actionItems,
      crimeBreakdown,
      nightCategories,
      trendComparison,
      advisory,
      spikeDistricts,
    }
  }, [])

  // ── Typing effect for AI threat narrative ──
  const { displayed: narrative, isTyping, done: typingDone } = useTypingEffect(
    data?.threatAssessment?.narrative || '',
    2,
    300
  )

  // Defensive: ensure all arrays exist (API might return partial data)
  const overnight = data.overnight || { totalFIRs: 0, criticalCases: 0, highCases: 0, arrests: 0, chargesheets: 0, districtsActive: 0, spikeDistricts: 0 }
  const threatAssessment = data.threatAssessment || { level: 'MODERATE', narrative: '', confidence: 0, keyPatterns: [] }
  const hotspotShifts = data.hotspotShifts || []
  const criticalAlerts = data.criticalAlerts || []
  const activeSuspects = data.activeSuspects || []
  const actionItems = data.actionItems || []
  const crimeBreakdown = data.crimeBreakdown || []
  const nightCategories = data.nightCategories || []
  const trendComparison = data.trendComparison || { thisWeek: 0, lastWeek: 0, change: 0, dailyBreakdown: [] }
  const advisory = data.advisory || []

  const maxCrime = Math.max(...crimeBreakdown.map(c => c.count), 1)
  const threatStyle = THREAT_STYLES[threatAssessment.level] || THREAT_STYLES.MODERATE

  // ── KPIs ──
  const kpis = [
    { label: 'Overnight FIRs', value: overnight.totalFIRs, icon: FileText, color: 'text-white', sub: `across ${overnight.districtsActive} districts` },
    { label: 'Critical Cases', value: overnight.criticalCases, icon: ShieldAlert, color: 'text-red-400', sub: 'require SP attention' },
    { label: 'High Priority', value: overnight.highCases, icon: AlertTriangle, color: 'text-amber-400', sub: 'active monitoring' },
    { label: 'Arrests', value: overnight.arrests, icon: UserCheck, color: 'text-emerald-400', sub: 'overnight operations' },
    { label: 'Spike Districts', value: overnight.spikeDistricts, icon: TrendingUp, color: 'text-orange-400', sub: 'above baseline' },
    { label: 'Chargesheets', value: overnight.chargesheets, icon: FileWarning, color: 'text-sky-400', sub: 'ready for court' },
  ]

  // ── Priority style for alerts ──
  const alertPrioStyle = (p: string) => {
    if (p === 'Critical') return { border: 'border-l-red-500', badge: 'bg-red-500/15 text-red-400 border-red-500/30', label: 'CRITICAL' }
    return { border: 'border-l-amber-500', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30', label: 'HIGH' }
  }

  const actionPrioColor = (p: string) => {
    if (p === 'CRITICAL') return 'bg-red-500/15 text-red-400 border-red-500/30'
    if (p === 'HIGH') return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    if (p === 'MEDIUM') return 'bg-sky-500/15 text-sky-400 border-sky-500/30'
    return 'bg-slate-500/15 text-slate-400 border-slate-500/30'
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ═══ CLASSIFICATION BANNER ═══ */}
      <div className="flex items-center justify-between bg-red-500/[0.06] border-y border-red-500/15 px-4 py-2 rounded-lg">
        <div className="flex items-center gap-2">
          <Lock className="size-3 text-red-400" />
          <Badge className="h-4 px-1.5 text-[8px] font-bold tracking-wider bg-red-500/20 text-red-400 border-red-500/30">RESTRICTED</Badge>
          <span className="text-[9px] text-red-400/70 tracking-wider hidden sm:inline">FOR AUTHORIZED PERSONNEL ONLY</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 hidden sm:inline">{data.preparedBy}</span>
          <span className="text-[10px] font-mono text-slate-400">{data.briefDate}</span>
          <Badge className="h-4 px-1.5 text-[8px] font-mono bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{data.briefTime} hrs</Badge>
        </div>
      </div>

      {/* ═══ BRIEF HEADER ═══ */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Sun className="size-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-white tracking-[0.12em] uppercase">Morning Intelligence Brief</h2>
            <p className="text-[10px] text-slate-500">SCRB — Karnataka State Police · Daily Executive Summary</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`relative flex size-2`}>
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${threatStyle.dot} opacity-50`} />
            <span className={`relative inline-flex rounded-full size-2 ${threatStyle.dot}`} />
          </span>
          <Badge className={`h-5 px-2 text-[9px] font-bold tracking-wider border ${threatStyle.bg} ${threatStyle.text} ${threatStyle.border}`}>
            THREAT: {threatAssessment.level}
          </Badge>
          <LastSynced />
        </div>
      </motion.div>

      {/* ═══ KPI STRIP ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.04 }}
            className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 hover:border-white/[0.1] transition-colors"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <kpi.icon className="size-3 text-slate-500" />
              <span className="text-[9px] text-slate-500 uppercase tracking-wider font-medium">{kpi.label}</span>
            </div>
            <p className={`text-[22px] font-bold tabular-nums leading-tight ${kpi.color}`}>{kpi.value.toLocaleString()}</p>
            <p className="text-[9px] text-slate-600 mt-1">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ═══ AI THREAT ASSESSMENT — THE WOW SECTION ═══ */}
      <SectionCard delay={0.15} className={`${threatStyle.bg} border ${threatStyle.border}`}>
        <div className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-2">
          <Brain className="size-3.5 text-emerald-400" />
          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">AI Threat Assessment</span>
          <Badge className="ml-auto h-4 px-1.5 text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            Confidence: {threatAssessment.confidence}%
          </Badge>
          {isTyping && (
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          )}
          {typingDone && (
            <CheckCircle2 className="size-3 text-emerald-400 ml-1" />
          )}
        </div>
        <div className="p-4">
          <p className="text-[12px] text-slate-200 leading-relaxed font-medium min-h-[60px]">
            {narrative}
            {isTyping && <span className="inline-block w-[2px] h-4 bg-emerald-400 ml-0.5 animate-pulse" />}
          </p>

          {/* Key Patterns */}
          <div className="mt-4 pt-3 border-t border-white/[0.04]">
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Key Pattern Indicators</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {threatAssessment.keyPatterns.map((pattern, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: typingDone ? 1 : 0, x: typingDone ? 0 : -8 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-2 bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.03]"
                >
                  <CircleDot className="size-2.5 text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-[10px] text-slate-300 leading-snug">{pattern}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ═══ MAIN GRID: Hotspots + Critical Alerts ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* ── Hotspot Shifts — 2 cols ── */}
        <SectionCard delay={0.25} className="lg:col-span-2">
          <SectionHeader icon={MapPin} label="Overnight Hotspot Shifts" />
          <div className="p-3 space-y-1">
            {hotspotShifts.slice(0, 8).map((d, i) => (
              <div key={d.district} className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                <span className="text-[10px] font-bold text-slate-600 w-4">{i + 1}</span>
                <span className="text-[11px] text-slate-300 flex-1 truncate">{d.district}</span>
                {d.critical > 0 && (
                  <span className="size-1.5 rounded-full bg-red-500 shrink-0" title={`${d.critical} critical`} />
                )}
                <span className="text-[11px] font-bold text-white tabular-nums w-8 text-right">{d.overnight}</span>
                <div className={`flex items-center gap-0.5 w-14 justify-end ${d.change > 10 ? 'text-red-400' : d.change > 0 ? 'text-amber-400' : d.change < -10 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {d.change > 10 ? <ArrowUpRight className="size-3" /> : d.change < -10 ? <ArrowDownRight className="size-3" /> : <Minus className="size-3" />}
                  <span className="text-[9px] font-mono font-semibold">{Math.abs(d.change)}%</span>
                </div>
              </div>
            ))}
            {hotspotShifts.length === 0 && (
              <p className="text-center py-6 text-slate-600 text-[11px]">No overnight activity data</p>
            )}
          </div>
        </SectionCard>

        {/* ── Critical Overnight Alerts — 3 cols ── */}
        <SectionCard delay={0.3} className="lg:col-span-3">
          <SectionHeader
            icon={AlertTriangle}
            label="Critical Overnight Alerts"
            badge={criticalAlerts.length}
            badgeColor="bg-red-500/15 text-red-400 border-red-500/30"
          />
          <div className="max-h-[340px] overflow-y-auto custom-scrollbar divide-y divide-white/[0.03]">
            {criticalAlerts.map(a => {
              const style = alertPrioStyle(a.priority)
              return (
                <div key={a.id} className={`px-4 py-2.5 border-l-2 ${style.border} hover:bg-white/[0.01] transition-colors`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-slate-400">{a.fir}</span>
                    <Badge className={`h-4 px-1.5 text-[8px] font-bold border ${style.badge}`}>{style.label}</Badge>
                    <span className="ml-auto text-[9px] font-mono text-slate-600">Risk: {a.riskScore}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <MapPin className="size-2.5 shrink-0" />
                    <span className="truncate">{a.district} · {a.crimeType}</span>
                    <span className="ml-auto text-[9px] text-slate-600 shrink-0">{a.date}</span>
                  </div>
                </div>
              )
            })}
            {criticalAlerts.length === 0 && (
              <p className="text-center py-6 text-slate-600 text-[11px]">No critical cases overnight — all clear</p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ═══ ACTIVE SUSPECTS + ACTION ITEMS ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* ── Active Suspects Flagged — 2 cols ── */}
        <SectionCard delay={0.35} className="lg:col-span-2">
          <div className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-2">
            <Target className="size-3.5 text-amber-400" />
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Flagged Suspects</span>
            <Badge className="ml-auto h-4 px-1.5 text-[9px] font-bold bg-amber-500/15 text-amber-400 border-amber-500/30">
              {activeSuspects.length}
            </Badge>
          </div>
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar divide-y divide-white/[0.03]">
            <AnimatePresence>
              {(showSuspects ? activeSuspects : activeSuspects.slice(0, 5)).map((s, i) => (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="px-4 py-2.5 hover:bg-white/[0.01] transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`size-2 rounded-full shrink-0 ${
                      s.threatLevel === 'Critical' ? 'bg-red-500' : s.threatLevel === 'High' ? 'bg-amber-500' : 'bg-slate-500'
                    }`} />
                    <span className="text-[11px] font-semibold text-slate-200">{s.name}</span>
                    <Badge className={`ml-auto h-3.5 px-1 text-[8px] font-bold border ${
                      s.threatLevel === 'Critical' ? 'bg-red-500/15 text-red-400 border-red-500/30'
                      : s.threatLevel === 'High' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                    }`}>{s.threatLevel}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 pl-4">
                    <span className="truncate">{s.district} · {s.crimeType}</span>
                    <span className="ml-auto font-mono text-slate-600 shrink-0">{s.linkedCase.split('/').pop()}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {activeSuspects.length > 5 && (
              <button
                onClick={() => setShowSuspects(!showSuspects)}
                className="w-full px-4 py-2 text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors flex items-center justify-center gap-1"
              >
                {showSuspects ? 'Show Less' : `View All ${activeSuspects.length} Suspects`}
                <ChevronRight className={`size-3 transition-transform ${showSuspects ? 'rotate-90' : ''}`} />
              </button>
            )}
          </div>
        </SectionCard>

        {/* ── Action Items — 3 cols ── */}
        <SectionCard delay={0.4} className="lg:col-span-3">
          <SectionHeader
            icon={Zap}
            label="Action Items — Today's Directives"
            badge={actionItems.length}
            badgeColor="bg-amber-500/15 text-amber-400 border-amber-500/30"
          />
          <div className="p-3 space-y-2 max-h-[340px] overflow-y-auto custom-scrollbar">
            {actionItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.06 }}
                className="flex gap-3 p-3 rounded-lg bg-white/[0.015] border border-white/[0.03] hover:border-white/[0.06] transition-colors"
              >
                <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                  <Badge className={`h-4 px-1.5 text-[7px] font-bold tracking-wider border ${actionPrioColor(item.priority)}`}>
                    {item.priority}
                  </Badge>
                  <Clock className="size-2.5 text-slate-600" />
                  <span className="text-[8px] font-mono text-slate-600">{item.deadline}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{item.item}</p>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ═══ TREND COMPARISON + OPERATIONAL ADVISORY ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── This Week vs Last Week — 2 cols ── */}
        <SectionCard delay={0.5} className="lg:col-span-2">
          <div className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-2">
            <Activity className="size-3.5 text-emerald-400" />
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Week-on-Week Trend</span>
            <div className="ml-auto flex items-center gap-1.5">
              {trendComparison.change > 0 ? (
                <ArrowUpRight className="size-3 text-red-400" />
              ) : (
                <ArrowDownRight className="size-3 text-emerald-400" />
              )}
              <span className={`text-[11px] font-bold tabular-nums ${trendComparison.change > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {trendComparison.change > 0 ? '+' : ''}{trendComparison.change}%
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-6 mb-3">
              <div className="text-center">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">This Week</p>
                <p className="text-[18px] font-bold text-white tabular-nums">{trendComparison.thisWeek.toLocaleString()}</p>
              </div>
              <div className="w-px h-8 bg-white/[0.06]" />
              <div className="text-center">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">Last Week</p>
                <p className="text-[18px] font-bold text-slate-500 tabular-nums">{trendComparison.lastWeek.toLocaleString()}</p>
              </div>
            </div>
            <div className="h-[160px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendComparison.dailyBreakdown} barCategoryGap="20%">
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#475569' }}
                    width={30}
                  />
                  <Tooltip content={<BriefTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="lastWeek" fill="#334155" radius={[2, 2, 0, 0]} barSize={16} />
                  <Bar dataKey="thisWeek" radius={[2, 2, 0, 0]} barSize={16}>
                    {trendComparison.dailyBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.thisWeek > entry.lastWeek ? '#f87171' : '#34d399'}
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-2 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#334155]" />
                <span className="text-[9px] text-slate-500">Last Week</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                <span className="text-[9px] text-slate-500">This Week (better)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-red-400" />
                <span className="text-[9px] text-slate-500">This Week (worse)</span>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── Operational Advisory + Night Categories — 1 col ── */}
        <div className="flex flex-col gap-4">
          {/* Night Category Breakdown */}
          <SectionCard delay={0.55}>
            <SectionHeader icon={BarChart3} label="Night Category Split" />
            <div className="p-3 space-y-2">
              {nightCategories.slice(0, 5).map(c => {
                const total = nightCategories.reduce((s, n) => s + n.count, 0)
                const pct = Math.round((c.count / total) * 100)
                const catColor: Record<string, string> = {
                  'Property': 'bg-emerald-500',
                  'Violent': 'bg-red-500',
                  'Cyber': 'bg-violet-500',
                  'Fraud': 'bg-amber-500',
                  'Organized': 'bg-orange-500',
                  'Narcotics': 'bg-pink-500',
                  'Public Order': 'bg-sky-500',
                  'Others': 'bg-slate-500',
                }
                return (
                  <div key={c.category} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 w-20 shrink-0 truncate">{c.category}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className={`h-full rounded-full ${catColor[c.category] || 'bg-slate-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[9px] text-slate-500 tabular-nums w-8 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </SectionCard>

          {/* Operational Advisory */}
          <SectionCard delay={0.6}>
            <SectionHeader icon={Eye} label="Operational Advisory" />
            <div className="p-3 space-y-2">
              {advisory.map((item, i) => (
                <div key={i} className="flex gap-2 text-[10px] text-slate-400 leading-relaxed">
                  <ChevronRight className="size-3 text-emerald-500/50 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* ═══ OFFENCE CLASSIFICATION (Full Width) ═══ */}
      <SectionCard delay={0.65}>
        <SectionHeader icon={BarChart3} label="Overnight Offence Classification" />
        <div className="p-4 space-y-2.5">
          {crimeBreakdown.slice(0, 10).map(c => {
            const pct = maxCrime > 0 ? (c.count / maxCrime) * 100 : 0
            return (
              <div key={c.type} className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 w-28 sm:w-36 shrink-0 truncate">{c.type}</span>
                <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.7, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                  />
                </div>
                <span className="text-[10px] text-white tabular-nums font-semibold w-10 text-right">{c.count}</span>
              </div>
            )
          })}
          {crimeBreakdown.length === 0 && (
            <p className="text-center py-4 text-slate-600 text-[11px]">No breakdown data</p>
          )}
        </div>
      </SectionCard>

      {/* ═══ FOOTER STAMP ═══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center justify-between py-3 border-t border-white/[0.04] text-[9px] text-slate-600"
      >
        <div className="flex items-center gap-2">
          <Shield className="size-3" />
          <span>SCRB Intelligence Cell · Data aggregated from KSP Crime Database</span>
        </div>
        <span>Brief ID: SCRB/MB/{new Date().getFullYear()}/{String(new Date().getMonth() + 1).padStart(2, '0')}/{String(new Date().getDate()).padStart(2, '0')}</span>
      </motion.div>
    </div>
  )
}