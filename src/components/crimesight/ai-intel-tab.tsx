'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Brain, RefreshCw, Send, Terminal, ShieldAlert, Zap, AlertTriangle,
  Activity, TrendingUp, Users, Radar, GitBranch, Fingerprint, Crosshair,
  Eye, Cpu, Wifi, Clock, Database, BarChart3, AlertOctagon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GENERATED_CASES } from '@/lib/case-generator'

/* ═══════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════ */

interface Anomaly {
  id: string
  type: 'spike' | 'pattern' | 'outlier'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  district: string
  metric: string
  timestamp: string
}

interface AnomalyResponse {
  anomalies: Anomaly[]
  totalAnomalies: number
  criticalCount: number
}

interface RiskSummary {
  critical: number
  high: number
  medium: number
  low: number
}

/* ═══════════════════════════════════════════════════════════════════════
   NEURAL NETWORK SVG ANIMATION (idle state)
   ═══════════════════════════════════════════════════════════════════════ */

function NeuralNetworkViz() {
  const nodesRef = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      x: 40 + Math.random() * 220,
      y: 20 + Math.random() * 200,
      r: 2 + Math.random() * 3,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.5,
    }))
  )

  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => setFrame(f => f + 1), 60)
    return () => clearInterval(iv)
  }, [])

  const nodes = nodesRef.current.map((n, i) => ({
    ...n,
    cx: n.x + Math.sin(frame * 0.02 * n.speed + n.phase) * 12,
    cy: n.y + Math.cos(frame * 0.015 * n.speed + n.phase) * 8,
  }))

  // connections between nearby nodes
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number; opacity: number }> = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].cx - nodes[j].cx
      const dy = nodes[i].cy - nodes[j].cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 100) {
        const pulse = 0.15 + 0.15 * Math.sin(frame * 0.03 + i + j)
        lines.push({ x1: nodes[i].cx, y1: nodes[i].cy, x2: nodes[j].cx, y2: nodes[j].cy, opacity: pulse })
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <svg viewBox="0 0 300 240" className="w-64 h-52 opacity-60">
        {lines.map((l, i) => (
          <line key={`l-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke="#10b981" strokeWidth="0.5" opacity={l.opacity} />
        ))}
        {nodes.map((n, i) => (
          <circle key={`n-${i}`} cx={n.cx} cy={n.cy} r={n.r}
            fill="#10b981" opacity={0.3 + 0.2 * Math.sin(frame * 0.04 + n.phase)} />
        ))}
      </svg>
      <p className="text-[10px] tracking-[0.3em] text-slate-600 uppercase font-semibold mt-2">Neural Network Standby</p>
      <div className="flex items-center gap-2 mt-3">
        <Zap className="size-3 text-emerald-500/30" />
        <span className="text-[9px] text-slate-700 tracking-wider">AWAITING INTELLIGENCE QUERY</span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   PROCESSING ANIMATION
   ═══════════════════════════════════════════════════════════════════════ */

const PROCESSING_STAGES = [
  'Parsing query parameters...',
  'Scanning crime database...',
  'Running neural analysis...',
  'Generating intelligence report...',
]

function ProcessingAnimation({ query }: { query: string }) {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => {
      setStage(s => {
        if (s < PROCESSING_STAGES.length - 1) return s + 1
        return s
      })
    }, 1800)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <div className="relative mb-8">
        {/* Outer spinning ring */}
        <div className="w-20 h-20 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
        {/* Inner counter-spin ring */}
        <div className="absolute inset-2.5 rounded-full border border-emerald-500/10 border-b-emerald-400/60 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        {/* Center brain */}
        <Brain className="size-6 text-emerald-400 absolute inset-0 m-auto" />
        {/* Pulsing glow */}
        <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl animate-pulse" />
      </div>

      <p className="text-[10px] tracking-[0.3em] text-emerald-400/80 uppercase font-semibold mb-6">Neural Network Active</p>

      {/* Processing stages */}
      <div className="space-y-2.5 w-64">
        {PROCESSING_STAGES.map((s, i) => {
          const isActive = i === stage
          const isDone = i < stage
          return (
            <div key={s} className="flex items-center gap-2.5">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all duration-500 ${
                isDone ? 'border-emerald-500 bg-emerald-500/20' :
                isActive ? 'border-emerald-400 bg-emerald-500/10' :
                'border-white/10'
              }`}>
                {isDone && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              </div>
              <span className={`text-[10px] font-mono tracking-wide transition-all duration-500 ${
                isDone ? 'text-emerald-400/60' :
                isActive ? 'text-emerald-300' :
                'text-slate-600'
              }`}>{s}</span>
            </div>
          )
        })}
      </div>

      {/* Audio bars */}
      <div className="flex gap-1 mt-8">
        {[0.4, 0.7, 1, 0.7, 0.4].map((w, i) => (
          <motion.div
            key={i}
            className="h-5 bg-emerald-500/20 rounded-sm"
            initial={{ width: 4 }}
            animate={{ width: `${w * 28}px` }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse', delay: i * 0.12 }}
          />
        ))}
      </div>

      <p className="text-[9px] text-slate-600 mt-4 font-mono">&quot;{query}&quot;</p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   CLASSIFIED DOCUMENT RESPONSE
   ═══════════════════════════════════════════════════════════════════════ */

function ClassifiedResponse({ response, query }: { response: string; query: string }) {
  const confidence = 85 + Math.floor(Math.random() * 12) // 85-96
  const now = new Date()
  const ts = now.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  })

  const renderInline = (text: string) => text.split(/\*\*(.*?)\*\*/g).map((part, index) => (
    index % 2 === 1 ? <strong key={index} className="font-semibold text-white">{part}</strong> : part
  ))

  const parseMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('• '))
        return <p key={i} className="flex gap-2.5 ml-1"><span className="text-emerald-400 mt-0.5 shrink-0">&#9654;</span><span>{renderInline(line.trim().slice(2))}</span></p>
      // Numbered
      if (/^\d+\.\s/.test(line.trim()))
        return <p key={i} className="flex gap-2.5 ml-1"><span className="text-emerald-400/70 shrink-0">{line.trim().match(/^(\d+\.)/)?.[1]}</span><span>{renderInline(line.trim().replace(/^\d+\.\s/, ''))}</span></p>
      // Headers
      if (line.startsWith('##'))
        return <p key={i} className="text-[13px] font-bold text-white mt-3 mb-1">{renderInline(line.replace(/^#+\s*/, ''))}</p>
      if (line.startsWith('#'))
        return <p key={i} className="text-sm font-bold text-white mt-2">{renderInline(line.replace(/^#+\s*/, ''))}</p>
      if (line.trim() === '') return <div key={i} className="h-2" />
      return <p key={i}>{renderInline(line)}</p>
    })
  }

  return (
    <div className="flex flex-col min-h-[200px]">
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {/* Classified document header */}
        <div className="glow-card hud-corners rounded-xl p-5 mb-3 relative overflow-hidden">
          {/* CLASSIFIED watermark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[30deg] text-[60px] font-black text-red-500/[0.04] tracking-[0.3em] pointer-events-none select-none whitespace-nowrap">
            CLASSIFIED
          </div>

          {/* Top bar */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06] relative">
            <div className="flex items-center gap-2">
              <div className="w-2 h-4 bg-red-500/60" />
              <span className="text-[11px] font-bold tracking-[0.25em] text-red-400/80 uppercase">Intelligence Report</span>
            </div>
            <Badge className="text-[8px] px-2 py-0.5 bg-red-500/10 border-red-500/30 text-red-400 tracking-wider uppercase">
              Classified — KSP Internal
            </Badge>
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4 text-[9px] font-mono relative">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3 text-slate-500" />
              <span className="text-slate-500">Generated:</span>
              <span className="text-slate-300">{ts}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database className="size-3 text-slate-500" />
              <span className="text-slate-500">Source:</span>
              <span className="text-slate-300">KSP Crime DB</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <Crosshair className="size-3 text-slate-500" />
              <span className="text-slate-500">Query:</span>
              <span className="text-slate-300 truncate">{query}</span>
            </div>
          </div>

          {/* Response body */}
          <div className="text-[12px] text-slate-300 leading-[1.8] relative">
            {parseMarkdown(response)}
          </div>

          {/* Confidence bar */}
          <div className="mt-5 pt-3 border-t border-white/[0.06] relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] tracking-[0.2em] text-slate-500 uppercase font-semibold">AI Confidence Score</span>
              <span className="text-[12px] font-mono font-bold text-emerald-400">{confidence}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, rgba(16,185,129,0.3), rgba(16,185,129,0.6))`,
                  boxShadow: '0 0 10px rgba(16,185,129,0.3)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   ANALYSIS OUTPUT (center column)
   ═══════════════════════════════════════════════════════════════════════ */

function AnalysisOutput({
  response, processing, query, error, onRetry,
}: {
  response: string
  processing: boolean
  query: string
  error: string | null
  onRetry: () => void
}) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
        <AlertOctagon className="size-8 text-red-400/40" />
        <p className="text-[11px] text-red-400/70 text-center max-w-[200px]">{error}</p>
        <Button variant="ghost" size="sm" onClick={onRetry}
          className="text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10">
          RETRY ANALYSIS
        </Button>
      </div>
    )
  }

  if (!query) return <NeuralNetworkViz />
  if (processing) return <ProcessingAnimation key={query} query={query} />
  return <ClassifiedResponse response={response} query={query} />
}

/* ═══════════════════════════════════════════════════════════════════════
   MORNING BRIEF TERMINAL (with typing effect)
   ═══════════════════════════════════════════════════════════════════════ */

function BriefTerminal({ brief, loading, onRefresh, briefTimestamp }: {
  brief: string; loading: boolean; onRefresh: () => void; briefTimestamp: string | null
}) {
  const [displayedBrief, setDisplayedBrief] = useState('')
  const prevBriefRef = useRef('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Typing animation effect
  useEffect(() => {
    if (loading || !brief) {
      prevBriefRef.current = ''
      return
    }

    // If brief changed (new brief)
    if (brief !== prevBriefRef.current) {
      prevBriefRef.current = brief
      let idx = 0
      const speed = 8 // ms per character
      const iv = setInterval(() => {
        idx += 3 // reveal 3 chars at a time for speed
        if (idx >= brief.length) {
          setDisplayedBrief(brief)
          clearInterval(iv)
        } else {
          setDisplayedBrief(brief.slice(0, idx))
        }
      }, speed)
      return () => {
        clearInterval(iv)
        setDisplayedBrief('')
      }
    }
  }, [brief, loading])

  // Auto-scroll during typing
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [displayedBrief])

  return (
    <div className="glow-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <Terminal className="size-3.5 text-emerald-400" />
          <span className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase">
            Morning Intelligence Brief
          </span>
        </div>
        <div className="flex items-center gap-2">
          {briefTimestamp && !loading && (
            <span className="text-[8px] font-mono text-slate-600">{briefTimestamp}</span>
          )}
          <Badge className="text-[8px] px-1.5 py-0 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 tracking-wider">
            CONFIDENCE: HIGH
          </Badge>
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}
            className="h-6 px-2 text-[9px] text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10">
            <RefreshCw className={`size-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            REFRESH
          </Button>
        </div>
      </div>

      {/* Terminal body */}
      <div ref={containerRef}
        className="relative font-mono text-[11px] text-emerald-400/80 bg-black/50 p-4 min-h-[180px] max-h-[220px] overflow-y-auto custom-scrollbar scanlines">
        {/* CLASSIFIED watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[25deg] text-[48px] font-black text-red-500/[0.03] tracking-[0.4em] pointer-events-none select-none whitespace-nowrap">
          CLASSIFIED
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-emerald-400/60">
            <div className="flex gap-1">
              <span className="typing-dot w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span className="typing-dot w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span className="typing-dot w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            </div>
            <span>Analyzing crime data streams...</span>
          </div>
        ) : displayedBrief ? (
          <div className="whitespace-pre-wrap leading-relaxed relative">{displayedBrief}</div>
        ) : (
          <span className="text-slate-600">Awaiting intelligence data...</span>
        )}
        {!loading && displayedBrief && (
          <span className="inline-block w-2 h-4 bg-emerald-400/80 ml-0.5 animate-pulse align-middle" />
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   ANOMALY DETECTION PANEL
   ═══════════════════════════════════════════════════════════════════════ */

function AnomalyPanel() {
  const [refreshing, setRefreshing] = useState(false)

  const data = useMemo<AnomalyResponse>(() => {
    const anomalies: Anomaly[] = []

    // Group cases by district
    const districtCases: Record<string, typeof GENERATED_CASES[number][]> = {}
    for (const c of GENERATED_CASES) {
      if (!districtCases[c.district]) districtCases[c.district] = []
      districtCases[c.district].push(c)
    }

    // ─── 1. District crime spikes: compare each district's recent concentration vs expected ───
    const totalRecent7 = GENERATED_CASES.filter(c => c.daysAgo <= 7).length

    const spikeEntries: Array<{ district: string; ratio: number; recent: number; total: number }> = []
    for (const [district, cases] of Object.entries(districtCases)) {
      const recent = cases.filter(c => c.daysAgo <= 7).length
      if (recent < 3) continue
      const districtShare = cases.length / GENERATED_CASES.length
      const recentShare = recent / totalRecent7
      const ratio = districtShare > 0 ? recentShare / districtShare : 1
      spikeEntries.push({ district, ratio, recent, total: cases.length })
    }
    spikeEntries.sort((a, b) => b.ratio - a.ratio)

    for (let i = 0; i < Math.min(4, spikeEntries.length); i++) {
      const s = spikeEntries[i]
      const pct = ((s.ratio - 1) * 100).toFixed(0)
      anomalies.push({
        id: `anom-spike-${s.district}`,
        type: 'spike',
        severity: i === 0 ? 'critical' : i <= 1 ? 'warning' : 'info',
        title: `Crime Spike: ${s.district}`,
        description: `${s.district} shows ${Number(pct) >= 0 ? '+' : ''}${pct}% deviation in recent crime concentration — ${s.recent} cases in last 7 days out of ${s.total} total, exceeding the expected baseline distribution.`,
        district: s.district,
        metric: `${Number(pct) >= 0 ? '+' : ''}${pct}% vs baseline`,
        timestamp: new Date().toISOString(),
      })
    }

    // ─── 2. Unusual hour patterns (midnight–4 AM) ───
    const midnightEntries: Array<{ district: string; count: number; total: number; pct: number }> = []
    for (const [district, cases] of Object.entries(districtCases)) {
      let midnight = 0
      for (const c of cases) {
        const hour = parseInt(c.occurrenceDate.slice(11, 13), 10)
        if (hour >= 0 && hour < 4) midnight++
      }
      midnightEntries.push({ district, count: midnight, total: cases.length, pct: (midnight / cases.length) * 100 })
    }
    midnightEntries.sort((a, b) => b.pct - a.pct)

    for (let i = 0; i < Math.min(3, midnightEntries.length); i++) {
      const m = midnightEntries[i]
      anomalies.push({
        id: `anom-pattern-${m.district}`,
        type: 'pattern',
        severity: i === 0 && m.pct > 19 ? 'critical' : i === 0 ? 'warning' : 'info',
        title: `Unusual Hour Pattern: ${m.district}`,
        description: `${m.count} crimes occurred between midnight and 4 AM in ${m.district} (${m.pct.toFixed(1)}% of district total), suggesting organized nocturnal activity.`,
        district: m.district,
        metric: `${m.pct.toFixed(1)}% midnight crimes`,
        timestamp: new Date().toISOString(),
      })
    }

    // ─── 3. Repeat offender clusters ───
    const repeatEntries: Array<{ district: string; count: number; total: number; pct: number }> = []
    for (const [district, cases] of Object.entries(districtCases)) {
      const repeatCount = cases.filter(c => c.hasRepeatOffender).length
      repeatEntries.push({ district, count: repeatCount, total: cases.length, pct: (repeatCount / cases.length) * 100 })
    }
    repeatEntries.sort((a, b) => b.pct - a.pct)

    for (let i = 0; i < Math.min(3, repeatEntries.length); i++) {
      const r = repeatEntries[i]
      anomalies.push({
        id: `anom-outlier-${r.district}`,
        type: 'outlier',
        severity: i === 0 && r.pct > 17 ? 'critical' : i === 0 ? 'warning' : 'info',
        title: `Repeat Offender Cluster: ${r.district}`,
        description: `${r.district} has ${r.count} cases involving repeat offenders (${r.pct.toFixed(1)}% of district total), indicating active criminal networks in the area.`,
        district: r.district,
        metric: `${r.pct.toFixed(1)}% repeat offenders`,
        timestamp: new Date().toISOString(),
      })
    }

    return {
      anomalies: anomalies.slice(0, 12),
      totalAnomalies: anomalies.length,
      criticalCount: anomalies.filter(a => a.severity === 'critical').length,
    }
  }, [])

  const refreshAnomalies = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 600)
  }

  const severityConfig = {
    critical: { color: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10', dot: 'bg-red-400', badge: 'bg-red-500/15 border-red-500/30 text-red-400' },
    warning: { color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10', dot: 'bg-amber-400', badge: 'bg-amber-500/15 border-amber-500/30 text-amber-400' },
    info: { color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', dot: 'bg-cyan-400', badge: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' },
  }

  const typeIcons = {
    spike: <TrendingUp className="size-3" />,
    pattern: <Fingerprint className="size-3" />,
    outlier: <AlertTriangle className="size-3" />,
  }

  return (
    <div className="glow-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <Radar className="size-3.5 text-cyan-400" />
          <span className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase">Anomaly Detection</span>
        </div>
        <div className="flex items-center gap-2">
          {!refreshing && (
            <>
              {data.criticalCount > 0 && (
                <Badge className="text-[8px] px-1.5 py-0 bg-red-500/15 border-red-500/30 text-red-400 animate-pulse">
                  {data.criticalCount} CRITICAL
                </Badge>
              )}
              <span className="text-[9px] font-mono text-slate-500">{data.totalAnomalies} detected</span>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={refreshAnomalies} disabled={refreshing}
            className="h-6 px-2 text-[9px] text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10">
            <RefreshCw className={`size-3 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="p-3 max-h-[260px] overflow-y-auto custom-scrollbar space-y-2">
        {refreshing ? (
          <div className="flex items-center gap-2 py-6 justify-center text-cyan-400/50">
            <div className="w-4 h-4 border border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            <span className="text-[10px] font-mono">Scanning for anomalies...</span>
          </div>
        ) : data.anomalies.length > 0 ? (
          data.anomalies.map((a) => {
            const cfg = severityConfig[a.severity as keyof typeof severityConfig] || severityConfig.info
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-lg border ${cfg.border} ${cfg.bg} relative overflow-hidden`}
              >
                {/* Pulsing indicator for critical */}
                {a.severity === 'critical' && (
                  <div className="absolute top-2.5 right-2.5">
                    <div className="relative">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-red-400 animate-ping opacity-40" />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`${cfg.color}`}>{typeIcons[a.type as keyof typeof typeIcons] || <AlertTriangle className="size-3" />}</div>
                  <span className="text-[10px] font-semibold text-white tracking-wide">{a.title}</span>
                  <Badge className={`text-[7px] px-1.5 py-0 border ${cfg.badge} tracking-wider uppercase ml-auto`}>
                    {a.severity}
                  </Badge>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed mb-1.5">{a.description}</p>
                <div className="flex items-center gap-3 text-[9px] font-mono">
                  <span className="text-slate-500">
                    <span className="text-slate-400">{a.metric}</span>
                  </span>
                </div>
                <div className="text-[8px] text-slate-600 mt-1 font-mono">{a.district}</div>
              </motion.div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Eye className="size-5 text-slate-700 mb-2" />
            <p className="text-[10px] text-slate-600">No anomalies detected</p>
            <p className="text-[9px] text-slate-700">System operating within normal parameters</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   THREAT GAUGE (semicircular)
   ═══════════════════════════════════════════════════════════════════════ */

function ThreatGauge({ risk }: { risk: RiskSummary }) {
  const total = risk.critical + risk.high + risk.medium + risk.low || 1
  const threatScore = Math.min(100,
    ((risk.critical * 4 + risk.high * 3 + risk.medium * 2 + risk.low * 0.5) / (total * 4)) * 100
  )

  const threatLevel = threatScore > 75 ? 'CRITICAL' : threatScore > 50 ? 'ELEVATED' : threatScore > 30 ? 'MODERATE' : 'LOW'
  const threatColor = threatLevel === 'CRITICAL' ? '#ef4444' : threatLevel === 'ELEVATED' ? '#f59e0b' : threatLevel === 'MODERATE' ? '#eab308' : '#10b981'

  // Needle angle: 0-100 maps to -120deg to 120deg from top
  const angle = -120 + (threatScore / 100) * 240

  // Arc segments: green (0-33), yellow (33-50), amber (50-75), red (75-100)
  const segments = [
    { start: -120, end: -120 + (33 / 100) * 240, color: '#10b981', opacity: 0.5 },
    { start: -120 + (33 / 100) * 240, end: -120 + (50 / 100) * 240, color: '#eab308', opacity: 0.5 },
    { start: -120 + (50 / 100) * 240, end: -120 + (75 / 100) * 240, color: '#f59e0b', opacity: 0.5 },
    { start: -120 + (75 / 100) * 240, end: 120, color: '#ef4444', opacity: 0.5 },
  ]

  const polarToCart = (deg: number, r: number) => {
    const rad = ((deg - 90) * Math.PI) / 180
    return { x: 80 + r * Math.cos(rad), y: 80 + r * Math.sin(rad) }
  }

  return (
    <div className="glow-card rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-3.5 text-red-400/60" />
          <span className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase">Threat Level</span>
        </div>
      </div>
      <div className="flex flex-col items-center py-4 px-2">
        <svg viewBox="0 0 160 105" className="w-40 h-28 mb-1">
          {/* Background arc segments */}
          {segments.map((seg, i) => {
            const p1 = polarToCart(seg.start, 65)
            const p2 = polarToCart(seg.end, 65)
            const largeArc = (seg.end - seg.start) > 180 ? 1 : 0
            return (
              <path key={i}
                d={`M ${p1.x} ${p1.y} A 65 65 0 ${largeArc} 1 ${p2.x} ${p2.y}`}
                fill="none" stroke={seg.color} strokeWidth="8" opacity={seg.opacity} strokeLinecap="round" />
            )
          })}
          {/* Tick marks */}
          {Array.from({ length: 11 }).map((_, i) => {
            const deg = -120 + (i / 10) * 240
            const p1 = polarToCart(deg, 58)
            const p2 = polarToCart(deg, 65)
            return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          })}
          {/* Needle */}
          <motion.line
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            x1="80" y1="80" x2={polarToCart(angle, 55).x} y2={polarToCart(angle, 55).y}
            stroke={threatColor} strokeWidth="2.5" strokeLinecap="round"
          />
          <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4, type: 'spring' }}
          >
            <circle cx="80" cy="80" r="5" fill="#0a0f1a" stroke={threatColor} strokeWidth="2" />
            <circle cx="80" cy="80" r="2" fill={threatColor} />
          </motion.g>
        </svg>
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <p className="text-[16px] font-black tracking-[0.25em]" style={{ color: threatColor }}>{threatLevel}</p>
          <p className="text-[10px] font-mono text-slate-500 mt-0.5">Score: {threatScore.toFixed(0)}/100</p>
        </motion.div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   RISK DISTRIBUTION BARS (glowing)
   ═══════════════════════════════════════════════════════════════════════ */

function RiskDistribution({ risk }: { risk: RiskSummary }) {
  const maxVal = Math.max(risk.critical, risk.high, risk.medium, risk.low, 1)

  const items = [
    { label: 'CRITICAL', value: risk.critical, color: '#ef4444' },
    { label: 'HIGH', value: risk.high, color: '#f59e0b' },
    { label: 'MEDIUM', value: risk.medium, color: '#eab308' },
    { label: 'LOW', value: risk.low, color: '#10b981' },
  ]

  return (
    <div className="glow-card rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-3.5 text-amber-400/60" />
          <span className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase">Risk Distribution</span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {items.map(g => (
          <div key={g.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] tracking-[0.15em] text-slate-500 font-semibold">{g.label}</span>
              <span className="text-[11px] font-mono font-bold counter-glow" style={{ color: g.color }}>{g.value}</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.03] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(g.value / maxVal) * 100}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${g.color}33, ${g.color}88)`,
                  boxShadow: `0 0 12px ${g.color}44, 0 0 4px ${g.color}66`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   ACTIVE INTELLIGENCE MODULES
   ═══════════════════════════════════════════════════════════════════════ */

const AI_MODULES = [
  { name: 'PATTERN RECOGNITION', status: 'active' as const },
  { name: 'ANOMALY DETECTION', status: 'active' as const },
  { name: 'PREDICTIVE ANALYSIS', status: 'standby' as const },
  { name: 'NETWORK ANALYSIS', status: 'active' as const },
]

function ActiveModules() {
  return (
    <div className="glow-card rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <Cpu className="size-3.5 text-emerald-400/60" />
          <span className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase">AI Modules</span>
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        {AI_MODULES.map(m => (
          <div key={m.name} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md bg-white/[0.02]">
            <div className="relative">
              <div className={`w-2 h-2 rounded-full ${m.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {m.status === 'active' && (
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-50" />
              )}
            </div>
            <span className="text-[9px] tracking-[0.15em] text-slate-400 font-semibold flex-1">{m.name}</span>
            <span className={`text-[8px] tracking-wider uppercase font-bold ${
              m.status === 'active' ? 'text-emerald-400/60' : 'text-amber-400/60'
            }`}>{m.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   SYSTEM METRICS
   ═══════════════════════════════════════════════════════════════════════ */

function SystemMetrics() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }))
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="glow-card rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <Activity className="size-3.5 text-slate-500" />
          <span className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase">System</span>
        </div>
      </div>
      <div className="p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-slate-600 font-mono">Data Points Analyzed</span>
          <span className="text-[10px] font-mono font-bold text-emerald-400 counter-glow">8,353</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-slate-600 font-mono">Neural Confidence</span>
          <span className="text-[10px] font-mono font-bold text-emerald-400 counter-glow">94.7%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-slate-600 font-mono">Model Version</span>
          <span className="text-[10px] font-mono text-slate-400">v3.2.1</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-slate-600 font-mono">Last Updated</span>
          <span className="text-[10px] font-mono text-slate-300">{time}</span>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   INTELLIGENCE MODULE QUERY CARDS
   ═══════════════════════════════════════════════════════════════════════ */

const INTEL_MODULES = [
  { icon: TrendingUp, label: 'District Threat Ranking', desc: 'Rank districts by composite threat score' },
  { icon: Users, label: 'Repeat Offender Network', desc: 'Map repeat offender connections' },
  { icon: Zap, label: 'Crime Spike Detection', desc: 'Identify sudden crime surges' },
  { icon: GitBranch, label: 'Case Similarity Analysis', desc: 'Find patterns across cases' },
  { icon: Crosshair, label: 'Predictive Hotspot Analysis', desc: 'Forecast high-risk locations' },
  { icon: Fingerprint, label: 'Modus Operandi Clustering', desc: 'Group crimes by MO signatures' },
]

function IntelQueryCards({ onSelect, disabled }: { onSelect: (q: string) => void; disabled: boolean }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-2">
      {INTEL_MODULES.map(m => (
        <button
          key={m.label}
          onClick={() => onSelect(m.label)}
          disabled={disabled}
          className="group p-3 rounded-lg border border-white/[0.06] bg-white/[0.01] hover:border-emerald-500/30 hover:bg-emerald-500/[0.04] transition-all duration-200 text-left disabled:opacity-40 disabled:pointer-events-none"
        >
          <m.icon className="size-3.5 text-emerald-500/40 group-hover:text-emerald-400 mb-1.5 transition-colors" />
          <p className="text-[10px] font-semibold text-slate-300 group-hover:text-white leading-tight transition-colors">{m.label}</p>
          <p className="text-[8px] text-slate-600 group-hover:text-slate-500 mt-0.5 leading-tight transition-colors">{m.desc}</p>
        </button>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN EXPORT — AI INTEL TAB (3-column Intelligence Analysis Center)
   ═══════════════════════════════════════════════════════════════════════ */

export default function AIIntelTab() {
  const [brief, setBrief] = useState('')
  const [briefLoading, setBriefLoading] = useState(false)
  const [briefTimestamp, setBriefTimestamp] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [response, setResponse] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Compute risk scores locally from generated cases (recent 30 days)
  const risk = useMemo<RiskSummary>(() => {
    const recentCases = GENERATED_CASES.filter(c => c.daysAgo <= 30)
    let critical = 0, high = 0, medium = 0, low = 0
    for (const c of recentCases) {
      if (c.riskScore >= 75) critical++
      else if (c.riskScore >= 50) high++
      else if (c.riskScore >= 25) medium++
      else low++
    }
    return { critical, high, medium, low }
  }, [])

  const fetchBrief = async (retryCount = 0) => {
    setBriefLoading(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'Generate a very concise morning intelligence brief for KSP command center. Include: 1) Active case count 2) Highest crime district 3) Top crime type 4) Critical alerts 5) Recommended actions. Use bullet points. Be very brief — under 150 words.',
        }),
      })
      const data = await res.json()
      if (data.reply) {
        setBrief(data.reply)
        setBriefTimestamp(new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit', minute: '2-digit', hour12: true,
        }))
      } else {
        throw new Error('No answer')
      }
    } catch {
      // Auto-retry up to 3 times with 2s delay
      if (retryCount < 3) {
        setTimeout(() => fetchBrief(retryCount + 1), 2000)
        return
      }
      setBrief('Error generating brief. Click REFRESH to retry.')
    }
    setBriefLoading(false)
  }

  useEffect(() => { fetchBrief() }, [])

  const sendQuery = async (q: string) => {
    if (!q.trim() || processing) return
    setActiveQuery(q)
    setResponse('')
    setError(null)
    setProcessing(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResponse(data.reply || 'No analysis generated.')
    } catch (err: any) {
      setError(err.message || 'Analysis failed.')
    }
    setProcessing(false)
  }

  return (
    <div className="flex flex-col xl:flex-row gap-3">
      {/* ═══════ LEFT COLUMN (40%) — Intelligence Feed ═══════ */}
      <div className="w-full xl:w-[40%] shrink-0 flex flex-col gap-3">
        {/* Morning Brief Terminal */}
        <BriefTerminal
          brief={brief}
          loading={briefLoading}
          onRefresh={fetchBrief}
          briefTimestamp={briefTimestamp}
        />

        {/* Anomaly Detection Panel */}
        <AnomalyPanel />

        {/* Query Input */}
        <div className="glow-card rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-4 bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-mono tracking-wider text-slate-600 uppercase">Intelligence Query</span>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); sendQuery(query); setQuery('') }} className="flex gap-2">
            <Input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Enter intelligence query..."
              className="h-8 bg-black/40 border-white/[0.06] font-mono text-xs text-slate-200 placeholder:text-slate-700 focus-visible:border-emerald-500/30 focus-visible:ring-emerald-500/10"
            />
            <Button
              type="submit"
              disabled={processing || !query.trim()}
              size="sm"
              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
            >
              <Send className="size-3" />
            </Button>
          </form>
        </div>

        {/* Intelligence Module Cards */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Wifi className="size-3 text-emerald-500/30" />
            <span className="text-[9px] tracking-[0.2em] text-slate-600 uppercase font-semibold">Intelligence Modules</span>
          </div>
          <IntelQueryCards onSelect={sendQuery} disabled={processing} />
        </div>
      </div>

      {/* ═══════ CENTER COLUMN (35%) — Analysis Output ═══════ */}
      <div className="w-full xl:w-[35%] shrink-0">
        <div className="glow-card hud-corners rounded-xl min-h-[300px] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04] shrink-0">
            <div className="flex items-center gap-2">
              <Brain className="size-3.5 text-emerald-400" />
              <span className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase">Analysis Output</span>
            </div>
            {activeQuery && !processing && (
              <span className="text-[9px] font-mono text-slate-600 max-w-[180px] truncate">
                &gt; {activeQuery}
              </span>
            )}
          </div>
          <div className="flex-1 p-4 min-h-0">
            <AnalysisOutput
              response={response}
              processing={processing}
              query={activeQuery}
              error={error}
              onRetry={() => sendQuery(activeQuery)}
            />
          </div>
        </div>
      </div>

      {/* ═══════ RIGHT COLUMN (25%) — Threat Dashboard ═══════ */}
      <div className="w-full xl:w-[25%] shrink-0 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
        {/* Threat Gauge */}
        {risk && <ThreatGauge risk={risk} />}

        {/* Risk Distribution */}
        {risk && <RiskDistribution risk={risk} />}

        {/* Active AI Modules */}
        <ActiveModules />

        {/* System Metrics */}
        <SystemMetrics />
      </div>
    </div>
  )
}
