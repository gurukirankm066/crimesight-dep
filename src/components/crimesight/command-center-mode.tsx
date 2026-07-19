'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Map as MapIcon, Network, Brain, BarChart3, FileText,
  AlertTriangle, Activity, Users, Zap, Eye, Radio,
  ChevronRight, Clock, ArrowUpRight, TrendingUp,
  Target, Fingerprint,
} from 'lucide-react'
import {
  GENERATED_CASES, getGeneratedStats, getRecentCases,
  getGeneratedDistrictStats, getGeneratedCrimeTypeStats,
  getMonthlyDistribution, getGeneratedPriorityStats,
} from '@/lib/case-generator'

/* ═══════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════ */

interface DashboardStats {
  totalCases: number
  activeInvestigations: number
  arrests: number
  chargesheets: number
  districts: number
  officers: number
}

interface DistrictStat {
  name: string
  totalCases: number
  activeCases: number
  criticalCases: number
}

interface Anomaly {
  id: string
  type: string
  severity: string
  title: string
  description: string
  district: string
  metric: string
  timestamp: string
}

interface RecentCase {
  id: string
  fir: string
  district: string
  crimeType: string
  status: string
  priority: string
  date: string
}

interface CrimeTypeStat {
  crime_type_name: string
  count: number
}

interface MonthlyStat {
  month: string
  total: number
}

interface NetworkSummary {
  totalNodes: number
  totalEdges: number
  repeatOffenders: number
}

interface RepeatOffender {
  name: string
  caseCount: number
  crimeType: string
}

/* ═══════════════════════════════════════════════════════════════════════
   ANIMATED COUNTER
   ═══════════════════════════════════════════════════════════════════════ */

function AnimatedCounter({ value, duration = 60 }: { value: number; duration?: number }) {
  const [d, setD] = useState(0)
  const mounted = useRef(false)

  useEffect(() => {
    if (value === 0) return
    let n = 0
    const step = Math.max(Math.ceil(value / duration), 1)
    const id = setInterval(() => {
      n += step
      if (n >= value) { setD(value); clearInterval(id) }
      else setD(n)
    }, 20)
    return () => clearInterval(id)
  }, [value, duration])

  return <>{d.toLocaleString()}</>
}

/* ═══════════════════════════════════════════════════════════════════════
   SCAN LINE EFFECT
   ═══════════════════════════════════════════════════════════════════════ */

function ScanLine() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
      <motion.div
        animate={{ y: ['-10%', '110%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   LIVE CLOCK
   ═══════════════════════════════════════════════════════════════════════ */

function LiveClock() {
  const [t, setT] = useState('')
  const [date, setDate] = useState('')
  useEffect(() => {
    const tick = () => {
      setT(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
      setDate(new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="flex items-center gap-3">
      <Clock className="size-3.5 text-emerald-500/60" />
      <span className="text-sm font-mono tabular-nums text-slate-300">{t}</span>
      <span className="text-xs text-slate-500">{date}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   VIEW 1: CRIME MAP STATS
   ═══════════════════════════════════════════════════════════════════════ */

function CrimeMapView({ districts }: { districts: DistrictStat[] }) {
  const sorted = [...districts].sort((a, b) => b.totalCases - a.totalCases).slice(0, 12)
  const maxCases = sorted.length > 0 ? sorted[0].totalCases : 1

  return (
    <div className="h-full flex flex-col gap-4 p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <MapIcon className="size-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">DISTRICT CRIME OVERVIEW</h2>
          <p className="text-xs text-slate-500">Cases by district — sorted by total incidents</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-hidden">
        {sorted.map((d, i) => (
          <motion.div
            key={d.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="flex items-center gap-3 bg-white/[0.03] rounded-lg px-4 py-3 border border-white/[0.05]"
          >
            <span className="text-[10px] text-slate-600 font-mono w-5 text-right shrink-0">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-slate-200 truncate">{d.name}</span>
                <span className="text-sm font-bold text-white tabular-nums ml-2">
                  <AnimatedCounter value={d.totalCases} duration={30} />
                </span>
              </div>
              <div className="flex gap-1.5">
                <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(d.totalCases / maxCases) * 100}%` }}
                    transition={{ delay: i * 0.05 + 0.2, duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                  />
                </div>
                {d.activeCases > 0 && (
                  <span className="text-[10px] text-amber-400/80 tabular-nums shrink-0">
                    {d.activeCases} active
                  </span>
                )}
                {d.criticalCases > 0 && (
                  <span className="text-[10px] text-red-400/80 tabular-nums shrink-0">
                    {d.criticalCases} critical
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   VIEW 2: NETWORK OVERVIEW
   ═══════════════════════════════════════════════════════════════════════ */

function NetworkView({ network, repeatOffenders }: { network: NetworkSummary; repeatOffenders: RepeatOffender[] }) {
  return (
    <div className="h-full flex flex-col gap-4 p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <Network className="size-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">SUSPECT NETWORK INTELLIGENCE</h2>
          <p className="text-xs text-slate-500">Connections and repeat offender analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Network Nodes', value: network.totalNodes, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { label: 'Connections', value: network.totalEdges, icon: Target, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Repeat Offenders', value: network.repeatOffenders, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${s.bg} rounded-xl border border-white/[0.05] p-5 flex flex-col items-center justify-center`}
          >
            <s.icon className={`size-6 ${s.color} mb-2`} />
            <p className={`text-3xl font-bold tabular-nums ${s.color}`}>
              <AnimatedCounter value={s.value} duration={40} />
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <Fingerprint className="size-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-300 tracking-wide">REPEAT OFFENDERS</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
          {repeatOffenders.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-slate-600 text-sm">No repeat offenders found</div>
          ) : (
            repeatOffenders.map((o, i) => (
              <motion.div
                key={o.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 bg-white/[0.03] rounded-lg px-4 py-3 border border-white/[0.05]"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 shrink-0">
                  <AlertTriangle className="size-3.5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{o.name}</p>
                  <p className="text-[10px] text-slate-500">{o.crimeType}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-red-400 tabular-nums">{o.caseCount}</p>
                  <p className="text-[9px] text-slate-600 uppercase">cases</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   VIEW 3: AI INTEL
   ═══════════════════════════════════════════════════════════════════════ */

function AIIntelView({ anomalies, riskSummary }: { anomalies: Anomaly[]; riskSummary: { critical: number; high: number; medium: number; low: number } }) {
  const totalAnomalies = anomalies.length

  return (
    <div className="h-full flex flex-col gap-4 p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <Brain className="size-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">AI INTELLIGENCE ANALYSIS</h2>
          <p className="text-xs text-slate-500">Automated anomaly detection and risk assessment</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Critical', value: riskSummary.critical, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
          { label: 'High Risk', value: riskSummary.high, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
          { label: 'Medium', value: riskSummary.medium, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
          { label: 'Low', value: riskSummary.low, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            className={`${s.bg} ${s.border} border rounded-xl p-4 flex flex-col items-center justify-center`}
          >
            <p className={`text-3xl font-bold tabular-nums ${s.color}`}>
              <AnimatedCounter value={s.value} duration={35} />
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-300 tracking-wide">DETECTED ANOMALIES</h3>
          </div>
          <span className="text-xs text-slate-500 tabular-nums">{totalAnomalies} total</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
          {anomalies.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-slate-600 text-sm">No anomalies detected</div>
          ) : (
            anomalies.map((a, i) => {
              const severityColors: Record<string, string> = {
                critical: 'text-red-400 bg-red-500/10 border-red-500/20',
                warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                info: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
              }
              const colors = severityColors[a.severity] || severityColors.info
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-lg px-4 py-3 border ${colors}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{a.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{a.description}</p>
                    </div>
                    <span className="text-[9px] uppercase font-bold tracking-wider shrink-0 px-2 py-0.5 rounded bg-white/[0.05] text-slate-400">
                      {a.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-slate-500">{a.district}</span>
                    <span className="text-[10px] text-slate-600">•</span>
                    <span className="text-[10px] text-slate-500">{a.metric}</span>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   VIEW 4: TRENDS
   ═══════════════════════════════════════════════════════════════════════ */

function TrendsView({ crimeTypes, monthly }: { crimeTypes: CrimeTypeStat[]; monthly: MonthlyStat[] }) {
  const sortedTypes = [...crimeTypes].sort((a, b) => b.count - a.count).slice(0, 8)
  const maxTypeCount = sortedTypes.length > 0 ? sortedTypes[0].count : 1

  return (
    <div className="h-full flex flex-col gap-4 p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <BarChart3 className="size-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">CRIME TRENDS & ANALYTICS</h2>
          <p className="text-xs text-slate-500">Distribution by type and monthly patterns</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
        {/* Crime Type Distribution */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="size-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-300 tracking-wide">BY CRIME TYPE</h3>
          </div>
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1">
            {sortedTypes.map((ct, i) => {
              const hue = [160, 190, 30, 0, 280, 210, 340, 50][i % 8]
              return (
                <motion.div
                  key={ct.crime_type_name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs text-slate-400 w-36 truncate shrink-0">{ct.crime_type_name}</span>
                  <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(ct.count / maxTypeCount) * 100}%` }}
                      transition={{ delay: i * 0.06 + 0.15, duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: `hsl(${hue}, 70%, 55%)` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-300 tabular-nums w-10 text-right shrink-0">
                    {ct.count}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="size-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-300 tracking-wide">MONTHLY TREND</h3>
          </div>
          <div className="flex-1 flex items-end gap-1.5 px-2 pb-4">
            {monthly.map((m, i) => {
              const maxMonth = Math.max(...monthly.map(mm => mm.total), 1)
              const height = (m.total / maxMonth) * 100
              return (
                <motion.div
                  key={m.month}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: `${height}%`, opacity: 1 }}
                  transition={{ delay: i * 0.04, duration: 0.4 }}
                  className="flex-1 flex flex-col items-center gap-1 group relative"
                >
                  <div className="absolute -top-6 bg-slate-800 text-[10px] text-slate-300 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity tabular-nums whitespace-nowrap z-10">
                    {m.total}
                  </div>
                  <div
                    className="w-full rounded-t-sm bg-gradient-to-t from-emerald-600 to-emerald-400 min-h-[2px] group-hover:from-emerald-500 group-hover:to-emerald-300 transition-colors"
                  />
                  <span className="text-[9px] text-slate-600 font-mono">
                    {m.month.slice(0, 3).toUpperCase()}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   VIEW 5: CASES SUMMARY
   ═══════════════════════════════════════════════════════════════════════ */

function CasesSummaryView({ cases, stats }: { cases: RecentCase[]; stats: DashboardStats | null }) {
  const priorityColors: Record<string, string> = {
    Critical: 'text-red-400 bg-red-500/10 border-red-500/20',
    High: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    Low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  }
  const statusColors: Record<string, string> = {
    'Under Investigation': 'text-amber-400',
    'Chargesheet Filed': 'text-emerald-400',
    'Closed': 'text-slate-500',
    'Disposed': 'text-slate-500',
  }

  return (
    <div className="h-full flex flex-col gap-4 p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <FileText className="size-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">ACTIVE CASES DASHBOARD</h2>
          <p className="text-xs text-slate-500">Recent FIRs and case status overview</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total FIRs', value: stats?.totalCases ?? 0, icon: FileText, color: 'text-white', bg: 'bg-white/[0.04]' },
          { label: 'Active', value: stats?.activeInvestigations ?? 0, icon: Eye, color: 'text-amber-400', bg: 'bg-amber-500/[0.06]' },
          { label: 'Arrests', value: stats?.arrests ?? 0, icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/[0.06]' },
          { label: 'Chargesheets', value: stats?.chargesheets ?? 0, icon: Radio, color: 'text-cyan-400', bg: 'bg-cyan-500/[0.06]' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`${s.bg} rounded-xl border border-white/[0.05] p-4 flex flex-col items-center justify-center`}
          >
            <s.icon className={`size-5 ${s.color} mb-1.5`} />
            <p className={`text-2xl font-bold tabular-nums ${s.color}`}>
              <AnimatedCounter value={s.value} duration={50} />
            </p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="size-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-300 tracking-wide">RECENT CASES</h3>
          </div>
        </div>
        <div className="overflow-y-auto max-h-72 custom-scrollbar pr-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                <th className="text-left pb-2 pl-3 font-medium">FIR Number</th>
                <th className="text-left pb-2 font-medium">District</th>
                <th className="text-left pb-2 font-medium">Crime Type</th>
                <th className="text-left pb-2 font-medium">Priority</th>
                <th className="text-right pb-2 pr-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-2.5 pl-3 font-mono text-xs text-emerald-400/80">{c.fir}</td>
                  <td className="py-2.5 text-xs text-slate-400">{c.district}</td>
                  <td className="py-2.5 text-xs text-slate-300">{c.crimeType}</td>
                  <td className="py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${priorityColors[c.priority] || 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
                      {c.priority}
                    </span>
                  </td>
                  <td className={`py-2.5 pr-3 text-right text-xs ${statusColors[c.status] || 'text-slate-500'}`}>
                    {c.status}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {cases.length === 0 && (
            <div className="text-center py-12 text-slate-600 text-sm">No cases found</div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   COMMAND CENTER MODE
   ═══════════════════════════════════════════════════════════════════════ */

const ROTATION_INTERVAL = 10_000 // 10 seconds

const viewMeta = [
  { label: 'Crime Map', icon: MapIcon },
  { label: 'Network', icon: Network },
  { label: 'AI Intel', icon: Brain },
  { label: 'Trends', icon: BarChart3 },
  { label: 'Cases', icon: FileText },
] as const

interface CommandCenterModeProps {
  onExit: () => void
}

export default function CommandCenterMode({ onExit }: CommandCenterModeProps) {
  const [activeView, setActiveView] = useState(0)
  const [countdown, setCountdown] = useState(ROTATION_INTERVAL / 1000) // initial value

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isFullscreen = useRef(false)

  /* ── Compute all data locally from 10K case-generator ── */
  const stats = useMemo<DashboardStats>(() => {
    const s = getGeneratedStats()
    return {
      totalCases: s.totalCases,
      activeInvestigations: s.activeInvestigations,
      arrests: s.arrests,
      chargesheets: s.chargesheets,
      districts: s.districts,
      officers: s.officers,
    }
  }, [])

  const districts = useMemo<DistrictStat[]>(() => {
    const ds = getGeneratedDistrictStats()
    return Object.entries(ds).map(([name, s]) => ({
      name,
      totalCases: s.total,
      activeCases: s.active,
      criticalCases: s.critical,
    }))
  }, [])

  const anomalies = useMemo<Anomaly[]>(() => {
    // Reuse same anomaly detection logic from ai-analysis-tab
    const result: Anomaly[] = []
    let id = 1

    const districtCounts = new Map<string, number>()
    for (const c of GENERATED_CASES) {
      districtCounts.set(c.district, (districtCounts.get(c.district) || 0) + 1)
    }

    const counts = Array.from(districtCounts.values())
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length
    const variance = counts.reduce((a, b) => a + (b - mean) ** 2, 0) / counts.length
    const std = Math.sqrt(variance)

    for (const [districtName, count] of districtCounts) {
      if (std === 0) continue
      const zScore = (count - mean) / std
      if (zScore > 1.5) {
        let severity: string
        if (zScore > 3) severity = 'critical'
        else if (zScore > 2) severity = 'warning'
        else severity = 'info'

        result.push({
          id: String(id++),
          type: 'Spike',
          severity,
          title: `${districtName} case volume spike`,
          description: `${districtName} shows ${zScore.toFixed(1)}σ above average with ${count} cases (mean: ${mean.toFixed(1)})`,
          district: districtName,
          metric: 'Case volume',
          timestamp: 'Just now',
        })
      }
    }

    return result.slice(0, 10)
  }, [])

  const riskSummary = useMemo(() => {
    let critical = 0, high = 0, medium = 0, low = 0
    for (const c of GENERATED_CASES) {
      const s = c.riskScore || 0
      if (s >= 70) critical++
      else if (s >= 50) high++
      else if (s >= 30) medium++
      else low++
    }
    return { critical, high, medium, low }
  }, [])

  const crimeTypes = useMemo<CrimeTypeStat[]>(() => {
    const cts = getGeneratedCrimeTypeStats()
    return cts.map(c => ({ crime_type_name: c.name, count: c.count }))
  }, [])

  const monthly = useMemo<MonthlyStat[]>(() => {
    const md = getMonthlyDistribution()
    return md.map(m => ({ month: m.month, total: m.cases }))
  }, [])

  const recentCases = useMemo<RecentCase[]>(() => {
    return getRecentCases(20).map(c => ({
      id: c.rowid,
      fir: c.fir,
      district: c.district,
      crimeType: c.crimeType,
      status: c.status,
      priority: c.priority,
      date: c.occurrenceDate.split(' ')[0],
    }))
  }, [])

  const network = useMemo<NetworkSummary>(() => {
    // Simulate network stats from 10K data
    const repeatCount = GENERATED_CASES.filter(c => c.hasRepeatOffender).length
    const totalNodes = Math.round(repeatCount * 1.8 + 200)
    const totalEdges = Math.round(repeatCount * 2.5 + 350)
    return { totalNodes, totalEdges, repeatOffenders: Math.min(12, repeatCount) }
  }, [])

  const repeatOffenders = useMemo<RepeatOffender[]>(() => {
    // Generate repeat offender data from 10K cases
    const offenderMap = new Map<string, { count: number; crimeType: string }>()
    const names = [
      'Ravi Kumar S', 'Syed Iqbal', 'Manoj Reddy', 'Kiran Naidu',
      'Pradeep G', 'Arjun Patel', 'Farhan Khan', 'Deepak Shetty',
      'Basavarajappa M', 'Gangamma H', 'Chandru P', 'Mahesh Babu R',
    ]
    const repeatCases = GENERATED_CASES.filter(c => c.hasRepeatOffender)
    for (let i = 0; i < repeatCases.length; i++) {
      const name = names[i % names.length]
      const existing = offenderMap.get(name)
      if (existing) {
        existing.count++
      } else {
        offenderMap.set(name, { count: 1, crimeType: repeatCases[i].crimeType })
      }
    }
    return Array.from(offenderMap.entries())
      .map(([name, v]) => ({ name, caseCount: v.count, crimeType: v.crimeType }))
      .sort((a, b) => b.caseCount - a.caseCount)
      .slice(0, 12)
  }, [])

  /* ── Fullscreen ── */
  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen()
      isFullscreen.current = true
    } catch {
      // Fullscreen may not be available
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch {
      // ignore
    }
    isFullscreen.current = false
  }, [])

  /* ── Enter fullscreen on mount ── */
  useEffect(() => {
    enterFullscreen()
  }, [enterFullscreen])

  /* ── Auto-rotation ── */
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setActiveView(v => (v + 1) % 5)
          return ROTATION_INTERVAL / 1000
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  /* ── Listen for fullscreen exit ── */
  useEffect(() => {
    const handleFSChange = () => {
      if (!document.fullscreenElement && isFullscreen.current) {
        exitFullscreen()
        onExit()
      }
    }
    document.addEventListener('fullscreenchange', handleFSChange)
    return () => document.removeEventListener('fullscreenchange', handleFSChange)
  }, [onExit, exitFullscreen])

  /* ── Keyboard: ESC or F to exit ── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'f' || e.key === 'F') {
        exitFullscreen()
        onExit()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onExit, exitFullscreen])

  /* ── Cleanup fullscreen on unmount ── */
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      }
    }
  }, [])

  /* ── Render active view ── */
  const renderView = () => {
    switch (activeView) {
      case 0: return <CrimeMapView districts={districts} />
      case 1: return <NetworkView network={network} repeatOffenders={repeatOffenders} />
      case 2: return <AIIntelView anomalies={anomalies} riskSummary={riskSummary} />
      case 3: return <TrendsView crimeTypes={crimeTypes} monthly={monthly} />
      case 4: return <CasesSummaryView cases={recentCases} stats={stats} />
      default: return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#030712] text-slate-200 flex flex-col overflow-hidden">
      <ScanLine />

      {/* ── Top Stats Bar ── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="shrink-0 border-b border-white/[0.06]"
      >
        {/* Main stats row */}
        <div className="flex items-center justify-between px-6 py-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Shield className="size-5 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-[0.2em] text-white leading-none">
                CRIME<span className="text-emerald-500">SIGHT</span> AI
              </h1>
              <p className="text-[9px] text-slate-600 tracking-[0.15em] mt-0.5">KARNATAKA STATE POLICE — COMMAND CENTER</p>
            </div>
          </div>

          {/* Big Stats */}
          <div className="flex items-center gap-8">
            {[
              { label: 'TOTAL FIRs', value: stats?.totalCases ?? 0, color: 'text-white' },
              { label: 'ACTIVE', value: stats?.activeInvestigations ?? 0, color: 'text-amber-400' },
              { label: 'ARRESTS', value: stats?.arrests ?? 0, color: 'text-emerald-400' },
              { label: 'CHARGESHEETS', value: stats?.chargesheets ?? 0, color: 'text-cyan-400' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-3xl lg:text-4xl font-bold tabular-nums leading-none ${s.color}`}>
                  <AnimatedCounter value={s.value} duration={50} />
                </p>
                <p className="text-[9px] text-slate-500 uppercase tracking-[0.15em] mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Right side: Badge + Clock */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="relative flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="absolute w-2 h-2 rounded-full bg-red-400 animate-ping opacity-60" />
              </div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-red-400">COMMAND CENTER MODE</span>
            </div>
            <LiveClock />
          </div>
        </div>

        {/* View title + countdown */}
        <div className="flex items-center justify-between px-6 py-2 border-t border-white/[0.04] bg-white/[0.01]">
          <div className="flex items-center gap-3">
            {(() => {
              const Meta = viewMeta[activeView]
              return (
                <>
                  <Meta.icon className="size-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-300 tracking-wider uppercase">{Meta.label}</span>
                </>
              )
            })()}
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <span className="text-[10px] tracking-wider">NEXT ROTATION IN</span>
            <span className="text-sm font-bold font-mono tabular-nums text-emerald-400">
              {countdown}s
            </span>
          </div>
        </div>
      </motion.header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 min-h-0 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Bottom Bar: Minimap + Controls ── */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="shrink-0 border-t border-white/[0.06] bg-white/[0.01]"
      >
        <div className="flex items-center justify-between px-6 py-3">
          {/* View dots (minimap) */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-slate-600 uppercase tracking-[0.15em] mr-2">MINIMAP</span>
            {viewMeta.map((v, i) => (
              <button
                key={v.label}
                onClick={() => { setActiveView(i); setCountdown(ROTATION_INTERVAL / 1000) }}
                className="group flex items-center gap-2"
                aria-label={`Switch to ${v.label} view`}
              >
                <div
                  className={`w-8 h-1.5 rounded-full transition-all duration-300 ${
                    i === activeView
                      ? 'bg-emerald-500 w-12'
                      : 'bg-white/10 group-hover:bg-white/20'
                  }`}
                />
                <span className={`text-[9px] uppercase tracking-wider transition-colors ${
                  i === activeView ? 'text-emerald-400' : 'text-slate-600 group-hover:text-slate-400'
                }`}>
                  {v.label}
                </span>
              </button>
            ))}
          </div>

          {/* Progress bar for rotation */}
          <div className="flex items-center gap-4">
            <div className="w-32 h-1 bg-white/[0.05] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500/60 rounded-full"
                animate={{ width: `${((ROTATION_INTERVAL / 1000 - countdown) / (ROTATION_INTERVAL / 1000)) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-[9px] text-slate-600 tracking-wider">PRESS F OR ESC TO EXIT</span>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}
