'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { User, MapPin, AlertTriangle, Shield, Crosshair, GitBranch } from 'lucide-react'
import LastSynced from '@/components/crimesight/last-synced'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import {
  DEMO_SUSPECTS,
  DEMO_CASES,
  getDemoDistrictName,
  getDemoCrimeTypeName,
} from '@/lib/demo-data'
import type { DemoSuspect, DemoCase } from '@/lib/demo-data'
import { GENERATED_CASES } from '@/lib/case-generator'
import { useCrimeSightStore } from '@/lib/store'

// Crime Severity Map

type SeverityTier = 'Critical' | 'High' | 'Medium' | 'Low'

const CRIME_SEVERITY: Record<string, { tier: SeverityTier; score: number }> = {
  'ct-murder':            { tier: 'Critical', score: 25 },
  'ct-attempt-murder':    { tier: 'Critical', score: 22 },
  'ct-rape':              { tier: 'Critical', score: 24 },
  'ct-dowry-death':       { tier: 'Critical', score: 23 },
  'ct-human-trafficking': { tier: 'Critical', score: 22 },
  'ct-kidnapping':        { tier: 'High',     score: 16 },
  'ct-dacoity':           { tier: 'High',     score: 15 },
  'ct-robbery':           { tier: 'High',     score: 14 },
  'ct-narcotics':         { tier: 'High',     score: 14 },
  'ct-arms-act':          { tier: 'High',     score: 13 },
  'ct-cyber-crime':       { tier: 'Medium',   score: 10 },
  'ct-fraud':             { tier: 'Medium',   score: 8  },
  'ct-cheating':          { tier: 'Medium',   score: 7  },
  'ct-burglary':          { tier: 'Medium',   score: 8  },
  'ct-chain-snatching':   { tier: 'Medium',   score: 7  },
  'ct-assault':           { tier: 'Medium',   score: 8  },
  'ct-vehicle-theft':     { tier: 'Low',      score: 4  },
  'ct-theft':             { tier: 'Low',      score: 3  },
  'ct-rioting':           { tier: 'Low',      score: 5  },
  'ct-excise':            { tier: 'Low',      score: 3  },
  'ct-road-accident':     { tier: 'Low',      score: 2  },
  'ct-others':            { tier: 'Low',      score: 1  },
}

// Crime type name → severity (for 10K generated data which uses names with IPC sections)
function getCrimeSeverity(name: string): { tier: SeverityTier; score: number } {
  const n = name.toLowerCase()
  if (n.includes('murder') || n.includes('dowry death') || n.includes('attempt murder')) return { tier: 'Critical', score: 25 }
  if (n.includes('rape')) return { tier: 'Critical', score: 24 }
  if (n.includes('human trafficking')) return { tier: 'Critical', score: 22 }
  if (n.includes('kidnapping')) return { tier: 'High', score: 16 }
  if (n.includes('robbery')) return { tier: 'High', score: 14 }
  if (n.includes('ndps') || n.includes('drug')) return { tier: 'High', score: 14 }
  if (n.includes('dacoity')) return { tier: 'High', score: 15 }
  if (n.includes('arms act')) return { tier: 'High', score: 13 }
  if (n.includes('cyber crime')) return { tier: 'Medium', score: 10 }
  if (n.includes('fraud') || n.includes('cheating')) return { tier: 'Medium', score: 8 }
  if (n.includes('burglary')) return { tier: 'Medium', score: 8 }
  if (n.includes('chain snatch')) return { tier: 'Medium', score: 7 }
  if (n.includes('assault')) return { tier: 'Medium', score: 8 }
  if (n.includes('rioting')) return { tier: 'Low', score: 5 }
  if (n.includes('vehicle theft') || n.includes('theft')) return { tier: 'Low', score: 4 }
  if (n.includes('excise') || n.includes('road accident') || n.includes('traffic') || n.includes('missing person')) return { tier: 'Low', score: 2 }
  return { tier: 'Low', score: 2 }
}

const ARREST_STATUS_SCORE: Record<string, number> = {
  'Absconding':         30,
  'Released on Bail':   15,
  'Surrendered':        -5,
  'In Custody':        -20,
  'Arrested':          -15,
}

// Styling Constants

const STATUS_STYLES: Record<string, string> = {
  'Absconding':        'bg-red-500/15 text-red-400 border-red-500/30',
  'Arrested':          'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Released on Bail':  'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'In Custody':        'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Surrendered':       'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

const SEVERITY_BADGE: Record<SeverityTier, string> = {
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  High:     'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Medium:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Low:      'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

const THREAT_LEVEL_COLOR: Record<string, { ring: string; fill: string; avatar: string }> = {
  Critical: { ring: 'ring-red-500/40', fill: 'bg-red-500', avatar: 'bg-red-500/20 text-red-400' },
  High:     { ring: 'ring-amber-500/40', fill: 'bg-amber-500', avatar: 'bg-amber-500/20 text-amber-400' },
  Medium:   { ring: 'ring-emerald-500/40', fill: 'bg-emerald-500', avatar: 'bg-emerald-500/20 text-emerald-400' },
  Low:      { ring: 'ring-slate-500/40', fill: 'bg-slate-500', avatar: 'bg-slate-500/20 text-slate-400' },
}

// Types

interface ProcessedTarget {
  suspectRowid: string
  suspectName: string
  arrestStatus: string
  isRepeatOffender: boolean
  linkedFir: string
  linkedDistrict: string
  linkedDistrictRowid: string
  crimeType: string
  district: string
  severityTier: SeverityTier
  priorityScore: number
  riskScore: number
  linkedCases: number
  topCrimeType: string
  topCrimeSeverity: SeverityTier
}

type FilterKey = 'all' | 'absconding' | 'repeat' | 'critical'

const FILTERS: { key: FilterKey; label: string; count: number }[] = [
  { key: 'all',         label: 'All',              count: 0 },
  { key: 'absconding',  label: 'Absconding',       count: 0 },
  { key: 'repeat',      label: 'Repeat Offenders', count: 0 },
  { key: 'critical',    label: 'Critical',         count: 0 },
]

// Helpers

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function clampScore(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)))
}

// 10K Case Cross-Reference Maps for enrichment
const CASES_BY_DISTRICT_CRIME = new Map<string, number>()
const CASES_BY_DISTRICT = new Map<string, number>()
for (const c of GENERATED_CASES) {
  const dk = `${c.district}::${c.crimeType}`
  CASES_BY_DISTRICT_CRIME.set(dk, (CASES_BY_DISTRICT_CRIME.get(dk) || 0) + 1)
  CASES_BY_DISTRICT.set(c.district, (CASES_BY_DISTRICT.get(c.district) || 0) + 1)
}

// Generate additional suspect entries from 10K cases for scale
const GENERATED_SUSPECTS = (() => {
  const suspectPool = [
    'Ravi Kumar S', 'Syed Iqbal M', 'Manoj Reddy K', 'Kiran Naidu B', 'Pradeep Goud',
    'Arjun Patel R', 'Farhan Khan S', 'Deepak Shetty M', 'Venkatesh Rao H', 'Suresh Babu K',
    'Mohammed Irfan', 'Lakshmi N P', 'Kavitha Ramesh', 'Abdul Khader B', 'Nagaraj Pataki',
    'Poornima Devi S', 'Rajesh Shetty K', 'Ganesh Kumar M', 'Harish R', 'Sunitha M',
    'Basavaraj Patil', 'Chandra Shekar', 'Nandini Bhat', 'Jagadish Patil', 'Ramesh Gowda',
    'Anitha Kumari', 'Prakash Rao', 'Mahesh Kumar', 'Shivakumar M', 'Bhagya Lakshmi',
    'Karthik Raju', 'Divya Sharma', 'Sanjay Gupta', 'Anand Kumar', 'Priya Venkatesh',
    'Rahul Desai', 'Naveen Kumar', 'Geetha Ramu', 'Santosh Kumar', 'Meera Krishnan',
    'Arun Prasad', 'Lakshmi Devi', 'Vinay Kumar', 'Revathi S', 'Sumanth Bhat',
  ]
  const statuses: Array<'Absconding' | 'Arrested' | 'Released on Bail' | 'In Custody'> = ['Absconding', 'Arrested', 'Released on Bail', 'In Custody']
  const cases = GENERATED_CASES.filter(c => c.hasRepeatOffender || c.priority === 'Critical' || c.priority === 'High')

  return cases.slice(0, 200).map((c, i) => ({
    rowid: `GSUS-${String(i + 1).padStart(4, '0')}`,
    name: suspectPool[i % suspectPool.length],
    gender: i % 4 === 2 ? 'Female' : 'Male',
    age: String(22 + (i % 30)),
    phone: `98${String(45000000 + i * 123456).slice(0, 8)}`,
    aadhaar: `XXXX-XXXX-${String(1000 + i).slice(0, 4)}`,
    address: c.district,
    occupation: ['Daily Wage', 'Driver', 'Business', 'Unemployed', 'Student', 'Laborer'][i % 6],
    arrestStatus: c.priority === 'Critical' ? (i % 3 === 0 ? 'Absconding' : 'In Custody') : statuses[i % 4],
    isRepeatOffender: c.hasRepeatOffender,
    linkedFir: c.fir,
    linkedDistrict: c.district,
    linkedDistrictRowid: c.districtRowid,
    linkedCrimeType: c.crimeType,
    linkedPriority: c.priority,
    riskScore: c.riskScore,
  }))
})()

// Animation Variants

const cardContainer: Record<string, any> = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04 },
  },
}

const cardItem: Record<string, any> = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

// Component

export default function MostWantedTab() {
  const [filter, setFilter] = useState<FilterKey>('all')
  const { navigateToDistrict, navigateToNetworkSearch, openDossier } = useCrimeSightStore()

  /* ── Process & sort suspects client-side ── */
  const { targets, filterCounts } = useMemo(() => {
    const processed: ProcessedTarget[] = []

    // ── Process DEMO_SUSPECTS (handcrafted narrative data) ──
    const caseMap = new Map<string, DemoCase>()
    for (const c of DEMO_CASES) caseMap.set(c.ROWID, c)

    const suspectCaseMap = new Map<string, { suspect: DemoSuspect; caseData: DemoCase }[]>()
    for (const s of DEMO_SUSPECTS) {
      const c = caseMap.get(s.case_rowid)
      if (!c) continue
      const existing = suspectCaseMap.get(s.suspect_name)
      if (existing) {
        existing.push({ suspect: s, caseData: c })
      } else {
        suspectCaseMap.set(s.suspect_name, [{ suspect: s, caseData: c }])
      }
    }

    for (const [name, entries] of suspectCaseMap) {
      const primary = entries[0]
      const s = primary.suspect
      const c = primary.caseData
      const crimeType = getDemoCrimeTypeName(c.crime_type_rowid)
      const district = getDemoDistrictName(c.district_rowid)

      let worstSeverity: SeverityTier = 'Low'
      let worstSeverityScore = 0
      let worstCrimeType = crimeType
      let worstTier = 'Low' as SeverityTier

      for (const entry of entries) {
        const ctRowid = entry.caseData.crime_type_rowid
        const sev = CRIME_SEVERITY[ctRowid]
        if (sev && sev.score > worstSeverityScore) {
          worstSeverityScore = sev.score
          worstSeverity = sev.tier
          worstCrimeType = getDemoCrimeTypeName(ctRowid)
          worstTier = sev.tier
        }
      }

      const arrestScore = ARREST_STATUS_SCORE[s.arrest_status] ?? 0
      const repeatBonus = s.is_repeat_offender ? 25 : 0
      const casePriorityScore = c.case_priority === 'Critical' ? 20 : c.case_priority === 'High' ? 12 : c.case_priority === 'Medium' ? 5 : 0
      // Enrich priority with 10K crime volume in suspect's district+crimeType
      const priorityFrom10K = Math.min(8, Math.floor((CASES_BY_DISTRICT_CRIME.get(`${district}::${crimeType}`) || 0) / 60))
      const rawPriority = arrestScore + repeatBonus + worstSeverityScore + casePriorityScore + priorityFrom10K

      const baseRisk = 35
      const riskFromCrime = worstSeverityScore * 1.2
      const riskFromStatus = s.arrest_status === 'Absconding' ? 20 : s.arrest_status === 'Released on Bail' ? 10 : 0
      const riskFromRepeat = s.is_repeat_offender ? 15 : 0
      // Enrich riskScore with 10K crime volume in suspect's district+crimeType
      const riskFrom10KVolume = Math.min(10, Math.floor((CASES_BY_DISTRICT_CRIME.get(`${district}::${crimeType}`) || 0) / 40))
      const riskScore = clampScore(baseRisk + riskFromCrime + riskFromStatus + riskFromRepeat + riskFrom10KVolume)

      // Enrich linkedCases with 10K case volume
      const dk10k = `${district}::${crimeType}`
      const caseCount10k = CASES_BY_DISTRICT_CRIME.get(dk10k) || 0
      const linkedCasesFrom10K = Math.floor(caseCount10k / 25)
      const linkedCases = s.is_repeat_offender
        ? entries.length + linkedCasesFrom10K + Math.floor(Math.abs(hashStr(name)) % 4) + 1
        : entries.length + linkedCasesFrom10K

      processed.push({
        suspectRowid: s.ROWID,
        suspectName: s.suspect_name,
        arrestStatus: s.arrest_status,
        isRepeatOffender: s.is_repeat_offender,
        linkedFir: c.fir_number,
        linkedDistrict: district,
        linkedDistrictRowid: c.district_rowid,
        crimeType,
        district,
        severityTier: worstTier,
        priorityScore: rawPriority,
        riskScore,
        linkedCases,
        topCrimeType: worstCrimeType,
        topCrimeSeverity: worstSeverity,
      })
    }

    // ── Process GENERATED_SUSPECTS (10K-derived) ──
    for (const gs of GENERATED_SUSPECTS) {
      const sev = getCrimeSeverity(gs.linkedCrimeType)

      const arrestScore = ARREST_STATUS_SCORE[gs.arrestStatus] ?? 0
      const repeatBonus = gs.isRepeatOffender ? 25 : 0
      const casePriorityScore = gs.linkedPriority === 'Critical' ? 20 : gs.linkedPriority === 'High' ? 12 : gs.linkedPriority === 'Medium' ? 5 : 0
      // Enrich priority with 10K crime volume
      const priorityFrom10K = Math.min(8, Math.floor((CASES_BY_DISTRICT_CRIME.get(`${gs.linkedDistrict}::${gs.linkedCrimeType}`) || 0) / 60))
      const rawPriority = arrestScore + repeatBonus + sev.score + casePriorityScore + priorityFrom10K

      const baseRisk = 35
      const riskFromCrime = sev.score * 1.2
      const riskFromStatus = gs.arrestStatus === 'Absconding' ? 20 : gs.arrestStatus === 'Released on Bail' ? 10 : 0
      const riskFromRepeat = gs.isRepeatOffender ? 15 : 0
      // Enrich riskScore with 10K crime volume
      const riskFrom10KVolume = Math.min(10, Math.floor((CASES_BY_DISTRICT_CRIME.get(`${gs.linkedDistrict}::${gs.linkedCrimeType}`) || 0) / 40))
      const riskScore = clampScore(baseRisk + riskFromCrime + riskFromStatus + riskFromRepeat + riskFrom10KVolume)

      // Enrich linkedCases with 10K case volume
      const dk10k = `${gs.linkedDistrict}::${gs.linkedCrimeType}`
      const caseCount10k = CASES_BY_DISTRICT_CRIME.get(dk10k) || 0
      const linkedCasesFrom10K = Math.floor(caseCount10k / 25)
      const linkedCases = gs.isRepeatOffender
        ? 2 + linkedCasesFrom10K + Math.floor(Math.abs(hashStr(gs.name)) % 4) + 1
        : 1 + linkedCasesFrom10K

      processed.push({
        suspectRowid: gs.rowid,
        suspectName: gs.name,
        arrestStatus: gs.arrestStatus,
        isRepeatOffender: gs.isRepeatOffender,
        linkedFir: gs.linkedFir,
        linkedDistrict: gs.linkedDistrict,
        linkedDistrictRowid: gs.linkedDistrictRowid,
        crimeType: gs.linkedCrimeType,
        district: gs.linkedDistrict,
        severityTier: sev.tier,
        priorityScore: rawPriority,
        riskScore,
        linkedCases,
        topCrimeType: gs.linkedCrimeType,
        topCrimeSeverity: sev.tier,
      })
    }

    // Sort by priority score descending
    processed.sort((a, b) => b.priorityScore - a.priorityScore)

    // Count by filter
    const counts = {
      all: processed.length,
      absconding: processed.filter(t => t.arrestStatus === 'Absconding').length,
      repeat: processed.filter(t => t.isRepeatOffender).length,
      critical: processed.filter(t => t.severityTier === 'Critical').length,
    }

    return { targets: processed, filterCounts: counts }
  }, [])

  /* ── Apply filter ── */
  const filteredTargets = useMemo(() => {
    switch (filter) {
      case 'absconding': return targets.filter(t => t.arrestStatus === 'Absconding')
      case 'repeat':     return targets.filter(t => t.isRepeatOffender)
      case 'critical':   return targets.filter(t => t.severityTier === 'Critical')
      default:           return targets
    }
  }, [filter, targets])

  /* ── Build filter buttons with dynamic counts ── */
  const filters: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all',         label: 'All',              count: filterCounts.all },
    { key: 'absconding',  label: 'Absconding',       count: filterCounts.absconding },
    { key: 'repeat',      label: 'Repeat Offenders', count: filterCounts.repeat },
    { key: 'critical',    label: 'Critical',         count: filterCounts.critical },
  ]

  // Render
  return (
    <div className="flex flex-col gap-6">
      {/* ── Section Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div className="flex items-center gap-2.5">
          <Crosshair className="size-4 text-red-400" />
          <div>
            <h2 className="text-sm font-semibold text-slate-300 tracking-[0.1em] uppercase">
              Priority Targets
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Generated from 10,000 case analysis — SCRB Fugitive Tracking Cell
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] text-slate-600 tabular-nums">
            {filteredTargets.length} of {targets.length} subjects — 10,000 case corpus
          </span>
          <LastSynced />
        </div>
      </motion.div>

      {/* ── Filter Bar ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 flex-wrap"
      >
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => {
              if (f.key !== filter) {
                toast(`Filtered: ${f.label} targets`, { duration: 2000 })
              }
              setFilter(f.key)
            }}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-semibold
              uppercase tracking-wider border transition-all duration-200 cursor-pointer
              ${filter === f.key
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-transparent text-slate-500 border-white/[0.06] hover:text-slate-300 hover:border-white/[0.12] hover:bg-white/[0.02]'
              }
            `}
          >
            {f.label}
            <span className={`tabular-nums ${filter === f.key ? 'text-slate-300' : 'text-slate-600'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </motion.div>

      {/* ── Target Cards Grid ── */}
      <div className="max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
        {filteredTargets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-600 gap-2">
            <Crosshair className="size-5 opacity-40" />
            <p className="text-[11px]">No subjects match current filter criteria</p>
          </div>
        ) : (
          <motion.div
            variants={cardContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredTargets.map((target, idx) => {
              const { suspectName, linkedDistrict, topCrimeType, topCrimeSeverity, riskScore, linkedCases, arrestStatus, isRepeatOffender, suspectRowid, linkedFir, linkedDistrictRowid } = target
              const colors = THREAT_LEVEL_COLOR[topCrimeSeverity] ?? THREAT_LEVEL_COLOR.Low
              const statusStyle = STATUS_STYLES[arrestStatus] ?? STATUS_STYLES['Arrested']
              const severityBadgeStyle = SEVERITY_BADGE[topCrimeSeverity] ?? SEVERITY_BADGE.Low
              const initials = getInitials(suspectName)

              return (
                <motion.div
                  key={`${suspectRowid}-${idx}`}
                  variants={cardItem}
                  className={`glass-card relative p-5 flex flex-col gap-3 group hover:-translate-y-1 transition-all duration-300 cursor-pointer`}
                  onClick={() => openDossier(suspectName, linkedFir)}
                >
                  {/* Threat level accent line */}
                  <div className={`absolute top-0 left-3 right-3 h-px ${
                    topCrimeSeverity === 'Critical' ? 'bg-red-500/30' :
                    topCrimeSeverity === 'High' ? 'bg-amber-500/30' :
                    topCrimeSeverity === 'Medium' ? 'bg-emerald-500/20' :
                    'bg-slate-500/10'
                  }`} />

                  {/* ── Avatar + Name Row ── */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`
                        shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                        text-[13px] font-bold ring-2 ${colors.avatar} ${colors.ring}
                        ${topCrimeSeverity === 'Critical' ? 'ring-2 ring-red-500/50' : ''}
                        ${topCrimeSeverity === 'High' ? 'ring-2 ring-amber-500/40' : ''}
                      `}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-white leading-tight truncate">
                        {suspectName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                        <MapPin className="size-2.5 shrink-0" />
                        <button
                          onClick={(e) => { e.stopPropagation(); navigateToDistrict(linkedDistrictRowid) }}
                          className="truncate hover:text-emerald-400 transition-colors text-left"
                        >
                          {linkedDistrict}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── Badges Row ── */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge className={`h-4 px-1.5 text-[9px] font-semibold border ${severityBadgeStyle}`}>
                      {topCrimeType}
                    </Badge>
                    <Badge className={`h-4 px-1.5 text-[9px] font-semibold border ${statusStyle}`}>
                      {arrestStatus}
                    </Badge>
                  </div>

                  {/* ── Repeat Offender Tag ── */}
                  {isRepeatOffender && (
                    <div className="flex items-center gap-1.5 text-amber-400/80">
                      <AlertTriangle className="size-3" />
                      <span className="text-[9px] font-semibold uppercase tracking-wider">Repeat Offender</span>
                    </div>
                  )}

                  {/* ── Risk Score Bar ── */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-600 uppercase tracking-wider font-medium flex items-center gap-1">
                        <Shield className="size-2.5" />
                        Threat Level
                      </span>
                      <span className={`text-[10px] font-bold tabular-nums ${
                        riskScore >= 76 ? 'text-red-400' :
                        riskScore >= 51 ? 'text-amber-400' :
                        'text-emerald-400'
                      }`}>{riskScore}</span>
                    </div>
                    <div className="threat-bar">
                      <motion.div
                        className="threat-bar-fill"
                        style={{ 
                          background: `linear-gradient(90deg, #10b981, ${riskScore >= 76 ? '#ef4444' : riskScore >= 51 ? '#f59e0b' : '#10b981'})` 
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${riskScore}%` }}
                        transition={{ delay: 0.2 + idx * 0.03, duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  {/* ── Linked Cases ── */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-medium flex items-center gap-1">
                      <User className="size-2.5" />
                      Associated FIRs
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400 tabular-nums">
                      {linkedCases}
                    </span>
                  </div>

                  {/* ── Cross-Tab Actions ── */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigateToNetworkSearch(suspectName) }}
                      className="flex items-center gap-1 text-[9px] text-cyan-400/70 hover:text-cyan-400 transition-colors"
                    >
                      <GitBranch className="size-2.5" />
                      Link Analysis
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}

// Deterministic Hash (for repeat offender case count variation)

function hashStr(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + ch
    hash |= 0
  }
  return hash
}