'use client'

import { useState, useMemo } from 'react'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  ShieldAlert,
  Radio,
  Clock,
  MapPin,
  AlertTriangle,
  ChevronRight,
  Activity,
  TrendingUp,
} from 'lucide-react'

import { GENERATED_CASES } from '@/lib/case-generator'

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface DistrictPrediction {
  id: string
  name: string
  hourlyCounts: number[]
  totalCrimes: number
  riskLevels: string[]
}

interface PatrolData {
  districts: DistrictPrediction[]
  peakHours: number[]
  globalHourly: number[]
  maxHourlyCount: number
}

/* ═══════════════════════════════════════════════════════════════
   FRAMER VARIANTS
   ═══════════════════════════════════════════════════════════════ */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

function getRiskColor(level: string): string {
  switch (level) {
    case 'Critical': return 'text-red-400'
    case 'High': return 'text-amber-400'
    case 'Medium': return 'text-yellow-500'
    default: return 'text-emerald-400'
  }
}

function getRiskBg(level: string): string {
  switch (level) {
    case 'Critical': return 'bg-red-500/10 border-red-500/20'
    case 'High': return 'bg-amber-500/10 border-amber-500/20'
    case 'Medium': return 'bg-yellow-500/10 border-yellow-500/20'
    default: return 'bg-emerald-500/10 border-emerald-500/20'
  }
}

function getRiskIcon(level: string) {
  switch (level) {
    case 'Critical': return <AlertTriangle className="size-4 text-red-400" />
    case 'High': return <ShieldAlert className="size-4 text-amber-400" />
    case 'Medium': return <Activity className="size-4 text-yellow-500" />
    default: return <ShieldAlert className="size-4 text-emerald-400" />
  }
}

function getBarGradient(level: string): string {
  switch (level) {
    case 'Critical': return 'from-red-500 to-red-400'
    case 'High': return 'from-amber-500 to-amber-400'
    case 'Medium': return 'from-yellow-500 to-yellow-400'
    default: return 'from-emerald-500 to-emerald-400'
  }
}

function getBarColor(count: number, maxCount: number): string {
  if (maxCount === 0) return 'bg-emerald-500'
  const ratio = count / maxCount
  if (ratio >= 0.8) return 'bg-red-500'
  if (ratio >= 0.55) return 'bg-amber-500'
  if (ratio >= 0.25) return 'bg-yellow-500'
  return 'bg-emerald-500'
}

function getBarGlowColor(count: number, maxCount: number): string {
  if (maxCount === 0) return 'shadow-emerald-500/30'
  const ratio = count / maxCount
  if (ratio >= 0.8) return 'shadow-red-500/30'
  if (ratio >= 0.55) return 'shadow-amber-500/30'
  if (ratio >= 0.25) return 'shadow-yellow-500/30'
  return 'shadow-emerald-500/30'
}

function getDeploymentUnits(count: number, maxCount: number): number {
  if (maxCount === 0) return 0
  const ratio = count / maxCount
  if (ratio >= 0.8) return 4
  if (ratio >= 0.55) return 3
  if (ratio >= 0.25) return 2
  return 1
}

function formatHour(h: number): string {
  return `${h.toString().padStart(2, '0')}:00`
}

/* ═══════════════════════════════════════════════════════════════
   SKELETON LOADER
   ═══════════════════════════════════════════════════════════════ */

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Time slider skeleton */}
      <div className="flex flex-col items-center gap-4 py-4">
        <Skeleton className="h-12 w-48 bg-white/5" />
        <Skeleton className="h-6 w-full max-w-3xl bg-white/5" />
      </div>
      {/* Top 3 cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-28 rounded-xl bg-white/5" />
        ))}
      </div>
      {/* District list skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg bg-white/5" />
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function PredictivePatrolTab() {
  const [selectedHour, setSelectedHour] = useState(() => new Date().getHours())
  const [loading] = useState(false)

  // Compute patrol predictions from local 10K cases
  const data = useMemo<PatrolData>(() => {
    const recentCases = GENERATED_CASES.filter(c => c.daysAgo <= 30)

    // Group by district & compute hourly distribution
    const districtMap = new Map<string, { hourly: number[]; totalRisk: number }>()

    for (const c of recentCases) {
      if (!districtMap.has(c.district)) {
        districtMap.set(c.district, { hourly: new Array(24).fill(0), totalRisk: 0 })
      }
      const entry = districtMap.get(c.district)!
      const hour = parseInt(c.occurrenceDate.split(' ')[1]?.split(':')[0] || '12')
      if (hour >= 0 && hour < 24) {
        entry.hourly[hour]++
      }
      entry.totalRisk += c.riskScore
    }

    const districts: DistrictPrediction[] = []

    for (const [name, { hourly, totalRisk }] of districtMap) {
      const totalCrimes = hourly.reduce((s, v) => s + v, 0)
      const avgRisk = totalCrimes > 0 ? totalRisk / totalCrimes : 50
      const maxH = Math.max(...hourly, 1)

      // Per-hour risk levels: blend relative hour intensity with district avg risk
      const riskLevels = hourly.map(count => {
        if (count === 0) return 'Low'
        const ratio = count / maxH
        const riskBoost = avgRisk > 60 ? 0.12 : avgRisk > 40 ? 0.05 : -0.05
        const adjusted = Math.min(1, ratio + riskBoost)
        if (adjusted >= 0.8) return 'Critical'
        if (adjusted >= 0.55) return 'High'
        if (adjusted >= 0.25) return 'Medium'
        return 'Low'
      })

      districts.push({
        id: `district-${name.replace(/\s+/g, '-').toLowerCase()}`,
        name,
        hourlyCounts: hourly,
        totalCrimes,
        riskLevels,
      })
    }

    districts.sort((a, b) => b.totalCrimes - a.totalCrimes)

    // Global hourly aggregation
    const globalHourly = new Array(24).fill(0) as number[]
    for (const d of districts) {
      for (let h = 0; h < 24; h++) {
        globalHourly[h] += d.hourlyCounts[h]
      }
    }

    const maxHourlyCount = Math.max(...globalHourly, 0)

    // Peak hours: top 3 globally busiest hours
    const peakHours = globalHourly
      .map((count, hour) => ({ count, hour }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(e => e.hour)
      .sort((a, b) => a - b)

    return { districts, peakHours, globalHourly, maxHourlyCount }
  }, [])

  // Compute sorted districts for selected hour
  const sortedDistricts = useMemo(() => {
    if (!data) return []
    return [...data.districts]
      .map(d => ({
        ...d,
        currentHourCount: d.hourlyCounts[selectedHour],
        currentRiskLevel: d.riskLevels[selectedHour],
      }))
      .sort((a, b) => b.currentHourCount - a.currentHourCount)
  }, [data, selectedHour])

  // Top 3 hotspots
  const top3 = sortedDistricts.slice(0, 3)

  // #1 hotspot for mini chart
  const topDistrict = top3[0]

  // Peak hours at selected time
  const isPeakHour = data?.peakHours.includes(selectedHour) ?? false

  // Deployment recommendation
  const deploymentText = useMemo(() => {
    const candidates = sortedDistricts.filter(d => d.currentHourCount > 0).slice(0, 3)
    if (candidates.length === 0 || candidates[0].currentHourCount === 0) {
      return 'Minimal patrol required — low predicted activity at this hour.'
    }
    const parts = candidates.map(d => {
      const units = getDeploymentUnits(d.currentHourCount, data?.maxHourlyCount ?? 1)
      return `${units} unit${units > 1 ? 's' : ''} to ${d.name}`
    })
    if (parts.length === 0) return 'Minimal patrol required — low predicted activity at this hour.'
    return `Deploy ${parts.join(', ')}.`
  }, [sortedDistricts, data?.maxHourlyCount])

  // Max count for this hour (for bar width)
  const maxCountThisHour = sortedDistricts[0]?.currentHourCount ?? 0

  return (
    <div className="space-y-6">
      {loading && <LoadingSkeleton />}

      {!loading && data && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* ── Time Slider Section ── */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex flex-col items-center gap-4 py-2">
              {/* Hour display */}
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Clock className="size-5 text-emerald-500" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">
                    Predicted Hour
                    {isPeakHour && (
                      <span className="ml-2 inline-flex items-center gap-1 text-red-400">
                        <AlertTriangle className="size-3" /> PEAK
                      </span>
                    )}
                  </p>
                  <p className="text-4xl font-bold text-white tabular-nums tracking-wider">
                    {formatHour(selectedHour)}
                  </p>
                </div>
              </div>

              {/* Slider */}
              <div className="w-full max-w-3xl px-2">
                <Slider
                  value={[selectedHour]}
                  onValueChange={(v) => setSelectedHour(v[0])}
                  min={0}
                  max={23}
                  step={1}
                  className="w-full [&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:w-5 [&_[data-slot=slider-thumb]]:h-5 [&_[data-slot=slider-thumb]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-400 [&_[data-slot=slider-thumb]]:shadow-emerald-500/40 [&_[data-slot=slider-thumb]]:shadow-lg"
                />
                {/* Hour labels */}
                <div className="flex justify-between mt-2 px-0.5">
                  {Array.from({ length: 24 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedHour(i)}
                      className={`
                        text-[9px] tabular-nums transition-colors duration-150 cursor-pointer
                        ${i === selectedHour
                          ? 'text-emerald-400 font-bold'
                          : data.peakHours.includes(i)
                            ? 'text-red-400/70 hover:text-red-400'
                            : 'text-slate-600 hover:text-slate-400'
                        }
                      `}
                    >
                      {i % 3 === 0 ? `${i}` : ''}
                    </button>
                  ))}
                </div>
                {/* Peak hour indicators */}
                <div className="flex justify-center gap-4 mt-3">
                  {data.peakHours.map(h => (
                    <Badge
                      key={h}
                      variant="outline"
                      className="text-[9px] border-red-500/30 text-red-400/80 bg-red-500/5 cursor-pointer hover:bg-red-500/10 transition-colors"
                      onClick={() => setSelectedHour(h)}
                    >
                      <AlertTriangle className="size-2.5 mr-1" />
                      Peak {formatHour(h)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Top 3 Hotspot Alert Cards ── */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {top3.map((d, idx) => {
              const isTop = idx === 0
              return (
                <motion.div
                  key={d.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Card className={`${getRiskBg(d.currentRiskLevel)} border backdrop-blur-sm overflow-hidden relative`}>
                    {/* Rank badge */}
                    <div className="absolute top-3 right-3">
                      <div className={`
                        w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                        ${isTop ? 'bg-emerald-500 text-black' : 'bg-white/5 text-slate-400'}
                      `}>
                        #{idx + 1}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`
                          shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                          ${isTop ? 'bg-emerald-500/20' : 'bg-white/5'}
                        `}>
                          {isTop ? (
                            <Radio className="size-5 text-emerald-400" />
                          ) : (
                            getRiskIcon(d.currentRiskLevel)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-400 truncate">{d.name}</p>
                          <p className={`text-2xl font-bold tabular-nums ${getRiskColor(d.currentRiskLevel)} mt-0.5`}>
                            {d.currentHourCount}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            predicted incidents
                          </p>
                        </div>
                      </div>
                      {/* Risk level badge */}
                      <div className="mt-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${getRiskBg(d.currentRiskLevel)} ${getRiskColor(d.currentRiskLevel)} border`}
                        >
                          {d.currentRiskLevel} Risk
                        </Badge>
                        {isTop && d.currentHourCount > 0 && (
                          <Badge variant="outline" className="text-[10px] ml-1.5 border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                            <TrendingUp className="size-2.5 mr-1" />
                            TOP HOTSPOT
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}

            {/* If less than 3 hotspots, fill empty cards */}
            {top3.length < 3 && Array.from({ length: 3 - top3.length }).map((_, i) => (
              <Card key={`empty-${i}`} className="bg-white/[0.02] border-white/[0.04] border-dashed">
                <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[120px]">
                  <ShieldAlert className="size-6 text-slate-700 mb-2" />
                  <p className="text-[10px] text-slate-600">No data</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* ── Bottom Section: Mini Chart + District List ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 24-hour Mini Chart for #1 Hotspot */}
            <motion.div variants={itemVariants} className="lg:col-span-4">
              <Card className="bg-white/[0.02] border-white/[0.06] h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="size-3.5 text-emerald-500" />
                    <h3 className="text-xs font-semibold text-slate-300">
                      24h Pattern
                    </h3>
                  </div>
                  {topDistrict ? (
                    <>
                      <p className="text-[10px] text-slate-500 mb-3 truncate">
                        {topDistrict.name} — Hourly Distribution
                      </p>
                      {/* Bar chart */}
                      <div className="flex items-end gap-[3px] h-36 mb-2">
                        {topDistrict.hourlyCounts.map((count, h) => {
                          const maxH = Math.max(...topDistrict.hourlyCounts, 1)
                          const heightPct = (count / maxH) * 100
                          const isSelected = h === selectedHour
                          const isPeak = data.peakHours.includes(h)
                          return (
                            <motion.div
                              key={h}
                              className="flex-1 min-w-[6px] rounded-t-sm relative group cursor-pointer"
                              style={{
                                height: `${Math.max(heightPct, 2)}%`,
                              }}
                              onClick={() => setSelectedHour(h)}
                              whileHover={{ opacity: 0.8 }}
                              animate={{
                                backgroundColor: isSelected
                                  ? '#10b981'
                                  : isPeak
                                    ? 'rgba(239,68,68,0.6)'
                                    : count > 0
                                      ? 'rgba(148,163,184,0.25)'
                                      : 'rgba(148,163,184,0.08)',
                              }}
                              transition={{ duration: 0.2 }}
                            >
                              {/* Tooltip on hover */}
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                                <div className="bg-slate-800 text-[9px] text-slate-200 px-1.5 py-0.5 rounded whitespace-nowrap shadow-lg border border-white/10">
                                  {formatHour(h)}: {count}
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                      {/* X-axis labels */}
                      <div className="flex justify-between">
                        <span className="text-[8px] text-slate-600">00</span>
                        <span className="text-[8px] text-slate-600">06</span>
                        <span className="text-[8px] text-slate-600">12</span>
                        <span className="text-[8px] text-slate-600">18</span>
                        <span className="text-[8px] text-slate-600">23</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-40">
                      <p className="text-xs text-slate-600">No data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* District Heatmap List */}
            <motion.div variants={itemVariants} className="lg:col-span-8">
              <Card className="bg-white/[0.02] border-white/[0.06]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-3.5 text-emerald-500" />
                      <h3 className="text-xs font-semibold text-slate-300">
                        District Risk Map
                      </h3>
                      <Badge variant="outline" className="text-[9px] border-white/10 text-slate-500 ml-2">
                        {sortedDistricts.filter(d => d.currentHourCount > 0).length} active
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[9px] text-slate-600">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Low</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Med</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> High</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
                    </div>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                    <AnimatePresence mode="popLayout">
                      {sortedDistricts.map((d, idx) => {
                        const barWidth = maxCountThisHour > 0
                          ? Math.max((d.currentHourCount / maxCountThisHour) * 100, d.currentHourCount > 0 ? 4 : 0)
                          : 0
                        const barColorClass = getBarColor(d.currentHourCount, data.maxHourlyCount)
                        const glowClass = getBarGlowColor(d.currentHourCount, data.maxHourlyCount)

                        return (
                          <motion.div
                            key={d.id}
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.25, delay: idx * 0.01 }}
                            className={`
                              flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150
                              ${d.currentHourCount === maxCountThisHour && maxCountThisHour > 0
                                ? 'bg-white/[0.03] border border-emerald-500/10'
                                : 'hover:bg-white/[0.015]'
                              }
                            `}
                          >
                            {/* Rank */}
                            <span className={`
                              w-5 text-[10px] tabular-nums text-right shrink-0
                              ${idx < 3 ? 'text-emerald-400 font-bold' : 'text-slate-600'}
                            `}>
                              {idx + 1}
                            </span>

                            {/* District name */}
                            <span className="text-[11px] text-slate-400 w-36 sm:w-44 truncate shrink-0">
                              {d.name}
                            </span>

                            {/* Bar */}
                            <div className="flex-1 h-5 bg-white/[0.03] rounded-sm overflow-hidden relative">
                              <motion.div
                                className={`h-full rounded-sm ${barColorClass} shadow-md ${glowClass}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${barWidth}%` }}
                                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: idx * 0.01 }}
                              />
                              {/* Count label inside bar */}
                              {d.currentHourCount > 0 && barWidth > 15 && (
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-white/90 tabular-nums">
                                  {d.currentHourCount}
                                </span>
                              )}
                            </div>

                            {/* Count outside bar (when bar is too small) */}
                            {d.currentHourCount > 0 && barWidth <= 15 && (
                              <span className={`text-[10px] tabular-nums shrink-0 ${getRiskColor(d.currentRiskLevel)}`}>
                                {d.currentHourCount}
                              </span>
                            )}

                            {/* Risk badge for top districts */}
                            {idx < 10 && d.currentHourCount > 0 && (
                              <Badge
                                variant="outline"
                                className={`text-[8px] shrink-0 ${getRiskBg(d.currentRiskLevel)} ${getRiskColor(d.currentRiskLevel)} border hidden sm:inline-flex`}
                              >
                                {d.currentRiskLevel}
                              </Badge>
                            )}

                            {/* Chevron for top 3 */}
                            {idx < 3 && d.currentHourCount > 0 && (
                              <ChevronRight className="size-3 text-slate-600 shrink-0" />
                            )}
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* ── Deployment Recommendation ── */}
          <motion.div variants={itemVariants}>
            <Card className="bg-emerald-500/[0.03] border-emerald-500/10">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mt-0.5">
                  <Radio className="size-4 text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-emerald-400 mb-1">
                    Patrol Deployment Recommendation
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {deploymentText}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-1.5">
                    Based on historical crime frequency patterns for {formatHour(selectedHour)} across all Karnataka districts.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
