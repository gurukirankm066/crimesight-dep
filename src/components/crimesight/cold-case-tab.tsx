'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Snowflake,
  Filter,
  MapPin,
  FileText,
  Users,
  Car,
  Home,
  ArrowRight,
  Eye,
  ShieldAlert,
  TrendingUp,
  Search,
  ChevronRight,
  Calendar,
  AlertTriangle,
  Target,
  Sparkles,
} from 'lucide-react'

import { GENERATED_CASES, type GeneratedCase, getGeneratedDistrictStats, getGeneratedCrimeTypeStats } from '@/lib/case-generator'

// ─── Types ────────────────────────────────────────────────────────────────

interface CaseBrief {
  fir: string
  crimeType: string
  district: string
  date: string
  status: string
  place: string
  rowid: string
  priority: string
  ageMonths?: number
}

interface MatchPair {
  coldCase: CaseBrief
  newCase: CaseBrief
  matchScore: number
  matchScorePercent: number
  reasons: string[]
  recommendation: string
}

interface Summary {
  totalColdCases: number
  totalMatches: number
  highConfidenceMatches: number
  avgMatchScore: number
}

interface DistrictOption {
  ROWID?: string
  id?: string
  district_name: string
}

interface CrimeTypeOption {
  ROWID?: string
  id?: string
  crime_type_name: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatAge(months: number): string {
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} cold`
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (rem === 0) return `${years} year${years !== 1 ? 's' : ''} cold`
  return `${years}y ${rem}m cold`
}

function formatDate(raw: string): string {
  try {
    const d = new Date(raw.substring(0, 19).replace(' ', 'T'))
    if (isNaN(d.getTime())) return raw.substring(0, 10)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return raw.substring(0, 10)
  }
}

function getScoreColor(pct: number): string {
  if (pct >= 75) return 'text-emerald-400'
  if (pct >= 50) return 'text-amber-400'
  if (pct >= 25) return 'text-orange-400'
  return 'text-slate-400'
}

function getScoreRingColor(pct: number): string {
  if (pct >= 75) return 'stroke-emerald-400'
  if (pct >= 50) return 'stroke-amber-400'
  if (pct >= 25) return 'stroke-orange-400'
  return 'stroke-slate-500'
}

function getScoreBgColor(pct: number): string {
  if (pct >= 75) return 'bg-emerald-400/10 border-emerald-400/30'
  if (pct >= 50) return 'bg-amber-400/10 border-amber-400/30'
  if (pct >= 25) return 'bg-orange-400/10 border-orange-400/30'
  return 'bg-slate-500/10 border-slate-500/30'
}

function getConfidenceBadge(pct: number): { label: string; className: string } {
  if (pct >= 75) return { label: 'High Confidence', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
  if (pct >= 50) return { label: 'Moderate', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
  if (pct >= 25) return { label: 'Low', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }
  return { label: 'Weak', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' }
}

function getReasonIcon(reason: string) {
  const r = reason.toLowerCase()
  if (r.includes('suspect') || r.includes('shared')) return Users
  if (r.includes('vehicle')) return Car
  if (r.includes('property')) return Home
  if (r.includes('district') || r.includes('location')) return MapPin
  if (r.includes('crime type')) return ShieldAlert
  return Target
}

function getPriorityColor(priority: string): string {
  const p = priority.toLowerCase()
  if (p === 'high' || p === 'critical') return 'text-red-400'
  if (p === 'medium') return 'text-amber-400'
  return 'text-slate-400'
}

// ─── Score Ring Component ─────────────────────────────────────────────────

function ScoreRing({ percent }: { percent: number }) {
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference
  const color = getScoreRingColor(percent)

  return (
    <div className={`relative flex items-center justify-center w-20 h-20 rounded-full border-2 ${getScoreBgColor(percent)}`}>
      <svg className="absolute inset-0 -rotate-90" width="80" height="80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth="3" className="text-white/[0.06]" />
        <motion.circle
          cx="40" cy="40" r={radius} fill="none" strokeWidth="3"
          strokeLinecap="round" className={color}
          strokeDasharray={circumference} strokeDashoffset={offset}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <span className={`text-lg font-bold tabular-nums ${getScoreColor(percent)}`}>
        {percent}%
      </span>
    </div>
  )
}

// ─── Case Card Component ──────────────────────────────────────────────────

function CaseCard({
  caseData,
  variant,
}: {
  caseData: CaseBrief
  variant: 'cold' | 'new'
}) {
  const isCold = variant === 'cold'
  const bgClass = isCold
    ? 'bg-blue-950/30 border-blue-500/20 hover:border-blue-500/40'
    : 'bg-amber-950/30 border-amber-500/20 hover:border-amber-500/40'

  return (
    <div className={`flex-1 min-w-0 rounded-xl border p-4 transition-colors duration-200 ${bgClass}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {isCold ? (
            <Snowflake className="size-4 text-blue-400 shrink-0" />
          ) : (
            <Sparkles className="size-4 text-amber-400 shrink-0" />
          )}
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider truncate">
            {isCold ? 'Cold Case' : 'Active Case'}
          </span>
        </div>
        {isCold && caseData.ageMonths != null && (
          <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/25 text-[10px] px-1.5 py-0">
            {formatAge(caseData.ageMonths)}
          </Badge>
        )}
      </div>

      {/* FIR Number */}
      <p className="text-sm font-semibold text-white mb-2 truncate" title={caseData.fir}>
        {caseData.fir}
      </p>

      {/* Details */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-3 text-slate-500 shrink-0" />
          <span className="text-slate-300 truncate">{caseData.crimeType}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="size-3 text-slate-500 shrink-0" />
          <span className="text-slate-400 truncate">{caseData.place}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="size-3 text-slate-500 shrink-0" />
          <span className="text-slate-500">{formatDate(caseData.date)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">District: {caseData.district}</span>
          <span className={`text-[10px] font-medium uppercase tracking-wider ${getPriorityColor(caseData.priority)}`}>
            {caseData.priority}
          </span>
        </div>
      </div>

      {/* Status */}
      <div className="mt-3 pt-2 border-t border-white/[0.06]">
        <span className={`inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider ${
          caseData.status === 'Open' ? 'text-amber-400' : 'text-cyan-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            caseData.status === 'Open' ? 'bg-amber-400' : 'bg-cyan-400'
          }`} />
          {caseData.status}
        </span>
      </div>
    </div>
  )
}

// ─── Match Card Component ─────────────────────────────────────────────────

function MatchCard({ match, index }: { match: MatchPair; index: number }) {
  const confidence = getConfidenceBadge(match.matchScorePercent)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
    >
      {/* Match Reasons Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <Badge className={confidence.className}>{confidence.label}</Badge>
          {match.reasons.slice(0, 2).map((reason, i) => {
            const Icon = getReasonIcon(reason)
            return (
              <span key={i} className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <Icon className="size-3" />
                <span className="truncate max-w-[200px]">{reason}</span>
              </span>
            )
          })}
          {match.reasons.length > 2 && (
            <span className="text-[10px] text-slate-600">+{match.reasons.length - 2} more</span>
          )}
        </div>
      </div>

      {/* Case Pair + Score */}
      <div className="px-4 pb-4">
        <div className="flex items-stretch gap-3">
          {/* Cold Case */}
          <CaseCard caseData={match.coldCase} variant="cold" />

          {/* Connection Arrow + Score */}
          <div className="flex flex-col items-center justify-center gap-1 shrink-0">
            <div className="relative">
              {/* Connection line - left */}
              <div className="absolute right-full top-1/2 -translate-y-1/2 w-3 h-px bg-gradient-to-l from-blue-500/50 to-transparent" />
              {/* Connection line - right */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 w-3 h-px bg-gradient-to-r from-amber-500/50 to-transparent" />
              <ScoreRing percent={match.matchScorePercent} />
            </div>
            <span className="text-[9px] text-slate-600 uppercase tracking-wider font-medium">Match</span>
          </div>

          {/* New Case */}
          <CaseCard caseData={match.newCase} variant="new" />
        </div>

        {/* All Match Reasons */}
        {match.reasons.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/[0.04]">
            <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium mb-2">
              Matching Factors
            </p>
            <div className="flex flex-wrap gap-2">
              {match.reasons.map((reason, i) => {
                const Icon = getReasonIcon(reason)
                return (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 text-[11px] text-slate-300 bg-white/[0.04] rounded-md px-2 py-1 border border-white/[0.06]"
                  >
                    <Icon className="size-3 text-emerald-400" />
                    {reason}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Recommendation */}
        <div className="mt-3 flex items-center gap-2 bg-emerald-500/[0.06] border border-emerald-500/15 rounded-lg px-3 py-2">
          <TrendingUp className="size-3.5 text-emerald-400 shrink-0" />
          <p className="text-[11px] text-emerald-300/90 leading-relaxed">
            {match.recommendation}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px] gap-1.5 text-blue-400 border-blue-500/25 hover:bg-blue-500/10 hover:text-blue-300"
            onClick={() => {/* navigate to cold case detail */}}
          >
            <Eye className="size-3" />
            View Cold Case
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px] gap-1.5 text-amber-400 border-amber-500/25 hover:bg-amber-500/10 hover:text-amber-300"
            onClick={() => {/* navigate to new case detail */}}
          >
            <Eye className="size-3" />
            View New Case
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Summary Stat Card ────────────────────────────────────────────────────

function SummaryStat({
  icon: Icon,
  label,
  value,
  color,
  subtext,
}: {
  icon: React.FC<{ className?: string }>
  label: string
  value: number
  color: string
  subtext?: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${color} shrink-0`}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums text-white">{value.toLocaleString()}</p>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
        {subtext && <p className="text-[10px] text-slate-600 mt-0.5">{subtext}</p>}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────

export default function ColdCaseTab() {
  const [districtFilter, setDistrictFilter] = useState<string>('all')
  const [crimeTypeFilter, setCrimeTypeFilter] = useState<string>('all')
  const [minScore, setMinScore] = useState<number>(0)

  // Local district lookup
  const districts = useMemo<DistrictOption[]>(() => {
    const stats = getGeneratedDistrictStats()
    return Object.keys(stats).map(name => ({
      ROWID: name,
      district_name: name,
    }))
  }, [])

  // Local crime type lookup
  const crimeTypes = useMemo<CrimeTypeOption[]>(() => {
    const stats = getGeneratedCrimeTypeStats()
    return stats.map(s => ({
      id: s.name,
      crime_type_name: s.name,
    }))
  }, [])

  // Local cold case matching
  const data = useMemo<{ summary: Summary; matches: MatchPair[] }>(() => {
    let coldCases = GENERATED_CASES.filter(c =>
      c.daysAgo > 120 && (c.status === 'Open' || c.status === 'Under Investigation')
    )
    let recentCases = GENERATED_CASES.filter(c => c.daysAgo <= 30)

    if (districtFilter !== 'all') {
      coldCases = coldCases.filter(c => c.district === districtFilter)
      recentCases = recentCases.filter(c => c.district === districtFilter)
    }
    if (crimeTypeFilter !== 'all') {
      coldCases = coldCases.filter(c => c.crimeType === crimeTypeFilter)
      recentCases = recentCases.filter(c => c.crimeType === crimeTypeFilter)
    }

    // Index cold cases for efficient matching
    const coldMap = new Map<string, GeneratedCase>()
    const coldByType = new Map<string, string[]>()
    const coldByDistrict = new Map<string, string[]>()
    for (const c of coldCases) {
      coldMap.set(c.rowid, c)
      if (!coldByType.has(c.crimeType)) coldByType.set(c.crimeType, [])
      coldByType.get(c.crimeType)!.push(c.rowid)
      if (!coldByDistrict.has(c.district)) coldByDistrict.set(c.district, [])
      coldByDistrict.get(c.district)!.push(c.rowid)
    }

    const matches: MatchPair[] = []
    const recentSlice = recentCases.slice(0, 300)

    for (const recent of recentSlice) {
      const candidateIds = new Set<string>()
      const sameType = coldByType.get(recent.crimeType) || []
      const sameDistrict = coldByDistrict.get(recent.district) || []
      for (const id of sameType) candidateIds.add(id)
      for (const id of sameDistrict) candidateIds.add(id)
      if (candidateIds.size === 0) continue

      let bestMatch: { cold: GeneratedCase; score: number; reasons: string[] } | null = null

      for (const id of candidateIds) {
        const cold = coldMap.get(id)
        if (!cold) continue

        let score = 0
        const reasons: string[] = []

        if (cold.crimeType === recent.crimeType) {
          score += 35
          reasons.push('Same crime type')
        } else if (cold.crimeCategory === recent.crimeCategory) {
          score += 15
          reasons.push('Similar crime category')
        }

        if (cold.district === recent.district) {
          score += 25
          reasons.push('Same district location')
        }

        if (cold.complaintMode === recent.complaintMode) {
          score += 10
          reasons.push('Similar complaint mode (MO)')
        }

        if (cold.priority === recent.priority) {
          score += 10
          reasons.push('Same priority level')
        }

        if (cold.hasRepeatOffender && recent.hasRepeatOffender) {
          score += 10
          reasons.push('Both involve repeat offenders')
        }

        if (cold.suspectCount === recent.suspectCount && cold.suspectCount > 1) {
          score += 5
          reasons.push('Similar suspect profile')
        }

        if (cold.vehicleCount > 0 && recent.vehicleCount > 0) {
          score += 5
          reasons.push('Vehicle involved in both')
        }

        if (score >= minScore && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { cold, score, reasons }
        }
      }

      if (bestMatch && bestMatch.score >= minScore) {
        const cold = bestMatch.cold
        const matchScorePercent = Math.min(100, Math.round(bestMatch.score))
        const ageMonths = Math.round(cold.daysAgo / 30)

        let recommendation = ''
        if (matchScorePercent >= 75) {
          recommendation = `Strong pattern match (${matchScorePercent}%). Recommend merging investigation teams and sharing forensic evidence between ${cold.fir} and ${recent.fir}.`
        } else if (matchScorePercent >= 50) {
          recommendation = `Moderate similarity detected. Consider cross-referencing witness statements and checking for shared suspects.`
        } else {
          recommendation = `Weak pattern link. May be worth a brief review if other leads are exhausted.`
        }

        matches.push({
          coldCase: {
            fir: cold.fir,
            crimeType: cold.crimeType,
            district: cold.district,
            date: cold.occurrenceDate,
            status: cold.status,
            place: cold.place,
            rowid: cold.rowid,
            priority: cold.priority,
            ageMonths,
          },
          newCase: {
            fir: recent.fir,
            crimeType: recent.crimeType,
            district: recent.district,
            date: recent.occurrenceDate,
            status: recent.status,
            place: recent.place,
            rowid: recent.rowid,
            priority: recent.priority,
          },
          matchScore: bestMatch.score / 100,
          matchScorePercent,
          reasons: bestMatch.reasons,
          recommendation,
        })
      }
    }

    matches.sort((a, b) => b.matchScorePercent - a.matchScorePercent)
    const top30 = matches.slice(0, 30)
    const highConfidence = top30.filter(m => m.matchScorePercent >= 75).length
    const avgScore = top30.length > 0
      ? Math.round(top30.reduce((s, m) => s + m.matchScorePercent, 0) / top30.length)
      : 0

    return {
      summary: {
        totalColdCases: coldCases.length,
        totalMatches: top30.length,
        highConfidenceMatches: highConfidence,
        avgMatchScore: avgScore,
      },
      matches: top30,
    }
  }, [districtFilter, crimeTypeFilter, minScore])

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Snowflake className="size-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Cold Case Revival</h2>
            <p className="text-[11px] text-slate-500">Match unsolved cases with new active investigations</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/10"
          onClick={() => {}}
        >
          <Search className="size-3.5" />
          Refresh Matches
        </Button>
      </div>

      {/* Summary Banner */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryStat
            icon={Snowflake}
            label="Total Cold Cases"
            value={data.summary.totalColdCases}
            color="bg-blue-500/10 text-blue-400"
            subtext="Older than 6 months"
          />
          <SummaryStat
            icon={Target}
            label="Matches Found"
            value={data.summary.totalMatches}
            color="bg-emerald-500/10 text-emerald-400"
            subtext="Cross-referenced"
          />
          <SummaryStat
            icon={AlertTriangle}
            label="High Confidence"
            value={data.summary.highConfidenceMatches}
            color="bg-amber-500/10 text-amber-400"
            subtext="≥75% match score"
          />
          <SummaryStat
            icon={TrendingUp}
            label="Avg Match Score"
            value={data.summary.avgMatchScore}
            color="bg-cyan-500/10 text-cyan-400"
            subtext="Across all matches"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-end gap-3 flex-wrap rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
          <Filter className="size-3.5" />
          <span className="text-[11px] font-medium uppercase tracking-wider">Filters</span>
        </div>

        <div className="w-40">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">District</label>
          <Select value={districtFilter} onValueChange={setDistrictFilter}>
            <SelectTrigger className="w-full h-8 text-xs bg-white/[0.04] border-white/[0.08] text-slate-300">
              <SelectValue placeholder="All Districts" />
            </SelectTrigger>
            <SelectContent className="bg-[#0a0f1a] border-white/[0.08]">
              <SelectItem value="all" className="text-slate-300">All Districts</SelectItem>
              {districts.map((d) => {
                const key = d.ROWID || d.id || ''
                return (
                  <SelectItem key={key} value={key} className="text-slate-300">
                    {d.district_name}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="w-40">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Crime Type</label>
          <Select value={crimeTypeFilter} onValueChange={setCrimeTypeFilter}>
            <SelectTrigger className="w-full h-8 text-xs bg-white/[0.04] border-white/[0.08] text-slate-300">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-[#0a0f1a] border-white/[0.08]">
              <SelectItem value="all" className="text-slate-300">All Crime Types</SelectItem>
              {crimeTypes.map((c) => {
                const key = c.ROWID || c.id || ''
                return (
                  <SelectItem key={key} value={key} className="text-slate-300">
                    {c.crime_type_name}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="w-52">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
            Min Match Score: <span className="text-emerald-400 font-semibold">{minScore}%</span>
          </label>
          <Slider
            value={[minScore]}
            onValueChange={([v]) => setMinScore(v)}
            min={0}
            max={100}
            step={5}
            className="py-1.5 [&_[data-slot=slider-track]]:bg-white/[0.08] [&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:bg-emerald-400 border-emerald-400"
          />
        </div>

        {(districtFilter !== 'all' || crimeTypeFilter !== 'all' || minScore > 0) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[11px] text-slate-500 hover:text-white"
            onClick={() => {
              setDistrictFilter('all')
              setCrimeTypeFilter('all')
              setMinScore(0)
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Match List */}
      {data && data.matches.length > 0 ? (
        <div className="space-y-4 max-h-[calc(100vh-420px)] overflow-y-auto pr-1 custom-scrollbar">
          <AnimatePresence>
            {data.matches.map((match, i) => (
              <MatchCard key={`${match.coldCase.rowid}-${match.newCase.rowid}`} match={match} index={i} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/[0.03] border border-white/[0.06]">
            <Snowflake className="size-7 text-slate-700" />
          </div>
          <p className="text-sm text-slate-400 font-medium">No matches found</p>
          <p className="text-xs text-slate-600 max-w-md">
            {data && data.summary.totalColdCases === 0
              ? 'There are no cold cases (unsolved cases older than 6 months) in the current dataset.'
              : 'No matches meet the current filter criteria. Try lowering the minimum match score or adjusting filters.'}
          </p>
        </div>
      )}
    </div>
  )
}