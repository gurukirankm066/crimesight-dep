'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Brain, AlertTriangle, Shield, TrendingUp, MapPin, Zap, BarChart3, Activity, Clock, Users, ChevronDown
} from 'lucide-react'
import { GENERATED_CASES, getGeneratedStats, getRecentCases, getGeneratedPriorityStats } from '@/lib/case-generator'
import { useCrimeSightStore } from '@/lib/store'
import LastSynced from '@/components/crimesight/last-synced'

// Types

interface ComputedAnomaly {
  id: number
  severity: 'Critical' | 'Warning' | 'Info'
  type: 'Spike' | 'Pattern' | 'Outlier'
  district: string
  metric: string
  description: string
  timestamp: string
}

// Shared constants

const SEVERITY_STYLES: Record<string, { border: string; badge: string; icon: string }> = {
  Critical: { border: 'border-l-red-500', badge: 'text-red-400 bg-red-500/10 border-red-500/20', icon: 'text-red-400' },
  Warning: { border: 'border-l-amber-500', badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: 'text-amber-400' },
  Info: { border: 'border-l-cyan-500', badge: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', icon: 'text-cyan-400' },
}

// Helpers

function parseDate(str: string): Date {
  if (!str) return new Date(0)
  const d = new Date(str.replace(' ', 'T'))
  return isNaN(d.getTime()) ? new Date(0) : d
}

function confidenceScore(n: number): number {
  return Math.min(95, Math.round(30 + Math.min(n, 15) * 4.5))
}

const COLD_CASES = [
  {
    fir: 'FIR/2024/KSP/0342',
    crime: 'Murder (IPC 302)',
    district: 'Mysuru',
    date: '2024-03-14',
    victim: 'Nagaraj P. (48), businessman',
    io: 'PSI Venkatesh R (retired)',
    status: 'Stale — No progress in 14 months',
    solvability: 72,
    rationale: 'New AFIS match: fingerprint from crime scene now matches suspect arrested in unrelated case (FIR/2025/KSP/0189, Bengaluru Urban). Cross-referencing suggests suspect operated in both districts.',
    action: 'Coordinate with Bengaluru Urban CP for suspect interrogation and identity confirmation.',
  },
  {
    fir: 'FIR/2023/KSP/0087',
    crime: 'Robbery (IPC 395 r/w 397)',
    district: 'Davanagere',
    date: '2023-11-22',
    victim: 'Karnataka State Cooperative Bank, Harihar branch',
    io: 'PSI Nandini Bhat P (transferred)',
    status: 'Transferred — IO posted out',
    solvability: 58,
    rationale: 'Similar MO to 3 recent robberies in Chitradurga and Ballari (FIR/2025/KSP/0045, 0051, 0063). Possible interstate gang. ANPR data from NH-4 toll plaza shows vehicle matching description.',
    action: 'Consolidate under single IO. Request toll plaza ANPR data from NHAI.',
  },
  {
    fir: 'FIR/2024/KSP/0567',
    crime: 'Kidnapping (IPC 363)',
    district: 'Belagavi',
    date: '2024-06-08',
    victim: 'Pooja S. (14), student',
    io: 'SI Mohammed Irfan K',
    status: 'Open — Partial leads',
    solvability: 85,
    rationale: "CRITICAL BREAKTHROUGH: Victim's recovered mobile phone (seized as evidence) has been forensically unlocked by FSL. Call records and WhatsApp chats recovered. Two phone numbers repeatedly contacted — one traced to Goa, one to Maharashtra border town.",
    action: 'Immediate: Issue lookout circular to Goa and Maharashtra police. Forward phone numbers to telecom providers for subscriber details.',
  },
  {
    fir: 'FIR/2023/KSP/0212',
    crime: 'Dowry Death (IPC 304B r/w 498A)',
    district: 'Raichur',
    date: '2023-08-30',
    victim: 'Lakshmi Devi R. (26)',
    io: 'PSI Prakash Naik D',
    status: 'Open — Accused absconding',
    solvability: 64,
    rationale: 'Accused husband Ravi K. recently arrested in Hyderabad for similar offence (Cheating case, Cyberabad PS). Karnataka police not notified. Possible double identity — same person with different Aadhaar details.',
    action: 'Confirm identity through biometric matching. If confirmed, initiate extradition process from Telangana.',
  },
  {
    fir: 'FIR/2024/KSP/0789',
    crime: 'Narcotics (NDPS Act 8(c), 22)',
    district: 'Uttara Kannada',
    date: '2024-09-17',
    victim: 'State of Karnataka (seizure: 4.7 kg ganja)',
    io: 'PSI Harish Chandra B',
    status: 'Open — Supply chain identified, kingpin unknown',
    solvability: 78,
    rationale: 'Supply chain analysis from this case and 2 others (FIR/2025/KSP/0147, FIR/2025/KSP/0148) reveals common procurement source in coastal Karnataka. Money trail leads to same hawala operator. Connects to Operation Black Lotus.',
    action: 'Merge with Operation Black Lotus task force. Assign to SP Dakshina Kannada for coordinated investigation.',
  },
]

// Component

export default function AIAnalysisTab() {
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [anomaliesVisible, setAnomaliesVisible] = useState(false)
  const [expandedColdCase, setExpandedColdCase] = useState<string | null>(null)
  const navigateToFir = useCrimeSightStore((s) => s.navigateToFir)

  // ───────────────────────────────────────────────────────────────────
  // 1. ANOMALY DETECTION — Real statistical computation
  // ───────────────────────────────────────────────────────────────────

  const computedAnomalies = useMemo<ComputedAnomaly[]>(() => {
    const anomalies: ComputedAnomaly[] = []
    let id = 1

    // Parse dates once
    const casesWithDates = GENERATED_CASES.map(c => ({
      ...c,
      occurrenceDate: parseDate(c.occurrenceDate),
      complaintDate: parseDate(c.complaintDate),
    }))

    // ── A. Z-Score Spike Detection per District ──
    const districtCounts = new Map<string, number>()
    for (const c of casesWithDates) {
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
        let severity: 'Critical' | 'Warning' | 'Info'
        if (zScore > 3) severity = 'Critical'
        else if (zScore > 2) severity = 'Warning'
        else severity = 'Info'

        anomalies.push({
          id: id++,
          severity,
          type: 'Spike',
          district: districtName,
          metric: 'Case volume',
          description: `${districtName} shows ${zScore.toFixed(1)}σ above average with ${count} cases (mean: ${mean.toFixed(1)}, threshold: ${(mean + 1.5 * std).toFixed(1)})`,
          timestamp: 'Just now',
        })
      }
    }

    // ── B. Crime Type Correlation Anomalies ──
    // State-wide crime type proportions
    const stateCrimeTypeCounts = new Map<string, number>()
    for (const c of casesWithDates) {
      stateCrimeTypeCounts.set(c.crimeType, (stateCrimeTypeCounts.get(c.crimeType) || 0) + 1)
    }
    const totalCases = casesWithDates.length

    // Per-district crime type breakdown
    const districtCases = new Map<string, typeof casesWithDates>()
    for (const c of casesWithDates) {
      if (!districtCases.has(c.district)) districtCases.set(c.district, [])
      districtCases.get(c.district)!.push(c)
    }

    for (const [districtName, dCases] of districtCases) {
      if (dCases.length < 3) continue

      const crimeTypeCounts = new Map<string, number>()
      for (const c of dCases) {
        crimeTypeCounts.set(c.crimeType, (crimeTypeCounts.get(c.crimeType) || 0) + 1)
      }

      // Find the most overrepresented crime type in this district
      let bestRatio = 0
      let bestCrimeType = ''
      let bestDistrictProp = 0
      let bestStateProp = 0
      let bestCount = 0

      for (const [crimeTypeName, count] of crimeTypeCounts) {
        const districtProp = count / dCases.length
        const stateProp = (stateCrimeTypeCounts.get(crimeTypeName) || 0) / totalCases

        // Must be >30% of district AND significantly above state average
        if (districtProp > 0.30 && stateProp > 0 && districtProp / stateProp > bestRatio) {
          bestRatio = districtProp / stateProp
          bestCrimeType = crimeTypeName
          bestDistrictProp = districtProp
          bestStateProp = stateProp
          bestCount = count
        }
      }

      if (bestCrimeType && bestRatio > 1.5) {
        anomalies.push({
          id: id++,
          severity: bestDistrictProp > 0.50 ? 'Warning' : 'Info',
          type: 'Pattern',
          district: districtName,
          metric: bestCrimeType,
          description: `${districtName}: ${Math.round(bestDistrictProp * 100)}% of cases are ${bestCrimeType} (${bestCount}/${dCases.length}) — ${bestRatio.toFixed(1)}× the state average of ${Math.round(bestStateProp * 100)}%`,
          timestamp: 'Just now',
        })
      }
    }

    // ── C. Time-Based Anomalies ──
    // C1. Temporal clustering: districts where >50% of cases fall within any 7-day window
    for (const [districtName, dCases] of districtCases) {
      if (dCases.length < 4) continue

      const sorted = [...dCases].sort((a, b) => a.occurrenceDate.getTime() - b.occurrenceDate.getTime())
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000

      let maxClusterSize = 0
      for (let i = 0; i < sorted.length; i++) {
        const windowEnd = sorted[i].occurrenceDate.getTime() + sevenDaysMs
        let count = 0
        for (let j = i; j < sorted.length && sorted[j].occurrenceDate.getTime() <= windowEnd; j++) {
          count++
        }
        if (count > maxClusterSize) maxClusterSize = count
      }

      const clusterRatio = maxClusterSize / sorted.length
      if (clusterRatio > 0.50) {
        anomalies.push({
          id: id++,
          severity: clusterRatio > 0.75 ? 'Critical' : clusterRatio > 0.60 ? 'Warning' : 'Info',
          type: 'Outlier',
          district: districtName,
          metric: 'Temporal clustering',
          description: `${Math.round(clusterRatio * 100)}% of ${districtName}'s cases (${maxClusterSize}/${sorted.length}) cluster within a 7-day window — suggests burst criminal activity`,
          timestamp: 'Just now',
        })
      }
    }

    // C2. Unusual time-of-day patterns per crime type
    const crimeTypeCasesMap = new Map<string, typeof casesWithDates>()
    for (const c of casesWithDates) {
      if (!crimeTypeCasesMap.has(c.crimeType)) crimeTypeCasesMap.set(c.crimeType, [])
      crimeTypeCasesMap.get(c.crimeType)!.push(c)
    }

    // Compute overall hourly distribution for baseline comparison
    const allHours = casesWithDates.map(c => c.occurrenceDate.getHours())

    for (const [crimeTypeName, cCases] of crimeTypeCasesMap) {
      if (cCases.length < 3) continue

      const crimeHours = cCases.map(c => c.occurrenceDate.getHours())

      // Check each 4-hour sliding window
      let bestWindowProp = 0
      let bestWindowStart = 0

      for (let ws = 0; ws < 24; ws++) {
        const we = (ws + 4) % 24
        let inWindow: number
        if (we > ws) {
          inWindow = crimeHours.filter(h => h >= ws && h < we).length
        } else {
          inWindow = crimeHours.filter(h => h >= ws || h < we).length
        }
        const prop = inWindow / crimeHours.length
        if (prop > bestWindowProp) {
          bestWindowProp = prop
          bestWindowStart = ws
        }
      }

      if (bestWindowProp > 0.55) {
        // Baseline: what fraction of ALL cases fall in this window?
        const we = (bestWindowStart + 4) % 24
        let allInWindow: number
        if (we > bestWindowStart) {
          allInWindow = allHours.filter(h => h >= bestWindowStart && h < we).length
        } else {
          allInWindow = allHours.filter(h => h >= bestWindowStart || h < we).length
        }
        const baselineProp = allInWindow / allHours.length

        // Flag if crime type is at least 1.4× the baseline
        if (baselineProp > 0 && bestWindowProp / baselineProp > 1.4) {
          const endHour = (bestWindowStart + 4) % 24
          anomalies.push({
            id: id++,
            severity: bestWindowProp > 0.70 ? 'Warning' : 'Info',
            type: 'Pattern',
            district: cCases[0].district,
            metric: `${crimeTypeName} timing`,
            description: `${crimeTypeName} shows temporal concentration: ${Math.round(bestWindowProp * 100)}% of cases occur in ${bestWindowStart.toString().padStart(2, '0')}:00–${endHour.toString().padStart(2, '0')}:00 window (${cCases.length} cases) — ${bestWindowProp > 0 ? (bestWindowProp / baselineProp).toFixed(1) : '∞'}× overall baseline`,
            timestamp: 'Just now',
          })
        }
      }
    }

    // Sort by severity (Critical first), then by type
    const severityOrder: Record<string, number> = { Critical: 0, Warning: 1, Info: 2 }
    anomalies.sort((a, b) =>
      (severityOrder[a.severity] ?? 2) - (severityOrder[b.severity] ?? 2)
      || (a.type === 'Spike' ? 0 : a.type === 'Outlier' ? 1 : 2) - (b.type === 'Spike' ? 0 : b.type === 'Outlier' ? 1 : 2)
    )

    // Re-number and cap at 12
    return anomalies.slice(0, 12).map((a, i) => ({ ...a, id: i + 1 }))
  }, [])

  // ───────────────────────────────────────────────────────────────────
  // 2. RISK ASSESSMENT — Computed from GENERATED_CASES.riskScore
  // ───────────────────────────────────────────────────────────────────

  const riskDistribution = useMemo(() => {
    let high = 0, medium = 0, low = 0
    GENERATED_CASES.forEach(c => {
      const s = c.riskScore || 0
      if (s >= 70) high++
      else if (s >= 40) medium++
      else low++
    })
    return { high, medium, low, total: GENERATED_CASES.length }
  }, [])

  const topRiskCases = useMemo(() =>
    [...GENERATED_CASES].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0)).slice(0, 5),
  [])

  // ───────────────────────────────────────────────────────────────────
  // 3. PREDICTIVE INSIGHTS — Real statistical computation
  // ───────────────────────────────────────────────────────────────────

  const computedPredictions = useMemo(() => {
    try {
    const now = new Date()
    const casesWithDates = GENERATED_CASES.map(c => ({
      ...c,
      occurrenceDate: parseDate(c.occurrenceDate),
    }))
    const totalCases = casesWithDates.length

    const predictions: Array<{
      icon: React.ComponentType<{ className?: string }>
      title: string
      value: string
      detail: string
      color: string
      confidence: number
      methodology: string
    }> = []

    // ── 1. Week-over-Week Trend ──
    const lastWeekEnd = new Date(now.getTime())
    const lastWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const prevWeekEnd = new Date(lastWeekStart.getTime())
    const prevWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const lastWeekCases = casesWithDates.filter(
      c => c.occurrenceDate >= lastWeekStart && c.occurrenceDate < lastWeekEnd
    )
    const prevWeekCases = casesWithDates.filter(
      c => c.occurrenceDate >= prevWeekStart && c.occurrenceDate < prevWeekEnd
    )

    const lwCount = lastWeekCases.length
    const pwCount = prevWeekCases.length
    const pctChange = pwCount > 0
      ? ((lwCount - pwCount) / pwCount) * 100
      : (lwCount > 0 ? 100 : 0)

    const trendDirection = pctChange > 5 ? 'increase' : pctChange < -5 ? 'decrease' : 'stable'
    const sign = pctChange > 0 ? '+' : ''

    predictions.push({
      icon: TrendingUp,
      title: 'Week-over-Week Trend',
      value: `${sign}${pctChange.toFixed(0)}% ${trendDirection}`,
      detail: `${lwCount} cases in the last 7 days vs ${pwCount} in the previous 7 days. ${pctChange > 5 ? 'Upward trend detected — heightened vigilance recommended.' : pctChange < -5 ? 'Downward trend — current enforcement measures showing results.' : 'Volume remains stable compared to the previous period.'}`,
      color: pctChange > 5 ? 'text-red-400' : pctChange < -5 ? 'text-emerald-400' : 'text-amber-400',
      confidence: confidenceScore(lwCount + pwCount),
      methodology: '7-day rolling window comparison',
    })

    // ── 2. Emerging Hotspot ──
    const last30End = new Date(now.getTime())
    const last30Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const prev30End = new Date(last30Start.getTime())
    const prev30Start = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const last30Cases = casesWithDates.filter(c => c.occurrenceDate >= last30Start && c.occurrenceDate < last30End)
    const prev30Cases = casesWithDates.filter(c => c.occurrenceDate >= prev30Start && c.occurrenceDate < prev30End)

    const districtLast30 = new Map<string, number>()
    const districtPrev30 = new Map<string, number>()
    for (const c of last30Cases) districtLast30.set(c.district, (districtLast30.get(c.district) || 0) + 1)
    for (const c of prev30Cases) districtPrev30.set(c.district, (districtPrev30.get(c.district) || 0) + 1)

    let maxPctIncrease = -Infinity
    let hotspotDistrict = ''
    let hotspotLastCount = 0
    let hotspotPrevCount = 0

    for (const [districtName, count] of districtLast30) {
      const prev = districtPrev30.get(districtName) || 0
      // Require at least some baseline to avoid noise from 0→1
      if (prev === 0 && count <= 1) continue
      const increase = prev > 0
        ? ((count - prev) / prev) * 100
        : 100 // New activity in previously silent district
      if (increase > maxPctIncrease) {
        maxPctIncrease = increase
        hotspotDistrict = districtName
        hotspotLastCount = count
        hotspotPrevCount = prev
      }
    }

    // Fallback if no district found (shouldn't happen with 10K cases)
    if (!hotspotDistrict) {
      hotspotDistrict = 'Bengaluru Urban'
      hotspotLastCount = districtLast30.get('Bengaluru Urban') || 0
      hotspotPrevCount = districtPrev30.get('Bengaluru Urban') || 0
      maxPctIncrease = 0
    }

    predictions.push({
      icon: MapPin,
      title: 'Emerging Hotspot',
      value: hotspotDistrict,
      detail: `Steepest 30-day increase: ${hotspotLastCount} cases (was ${hotspotPrevCount}). ${maxPctIncrease > 0 ? `+${maxPctIncrease.toFixed(0)}% change — monitor closely for resource deployment.` : maxPctIncrease === 0 ? 'New criminal activity detected in a previously quiet area.' : 'Declining activity — current measures effective.'}`,
      color: maxPctIncrease > 50 ? 'text-red-400' : maxPctIncrease > 0 ? 'text-amber-400' : 'text-emerald-400',
      confidence: confidenceScore(hotspotLastCount + hotspotPrevCount),
      methodology: '30-day vs 30-day district comparison',
    })

    // ── 3. Peak Crime Hour & Dominant Type ──
    const hourBuckets = new Array(24).fill(0)
    const hourCrimeTypeMap = new Map<number, Map<string, number>>()

    for (const c of casesWithDates) {
      const hour = c.occurrenceDate.getHours()
      hourBuckets[hour]++
      if (!hourCrimeTypeMap.has(hour)) hourCrimeTypeMap.set(hour, new Map())
      const m = hourCrimeTypeMap.get(hour)!
      m.set(c.crimeType, (m.get(c.crimeType) || 0) + 1)
    }

    const peakHour = hourBuckets.indexOf(Math.max(...hourBuckets))
    const peakHourTotal = hourBuckets[peakHour]
    const peakHourCrimes = hourCrimeTypeMap.get(peakHour) || new Map()

    let topTypeAtPeak = ''
    let topTypeCount = 0
    for (const [typeId, count] of peakHourCrimes) {
      if (count > topTypeCount) {
        topTypeCount = count
        topTypeAtPeak = typeId
      }
    }

    const endHour = (peakHour + 1) % 24
    const peakHourShare = totalCases > 0 ? ((peakHourTotal / totalCases) * 100).toFixed(1) : '0'

    predictions.push({
      icon: Clock,
      title: 'Peak Crime Hour',
      value: `${peakHour.toString().padStart(2, '0')}:00 – ${endHour.toString().padStart(2, '0')}:00`,
      detail: `Most active hour across all districts: ${peakHourTotal} cases (${peakHourShare}% of total). Dominant type: ${topTypeAtPeak || 'N/A'} (${topTypeCount} cases). Targeted patrols recommended during this window.`,
      color: 'text-red-400',
      confidence: confidenceScore(peakHourTotal),
      methodology: 'Hourly distribution analysis',
    })

    // ── 4. Resource Recommendation (highest active-to-total ratio) ──
    const districtStatusMap = new Map<string, { total: number; active: number }>()
    for (const c of casesWithDates) {
      if (!districtStatusMap.has(c.district)) districtStatusMap.set(c.district, { total: 0, active: 0 })
      const ds = districtStatusMap.get(c.district)!
      ds.total++
      if (c.status === 'Under Investigation' || c.status === 'Open') {
        ds.active++
      }
    }

    let maxRatio = -1
    let resDistrict = ''
    let resActive = 0
    let resTotal = 0

    for (const [districtName, { total, active }] of districtStatusMap) {
      if (total < 3) continue // Need minimum cases for meaningful ratio
      const ratio = active / total
      if (ratio > maxRatio) {
        maxRatio = ratio
        resDistrict = districtName
        resActive = active
        resTotal = total
      }
    }

    if (!resDistrict) {
      resDistrict = 'Bengaluru Urban'
      resActive = 0
      resTotal = 1
      maxRatio = 0
    }

    const recommendedUnits = Math.max(2, Math.ceil(resActive / 4))

    predictions.push({
      icon: Users,
      title: 'Resource Recommendation',
      value: `Deploy ${recommendedUnits} units`,
      detail: `${resDistrict} has ${resActive}/${resTotal} active cases (${Math.round(maxRatio * 100)}% active ratio) — highest unresolved caseload. Prioritize investigative resources here.`,
      color: 'text-cyan-400',
      confidence: confidenceScore(resTotal),
      methodology: 'Active-to-total case ratio analysis',
    })

    return predictions
    } catch {
      return [
        { icon: TrendingUp, title: 'Next Week Forecast', value: 'Monitoring', detail: 'Statistical engine initializing.', color: 'text-emerald-400', confidence: 50, methodology: 'Pending data load' },
        { icon: MapPin, title: 'Emerging Hotspot', value: 'Scanning...', detail: 'Cross-district trend analysis in progress.', color: 'text-amber-400', confidence: 40, methodology: 'Initializing' },
        { icon: Zap, title: 'Pattern Alert', value: 'Processing', detail: 'Temporal pattern detection running.', color: 'text-red-400', confidence: 45, methodology: 'Initializing' },
        { icon: Users, title: 'Resource Recommendation', value: 'Analyzing', detail: 'Workload distribution analysis computing.', color: 'text-cyan-400', confidence: 35, methodology: 'Initializing' },
      ]
    }
  }, [GENERATED_CASES])

  // ───────────────────────────────────────────────────────────────────
  // Scan handler
  // ───────────────────────────────────────────────────────────────────

  const handleScan = () => {
    setScanning(true)
    setScanProgress(0)
    setAnomaliesVisible(false)
    const interval = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          setScanning(false)
          setAnomaliesVisible(true)
          return 100
        }
        return p + 2
      })
    }, 40)
  }

  // ───────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Anomaly Detection */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <Brain className="size-4 text-cyan-400" />
          <h3 className="text-[13px] font-semibold text-slate-300 uppercase tracking-wider">Pattern Anomaly Report</h3>
          <Badge variant="outline" className="text-[9px] px-1.5 text-slate-400 border-slate-500/20 bg-slate-500/5">
            Z-Score Analysis
          </Badge>
        </div>
        <span className="text-[10px] text-slate-500 normal-case tracking-normal font-normal">
          {GENERATED_CASES.length} cases · transparent statistical scan for review signals in crime patterns, timing &amp; spatial distribution
        </span>
        <LastSynced />
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Button
          onClick={handleScan}
          disabled={scanning}
          className="bg-cyan-700 hover:bg-cyan-600 text-white gap-2 font-medium transition-all"
        >
          <Brain className="size-4" />
          {scanning ? 'Assessing...' : 'Run Assessment'}
        </Button>
        {scanning && (
          <div className="flex-1 max-w-md">
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${scanProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-[10px] text-cyan-400/60 mt-1 font-mono">Assessing {GENERATED_CASES.length} FIRs across 31 districts...</p>
          </div>
        )}
        {anomaliesVisible && (
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/5 text-[10px]">
            {computedAnomalies.length} anomalies flagged
          </Badge>
        )}
      </div>

      <AnimatePresence>
        {anomaliesVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
          >
            {computedAnomalies.map((a, i) => {
              const style = SEVERITY_STYLES[a.severity]
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`glass-card p-5 border-l-2 ${style.border}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`size-3.5 ${style.icon}`} />
                      <Badge variant="outline" className={`text-[9px] px-1.5 ${style.badge}`}>{a.severity}</Badge>
                      <Badge variant="outline" className="text-[9px] px-1.5 text-slate-400 border-slate-500/20 bg-slate-500/5">{a.type}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono text-violet-400/60 bg-violet-500/10 border border-violet-500/15 rounded px-1.5 py-0.5">SCRB</span>
                      <span className="text-[9px] text-slate-600">{a.timestamp}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-2">{a.description}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><MapPin className="size-2.5" />{a.district}</span>
                    <span>•</span>
                    <span>{a.metric}</span>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Risk Assessment */}
      <div className="flex items-center justify-between mb-6 mt-6">
        <div className="flex items-center gap-2.5">
          <Shield className="size-4 text-red-400" />
          <h3 className="text-[13px] font-semibold text-slate-300 uppercase tracking-wider">Case Risk Scoring</h3>
          <Badge variant="outline" className="text-[9px] px-1.5 text-slate-400 border-slate-500/20 bg-slate-500/5">
            Score Distribution
          </Badge>
        </div>
        <span className="text-[10px] text-slate-500 normal-case tracking-normal font-normal">Data: {GENERATED_CASES.length} cases analyzed</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="glass-card p-5 text-center border-t-2 border-t-red-500/40">
          <p className="text-2xl font-bold text-red-400 tabular-nums">{riskDistribution.high}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">High Risk (70+)</p>
        </div>
        <div className="glass-card p-5 text-center border-t-2 border-t-amber-500/40">
          <p className="text-2xl font-bold text-amber-400 tabular-nums">{riskDistribution.medium}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Medium Risk (40-69)</p>
        </div>
        <div className="glass-card p-5 text-center border-t-2 border-t-emerald-500/40">
          <p className="text-2xl font-bold text-emerald-400 tabular-nums">{riskDistribution.low}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Low Risk (&lt;40)</p>
        </div>
      </div>

      <div className="glass-card p-1 mb-4 flex h-2.5 rounded-full overflow-hidden">
        <div className="bg-red-500 transition-all" style={{ width: `${(riskDistribution.high / riskDistribution.total) * 100}%` }} />
        <div className="bg-amber-500 transition-all" style={{ width: `${(riskDistribution.medium / riskDistribution.total) * 100}%` }} />
        <div className="bg-emerald-500 transition-all" style={{ width: `${(riskDistribution.low / riskDistribution.total) * 100}%` }} />
      </div>

      <div className="space-y-2 mb-8">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-3">Top 5 Highest Risk FIRs</p>
        {topRiskCases.map((c, i) => (
          <motion.div
            key={c.rowid}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-3 flex items-center gap-4"
          >
            <span className="text-[10px] text-slate-600 font-mono w-4">#{i + 1}</span>
            <span className="font-mono text-xs text-emerald-400 w-36 shrink-0">{c.fir}</span>
            <span className="text-xs text-slate-300 flex-1">{c.crimeType}</span>
            <span className="text-xs text-slate-500 hidden md:block">{c.district}</span>
            <div className="flex items-center gap-2 w-32 shrink-0">
              <div className="threat-bar flex-1">
                <div
                  className="threat-bar-fill"
                  style={{
                    width: `${c.riskScore || 0}%`,
                    background: (c.riskScore || 0) >= 70 ? '#ef4444' : (c.riskScore || 0) >= 40 ? '#f59e0b' : '#10b981'
                  }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400 w-6 text-right">{c.riskScore}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Statistical review signals */}
      <div className="flex items-center justify-between mb-6 mt-6">
        <div className="flex items-center gap-2.5">
          <Zap className="size-4 text-violet-400" />
          <h3 className="text-[13px] font-semibold text-slate-300 uppercase tracking-wider">Statistical Review Signals — SCRB Intelligence Wing</h3>
          <Badge variant="outline" className="text-[9px] px-1.5 text-slate-400 border-slate-500/20 bg-slate-500/5">
            Statistical Computing
          </Badge>
        </div>
        <span className="text-[10px] text-slate-500 normal-case tracking-normal font-normal">Data: {GENERATED_CASES.length} cases analyzed</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {computedPredictions.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                p.color === 'text-red-400' ? 'bg-red-500/10' :
                p.color === 'text-amber-400' ? 'bg-amber-500/10' :
                p.color === 'text-cyan-400' ? 'bg-cyan-500/10' :
                'bg-emerald-500/10'
              }`}>
                <p.icon className={`size-4 ${p.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{p.title}</p>
                <p className={`text-2xl font-bold mt-0.5 ${p.color}`}>{p.value}</p>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">{p.detail}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="outline" className="text-[8px] px-1.5 py-0 text-slate-500 border-slate-600/20">
                    {p.methodology}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${p.confidence}%`,
                          background: p.confidence >= 70 ? '#10b981' : p.confidence >= 50 ? '#f59e0b' : '#ef4444'
                        }} 
                      />
                    </div>
                    <span className="text-[8px] text-slate-600">{p.confidence}%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Cold Case Revival Engine */}
      <div className="flex items-center justify-between mb-6 mt-6">
        <div className="flex items-center gap-2.5">
          <Zap className="size-4 text-cyan-400" />
          <h3 className="text-[13px] font-semibold text-slate-300 uppercase tracking-wider">Cold Case Revival</h3>
          <Badge variant="outline" className="text-[9px] px-1.5 text-slate-400 border-slate-500/20 bg-slate-500/5">
            SCRB Cold Case Cell
          </Badge>
        </div>
        <span className="text-[10px] text-slate-500 normal-case tracking-normal font-normal">
          System-identified cases with new investigative leads
        </span>
      </div>

      <div className="glass-card p-5 mb-8">
        <div className="space-y-0 divide-y divide-slate-700/40">
          {COLD_CASES.map((c) => {
            const isExpanded = expandedColdCase === c.fir
            const barColor = c.solvability >= 75 ? '#10b981' : c.solvability >= 50 ? '#f59e0b' : '#ef4444'
            const isBlackLotus = c.fir === 'FIR/2024/KSP/0789'
            return (
              <div key={c.fir} className={isBlackLotus ? 'border-l-2 border-l-emerald-500/60 -ml-4 pl-4' : ''}>
                <button
                  type="button"
                  onClick={() => setExpandedColdCase(isExpanded ? null : c.fir)}
                  className="w-full flex items-center gap-3 py-3 text-left hover:bg-white/[0.02] rounded px-1 transition-colors"
                >
                  <ChevronDown className={`size-3.5 text-slate-500 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                  <span
                    onClick={(e) => { e.stopPropagation(); navigateToFir(c.fir) }}
                    className="font-mono text-xs text-emerald-400 w-40 shrink-0 hover:underline cursor-pointer"
                  >
                    {c.fir}
                  </span>
                  <span className="text-xs text-slate-300 w-52 shrink-0 truncate">{c.crime}</span>
                  <span className="text-[10px] text-slate-500 hidden lg:block w-28 shrink-0">{c.district}</span>
                  <span className="text-[10px] text-slate-600 hidden md:block w-20 shrink-0">{c.date}</span>
                  <div className="flex items-center gap-2 w-28 shrink-0">
                    <div className="threat-bar flex-1">
                      <div
                        className="threat-bar-fill"
                        style={{ width: `${c.solvability}%`, background: barColor }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 w-6 text-right">{c.solvability}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 hidden xl:block truncate">{c.io}</span>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pb-3 pl-7 pr-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[9px] px-1.5 text-slate-400 border-slate-600/30 bg-slate-500/5">{c.status}</Badge>
                          <span className="text-[10px] text-slate-500">Victim: {c.victim}</span>
                          <span className="text-[10px] text-slate-600">•</span>
                          <span className="text-[10px] text-slate-500">IO: {c.io}</span>
                        </div>
                        <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/30">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1">Analysis Rationale</p>
                          <p className="text-[11px] text-slate-300 leading-relaxed">{c.rationale}</p>
                        </div>
                        <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/15">
                          <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-medium mb-1">Recommended Action</p>
                          <p className="text-[11px] text-slate-300 leading-relaxed">{c.action}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>

      {/* Kalaburagi Pattern Alert */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-5 border-l-2 border-l-red-500/60 mb-4"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="size-4 text-red-400 shrink-0" />
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">⚠ PATTERN ALERT — Serial Homicide Investigation</h4>
          </div>
          <Badge className="text-[9px] px-2 py-0.5 bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/20">
            CRITICAL — Active Manhunt
          </Badge>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
          Three violent attacks (2 murders, 1 attempted murder) in Kalaburagi and Vijayapura within 47 days. Identical MO: blunt weapon, right-handed attacker, late-night (22:00-01:00), poorly lit areas. AFIS match confirms single suspect: <strong className="text-red-300">Siddu M alias Siddheshwar</strong> (31), agricultural labourer, Jalihal Village, Sedam Taluk. Partial fingerprint recovered from weapon in FIR/2025/KSP/0154 matches crime scene evidence from FIR/2025/KSP/0155 (94.2% confidence).
        </p>
        <div className="space-y-1.5 mb-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Action Items</p>
          <ul className="space-y-1">
            <li className="text-[11px] text-slate-300 flex items-start gap-2">
              <span className="text-red-400 mt-0.5 shrink-0">▸</span>
              SP Kalaburagi: Enhanced patrol in Sedam and Kalaburagi rural areas
            </li>
            <li className="text-[11px] text-slate-300 flex items-start gap-2">
              <span className="text-red-400 mt-0.5 shrink-0">▸</span>
              Inter-state alert: Maharashtra (Solapur) and Telangana (Hyderabad) police notified
            </li>
            <li className="text-[11px] text-slate-300 flex items-start gap-2">
              <span className="text-red-400 mt-0.5 shrink-0">▸</span>
              Check posts activated on Kalaburagi-Vijayapura state highway
            </li>
          </ul>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-2 border-t border-slate-700/40">
          <span>IO: <span className="text-slate-400">SP Jagadish Patil S, Kalaburagi</span></span>
          <span>•</span>
          <span className="font-mono">FIR/2025/KSP/0153, FIR/2025/KSP/0154, FIR/2025/KSP/0155</span>
        </div>
      </motion.div>

      {/* ORACLE Disclaimer Footer */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.04] text-[9px] text-slate-600">
        <span>⚠</span>
        <span>ORACLE Predictive Module v2.0 — Output is advisory in nature. Field verification required before operational deployment. Not admissible as evidence.</span>
      </div>
    </div>
  )
}
