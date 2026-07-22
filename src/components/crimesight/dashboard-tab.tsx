'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  TrendingUp,
  Shield,
  Users,
  MapPin,
  Activity,
  Brain,
  Sun,
  Crosshair,
  Network,
  FileText,
  Cloud,
  Database,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCrimeSightStore } from '@/lib/store'
import { DEMO_DISTRICTS as ALL_DISTRICTS, DEMO_NARRATIVE_ARCS } from '@/lib/demo-data'
import { getGeneratedStats, getRecentCases, getGeneratedPriorityStats, getGeneratedStatusPipeline, getSPScorecard, getGeneratedDistrictStats } from '@/lib/case-generator'
import LastSynced from '@/components/crimesight/last-synced'
import { KSP_TOTAL_CASES } from '@/lib/ksp-data'

// Types

interface KpiData {
  label: string
  value: number
  delta: number // percentage change, e.g. +12.5 or -3.2
}

interface AlertItem {
  id: string
  fir: string
  crimeType: string
  district: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  date: string
}

interface DistrictRow {
  name: string
  cases: number
}

interface DashboardResponse {
  stats: {
    totalCases: number
    activeInvestigations: number
    arrests: number
    chargesheets: number
    districts: number
    officers: number
  }
  alerts: AlertItem[]
  recentCases: AlertItem[]
  hasRepeatAlerts: boolean
}

// Constants & Helpers

const PRIORITY_STYLES: Record<string, string> = {
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  High: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Low: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

const PRIORITY_DOT: Record<string, string> = {
  Critical: 'bg-red-500',
  High: 'bg-amber-500',
  Medium: 'bg-yellow-500',
  Low: 'bg-slate-500',
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '—'
  const then = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - then.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function formatDelta(delta: number): { text: string; className: string } {
  const sign = delta >= 0 ? '+' : ''
  const positive = delta >= 0
  return {
    text: `${sign}${delta.toFixed(1)}%`,
    className: positive
      ? 'text-emerald-400 bg-emerald-500/10'
      : 'text-red-400 bg-red-500/10',
  }
}

// Demo fallback data

const DEMO_DATA: DashboardResponse = {
  stats: {
    totalCases: 12847,
    activeInvestigations: 3256,
    arrests: 4891,
    chargesheets: 2934,
    districts: 31,
    officers: 142,
  },
  alerts: [
    { id: '1', fir: 'FIR/2025/BLR/02341', crimeType: 'Robbery', district: 'Bengaluru Urban', priority: 'Critical', date: '2025-07-08' },
    { id: '2', fir: 'FIR/2025/MYS/00892', crimeType: 'Murder', district: 'Mysuru', priority: 'Critical', date: '2025-07-08' },
    { id: '3', fir: 'FIR/2025/BLR/02338', crimeType: 'Cyber Crime', district: 'Bengaluru Urban', priority: 'High', date: '2025-07-07' },
    { id: '4', fir: 'FIR/2025/Hub/01456', crimeType: 'Dacoity', district: 'Hubballi-Dharwad', priority: 'High', date: '2025-07-07' },
    { id: '5', fir: 'FIR/2025/MNG/00923', crimeType: 'Narcotics', district: 'Mangaluru', priority: 'High', date: '2025-07-07' },
    { id: '6', fir: 'FIR/2025/BLR/02335', crimeType: 'Kidnapping', district: 'Bengaluru Rural', priority: 'Medium', date: '2025-07-06' },
    { id: '7', fir: 'FIR/2025/BLR/02330', crimeType: 'Extortion', district: 'Bengaluru Urban', priority: 'Medium', date: '2025-07-06' },
    { id: '8', fir: 'FIR/2025/SHM/00567', crimeType: 'Human Trafficking', district: 'Shivamogga', priority: 'High', date: '2025-07-06' },
    { id: '9', fir: 'FIR/2025/BLR/02328', crimeType: 'Fraud', district: 'Bengaluru Urban', priority: 'Low', date: '2025-07-05' },
    { id: '10', fir: 'FIR/2025/BDG/00412', crimeType: 'Theft', district: 'Belagavi', priority: 'Low', date: '2025-07-05' },
  ],
  recentCases: [
    { id: '1', fir: 'FIR/2025/BLR/02341', crimeType: 'Robbery', district: 'Bengaluru Urban', priority: 'Critical', date: '2025-07-08' },
    { id: '2', fir: 'FIR/2025/MYS/00892', crimeType: 'Murder', district: 'Mysuru', priority: 'Critical', date: '2025-07-08' },
    { id: '3', fir: 'FIR/2025/BLR/02338', crimeType: 'Cyber Crime', district: 'Bengaluru Urban', priority: 'High', date: '2025-07-07' },
    { id: '4', fir: 'FIR/2025/Hub/01456', crimeType: 'Dacoity', district: 'Hubballi-Dharwad', priority: 'High', date: '2025-07-07' },
    { id: '5', fir: 'FIR/2025/MNG/00923', crimeType: 'Narcotics', district: 'Mangaluru', priority: 'High', date: '2025-07-07' },
  ],
  hasRepeatAlerts: true,
}

// 10K generated data stats
const GEN_STATS = getGeneratedStats()
const GENERATED_DEMO_DATA: DashboardResponse = {
  stats: {
    totalCases: GEN_STATS.totalCases,
    activeInvestigations: GEN_STATS.activeInvestigations,
    arrests: GEN_STATS.arrests,
    chargesheets: GEN_STATS.chargesheets,
    districts: GEN_STATS.districts,
    officers: GEN_STATS.officers,
  },
  alerts: getRecentCases(10).map((c) => ({
    // Keep the actual registry ROWID. The alert is a navigation control, not
    // a display-only notification.
    id: c.rowid,
    fir: c.fir,
    crimeType: c.crimeType,
    district: c.district,
    priority: c.priority as any,
    date: c.occurrenceDate.split(' ')[0],
  })),
  recentCases: getRecentCases(5).map((c) => ({
    id: c.rowid,
    fir: c.fir,
    crimeType: c.crimeType,
    district: c.district,
    priority: c.priority as any,
    date: c.occurrenceDate.split(' ')[0],
  })),
  hasRepeatAlerts: GEN_STATS.repeatOffenders > 0,
}

const DEMO_DISTRICTS: DistrictRow[] = [
  { name: 'Bengaluru Urban', cases: 3421 },
  { name: 'Mysuru', cases: 1287 },
  { name: 'Hubballi-Dharwad', cases: 1045 },
  { name: 'Mangaluru', cases: 892 },
  { name: 'Belagavi', cases: 756 },
]

const DEMO_DELTAS: Record<string, number> = {
  'Registered FIRs': 12.4,
  'Open Investigations': -3.8,
  'Arrests Made': 8.2,
  'Chargesheets Filed': 6.1,
}

// Mini Sparkline

function MiniSparkline({ data, color, positive }: { data: number[]; color: string; positive: boolean }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 80
  const h = 28
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} className="opacity-60 group-hover:opacity-100 transition-opacity">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`0,${h} ${points} ${w},${h}`}
        fill={color}
        opacity="0.08"
      />
    </svg>
  )
}

// Animation variants

const cardContainer: Record<string, any> = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
}

const cardItem: Record<string, any> = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

const sectionFade: Record<string, any> = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.35 } },
}



const THREAT_LEVELS = [
  { max: 30, label: 'Low', color: '#10b981' },
  { max: 60, label: 'Moderate', color: '#06b6d4' },
  { max: 80, label: 'High', color: '#f59e0b' },
  { max: 100, label: 'Critical', color: '#ef4444' },
]

function getThreatLevel(score: number) {
  return THREAT_LEVELS.find(l => score <= l.max) ?? THREAT_LEVELS[3]
}

const SP_SCORECARD_COMPUTED = getSPScorecard()

// Loading skeleton

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-4 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
        ))}
      </div>
      {/* Alerts skeleton */}
      <div className="glass-card p-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="ml-auto h-5 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
      {/* District skeleton */}
      <div className="glass-card p-4 space-y-3">
        <Skeleton className="h-4 w-36" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-10" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Main component

export default function DashboardTab() {
  const [data] = useState<DashboardResponse | null>(GENERATED_DEMO_DATA)
  const [pulseKey] = useState(0)
  const { navigateToFir: storeNavFir, navigateToDistrict: storeNavDistrict, navigateToArcNetwork, navigateToArcCases, navigateToArcFir, livePulseCount } = useCrimeSightStore()

  const navigateToFir = (id: string) => storeNavFir(id)
  const navigateToDistrict = (districtName: string) => {
    const d = ALL_DISTRICTS.find(dd => dd.district_name === districtName)
    if (d) storeNavDistrict(d.ROWID)
  }

  // Derive pulse key from livePulseCount (avoids setState in effect)
  const kpiPulseKey = livePulseCount > 0 ? String(livePulseCount) : '0'

  /* ── Fallback guard ── */
  const d = data ?? GENERATED_DEMO_DATA
  const stats = {
    totalCases: d.stats?.totalCases ?? DEMO_DATA.stats.totalCases,
    activeInvestigations: d.stats?.activeInvestigations ?? DEMO_DATA.stats.activeInvestigations,
    arrests: d.stats?.arrests ?? DEMO_DATA.stats.arrests,
    chargesheets: d.stats?.chargesheets ?? DEMO_DATA.stats.chargesheets,
    districts: d.stats?.districts ?? DEMO_DATA.stats.districts,
    officers: d.stats?.officers ?? DEMO_DATA.stats.officers,
  }
  const alerts = Array.isArray(d.alerts) ? d.alerts : DEMO_DATA.alerts
  const recentCases = Array.isArray(d.recentCases) ? d.recentCases : DEMO_DATA.recentCases

  /* ── KPI definitions ── */
  const kpis: (KpiData & { icon: typeof Shield; iconColor: string; accentColor: string; accentBg: string; sparkData: number[] })[] = [
    {
      label: 'Registered FIRs',
      value: stats.totalCases,
      delta: DEMO_DELTAS['Registered FIRs'],
      icon: Shield,
      iconColor: 'text-emerald-400',
      accentColor: 'border-l-emerald-500/50',
      accentBg: 'bg-emerald-500/10',
      sparkData: [8200, 8600, 8900, 9100, 9400, 9700, GEN_STATS.totalCases],
    },
    {
      label: 'Open Investigations',
      value: stats.activeInvestigations,
      delta: DEMO_DELTAS['Open Investigations'],
      icon: TrendingUp,
      iconColor: 'text-emerald-300',
      accentColor: 'border-l-emerald-400/40',
      accentBg: 'bg-emerald-500/8',
      sparkData: [4200, 4100, 4050, 3980, 3950, 3920, GEN_STATS.activeInvestigations],
    },
    {
      label: 'Arrests Made',
      value: stats.arrests,
      delta: DEMO_DELTAS['Arrests Made'],
      icon: Users,
      iconColor: 'text-emerald-400',
      accentColor: 'border-l-emerald-500/50',
      accentBg: 'bg-emerald-500/10',
      sparkData: [3200, 3350, 3500, 3600, 3650, 3700, GEN_STATS.arrests],
    },
    {
      label: 'Chargesheets Filed',
      value: stats.chargesheets,
      delta: DEMO_DELTAS['Chargesheets Filed'],
      icon: AlertTriangle,
      iconColor: 'text-emerald-300',
      accentColor: 'border-l-emerald-400/40',
      accentBg: 'bg-emerald-500/8',
      sparkData: [1100, 1150, 1180, 1200, 1220, 1240, GEN_STATS.chargesheets],
    },
  ]

  /* ── Severity & Pipeline data (computed from 10K) ── */
  const severityData = useMemo(() => getGeneratedPriorityStats(), [])
  const pipelineData = useMemo(() => getGeneratedStatusPipeline(), [])

  function renderPipeline() {
    return (
      <div className="space-y-4">
        {/* Funnel bars */}
        <div className="space-y-2">
          {pipelineData.map((stage, i) => (
            <div key={stage.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] text-slate-400">{stage.label}</span>
                <span className="text-[12px] font-bold tabular-nums" style={{ color: stage.color }}>{stage.count}</span>
              </div>
              <div className="h-5 rounded-md overflow-hidden bg-white/[0.04] relative">
                <motion.div
                  className="h-full rounded-md"
                  style={{ background: `${stage.color}20`, borderLeft: `2px solid ${stage.color}` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${stage.pct}%` }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>
        {/* Conversion rates */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
          {pipelineData.slice(1).map((stage, i) => {
            const rate = Math.round((stage.count / pipelineData[i].count) * 100)
            return (
              <div key={stage.label} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="text-[9px] text-slate-500">{rate}% conversion</span>
                {i < pipelineData.length - 2 && <span className="text-[9px] text-slate-700 mx-1">→</span>}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /* ── Latest 10 alerts (from both alerts + recentCases) ── */
  const allAlerts: AlertItem[] = [...alerts, ...recentCases]
    .reduce<AlertItem[]>((acc, cur) => {
      if (!acc.find((a) => a.id === cur.id)) acc.push(cur)
      return acc
    }, [])
    .slice(0, 10)

  /* ── District aggregation from 10K data ── */
  const genDistrictStats = useMemo(() => getGeneratedDistrictStats(), [])
  const districtRows: DistrictRow[] = useMemo(() =>
    Object.entries(genDistrictStats)
      .map(([name, s]) => ({ name, cases: s.total }))
      .sort((a, b) => b.cases - a.cases)
      .slice(0, 5),
  [genDistrictStats])
  const maxDistrictCases = Math.max(...districtRows.map((d) => d.cases), 1)

  /* ── District bar colors by rank ── */
  const DISTRICT_BAR_COLORS = ['#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#d1fae5']

  /* ── Threat Score (computed from 10K data) ── */
  const criticalCount = GEN_STATS.critical
  const totalCasesThreat = stats.totalCases || 1
  const activeInvestigationsThreat = stats.activeInvestigations
  const todayFactor = Math.min(1, (GEN_STATS.todayCount || 0) / 200)
  const threatRaw = (criticalCount / totalCasesThreat * 35) + (activeInvestigationsThreat / totalCasesThreat * 35) + (todayFactor * 30)
  const threatScore = Math.round(Math.max(0, Math.min(100, threatRaw)))
  const threatLevel = getThreatLevel(threatScore)

  const displayedScore = threatScore

  /* ── Intelligence Brief ── */
  const displayedBrief = 'Bengaluru Urban: 8 high-priority FIRs pending (FIR/2025/KSP/0147\u20130154). SP Office directed CI Priya Sharma to expedite. Chain snatching ring operating in Majestic-Shivajinagar corridor \u2014 5 linked FIRs, 2 repeat offenders absconding. Road accidents up 12% this quarter \u2014 recommend intensified traffic enforcement on NH-4.'

  // Render
  return (
    <div className="flex flex-col gap-6 ops-atmosphere">
      {/* ── Section Label ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <Shield className="size-4 text-emerald-400" />
          <h2 className="text-[13px] font-semibold text-slate-300 tracking-[0.12em] uppercase">
            Command Center
          </h2>
          <Badge className="h-5 px-2 text-[9px] font-bold tracking-wider bg-emerald-500/15 text-emerald-400 border-emerald-500/30 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            LIVE
          </Badge>
        </div>
        <span className="text-[10px] text-slate-600 tabular-nums">
          {new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        <LastSynced />
      </motion.div>

      {/* ── Threat Assessment + Intelligence Brief ── */}
      <motion.div
        variants={sectionFade}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Threat Assessment */}
        <div className="glass-card p-5 lg:col-span-1 flex flex-col items-center justify-center">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Threat Index</span>
          <span
            className="text-[28px] font-bold tabular-nums"
            style={{ color: threatLevel.color }}
          >
            {displayedScore}
          </span>
          <Badge
            className="mt-2 px-3 py-0.5 text-[10px] font-bold tracking-wider border"
            style={{
              color: threatLevel.color,
              backgroundColor: `${threatLevel.color}15`,
              borderColor: `${threatLevel.color}30`,
            }}
          >
            {threatLevel.label}
          </Badge>
        </div>

        {/* Intelligence Brief */}
        <div className="glass-card p-5 lg:col-span-2 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="size-3.5 text-emerald-400" />
            <h3 className="text-[13px] font-semibold text-slate-300 uppercase tracking-wider">
              SCRB DAILY BRIEF
            </h3>
          </div>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2 text-[12px] text-slate-300 leading-relaxed">
              <span className="size-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <span><strong className="text-white">Bengaluru Urban:</strong> 8 high-priority FIRs pending (FIR/2025/KSP/0147–0154). SP Office directed CI Priya Sharma to expedite.</span>
            </li>
            <li className="flex items-start gap-2 text-[12px] text-slate-300 leading-relaxed">
              <span className="size-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
              <span><strong className="text-white">Chain Snatching Ring:</strong> Active in Majestic–Shivajinagar corridor — 5 linked FIRs, 2 repeat offenders absconding.</span>
            </li>
            <li className="flex items-start gap-2 text-[12px] text-slate-300 leading-relaxed">
              <span className="size-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <span><strong className="text-white">Traffic Enforcement:</strong> Road accidents up 12% this quarter — recommend intensified enforcement on NH-4.</span>
            </li>
          </ul>
          <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/[0.04]">
            <span className="text-[10px] text-slate-500">Operational Briefing — SCRB Intelligence Cell</span>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      <motion.div
        variants={cardContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          const delta = formatDelta(kpi.delta)
          return (
            <motion.div
              key={kpi.label}
              variants={cardItem}
              className="glass-card p-5"
            >
              <div className={`border-l-2 ${kpi.accentColor}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                    {kpi.label}
                  </span>
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center ${kpi.accentBg}`}>
                    <Icon className={`size-3.5 ${kpi.iconColor}`} />
                  </div>
                </div>
                <p key={`kpi-${kpi.label}-${kpiPulseKey}`} className={`stat-value text-[24px] leading-none mb-2 ${kpi.iconColor} ${livePulseCount > 0 ? 'kpi-live-pulse' : ''}`}>
                  {kpi.value.toLocaleString('en-IN')}
                </p>
                <div className="flex items-end justify-between">
                  <span
                    className={`inline-flex items-center text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded ${delta.className}`}
                  >
                    {kpi.delta >= 0 ? (
                      <TrendingUp className="size-2.5 mr-0.5" />
                    ) : (
                      <TrendingUp className="size-2.5 mr-0.5 rotate-180" />
                    )}
                    {delta.text}
                  </span>
                  <MiniSparkline
                    data={kpi.sparkData}
                    color={kpi.delta >= 0 ? '#10b981' : '#ef4444'}
                    positive={kpi.delta >= 0}
                  />
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* ── Morning Intelligence Brief ── */}
      <motion.div
        variants={sectionFade}
        initial="hidden"
        animate="show"
      >
        <div className="glass-card p-4" role="region" aria-label="Morning Intelligence Brief">
          <div className="flex items-center gap-2 mb-3">
            <Sun className="size-3.5 text-emerald-400" />
            <h3 className="text-[13px] font-semibold text-emerald-400 uppercase tracking-wider">Morning Intelligence Brief</h3>
            <span className="text-[10px] text-slate-500 ml-auto tabular-nums">
              {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, 08:00 hrs
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mb-3">Prepared by: SCRB Intelligence Cell, Bengaluru</p>

          <div className="space-y-3">
            {/* Overnight Incidents */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-[13px] font-semibold text-slate-300">OVERNIGHT INCIDENTS <span className="text-slate-500 font-normal">(22:00–06:00 hrs)</span></h4>
                <span className="text-[10px] text-slate-400">{(GEN_STATS.todayCount + GEN_STATS.yesterdayCount).toLocaleString('en-IN')} incidents <span className="text-emerald-400">│ {GEN_STATS.todayCount} today</span></span>
              </div>
              <div className="space-y-1.5 pl-1">
                <div className="border-l-2 border-l-slate-500/40 pl-2.5 py-1 rounded-r">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] font-medium text-slate-300 tabular-nums">02:14 hrs</span>
                    <span className="text-[12px] font-semibold text-white">Road Accident</span>
                    <span className="text-[12px] text-slate-500">·</span>
                    <span className="text-[12px] text-slate-400">NH-4, Tumakuru</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[12px] text-emerald-400">FIR/2025/TKR/0231</span>
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Closed</span>
                  </div>
                  <p className="text-[12px] text-slate-500 mt-0.5">Drunk driver arrested by Highway Patrol.</p>
                </div>
                <div className="border-l-2 border-l-amber-500/50 pl-2.5 py-1 rounded-r">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] font-medium text-slate-300 tabular-nums">03:47 hrs</span>
                    <span className="text-[12px] font-semibold text-white">Burglary</span>
                    <span className="text-[12px] text-slate-500">·</span>
                    <span className="text-[12px] text-slate-400">4th Cross, Jayanagar, Bengaluru Urban</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[12px] text-emerald-400">FIR/2025/BLR/1874</span>
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">Investigation</span>
                  </div>
                  <p className="text-[12px] text-slate-500 mt-0.5">CCTV footage under analysis.</p>
                </div>
                <div className="border-l-2 border-l-amber-500/50 pl-2.5 py-1 rounded-r">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] font-medium text-slate-300 tabular-nums">05:20 hrs</span>
                    <span className="text-[12px] font-semibold text-white">Theft</span>
                    <span className="text-[12px] text-slate-500">·</span>
                    <span className="text-[12px] text-slate-400">Bus Stand Area, Mysuru</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[12px] text-emerald-400">FIR/2025/MYS/0912</span>
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">Open</span>
                  </div>
                  <p className="text-[12px] text-slate-500 mt-0.5">Victim: tourist, passport and cash stolen.</p>
                </div>
              </div>
            </div>

            {/* Priority Actions */}
            <div>
              <h4 className="text-[13px] font-semibold text-slate-300">PRIORITY ACTIONS FOR SPs</h4>
              <div className="space-y-2 mt-1.5 pl-1">
                <button onClick={() => navigateToArcCases('kalaburagi-murder-series')} className="flex items-start gap-2 text-left w-full hover:bg-white/[0.02] -mx-1 px-2 py-1.5 rounded transition-colors">
                  <span className="text-red-400 text-[10px] mt-1.5 shrink-0">●</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-200">SP Kalaburagi</p>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-[12px] text-slate-400">Third homicide in 47 days · AFIS match confirmed</p>
                      <span className="shrink-0 text-[10px] font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2 py-0.5 rounded transition-colors">View Cases →</span>
                    </div>
                  </div>
                </button>
                <button onClick={() => navigateToArcCases('operation-black-lotus')} className="flex items-start gap-2 text-left w-full hover:bg-white/[0.02] -mx-1 px-2 py-1.5 rounded transition-colors">
                  <span className="text-amber-400 text-[10px] mt-1.5 shrink-0">●</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-200">SP Dakshina Kannada</p>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-[12px] text-slate-400">Arms seizure linked to Operation Black Lotus · Suspect fled towards Udupi</p>
                      <span className="shrink-0 text-[10px] font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2 py-0.5 rounded transition-colors">View Cases →</span>
                    </div>
                  </div>
                </button>
                <button onClick={() => navigateToArcCases('majestic-pickpocket-ring')} className="flex items-start gap-2 text-left w-full hover:bg-white/[0.02] -mx-1 px-2 py-1.5 rounded transition-colors">
                  <span className="text-amber-400 text-[10px] mt-1.5 shrink-0">●</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-200">SP Bengaluru</p>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-[12px] text-slate-400">Majestic chain-snatching ring · Vehicle KA-01-EJ-4521 last seen near KR Market</p>
                      <span className="shrink-0 text-[10px] font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2 py-0.5 rounded transition-colors">View Cases →</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Cross-District Alert */}
            <button onClick={() => navigateToArcFir('operation-black-lotus', 'case-0001')} className="border border-red-500/20 rounded px-3 py-2 bg-red-500/5 text-left w-full hover:bg-red-500/10 transition-colors">
              <div className="flex gap-1.5">
                <span className="text-red-400 text-[10px] mt-px shrink-0">⚠</span>
                <p className="text-[10px] text-slate-300">
                  <span className="font-semibold text-red-400">Operation Black Lotus:</span> Ravi Shetty (kingpin) still absconding. Financial trail under ED investigation. <span className="text-red-300">₹3.8Cr traced.</span>
                  <span className="text-red-400/70 ml-1">→ View Case</span>
                </p>
              </div>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Active Operations Status ── */}
      <motion.div
        variants={sectionFade}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-4"
      >
        <div className="flex items-center gap-2">
          <Crosshair className="size-3.5 text-red-400" />
          <h3 className="text-[13px] font-semibold text-slate-300 uppercase tracking-wider">Active Operations Status</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DEMO_NARRATIVE_ARCS.map((arc) => {
            const isCritical = arc.status.includes('CRITICAL')
            const isClosed = arc.status.includes('Closed')
            const borderColor = isCritical ? 'border-red-500/60' : isClosed ? 'border-emerald-500/60' : 'border-amber-500/60'
            const badgeColor = isCritical
              ? 'bg-red-500/15 text-red-400 border-red-500/30'
              : isClosed
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            const statusLabel = isCritical ? 'CRITICAL' : isClosed ? 'Closed' : 'Active'

            return (
              <div
                key={arc.id}
                className={`glass-card p-3 text-left border-t-2 ${borderColor} ${isCritical ? 'animate-pulse' : ''}`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[12px] font-semibold text-slate-200 truncate">{arc.name}</span>
                  <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${badgeColor}`}>
                    {statusLabel}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400">IO: <span className="text-slate-300">{arc.leadOfficer}</span></p>
                  <p className="text-[10px] text-slate-400">{arc.caseIds.length} FIRs · {arc.suspectNames.length} suspects · {arc.districts.length} {arc.districts.length === 1 ? 'district' : 'districts'}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">{arc.description}</p>
                </div>
                {/* Dual navigation buttons */}
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/[0.06]">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigateToArcCases(arc.id) }}
                    className="flex-1 flex items-center justify-center gap-1.5 text-[10px] text-slate-300 hover:text-emerald-400 bg-white/[0.04] hover:bg-emerald-500/10 border border-white/[0.08] hover:border-emerald-500/20 rounded py-1.5 transition-colors"
                  >
                    <FileText className="size-3" />
                    View FIRs
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigateToArcNetwork(arc.id) }}
                    className="flex-1 flex items-center justify-center gap-1.5 text-[10px] text-slate-300 hover:text-emerald-400 bg-white/[0.04] hover:bg-emerald-500/10 border border-white/[0.08] hover:border-emerald-500/20 rounded py-1.5 transition-colors"
                  >
                    <Network className="size-3" />
                    Network Map
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* ── District SP Scorecard ── */}
      <motion.div
        variants={sectionFade}
        initial="hidden"
        animate="show"
      >
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="size-3.5 text-slate-400" />
            <h3 className="text-[13px] font-semibold text-slate-300 uppercase tracking-wider">District SP Scorecard</h3>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="table-dossier w-full">
              <thead>
                <tr>
                  <th className="text-left text-[10px] text-slate-400 font-medium uppercase tracking-wider pb-2 pr-4">District</th>
                  <th className="text-left text-[10px] text-slate-400 font-medium uppercase tracking-wider pb-2 pr-4 hidden sm:table-cell">SP Name</th>
                  <th className="text-right text-[10px] text-slate-400 font-medium uppercase tracking-wider pb-2 px-2">FIRs</th>
                  <th className="text-right text-[10px] text-slate-400 font-medium uppercase tracking-wider pb-2 px-2">Open</th>
                  <th className="text-right text-[10px] text-slate-400 font-medium uppercase tracking-wider pb-2 px-2 hidden md:table-cell">Disposed</th>
                  <th className="text-right text-[10px] text-slate-400 font-medium uppercase tracking-wider pb-2 px-2">Closure %</th>
                  <th className="text-right text-[10px] text-slate-400 font-medium uppercase tracking-wider pb-2 pl-2">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {SP_SCORECARD_COMPUTED.map((row) => {
                  const closureColor = row.closure > 65 ? 'text-emerald-400' : row.closure >= 55 ? 'text-amber-400' : 'text-red-400'
                  const trendPositive = row.trend.startsWith('+')
                  const trendValue = parseFloat(row.trend)
                  const trendColor = !trendPositive
                    ? 'text-red-400 font-semibold'
                    : trendValue >= 3
                      ? 'text-emerald-400 font-semibold'
                      : 'text-emerald-400'
                  const trendArrow = trendPositive ? '↑' : '↓'
                  const openHigh = row.open > 200
                  const isKalaburagi = row.district === 'Kalaburagi'

                  return (
                    <tr key={row.district} className={`hover:bg-white/[0.02] transition-colors ${isKalaburagi ? 'bg-red-500/[0.04]' : ''}`}>
                      <td className="py-2 pr-4">
                        <button
                          onClick={() => navigateToDistrict(row.district)}
                          className="text-[12px] text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer hover:underline"
                        >
                          {row.district}
                        </button>
                      </td>
                      <td className="py-2 pr-4 text-[12px] text-slate-400 hidden sm:table-cell">{row.sp}</td>
                      <td className="py-2 px-2 text-[12px] text-slate-300 text-right tabular-nums">{row.firs.toLocaleString('en-IN')}</td>
                      <td className={`py-2 px-2 text-[12px] text-right tabular-nums ${openHigh ? 'text-amber-400 font-medium' : 'text-slate-300'}`}>{row.open.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-2 text-[12px] text-slate-300 text-right tabular-nums hidden md:table-cell">{row.disposed.toLocaleString('en-IN')}</td>
                      <td className={`py-2 px-2 text-[12px] text-right tabular-nums font-medium ${closureColor}`}>{row.closure}%</td>
                      <td className={`py-2 pl-2 text-right tabular-nums ${trendColor}`}>
                        {trendArrow} {row.trend}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* ── Severity Distribution + Case Pipeline ── */}
      <motion.div
        variants={sectionFade}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="size-3.5 text-red-400" />
            <h3 className="text-[13px] font-semibold text-slate-300 uppercase tracking-wider">Case Severity</h3>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2.5">
              {severityData.map(s => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-[12px] text-slate-400">{s.name}</span>
                  </div>
                  <span className="text-[12px] font-bold text-white tabular-nums">{s.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Total</span>
                <span className="text-[12px] font-bold text-slate-300 tabular-nums">{severityData.reduce((a, b) => a + b.value, 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Case Resolution Pipeline */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="size-3.5 text-emerald-400" />
            <h3 className="text-[13px] font-semibold text-slate-300 uppercase tracking-wider">Case Pipeline</h3>
          </div>
          {renderPipeline()}
        </div>
      </motion.div>

      {/* ── Two-column: Alerts + District Overview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Recent Alerts Feed ── */}
        <motion.div
          variants={sectionFade}
          initial="hidden"
          animate="show"
          className="lg:col-span-3 glass-card overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-2">
            <AlertTriangle className="size-3.5 text-amber-400" />
            <h3 className="text-[13px] font-semibold text-slate-300 uppercase tracking-wider">
              Recent Alerts
            </h3>
            <Badge className="ml-auto h-4 px-1.5 text-[9px] font-bold bg-white/[0.06] text-slate-400 border-white/[0.08]">
              {allAlerts.length}
            </Badge>
          </div>
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {allAlerts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                <AlertTriangle className="size-5 mb-2 opacity-40" />
                <p className="text-[12px]">No recent alerts</p>
              </div>
            )}
            <div className="divide-y divide-white/[0.03]">
              {allAlerts.map((alert, idx) => (
                <motion.div
                  key={`${alert.id}-${idx}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.04, duration: 0.25 }}
                  className={`px-4 py-3 hover:bg-white/[0.015] transition-colors ${alert.priority === 'Critical' ? 'border-l-2 border-l-red-500/40' : ''} ${alert.priority === 'High' ? 'alert-row-high' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Priority dot */}
                    <span
                      className={`mt-1.5 size-1.5 rounded-full shrink-0 ${PRIORITY_DOT[alert.priority] || PRIORITY_DOT.Low}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <button
                          onClick={() => navigateToFir(alert.id)}
                          className="text-[12px] font-mono font-medium text-emerald-400 hover:text-emerald-300 hover:underline underline-offset-2 transition-colors"
                        >
                          {alert.fir}
                        </button>
                        <Badge
                          className={`h-4 px-1.5 text-[9px] font-semibold border ${PRIORITY_STYLES[alert.priority] || PRIORITY_STYLES.Low}`}
                        >
                          {alert.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                        <span>{alert.crimeType}</span>
                        <span className="text-slate-700">·</span>
                        <button
                          onClick={() => navigateToDistrict(alert.district)}
                          className="flex items-center gap-0.5 hover:text-emerald-400 transition-colors"
                        >
                          <MapPin className="size-2.5" />
                          {alert.district}
                        </button>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-600 tabular-nums shrink-0 pt-0.5">
                      {timeAgo(alert.date)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── District Overview ── */}
        <motion.div
          variants={sectionFade}
          initial="hidden"
          animate="show"
          className="lg:col-span-2 glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="size-3.5 text-emerald-400" />
            <h3 className="text-[13px] font-semibold text-slate-300 uppercase tracking-wider">
              District Overview
            </h3>
            <span className="text-[9px] text-slate-600 ml-auto uppercase tracking-wider">Top 5</span>
          </div>
          <div className="space-y-3.5">
            {districtRows.map((dist, idx) => {
              const pct = Math.round((dist.cases / maxDistrictCases) * 100)
              return (
                <motion.div
                  key={dist.name}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + idx * 0.06, duration: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 tabular-nums w-3">
                        {idx + 1}
                      </span>
                      <button
                        onClick={() => navigateToDistrict(dist.name)}
                        className="text-[12px] text-slate-300 font-medium truncate max-w-[140px] hover:text-emerald-400 transition-colors text-left"
                      >
                        {dist.name}
                      </button>
                    </div>
                    <span className="text-[12px] text-slate-400 tabular-nums font-semibold">
                      {dist.cases.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="ml-5">
                    <div className="threat-bar">
                      <motion.div
                        className="threat-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${DISTRICT_BAR_COLORS[idx]}, ${DISTRICT_BAR_COLORS[idx]}80)`,
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.55 + idx * 0.06, duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* ── Prototype Intelligence Layer ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-5 glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Database className="size-3.5 text-emerald-400" />
            <h3 className="text-[13px] font-semibold text-emerald-400 uppercase tracking-wider">
              Prototype Intelligence Layer
            </h3>
            <Badge className="h-4 px-1.5 text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              {GEN_STATS.totalCases.toLocaleString('en-IN')} FIRs
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total Cases', value: GEN_STATS.totalCases, delta: '+12.4%', icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Active Cases', value: GEN_STATS.activeInvestigations, delta: '-3.8%', icon: Activity, color: 'text-emerald-300', bg: 'bg-emerald-500/8' },
              { label: 'Arrests', value: GEN_STATS.arrests, delta: '+8.2%', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Repeat Offenders', value: GEN_STATS.repeatOffenders, delta: '+1.5%', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Deep Intel Cases', value: KSP_TOTAL_CASES, delta: '', icon: Database, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            ].map((m) => {
              const Icon = m.icon
              return (
                <div key={m.label} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${m.bg}`}>
                    <Icon className={`size-3.5 ${m.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{m.label}</p>
                    <p className={`text-[15px] font-bold tabular-nums ${m.color}`}>{m.value.toLocaleString('en-IN')}</p>
                    <span className="text-[10px] text-emerald-400/80 tabular-nums">{m.delta}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.04]">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Top Districts by Case Volume (10K Dataset)</p>
            {(() => {
              const top5 = Object.entries(genDistrictStats)
                .map(([district, stats]) => ({ district, totalCases: stats.total, activeCases: stats.open, criticalCases: stats.critical }))
                .sort((a, b) => b.totalCases - a.totalCases)
                .slice(0, 5)
              const maxCases = top5[0]?.totalCases ?? 1
              const barColors = ['#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#d1fae5']
              return (
                <div className="space-y-2">
                  {top5.map((d, i) => (
                    <div key={d.district} className="flex items-center gap-3">
                      <span className="text-[12px] text-slate-400 w-28 truncate shrink-0">{d.district}</span>
                      <div className="flex-1 h-3 rounded-sm bg-white/[0.04] overflow-hidden">
                        <motion.div
                          className="h-full rounded-sm"
                          style={{ background: `linear-gradient(90deg, ${barColors[i]}, ${barColors[i]}80)` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round((d.totalCases / maxCases) * 100)}%` }}
                          transition={{ delay: 0.4 + i * 0.08, duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="text-[12px] font-bold text-slate-300 tabular-nums w-6 text-right shrink-0">{d.totalCases}</span>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </motion.div>

        {/* ── Cloud Infrastructure ── */}
        <motion.div
          variants={sectionFade}
          initial="hidden"
          animate="show"
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Cloud className="size-3.5 text-emerald-400" />
            <h3 className="text-[13px] font-semibold text-slate-300 uppercase tracking-wider">
              Cloud Infrastructure
            </h3>
            <span className="ml-auto text-[9px] font-mono text-emerald-500/70 uppercase tracking-wider flex items-center gap-1">
              <span className="relative flex size-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500" />
              </span>
              Operational
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Platform</span>
              <span className="text-slate-300 font-medium">Zoho Catalyst</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Database</span>
              <span className="text-slate-300 font-medium">PostgreSQL (Catalyst Data Store)</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Data Models</span>
              <span className="text-emerald-400 font-semibold tabular-nums">17 tables</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Data Source</span>
              <span className="text-slate-300 font-medium">Synthetic prototype dataset</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Records Ingested</span>
              <span className="text-emerald-400 font-semibold tabular-nums">2,556 entities</span>
            </div>
            <div className="mt-2 pt-2 border-t border-white/[0.04]">
              <p className="text-[9px] text-slate-600 leading-relaxed">
                Deployed on <span className="text-cyan-500/60">Zoho Catalyst Cloud Scale</span> · Auto-swap Prisma schema (SQLite ↔ PostgreSQL) · Serverless functions
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
