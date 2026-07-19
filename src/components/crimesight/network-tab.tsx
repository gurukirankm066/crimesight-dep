'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useCrimeSightStore } from '@/lib/store'
import LastSynced from '@/components/crimesight/last-synced'
import {
  Search, Users, Link2, MapPin, AlertTriangle, Network,
  X, User, FileText, Shield, ChevronRight, Clock, Activity,
  Eye, Zap, GitBranch, Brain, Radio
} from 'lucide-react'
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from 'd3-force'
import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force'
import {
  DEMO_SUSPECTS,
  DEMO_CASES,
  DEMO_ARRESTS,
  DEMO_OFFICERS,
  DEMO_NARRATIVE_ARCS,
  getDemoDistrictName,
  getDemoCrimeTypeName,
  getCaseNarrativeArc,
  getSuspectArcs,
} from '@/lib/demo-data'
import type { DemoSuspect, DemoCase, DemoOfficer } from '@/lib/demo-data'
import {
  KSP_REPEAT_OFFENDERS,
  KSP_SPATIAL_CLUSTERS,
  KSP_CASES,
} from '@/lib/ksp-data'
import type { RepeatOffender as KSPRepeatOffender, SpatialCluster as KSPSpatialCluster } from '@/lib/ksp-data'

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

type SubTab = 'graph' | 'networks' | 'repeaters' | 'linked' | 'cross' | 'ksp'
type NodeType = 'suspect' | 'case' | 'crimeType' | 'district' | 'officer'
type LinkType = 'suspect-case' | 'case-district' | 'case-crime' | 'officer-case' | 'shared-case'

interface GraphNode extends SimulationNodeDatum {
  id: string
  type: NodeType
  label: string
  color: string
  size: number
  // Suspect fields
  arrestStatus?: string
  isRepeatOffender?: boolean
  age?: string
  gender?: string
  occupation?: string
  address?: string
  crimeTypes?: string[]
  linkedFirs?: string[]
  linkedCaseCount?: number
  // Case fields
  firNumber?: string
  casePriority?: string
  caseStatus?: string
  place?: string
  caseDate?: string
  riskScore?: number
  aiSummary?: string
  linkedSuspectNames?: string[]
  officerName?: string
  // District fields
  districtCode?: string
  districtCaseCount?: number
  districtCrimeTypeCounts?: Record<string, number>
  // Officer fields
  officerRank?: string
  officerDesignation?: string
  officerUnit?: string
  officerDistrict?: string
  officerBadge?: string
  officerEmail?: string
  // Crime type fields
  crimeTypeCaseCount?: number
  crimeTypeSuspectCount?: number
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: GraphNode | string
  target: GraphNode | string
  type: LinkType
}

interface CrimeCluster {
  crimeType: string
  crimeTypeRowid: string
  suspectCount: number
  caseCount: number
  topSuspects: string[]
}

interface RepeatOffenderRow {
  suspect: DemoSuspect
  crimeTypes: string[]
  districts: string[]
  repeatCount: number
}

interface LinkedCaseEntry {
  suspectName: string
  cases: DemoCase[]
}

interface CrossDistrictEntry {
  suspectName: string
  districts: string[]
  districtCaseCounts: Record<string, number>
  totalCases: number
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const ARREST_BADGE: Record<string, string> = {
  'Arrested': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Absconding': 'bg-red-500/15 text-red-400 border-red-500/30',
  'Released on Bail': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'In Custody': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'Surrendered': 'bg-sky-500/15 text-sky-400 border-sky-500/30',
}

const CRIME_CLUSTER_COLORS: Record<string, string> = {
  'Theft': 'bg-amber-500/20 text-amber-400',
  'Robbery': 'bg-red-500/20 text-red-400',
  'Assault': 'bg-orange-500/20 text-orange-400',
  'Cyber Crime': 'bg-cyan-500/20 text-cyan-400',
  'Fraud': 'bg-violet-500/20 text-violet-400',
  'Murder': 'bg-rose-600/20 text-rose-500',
  'Kidnapping': 'bg-pink-500/20 text-pink-400',
  'Narcotics': 'bg-green-500/20 text-green-400',
  'Burglary': 'bg-purple-500/20 text-purple-400',
  'Vehicle Theft': 'bg-yellow-500/20 text-yellow-400',
}

const ARREST_NODE_COLORS: Record<string, string> = {
  'Absconding': '#ef4444',
  'Arrested': '#10b981',
  'Released on Bail': '#f59e0b',
  'In Custody': '#3b82f6',
  'Surrendered': '#64748b',
}

const PRIORITY_COLORS: Record<string, string> = {
  'Critical': '#ef4444',
  'High': '#f97316',
  'Medium': '#eab308',
  'Low': '#64748b',
}

const SEVERITY_COLORS: Record<string, string> = {
  'Murder': '#dc2626', 'Attempt to Murder': '#dc2626', 'Rape': '#e11d48',
  'Dowry Death': '#e11d48', 'Human Trafficking': '#be185d',
  'Kidnapping': '#f97316', 'Robbery': '#f97316',
  'Narcotics': '#8b5cf6', 'Arms Act': '#a855f7', 'Rioting': '#ea580c',
  'Assault': '#d97706', 'Cyber Crime': '#06b6d4', 'Fraud': '#7c3aed',
  'Cheating': '#a78bfa', 'Theft': '#eab308', 'Burglary': '#ca8a04',
  'Vehicle Theft': '#eab308', 'Chain Snatching': '#f59e0b',
  'Excise': '#78716c', 'Road Accident': '#6b7280', 'Others': '#9ca3af',
}

const ARC_COLORS: Record<string, { accent: string; bg: string; border: string }> = {
  'operation-black-lotus': { accent: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.3)' },
  'majestic-pickpocket-ring': { accent: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' },
  'kalaburagi-murder-series': { accent: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' },
}

const SUBTABS: { key: SubTab; label: string; icon: typeof Users }[] = [
  { key: 'graph', label: 'Accused-Case Association Graph', icon: Network },
  { key: 'networks', label: 'Crime Networks', icon: Users },
  { key: 'repeaters', label: 'Repeat Offenders', icon: AlertTriangle },
  { key: 'linked', label: 'Linked Cases', icon: Link2 },
  { key: 'cross', label: 'Inter-District', icon: MapPin },
  { key: 'ksp', label: 'KSP Intelligence', icon: Brain },
]

const FADE_UP = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
}

const NODE_TYPE_CONFIG: { type: NodeType; label: string; icon: typeof User; color: string }[] = [
  { type: 'suspect', label: 'Accused', icon: User, color: '#f87171' },
  { type: 'case', label: 'FIR Cases', icon: FileText, color: '#60a5fa' },
  { type: 'district', label: 'Districts', icon: MapPin, color: '#38bdf8' },
  { type: 'officer', label: 'IOs', icon: Shield, color: '#fbbf24' },
  { type: 'crimeType', label: 'Offence Types', icon: Zap, color: '#a78bfa' },
]

/* ═══════════════════════════════════════════════════════════════
   SUB-TAB DATA COMPUTATION
   ═══════════════════════════════════════════════════════════════ */

function computeCrimeClusters(): CrimeCluster[] {
  const caseMap = new Map<string, DemoCase>()
  for (const c of DEMO_CASES) caseMap.set(c.ROWID, c)
  const clusterMap = new Map<string, { suspects: Set<string>; cases: Set<string> }>()
  for (const s of DEMO_SUSPECTS) {
    const c = caseMap.get(s.case_rowid)
    if (!c) continue
    const ct = c.crime_type_rowid
    if (!clusterMap.has(ct)) clusterMap.set(ct, { suspects: new Set(), cases: new Set() })
    const entry = clusterMap.get(ct)!
    entry.suspects.add(s.suspect_name)
    entry.cases.add(c.ROWID)
  }
  const clusters: CrimeCluster[] = []
  for (const [ctRowid, data] of clusterMap) {
    clusters.push({
      crimeType: getDemoCrimeTypeName(ctRowid),
      crimeTypeRowid: ctRowid,
      suspectCount: data.suspects.size,
      caseCount: data.cases.size,
      topSuspects: Array.from(data.suspects).slice(0, 3),
    })
  }
  return clusters.sort((a, b) => b.caseCount - a.caseCount)
}

function computeRepeatOffenders(): RepeatOffenderRow[] {
  const caseMap = new Map<string, DemoCase>()
  for (const c of DEMO_CASES) caseMap.set(c.ROWID, c)
  const repeatSuspects = DEMO_SUSPECTS.filter(s => s.is_repeat_offender)
  const nameMap = new Map<string, DemoSuspect[]>()
  for (const s of repeatSuspects) {
    if (!nameMap.has(s.suspect_name)) nameMap.set(s.suspect_name, [])
    nameMap.get(s.suspect_name)!.push(s)
  }
  const rows: RepeatOffenderRow[] = []
  for (const [name, suspects] of nameMap) {
    const crimeTypes = new Set<string>()
    const districts = new Set<string>()
    for (const s of suspects) {
      const c = caseMap.get(s.case_rowid)
      if (c) {
        crimeTypes.add(getDemoCrimeTypeName(c.crime_type_rowid))
        districts.add(getDemoDistrictName(c.district_rowid))
      }
    }
    rows.push({ suspect: suspects[0], crimeTypes: Array.from(crimeTypes), districts: Array.from(districts), repeatCount: suspects.length })
  }
  return rows.sort((a, b) => b.repeatCount - a.repeatCount)
}

function computeLinkedCases(): LinkedCaseEntry[] {
  const caseMap = new Map<string, DemoCase>()
  for (const c of DEMO_CASES) caseMap.set(c.ROWID, c)
  const nameCasesMap = new Map<string, DemoCase[]>()
  for (const s of DEMO_SUSPECTS) {
    const c = caseMap.get(s.case_rowid)
    if (!c) continue
    if (!nameCasesMap.has(s.suspect_name)) nameCasesMap.set(s.suspect_name, [])
    nameCasesMap.get(s.suspect_name)!.push(c)
  }
  const entries: LinkedCaseEntry[] = []
  for (const [name, cases] of nameCasesMap) {
    const uniqueCases = new Map<string, DemoCase>()
    for (const c of cases) uniqueCases.set(c.ROWID, c)
    const deduped = Array.from(uniqueCases.values())
    if (deduped.length < 2) continue
    entries.push({ suspectName: name, cases: deduped })
  }
  return entries.sort((a, b) => b.cases.length - a.cases.length)
}

function computeCrossDistrict(): CrossDistrictEntry[] {
  const caseMap = new Map<string, DemoCase>()
  for (const c of DEMO_CASES) caseMap.set(c.ROWID, c)
  const nameDistrictMap = new Map<string, Map<string, number>>()
  for (const s of DEMO_SUSPECTS) {
    const c = caseMap.get(s.case_rowid)
    if (!c) continue
    const distName = getDemoDistrictName(c.district_rowid)
    if (!nameDistrictMap.has(s.suspect_name)) nameDistrictMap.set(s.suspect_name, new Map())
    const dm = nameDistrictMap.get(s.suspect_name)!
    dm.set(distName, (dm.get(distName) ?? 0) + 1)
  }
  const entries: CrossDistrictEntry[] = []
  for (const [name, distMap] of nameDistrictMap) {
    if (distMap.size < 2) continue
    const districts = Array.from(distMap.keys())
    const districtCaseCounts: Record<string, number> = {}
    let totalCases = 0
    for (const [d, count] of distMap) { districtCaseCounts[d] = count; totalCases += count }
    entries.push({ suspectName: name, districts, districtCaseCounts, totalCases })
  }
  return entries.sort((a, b) => b.districts.length - a.districts.length)
}

/* ═══════════════════════════════════════════════════════════════
   GRAPH DATA COMPUTATION — Full Ontology with 5 Entity Types
   ═══════════════════════════════════════════════════════════════ */

function computeGraphData(): { nodes: GraphNode[]; links: GraphLink[] } {
  const caseMap = new Map<string, DemoCase>()
  for (const c of DEMO_CASES) caseMap.set(c.ROWID, c)

  const officerMap = new Map<string, DemoOfficer>()
  for (const o of DEMO_OFFICERS) officerMap.set(o.ROWID, o)

  // ── Aggregate suspect data by name ──
  const suspectData = new Map<string, {
    arrestStatus: string; isRepeat: boolean; age: string; gender: string
    occupation: string; address: string; crimeTypes: Set<string>
    districts: Set<string>; firs: Map<string, string>; caseIds: Set<string>
  }>()

  for (const s of DEMO_SUSPECTS) {
    const c = caseMap.get(s.case_rowid)
    if (!c) continue
    if (!suspectData.has(s.suspect_name)) {
      suspectData.set(s.suspect_name, {
        arrestStatus: s.arrest_status, isRepeat: s.is_repeat_offender,
        age: s.age, gender: s.gender, occupation: s.occupation, address: s.address,
        crimeTypes: new Set(), districts: new Set(), firs: new Map(), caseIds: new Set(),
      })
    }
    const d = suspectData.get(s.suspect_name)!
    if (s.arrest_status === 'Absconding') d.arrestStatus = 'Absconding'
    if (s.is_repeat_offender) d.isRepeat = true
    d.crimeTypes.add(getDemoCrimeTypeName(c.crime_type_rowid))
    d.districts.add(getDemoDistrictName(c.district_rowid))
    d.firs.set(c.ROWID, c.fir_number)
    d.caseIds.add(c.ROWID)
  }

  // ── Collect case nodes (cases with at least one suspect) ──
  const caseSet = new Set<string>()
  for (const [, d] of suspectData) for (const cid of d.caseIds) caseSet.add(cid)

  // ── Officer → case links from arrests ──
  const officerCaseLinks = new Map<string, Set<string>>() // officerRowid -> caseRowid[]
  const caseOfficerLinks = new Map<string, string>() // caseRowid -> officerName
  for (const a of DEMO_ARRESTS) {
    if (!caseSet.has(a.case_rowid)) continue
    if (!officerCaseLinks.has(a.arresting_officer_rowid)) officerCaseLinks.set(a.arresting_officer_rowid, new Set())
    officerCaseLinks.get(a.arresting_officer_rowid)!.add(a.case_rowid)
    const off = officerMap.get(a.arresting_officer_rowid)
    if (off) caseOfficerLinks.set(a.case_rowid, off.full_name)
  }

  // ── Build nodes and links ──
  const nodes: GraphNode[] = []
  const links: GraphLink[] = []
  const nodeMap = new Map<string, GraphNode>()

  const addNode = (id: string, node: GraphNode) => {
    if (nodeMap.has(id)) return nodeMap.get(id)!
    nodes.push(node)
    nodeMap.set(id, node)
    return node
  }

  // 1. Crime type nodes
  const allCrimeTypes = new Set<string>()
  for (const [, d] of suspectData) for (const ct of d.crimeTypes) allCrimeTypes.add(ct)
  for (const ct of allCrimeTypes) {
    const ctCases = DEMO_CASES.filter(c => getDemoCrimeTypeName(c.crime_type_rowid) === ct && caseSet.has(c.ROWID))
    const ctSuspectCount = Array.from(suspectData.values()).filter(d => d.crimeTypes.has(ct)).length
    addNode(`ct-${ct}`, {
      id: `ct-${ct}`, type: 'crimeType', label: ct,
      color: SEVERITY_COLORS[ct] ?? '#9ca3af', size: 7,
      crimeTypeCaseCount: ctCases.length, crimeTypeSuspectCount: ctSuspectCount,
    })
  }

  // 2. District nodes
  const allDistricts = new Set<string>()
  for (const [, d] of suspectData) for (const dd of d.districts) allDistricts.add(dd)
  for (const dName of allDistricts) {
    const dCases = DEMO_CASES.filter(c => getDemoDistrictName(c.district_rowid) === dName && caseSet.has(c.ROWID))
    const ctCounts: Record<string, number> = {}
    for (const c of dCases) {
      const ct = getDemoCrimeTypeName(c.crime_type_rowid)
      ctCounts[ct] = (ctCounts[ct] || 0) + 1
    }
    addNode(`dist-${dName}`, {
      id: `dist-${dName}`, type: 'district', label: dName,
      color: '#38bdf8', size: 9, districtCaseCount: dCases.length, districtCrimeTypeCounts: ctCounts,
    })
  }

  // 3. Officer nodes
  const usedOfficers = new Set<string>()
  for (const [offRowid, caseRowids] of officerCaseLinks) {
    if (usedOfficers.has(offRowid)) continue
    usedOfficers.add(offRowid)
    const off = officerMap.get(offRowid)
    if (!off) continue
    const rankSize = off.rank === 'SP' ? 8 : off.rank === 'DSP' ? 7 : off.rank === 'Inspector' ? 6.5 : 5.5
    addNode(`off-${off.ROWID}`, {
      id: `off-${off.ROWID}`, type: 'officer', label: off.full_name.split(' ').slice(0, 2).join(' '),
      color: '#fbbf24', size: rankSize,
      officerRank: off.rank, officerDesignation: off.designation,
      officerUnit: off.unit_name, officerDistrict: off.district_name,
      officerBadge: off.badge_number, officerEmail: off.email,
    })
  }

  // 4. Case nodes
  for (const caseRowid of caseSet) {
    const c = caseMap.get(caseRowid)!
    const ctName = getDemoCrimeTypeName(c.crime_type_rowid)
    const distName = getDemoDistrictName(c.district_rowid)
    const priority = c.case_priority
    const size = priority === 'Critical' ? 6 : priority === 'High' ? 5 : 4
    // Find linked suspect names
    const linkedNames: string[] = []
    for (const [name, d] of suspectData) { if (d.caseIds.has(caseRowid)) linkedNames.push(name) }

    addNode(`case-${caseRowid}`, {
      id: `case-${caseRowid}`, type: 'case', label: c.fir_number.replace('FIR/2025/KSP/', '#'),
      color: PRIORITY_COLORS[priority] ?? '#64748b', size,
      firNumber: c.fir_number, casePriority: priority, caseStatus: c.case_status,
      place: c.place_of_occurrence, caseDate: c.complaint_datetime?.substring(0, 10),
      riskScore: c.ai_risk_score, aiSummary: c.ai_summary,
      linkedSuspectNames: linkedNames, officerName: caseOfficerLinks.get(caseRowid),
    })

    // Case → district link
    links.push({ source: `case-${caseRowid}`, target: `dist-${distName}`, type: 'case-district' })
    // Case → crime type link
    links.push({ source: `case-${caseRowid}`, target: `ct-${ctName}`, type: 'case-crime' })
  }

  // 5. Officer → case links
  for (const [offRowid, caseRowids] of officerCaseLinks) {
    for (const caseRowid of caseRowids) {
      links.push({ source: `off-${offRowid}`, target: `case-${caseRowid}`, type: 'officer-case' })
    }
  }

  // 6. Suspect nodes + suspect-case links
  for (const [name, d] of suspectData) {
    const caseCount = d.caseIds.size
    const nodeColor = d.arrestStatus === 'Absconding' ? '#ef4444'
      : ARREST_NODE_COLORS[d.arrestStatus] ?? '#64748b'
    const size = Math.max(6, Math.min(18, 5 + caseCount * 2))

    addNode(`s-${name}`, {
      id: `s-${name}`, type: 'suspect', label: name, color: nodeColor, size,
      arrestStatus: d.arrestStatus, isRepeatOffender: d.isRepeat,
      age: d.age, gender: d.gender, occupation: d.occupation, address: d.address,
      crimeTypes: Array.from(d.crimeTypes), linkedFirs: Array.from(d.firs.values()),
      linkedCaseCount: caseCount,
    })

    // Suspect → case links
    for (const caseRowid of d.caseIds) {
      links.push({ source: `s-${name}`, target: `case-${caseRowid}`, type: 'suspect-case' })
    }
  }

  // 7. Shared-case links (suspect-suspect)
  const caseSuspectNames = new Map<string, string[]>()
  for (const [name, d] of suspectData) {
    for (const caseRowid of d.caseIds) {
      if (!caseSuspectNames.has(caseRowid)) caseSuspectNames.set(caseRowid, [])
      caseSuspectNames.get(caseRowid)!.push(name)
    }
  }
  const sharedPairs = new Set<string>()
  for (const [, names] of caseSuspectNames) {
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const key = [names[i], names[j]].sort().join('|||')
        if (!sharedPairs.has(key)) {
          sharedPairs.add(key)
          links.push({ source: `s-${names[i]}`, target: `s-${names[j]}`, type: 'shared-case' })
        }
      }
    }
  }

  return { nodes, links }
}

/* ═══════════════════════════════════════════════════════════════
   ENTITY DETAIL PANEL — Slides in from right
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   SUSPECT INLINE INTELLIGENCE PANEL — Compact overlay for clicked suspect nodes
   ═══════════════════════════════════════════════════════════════ */

function SuspectInlineIntelPanel({
  node,
  links,
  allNodes,
  onClose,
  onHighlightNode,
}: {
  node: GraphNode
  links: GraphLink[]
  allNodes: GraphNode[]
  onClose: () => void
  onHighlightNode: (node: GraphNode) => void
}) {
  const { openDossier, navigateToFir } = useCrimeSightStore()

  // Compute co-accused from links (suspect-suspect via shared-case)
  const coAccused = useMemo(() => {
    const neighborIds = new Set<string>()
    for (const l of links) {
      const sId = typeof l.source === 'string' ? l.source : l.source.id
      const tId = typeof l.target === 'string' ? l.target : l.target.id
      if (l.type === 'shared-case') {
        if (sId === node.id && tId.startsWith('s-')) neighborIds.add(tId)
        if (tId === node.id && sId.startsWith('s-')) neighborIds.add(sId)
      }
    }
    return allNodes
      .filter(n => neighborIds.has(n.id) && n.type === 'suspect')
      .map(n => n.label)
  }, [links, allNodes, node.id])

  // Compute linked case details from DEMO_CASES
  const linkedCaseDetails = useMemo(() => {
    if (!node.linkedFirs) return []
    return node.linkedFirs.map(firNum => {
      const kase = DEMO_CASES.find(c => c.fir_number === firNum)
      return {
        firNumber: firNum,
        crimeType: kase ? getDemoCrimeTypeName(kase.crime_type_rowid) : 'Unknown',
        district: kase ? getDemoDistrictName(kase.district_rowid) : '',
        caseId: kase ? `case-${kase.ROWID}` : '',
      }
    })
  }, [node.linkedFirs])

  // Compute unique districts from linked cases
  const uniqueDistricts = useMemo(() => {
    const dists = new Set<string>()
    for (const detail of linkedCaseDetails) {
      if (detail.district) dists.add(detail.district)
    }
    return dists.size
  }, [linkedCaseDetails])

  const maxShow = 5
  const showAllLinkedCases = linkedCaseDetails.length > maxShow
  const showAllCoAccused = coAccused.length > maxShow

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      className="absolute top-0 right-0 w-80 h-full bg-[#0a0f1a]/95 backdrop-blur-xl border-l border-emerald-500/20 p-4 overflow-y-auto custom-scrollbar z-10 flex flex-col"
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold"
            style={{ backgroundColor: `${node.color}20`, color: node.color, border: `1px solid ${node.color}40` }}
          >
            {node.label.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate leading-tight">{node.label}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {node.age}y · {node.gender} · {node.occupation}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors shrink-0 -mr-1 -mt-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Status Row ── */}
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <Badge variant="outline" className={`text-[10px] ${ARREST_BADGE[node.arrestStatus ?? ''] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}>
          {node.arrestStatus}
        </Badge>
        {node.isRepeatOffender && (
          <Badge variant="outline" className="text-[10px] bg-red-500/15 text-red-400 border-red-500/30">
            <AlertTriangle className="w-2.5 h-2.5 mr-1" />
            Repeat Offender
          </Badge>
        )}
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-3 gap-2 mb-4 shrink-0">
        <div className="bg-white/[0.03] rounded-lg px-2.5 py-2 text-center">
          <p className="text-2xl font-bold tabular-nums text-blue-400">{linkedCaseDetails.length}</p>
          <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">Linked FIRs</p>
        </div>
        <div className="bg-white/[0.03] rounded-lg px-2.5 py-2 text-center">
          <p className="text-2xl font-bold tabular-nums text-rose-400">{coAccused.length}</p>
          <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">Co-Accused</p>
        </div>
        <div className="bg-white/[0.03] rounded-lg px-2.5 py-2 text-center">
          <p className="text-2xl font-bold tabular-nums text-emerald-400">{uniqueDistricts}</p>
          <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">Districts</p>
        </div>
      </div>

      {/* ── Linked Cases ── */}
      {linkedCaseDetails.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">
              Linked Cases ({linkedCaseDetails.length})
            </span>
          </div>
          <div className="space-y-1">
            {linkedCaseDetails.slice(0, maxShow).map(detail => (
              <button
                key={detail.firNumber}
                onClick={() => navigateToFir(detail.caseId)}
                className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded hover:bg-white/[0.04] transition-colors group"
              >
                <FileText className="w-3 h-3 text-blue-400/60 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-mono text-blue-300 group-hover:text-blue-200 truncate">{detail.firNumber}</p>
                  <p className="text-[10px] text-slate-600 truncate">{detail.crimeType}{detail.district ? ` · ${detail.district}` : ''}</p>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-700 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
          </div>
          {showAllLinkedCases && (
            <button
              onClick={() => openDossier(node.label)}
              className="flex items-center gap-1 mt-1.5 text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              Show all {linkedCaseDetails.length} cases <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* ── Co-Accused ── */}
      {coAccused.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">
              Co-Accused ({coAccused.length})
            </span>
          </div>
          <div className="space-y-1">
            {coAccused.slice(0, maxShow).map(name => {
              const coNode = allNodes.find(n => n.type === 'suspect' && n.label === name)
              return (
                <button
                  key={name}
                  onClick={() => coNode && onHighlightNode(coNode)}
                  className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded hover:bg-white/[0.04] transition-colors group"
                >
                  <User className="w-3 h-3 text-red-400/60 shrink-0" />
                  <span className="text-[11px] text-slate-300 group-hover:text-white truncate">{name}</span>
                  <ChevronRight className="w-3 h-3 text-slate-700 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              )
            })}
          </div>
          {showAllCoAccused && (
            <button
              onClick={() => openDossier(node.label)}
              className="flex items-center gap-1 mt-1.5 text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              Show all {coAccused.length} co-accused <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* ── Narrative Arc Linkage ── */}
      {(() => {
        const arcs = getSuspectArcs(node.label)
        if (arcs.length === 0) return null
        return (
          <div className="mb-4">
            <span className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">Operation Linkage</span>
            <div className="mt-1.5 space-y-1.5">
              {arcs.map(arc => {
                const colors = ARC_COLORS[arc.id]
                if (!colors) return null
                return (
                  <div key={arc.id} className="px-2.5 py-1.5 rounded border" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium" style={{ color: colors.accent }}>{arc.name}</span>
                      <Badge variant="outline" className="text-[9px]" style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.accent }}>
                        {arc.caseIds.length} FIRs
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* ── Spacer ── */}
      <div className="flex-1 min-h-2" />

      {/* ── View Full Dossier Button ── */}
      <button
        onClick={() => openDossier(node.label)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/12 border border-emerald-500/25 hover:bg-emerald-500/20 transition-colors text-emerald-400 text-[12px] font-semibold shrink-0"
      >
        <Eye className="w-3.5 h-3.5" />
        View Full Dossier
      </button>
    </motion.div>
  )
}

function EntityDetailPanel({ node, onClose }: { node: GraphNode; onClose: () => void }) {
  const { navigateToFir, navigateToDistrict, navigateToSuspect, navigateToArcCases } = useCrimeSightStore()

  const priorityBadge: Record<string, string> = {
    'Critical': 'bg-red-500/15 text-red-400 border-red-500/30',
    'High': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    'Medium': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    'Low': 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  }

  const statusBadge: Record<string, string> = {
    'Under Investigation': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    'Open': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'Closed': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'Charge Sheet Filed': 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    'Transfer Pending': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  }

  const typeLabels: Record<NodeType, string> = {
    suspect: 'SUSPECT DOSSIER', case: 'FIR CASE FILE', district: 'DISTRICT PROFILE',
    officer: 'IO RECORD', crimeType: 'OFFENCE TYPE ANALYSIS',
  }

  const typeIcons: Record<NodeType, typeof User> = {
    suspect: User, case: FileText, district: MapPin, officer: Shield, crimeType: Zap,
  }

  const Icon = typeIcons[node.type]

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute right-0 top-0 bottom-0 w-[360px] bg-[#0a0f1a]/95 backdrop-blur-xl border-l border-white/[0.06] z-40 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" style={{ color: node.color }} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {typeLabels[node.type]}
          </span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* Name / Title */}
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
            style={{ backgroundColor: `${node.color}20`, color: node.color, border: `1px solid ${node.color}40` }}
          >
            {node.type === 'suspect' && <span>{node.label.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>}
            {node.type === 'case' && <FileText className="w-4 h-4" />}
            {node.type === 'district' && <MapPin className="w-4 h-4" />}
            {node.type === 'officer' && <Shield className="w-4 h-4" />}
            {node.type === 'crimeType' && <Zap className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{node.label}</h3>
            {node.type === 'suspect' && (
              <p className="text-[11px] text-slate-500">{node.age}y · {node.gender} · {node.occupation}</p>
            )}
            {node.type === 'officer' && (
              <p className="text-[11px] text-slate-500">{node.officerRank} — {node.officerDesignation}</p>
            )}
            {node.type === 'district' && (
              <p className="text-[11px] text-slate-500">{node.districtCode} · {node.districtCaseCount} FIRs</p>
            )}
            {node.type === 'crimeType' && (
              <p className="text-[11px] text-slate-500">{node.crimeTypeCaseCount} FIRs · {node.crimeTypeSuspectCount} accused</p>
            )}
          </div>
        </div>

        {/* ── SUSPECT DETAILS ── */}
        {node.type === 'suspect' && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">Arrest Status</span>
                <Badge variant="outline" className={`text-[10px] ${ARREST_BADGE[node.arrestStatus ?? ''] ?? ''}`}>
                  {node.arrestStatus}
                </Badge>
              </div>
              {node.address && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">Address</span>
                  <p className="text-[12px] text-slate-400 mt-0.5">{node.address}</p>
                </div>
              )}
              {node.isRepeatOffender && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-red-500/8 border border-red-500/15">
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Repeat Offender</span>
                </div>
              )}
            </div>

            {/* Linked Cases */}
            {node.linkedFirs && node.linkedFirs.length > 0 && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">
                  Linked Cases ({node.linkedFirs.length})
                </span>
                <div className="mt-1.5 space-y-1">
                  {node.linkedFirs.map(fir => (
                    <button
                      key={fir}
                      onClick={() => { const id = fir.replace('FIR/2025/KSP/', 'case-'); navigateToFir(id) }}
                      className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded hover:bg-white/[0.03] transition-colors group"
                    >
                      <FileText className="w-3 h-3 text-blue-400/60 shrink-0" />
                      <span className="text-[11px] font-mono text-blue-300 group-hover:text-blue-200">{fir}</span>
                      <ChevronRight className="w-3 h-3 text-slate-700 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Crime Types */}
            {node.crimeTypes && node.crimeTypes.length > 0 && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">Offence Types</span>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {node.crimeTypes.map(ct => (
                    <Badge key={ct} variant="outline" className="text-[10px] px-1.5 py-0 bg-white/[0.03] border-white/[0.06] text-slate-300">
                      {ct}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Narrative Arc Affiliation */}
            {(() => {
              const arcs = getSuspectArcs(node.label)
              if (arcs.length === 0) return null
              return (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">Operation Linkage</span>
                  <div className="mt-1.5 space-y-1.5">
                    {arcs.map(arc => {
                      const colors = ARC_COLORS[arc.id]
                      if (!colors) return null
                      return (
                        <div key={arc.id} className="px-2.5 py-2 rounded border" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium" style={{ color: colors.accent }}>{arc.name}</span>
                            <Badge variant="outline" className="text-[9px]" style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.accent }}>{arc.status.split('—')[0].trim()}</Badge>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">{arc.caseIds.length} FIRs · {arc.districts.length} districts</p>
                          <button
                            onClick={() => navigateToArcCases(arc.id)}
                            className="flex items-center gap-1.5 mt-1.5 text-[10px] font-medium transition-colors hover:opacity-80"
                            style={{ color: colors.accent }}
                          >
                            <FileText className="w-3 h-3" />
                            View FIR Registry →
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </>
        )}

        {/* ── CASE DETAILS ── */}
        {node.type === 'case' && (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={`text-[10px] ${priorityBadge[node.casePriority ?? ''] ?? ''}`}>
                  {node.casePriority}
                </Badge>
                <Badge variant="outline" className={`text-[10px] ${statusBadge[node.caseStatus ?? ''] ?? ''}`}>
                  {node.caseStatus}
                </Badge>
              </div>
              {node.place && (
                <div className="flex items-center gap-2 text-[12px] text-slate-400">
                  <MapPin className="w-3 h-3 text-slate-600" />
                  {node.place}
                </div>
              )}
              {node.caseDate && (
                <div className="flex items-center gap-2 text-[12px] text-slate-500">
                  <Clock className="w-3 h-3" />
                  {node.caseDate}
                </div>
              )}
            </div>

            {/* Risk Score */}
            {node.riskScore !== undefined && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">Threat Assessment Score</span>
                  <span className="text-xs font-bold tabular-nums" style={{
                    color: node.riskScore >= 70 ? '#ef4444' : node.riskScore >= 40 ? '#f59e0b' : '#10b981'
                  }}>{node.riskScore}</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${node.riskScore}%`,
                    backgroundColor: node.riskScore >= 70 ? '#ef4444' : node.riskScore >= 40 ? '#f59e0b' : '#10b981'
                  }} />
                </div>
              </div>
            )}

            {/* SCRB Intelligence Note */}
            {node.aiSummary && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">SCRB Assessment</span>
                <p className="text-[12px] text-slate-400 mt-1 leading-relaxed">{node.aiSummary}</p>
              </div>
            )}

            {/* Linked Suspects */}
            {node.linkedSuspectNames && node.linkedSuspectNames.length > 0 && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">
                  Identified Accused ({node.linkedSuspectNames.length})
                </span>
                <div className="space-y-1 mt-1.5">
                  {node.linkedSuspectNames.map(name => (
                    <button
                      key={name}
                      onClick={() => navigateToSuspect(name)}
                      className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded hover:bg-white/[0.03] transition-colors group"
                    >
                      <User className="w-3 h-3 text-red-400/60 shrink-0" />
                      <span className="text-[12px] text-slate-300 group-hover:text-white">{name}</span>
                      <ChevronRight className="w-3 h-3 text-slate-700 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Investigating Officer */}
            {node.officerName && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">Investigating Officer</span>
                <div className="flex items-center gap-2 mt-1.5 px-2.5 py-1.5 rounded bg-white/[0.02]">
                  <Shield className="w-3 h-3 text-amber-400/60" />
                  <span className="text-[12px] text-slate-300">{node.officerName}</span>
                </div>
              </div>
            )}

            {/* Narrative Arc Badge + Cross-Tab Navigation */}
            <div className="space-y-2">
              {(() => {
                const arc = getCaseNarrativeArc(node.id.replace(/^case-/, ''))
                if (!arc) return null
                const colors = ARC_COLORS[arc.id]
                if (!colors) return null
                return (
                  <div className="px-2.5 py-1.5 rounded border flex items-center gap-2" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: colors.accent }} />
                    <span className="text-[10px] font-medium" style={{ color: colors.accent }}>{arc.name}</span>
                  </div>
                )
              })()}
              <button
                onClick={() => navigateToFir(node.id.replace(/^case-/, ''))}
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded bg-blue-500/8 border border-blue-500/15 hover:bg-blue-500/12 transition-colors group"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] text-blue-400 font-medium">View in FIR Registry</span>
                <ChevronRight className="w-3 h-3 text-blue-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </>
        )}

        {/* ── DISTRICT DETAILS ── */}
        {node.type === 'district' && (
          <>
            <button
              onClick={() => navigateToDistrict(`dist-${node.label}`)}
              className="flex items-center gap-2 w-full text-left px-3 py-2 rounded bg-emerald-500/8 border border-emerald-500/15 hover:bg-emerald-500/12 transition-colors group"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-emerald-400 font-medium">View on Geo Intelligence Map</span>
              <ChevronRight className="w-3 h-3 text-emerald-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            {node.districtCrimeTypeCounts && Object.keys(node.districtCrimeTypeCounts).length > 0 && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">Crime Breakdown</span>
                <div className="mt-1.5 space-y-1.5">
                  {Object.entries(node.districtCrimeTypeCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([ct, count]) => (
                      <div key={ct} className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 w-24 truncate">{ct}</span>
                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, count * 15)}%`,
                              backgroundColor: SEVERITY_COLORS[ct] ?? '#64748b',
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 tabular-nums w-5 text-right">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── OFFICER DETAILS ── */}
        {node.type === 'officer' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="px-2.5 py-2 rounded bg-white/[0.02]">
                <span className="text-[9px] uppercase tracking-wider text-slate-600">Rank</span>
                <p className="text-[12px] text-slate-300 font-medium mt-0.5">{node.officerRank}</p>
              </div>
              <div className="px-2.5 py-2 rounded bg-white/[0.02]">
                <span className="text-[9px] uppercase tracking-wider text-slate-600">Badge</span>
                <p className="text-[12px] text-slate-300 font-mono mt-0.5">{node.officerBadge}</p>
              </div>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-600">Unit</span>
              <p className="text-[12px] text-slate-400 mt-0.5">{node.officerUnit}</p>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-600">District</span>
              <p className="text-[12px] text-slate-400 mt-0.5">{node.officerDistrict}</p>
            </div>
            {node.officerEmail && (
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-600">Email</span>
                <p className="text-[12px] text-slate-500 font-mono mt-0.5">{node.officerEmail}</p>
              </div>
            )}
          </div>
        )}

        {/* ── CRIME TYPE DETAILS ── */}
        {node.type === 'crimeType' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="px-2.5 py-2 rounded bg-white/[0.02]">
              <span className="text-[9px] uppercase tracking-wider text-slate-600">Total Cases</span>
              <p className="text-2xl font-bold tabular-nums mt-0.5" style={{ color: node.color }}>
                {node.crimeTypeCaseCount}
              </p>
            </div>
            <div className="px-2.5 py-2 rounded bg-white/[0.02]">
              <span className="text-[9px] uppercase tracking-wider text-slate-600">Accused</span>
              <p className="text-2xl font-bold tabular-nums text-slate-300 mt-0.5">
                {node.crimeTypeSuspectCount}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   NETWORK GRAPH PANEL — Suspect-Case Network Graph
   ═══════════════════════════════════════════════════════════════ */

function NetworkGraphPanel() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<GraphNode[]>([])
  const linksRef = useRef<GraphLink[]>([])
  const simRef = useRef<ReturnType<typeof forceSimulation<GraphNode>> | null>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 0.85 })
  const transformRef = useRef({ x: 0, y: 0, k: 0.85 })
  const [tick, setTick] = useState(0)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GraphNode[]>([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [visibleTypes, setVisibleTypes] = useState<Set<NodeType>>(new Set(['suspect', 'case']))
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { networkSearchQuery, setNetworkSearchQuery, activeNarrativeArc, clearArcSelection, selectedSuspectName, setSelectedSuspect } = useCrimeSightStore()

  // React to cross-tab navigation search
  useEffect(() => {
    if (networkSearchQuery) {
      const q = networkSearchQuery
      setNetworkSearchQuery('')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery(q)
      setTimeout(() => searchInputRef.current?.focus(), 300)
    }
  }, [networkSearchQuery, setNetworkSearchQuery])

  // React to suspect name click from other tabs (Cases, Dashboard)
  useEffect(() => {
    if (selectedSuspectName) {
      const q = selectedSuspectName
      setSelectedSuspect(null)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery(q)
      setTimeout(() => searchInputRef.current?.focus(), 300)
    }
  }, [selectedSuspectName, setSelectedSuspect])

  const [activeArcFilter, setActiveArcFilter] = useState<string | null>(null)

  useEffect(() => {
    if (activeNarrativeArc) {
      // Sync store narrative arc to local filter
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveArcFilter(activeNarrativeArc)
    }
  }, [activeNarrativeArc])

  const dragRef = useRef<{ nodeId: string | null; startX: number; startY: number; moved: boolean }>({
    nodeId: null, startX: 0, startY: 0, moved: false,
  })

  const { nodes, links } = useMemo(() => computeGraphData(), [])

  // Node counts by type
  const nodeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const n of nodes) counts[n.type] = (counts[n.type] || 0) + 1
    return counts
  }, [nodes])

  const visibleNodes = useMemo(() => nodes.filter(n => visibleTypes.has(n.type)), [nodes, visibleTypes])
  const visibleLinks = useMemo(() => {
    const vIds = new Set(visibleNodes.map(n => n.id))
    return links.filter(l => {
      const sId = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id
      const tId = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id
      return vIds.has(sId) && vIds.has(tId)
    })
  }, [links, visibleNodes])

  // Arc node IDs for graph filtering
  const arcNodeIds = useMemo(() => {
    if (!activeArcFilter) return null
    const arc = DEMO_NARRATIVE_ARCS.find(a => a.id === activeArcFilter)
    if (!arc) return null
    const ids = new Set<string>()
    for (const name of arc.suspectNames) ids.add(`s-${name}`)
    for (const caseId of arc.caseIds) ids.add(`case-${caseId}`)
    for (const dist of arc.districts) ids.add(`dist-${dist}`)
    const arcCases = arc.caseIds.map(id => DEMO_CASES.find(c => c.ROWID === id)).filter((c): c is DemoCase => !!c)
    for (const c of arcCases) ids.add(`ct-${getDemoCrimeTypeName(c.crime_type_rowid)}`)
    return ids
  }, [activeArcFilter])

  useEffect(() => {
    nodesRef.current = nodes
    linksRef.current = links
    const sim = forceSimulation<GraphNode>(nodes)
      .force('link', forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance((d: GraphLink) => {
        if (d.type === 'shared-case') return 50
        if (d.type === 'case-district' || d.type === 'case-crime') return 80
        if (d.type === 'officer-case') return 100
        return 60
      }).strength((d: GraphLink) => {
        if (d.type === 'shared-case') return 0.5
        if (d.type === 'case-district') return 0.05
        if (d.type === 'case-crime') return 0.08
        if (d.type === 'officer-case') return 0.1
        return 0.3
      }))
      .force('charge', forceManyBody<GraphNode>().strength(d => d.type === 'district' || d.type === 'crimeType' ? -400 : -150))
      .force('center', forceCenter(600, 400))
      .force('collide', forceCollide<GraphNode>().radius(d => d.size + 3))
      .alphaDecay(0.02)
    sim.on('tick', () => setTick(t => t + 1))
    simRef.current = sim
    return () => { sim.stop() }
  }, [nodes, links])

  const updateTransform = useCallback((next: { x: number; y: number; k: number }) => {
    transformRef.current = next
    setTransform(next)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const t = transformRef.current
    const scale = e.deltaY > 0 ? 0.9 : 1.1
    const newK = Math.max(0.15, Math.min(5, t.k * scale))
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    updateTransform({ x: mx - (mx - t.x) * (newK / t.k), y: my - (my - t.y) * (newK / t.k), k: newK })
  }, [updateTransform])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).closest('.graph-node') || (e.target as Element).closest('.graph-overlay')) return
    setSelectedNode(null)
    dragRef.current = { nodeId: '__pan__', startX: e.clientX, startY: e.clientY, moved: false }
    const onMove = (ev: MouseEvent) => {
      dragRef.current.moved = true
      const dx = ev.clientX - dragRef.current.startX
      const dy = ev.clientY - dragRef.current.startY
      const cur = transformRef.current
      updateTransform({ x: cur.x + dx, y: cur.y + dy, k: cur.k })
      dragRef.current.startX = ev.clientX
      dragRef.current.startY = ev.clientY
    }
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [updateTransform])

  const handleNodeMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    dragRef.current = { nodeId, startX: e.clientX, startY: e.clientY, moved: false }
    const sim = simRef.current
    const node = nodesRef.current.find(n => n.id === nodeId)
    if (sim && node) { node.fx = node.x ?? 0; node.fy = node.y ?? 0; sim.alphaTarget(0.3).restart() }
    const onMove = (ev: MouseEvent) => {
      dragRef.current.moved = true
      const dx = (ev.clientX - dragRef.current.startX) / transformRef.current.k
      const dy = (ev.clientY - dragRef.current.startY) / transformRef.current.k
      if (node) { node.fx = (node.fx ?? node.x ?? 0) + dx; node.fy = (node.fy ?? node.y ?? 0) + dy }
      dragRef.current.startX = ev.clientX
      dragRef.current.startY = ev.clientY
      sim?.alpha(0.3).restart()
    }
    const onUp = () => {
      if (node) { node.fx = undefined; node.fy = undefined }
      sim?.alphaTarget(0)
      window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (dragRef.current.moved) return
    setSelectedNode(prev => prev?.id === node.id ? null : node)
  }, [])

  // Highlighted set for selection
  const highlightedIds = useMemo(() => {
    if (!selectedNode) return null
    const ids = new Set<string>([selectedNode.id])
    for (const l of links) {
      const sId = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id
      const tId = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id
      if (sId === selectedNode.id) ids.add(tId)
      if (tId === selectedNode.id) ids.add(sId)
    }
    return ids
  }, [selectedNode, links])

  const dimmed = selectedNode !== null

  // Search — input binding is instant, filtering is debounced
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q)
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- reacting to debounced search to derive dropdown results */
  useEffect(() => {
    if (debouncedSearchQuery.length < 2) { setSearchResults([]); setShowSearchDropdown(false); return }
    const lq = debouncedSearchQuery.toLowerCase()
    const results = nodes.filter(n => {
      const label = n.label.toLowerCase()
      if (label.includes(lq)) return true
      if (n.type === 'suspect' && n.linkedFirs?.some(f => f.toLowerCase().includes(lq))) return true
      if (n.type === 'case' && n.firNumber?.toLowerCase().includes(lq)) return true
      return false
    }).slice(0, 8)
    setSearchResults(results)
    setShowSearchDropdown(results.length > 0)
  }, [debouncedSearchQuery, nodes])
  /* eslint-enable react-hooks/set-state-in-effect */

  const flyToNode = useCallback((node: GraphNode) => {
    if (!node.x || !node.y) return
    const k = 2
    const tx = 600 - node.x * k
    const ty = 400 - node.y * k
    updateTransform({ x: tx, y: ty, k })
    setSelectedNode(node)
    setShowSearchDropdown(false)
    setSearchQuery('')
  }, [updateTransform])

  // ── Auto-Spotlight: Fly to highest-risk absconder after graph settles ──
  const autoSpotlightDone = useRef(false)
  useEffect(() => {
    if (autoSpotlightDone.current) return
    if (tick < 150) return
    if (visibleNodes.length === 0) return

    const candidates = visibleNodes
      .filter(n => n.type === 'suspect')
      .sort((a, b) => {
        const score = (n: GraphNode) => {
          if (n.arrestStatus === 'Absconding' && n.isRepeatOffender) return 4
          if (n.arrestStatus === 'Absconding') return 3
          if (n.isRepeatOffender) return 2
          return 1
        }
        const sa = score(a), sb = score(b)
        if (sa !== sb) return sb - sa
        return (b.linkedCaseCount || 0) - (a.linkedCaseCount || 0)
      })

    const target = candidates[0]
    if (target && target.x != null && target.y != null) {
      autoSpotlightDone.current = true
      const k = 2
      const tx = 600 - target.x * k
      const ty = 400 - target.y * k
      const node = target
      requestAnimationFrame(() => {
        updateTransform({ x: tx, y: ty, k })
        setSelectedNode(node)
      })
    }
  }, [tick, visibleNodes, updateTransform])

  const toggleType = useCallback((type: NodeType) => {
    setVisibleTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) { if (next.size > 1) next.delete(type) } else next.add(type)
      return next
    })
  }, [])

  const tooltipStyle: React.CSSProperties = {
    position: 'absolute', pointerEvents: 'none', zIndex: 50,
    transition: 'opacity 0.15s', opacity: hoveredNode ? 1 : 0,
    left: mousePos.x + 14, top: mousePos.y + 14,
  }

  const linkCount = visibleLinks.length

  return (
    <div className="relative min-h-[400px]" style={{ height: 'calc(100vh - 18rem)' }}>
      {/* ── Search Bar ── */}
      <div className="graph-overlay absolute top-3 left-3 z-30 w-72">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
            onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
            placeholder="Search accused, FIR numbers, IOs…"
            className="pl-8 pr-8 h-8 text-[12px] bg-[#0a0f1a]/90 backdrop-blur-sm border-white/[0.08] rounded-md text-slate-200 placeholder:text-slate-600"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearchDropdown(false) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        {/* Search dropdown */}
        {showSearchDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#0d1117] border border-white/[0.08] rounded-md shadow-xl overflow-hidden z-50">
            {searchResults.map(node => {
              const typeLabel = node.type === 'suspect' ? 'Accused' : node.type === 'case' ? 'FIR' : node.type === 'officer' ? 'IO' : node.type === 'district' ? 'District' : 'Offence Type'
              return (
                <button
                  key={node.id}
                  onClick={() => flyToNode(node)}
                  className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-white/[0.04] transition-colors text-left"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: node.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-slate-200 truncate">{node.label}</p>
                    <p className="text-[10px] text-slate-600">{typeLabel}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Arc Filter Buttons ── */}
      <div className="graph-overlay absolute top-[52px] left-3 z-30">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setActiveArcFilter(null); clearArcSelection() }}
            className={`px-3 py-1 text-[10px] rounded-full border transition-colors ${
              !activeArcFilter
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:bg-white/[0.06]'
            }`}
          >
            All Networks
          </button>
          {DEMO_NARRATIVE_ARCS.map(arc => {
            const colors = ARC_COLORS[arc.id]
            if (!colors) return null
            const isActive = activeArcFilter === arc.id
            return (
              <button
                key={arc.id}
                onClick={() => setActiveArcFilter(isActive ? null : arc.id)}
                className={`px-3 py-1 text-[10px] rounded-full border transition-colors ${
                  isActive
                    ? ''
                    : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:bg-white/[0.06]'
                }`}
                style={isActive ? { backgroundColor: colors.bg, color: colors.accent, borderColor: colors.border } : undefined}
              >
                {arc.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Arc Info Banner ── */}
      {activeArcFilter && (() => {
        const arc = DEMO_NARRATIVE_ARCS.find(a => a.id === activeArcFilter)
        if (!arc) return null
        const colors = ARC_COLORS[activeArcFilter]
        if (!colors) return null
        return (
          <div className="graph-overlay absolute top-[80px] left-3 z-30">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border text-[10px]" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
              <span className="font-medium" style={{ color: colors.accent }}>{arc.name}</span>
              <span className="text-slate-500">—</span>
              <span className="text-slate-400">{arc.caseIds.length} FIRs, {arc.suspectNames.length} accused, {arc.districts.length} districts</span>
              <button
                onClick={() => { setActiveArcFilter(null); clearArcSelection() }}
                className="ml-1 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )
      })()}

      {/* ── Filter Pills ── */}
      <div className="graph-overlay absolute top-3 right-3 z-30">
        <div className="flex items-center gap-1 bg-[#0a0f1a]/90 backdrop-blur-sm border border-white/[0.06] rounded-md p-1">
          {NODE_TYPE_CONFIG.map(cfg => {
            const Icon = cfg.icon
            const active = visibleTypes.has(cfg.type)
            return (
              <button
                key={cfg.type}
                onClick={() => toggleType(cfg.type)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all duration-150 ${
                  active
                    ? 'bg-white/[0.06] text-slate-200'
                    : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                <Icon className="w-3 h-3" style={{ color: active ? cfg.color : undefined }} />
                <span className="hidden lg:inline">{cfg.label}</span>
                <span className="tabular-nums text-[9px] text-slate-500">{nodeCounts[cfg.type] || 0}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="graph-overlay absolute bottom-3 left-3 z-30">
        <div className="flex items-center gap-3 bg-[#0a0f1a]/80 backdrop-blur-sm border border-white/[0.04] rounded-md px-3 py-1.5">
          <span className="text-[10px] text-slate-600 tabular-nums">
            <span className="text-slate-400 font-medium">{visibleNodes.length}</span> entities
          </span>
          <span className="text-slate-700">·</span>
          <span className="text-[10px] text-slate-600 tabular-nums">
            <span className="text-slate-400 font-medium">{linkCount}</span> connections
          </span>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="graph-overlay absolute bottom-3 right-3 z-30 pointer-events-none">
        <div className="bg-[#0a0f1a]/90 backdrop-blur-sm border border-white/[0.06] rounded-md p-2.5 text-[9px] space-y-1.5">
          <div className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider">Node Types</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {[
              { shape: 'circle', color: '#f87171', label: 'Accused' },
              { shape: 'rect', color: '#60a5fa', label: 'FIR Case' },
              { shape: 'diamond', color: '#38bdf8', label: 'District' },
              { shape: 'hexagon', color: '#fbbf24', label: 'IO' },
              { shape: 'pill', color: '#a78bfa', label: 'Offence Type' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                {item.shape === 'circle' && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />}
                {item.shape === 'rect' && <span className="w-3.5 h-2 rounded-sm" style={{ backgroundColor: item.color, opacity: 0.8 }} />}
                {item.shape === 'diamond' && <span className="w-2.5 h-2.5 rotate-45 rounded-sm" style={{ backgroundColor: item.color, opacity: 0.8 }} />}
                {item.shape === 'hexagon' && <span className="w-3 h-2.5 rounded-sm" style={{ backgroundColor: item.color, opacity: 0.8, clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }} />}
                {item.shape === 'pill' && <span className="w-4 h-2 rounded-full" style={{ backgroundColor: item.color, opacity: 0.6 }} />}
                <span className="text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.04] pt-1.5 mt-1 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-px bg-emerald-500/60" />
              <span className="text-slate-600">Co-accused</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-px bg-white/20" />
              <span className="text-slate-600">Link</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-px border-t border-dashed border-white/20" />
              <span className="text-slate-600">District Link</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SVG Graph ── */}
      <div ref={containerRef} className="relative w-full h-full rounded-lg overflow-hidden border border-white/[0.04]" style={{ background: '#080c16' }}>
        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing select-none"
          viewBox="0 0 1200 800"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
          }}
        >
          {/* Grid pattern */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="0.5" />
            </pattern>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-sm">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="1200" height="800" fill="url(#grid)" />

          <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
            {/* ── Links ── */}
            {visibleLinks.map((link, i) => {
              const s = link.source as GraphNode
              const t = link.target as GraphNode
              const sId = s.id
              const tId = t.id
              const isRelated = highlightedIds?.has(sId) && highlightedIds?.has(tId)
              const isDimmed = dimmed && !isRelated

              let stroke = 'rgba(255,255,255,0.06)'
              let strokeWidth = 0.5
              let strokeDasharray = ''
              let opacity = isDimmed ? 0.02 : 1
              if (arcNodeIds && (!arcNodeIds.has(sId) || !arcNodeIds.has(tId))) opacity *= 0.05
              const linkFade = Math.min(1, Math.max(0, (tick - 30) / 60))
              opacity = opacity * linkFade

              if (link.type === 'shared-case') {
                stroke = isRelated ? 'rgba(16,185,129,0.8)' : 'rgba(16,185,129,0.1)'
                strokeWidth = isRelated ? 2.5 : 1
              } else if (link.type === 'officer-case') {
                stroke = isRelated ? 'rgba(251,191,36,0.6)' : 'rgba(251,191,36,0.06)'
                strokeWidth = isRelated ? 1.5 : 0.5
                strokeDasharray = '3 2'
              } else if (link.type === 'case-district') {
                stroke = isRelated ? 'rgba(56,189,248,0.4)' : 'rgba(56,189,248,0.04)'
                strokeWidth = isRelated ? 1 : 0.4
                strokeDasharray = '4 3'
              } else if (link.type === 'case-crime') {
                stroke = isRelated ? 'rgba(167,139,250,0.4)' : 'rgba(167,139,250,0.04)'
                strokeWidth = isRelated ? 1 : 0.4
                strokeDasharray = '2 2'
              } else if (link.type === 'suspect-case') {
                if (isRelated) {
                  stroke = 'rgba(255,255,255,0.35)'
                  strokeWidth = 1.2
                }
              }

              return (
                <line
                  key={`l-${i}`}
                  x1={s.x ?? 0} y1={s.y ?? 0}
                  x2={t.x ?? 0} y2={t.y ?? 0}
                  stroke={stroke}
                  strokeWidth={strokeWidth / transform.k}
                  strokeDasharray={strokeDasharray ? `${strokeDasharray.split(' ').map(v => Number(v) / transform.k).join(' ')}` : ''}
                  opacity={opacity}
                />
              )
            })}

            {/* ── Nodes ── */}
            {visibleNodes.map(node => {
              const isSelected = selectedNode?.id === node.id
              const isHovered = hoveredNode?.id === node.id
              const isRelated = highlightedIds?.has(node.id)
              const isDimmed = dimmed && !isRelated
              const nodeFade = Math.min(1, tick / 80)
              let opacity = isDimmed ? 0.08 * nodeFade : nodeFade
              if (arcNodeIds && !arcNodeIds.has(node.id)) opacity *= 0.1
              const glow = isSelected || isHovered
              const nx = node.x ?? 0
              const ny = node.y ?? 0
              const fs = Math.max(7, 10 / transform.k)
              const arcColor = arcNodeIds?.has(node.id) && activeArcFilter ? ARC_COLORS[activeArcFilter]?.accent ?? null : null

              // ── Suspect Node (circle) ──
              if (node.type === 'suspect') {
                return (
                  <g key={node.id} className="graph-node" transform={`translate(${nx},${ny})`} opacity={opacity}
                    onMouseDown={e => handleNodeMouseDown(node.id, e)}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => handleNodeClick(node)}
                    style={{ cursor: 'pointer' }}
                  >
                    {glow && <circle r={node.size + 6} fill={node.color} fillOpacity={0.15} />}
                    {arcColor && <circle r={node.size + 4} fill="none" stroke={arcColor} strokeWidth={2 / transform.k} strokeOpacity={0.7} filter="url(#glow-sm)" />}
                    <circle r={node.size} fill={node.color} fillOpacity={isSelected ? 0.9 : isHovered ? 0.8 : 0.6}
                      stroke={arcColor ?? (isSelected ? '#fff' : node.color)}
                      strokeWidth={(isSelected ? 2 : arcColor ? 1.2 : 0.8) / transform.k}
                      filter={glow ? 'url(#glow)' : undefined} />
                    {node.isRepeatOffender && (
                      <circle r={node.size + 2} fill="none" stroke="#ef4444" strokeWidth={1 / transform.k}
                        strokeDasharray={`${2 / transform.k} ${2 / transform.k}`} opacity={0.6} />
                    )}
                    <text y={node.size + 10} textAnchor="middle" fill="#94a3b8" fontSize={fs}
                      fontFamily="system-ui, sans-serif" style={{ pointerEvents: 'none' }}>
                      {node.label.length > 18 ? node.label.slice(0, 16) + '…' : node.label}
                    </text>
                  </g>
                )
              }

              // ── Case Node (small rounded rect with FIR number) ──
              if (node.type === 'case') {
                const w = Math.max(28, node.label.length * 6.5 + 10)
                const h = 16
                return (
                  <g key={node.id} className="graph-node" transform={`translate(${nx},${ny})`} opacity={opacity}
                    onMouseDown={e => handleNodeMouseDown(node.id, e)}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => handleNodeClick(node)}
                    style={{ cursor: 'pointer' }}
                  >
                    {glow && <rect x={-w / 2 - 3} y={-h / 2 - 3} width={w + 6} height={h + 6} rx={5} fill={node.color} fillOpacity={0.15} />}
                    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3}
                      fill={node.color} fillOpacity={isSelected ? 0.25 : 0.12}
                      stroke={arcColor ?? node.color} strokeWidth={(isSelected ? 1.5 : arcColor ? 1.2 : 0.5) / transform.k}
                      strokeOpacity={arcColor ? 0.9 : (isSelected ? 1 : 0.5)} />
                    <text textAnchor="middle" dominantBaseline="central" fill={node.color} fontSize={Math.max(6, 7.5 / transform.k)}
                      fontFamily="ui-monospace, monospace" fontWeight={500} style={{ pointerEvents: 'none' }}>
                      {node.label}
                    </text>
                  </g>
                )
              }

              // ── Crime Type Node (pill shape) ──
              if (node.type === 'crimeType') {
                const w = Math.max(36, node.label.length * 6 + 14)
                const h = 18
                return (
                  <g key={node.id} className="graph-node" transform={`translate(${nx},${ny})`} opacity={opacity}
                    onMouseDown={e => handleNodeMouseDown(node.id, e)}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => handleNodeClick(node)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2}
                      fill={node.color} fillOpacity={isSelected ? 0.3 : 0.15}
                      stroke={node.color} strokeWidth={(isSelected ? 1.5 : 0.6) / transform.k}
                      strokeOpacity={isSelected ? 1 : 0.5} />
                    <text textAnchor="middle" dominantBaseline="central" fill={node.color} fontSize={Math.max(7, 8 / transform.k)}
                      fontFamily="system-ui, sans-serif" fontWeight={600} style={{ pointerEvents: 'none' }}>
                      {node.label}
                    </text>
                  </g>
                )
              }

              // ── District Node (diamond) ──
              if (node.type === 'district') {
                const r = node.size
                return (
                  <g key={node.id} className="graph-node" transform={`translate(${nx},${ny})`} opacity={opacity}
                    onMouseDown={e => handleNodeMouseDown(node.id, e)}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => handleNodeClick(node)}
                    style={{ cursor: 'pointer' }}
                  >
                    <polygon points={`0,${-r} ${r},0 0,${r} ${-r},0`}
                      fill={node.color} fillOpacity={isSelected ? 0.3 : 0.15}
                      stroke={node.color} strokeWidth={(isSelected ? 1.5 : 0.6) / transform.k}
                      strokeOpacity={isSelected ? 1 : 0.4} />
                    <text y={r + 10} textAnchor="middle" fill={node.color} fontSize={Math.max(6, 7.5 / transform.k)}
                      fontFamily="system-ui, sans-serif" fontWeight={500} style={{ pointerEvents: 'none' }}>
                      {node.label.length > 14 ? node.label.slice(0, 12) + '…' : node.label}
                    </text>
                  </g>
                )
              }

              // ── Officer Node (hexagon) ──
              const r = node.size
              const hw = r * 1.2
              const hh = r
              const hexPoints = `${hw},0 ${hw / 2},${hh} ${-hw / 2},${hh} ${-hw},0 ${-hw / 2},${-hh} ${hw / 2},${-hh}`
              return (
                <g key={node.id} className="graph-node" transform={`translate(${nx},${ny})`} opacity={opacity}
                  onMouseDown={e => handleNodeMouseDown(node.id, e)}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => handleNodeClick(node)}
                  style={{ cursor: 'pointer' }}
                >
                  {glow && <polygon points={hexPoints} fill={node.color} fillOpacity={0.12} />}
                  <polygon points={hexPoints}
                    fill={node.color} fillOpacity={isSelected ? 0.3 : 0.15}
                    stroke={node.color} strokeWidth={(isSelected ? 1.5 : 0.6) / transform.k}
                    strokeOpacity={isSelected ? 1 : 0.5} />
                  <text y={hh + 10} textAnchor="middle" fill={node.color} fontSize={Math.max(6, 7.5 / transform.k)}
                    fontFamily="system-ui, sans-serif" fontWeight={500} style={{ pointerEvents: 'none' }}>
                    {node.label}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>

        {/* ── Tooltip ── */}
        <div style={tooltipStyle} className="glass-card p-2.5 text-[11px] space-y-1 max-w-[220px]">
          {hoveredNode && (
            <>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: hoveredNode.color }} />
                <span className="font-semibold text-foreground truncate">{hoveredNode.label}</span>
                <span className="text-[9px] text-slate-600 uppercase shrink-0 ml-auto">
                  {hoveredNode.type === 'suspect' ? 'Accused' : hoveredNode.type === 'case' ? 'FIR' : hoveredNode.type === 'officer' ? 'IO' : hoveredNode.type === 'district' ? 'District' : 'Offence'}
                </span>
              </div>
              {hoveredNode.type === 'suspect' && (
                <div className="text-muted-foreground">
                  {hoveredNode.arrestStatus} · {hoveredNode.linkedCaseCount} FIRs
                  {hoveredNode.isRepeatOffender && <span className="text-red-400 ml-1">· Repeat</span>}
                </div>
              )}
              {hoveredNode.type === 'case' && (
                <div className="text-muted-foreground font-mono text-[10px]">
                  {hoveredNode.firNumber} · {hoveredNode.casePriority} · {hoveredNode.caseStatus}
                </div>
              )}
              {hoveredNode.type === 'district' && (
                <div className="text-muted-foreground">{hoveredNode.districtCaseCount} FIRs</div>
              )}
              {hoveredNode.type === 'officer' && (
                <div className="text-muted-foreground">{hoveredNode.officerRank} — {hoveredNode.officerUnit}</div>
              )}
              {hoveredNode.type === 'crimeType' && (
                <div className="text-muted-foreground">{hoveredNode.crimeTypeCaseCount} FIRs · {hoveredNode.crimeTypeSuspectCount} accused</div>
              )}
            </>
          )}
        </div>

        {/* ── Detail Sidebar / Inline Intel Panel ── */}
        <AnimatePresence>
          {selectedNode && selectedNode.type === 'suspect' && (
            <SuspectInlineIntelPanel
              node={selectedNode}
              links={links}
              allNodes={nodes}
              onClose={() => setSelectedNode(null)}
              onHighlightNode={(n) => setSelectedNode(n)}
            />
          )}
          {selectedNode && selectedNode.type !== 'suspect' && (
            <EntityDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SUB-TAB COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function CrimeNetworksPanel({ clusters }: { clusters: CrimeCluster[] }) {
  const maxCases = Math.max(...clusters.map(c => c.caseCount), 1)
  return (
    <div>
      <h3 className="section-header text-[13px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <Users className="w-3.5 h-3.5 text-emerald-500" />
        Crime Type Clusters
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto custom-scrollbar pr-1">
        {clusters.map((cluster, i) => {
          const pct = Math.round((cluster.caseCount / maxCases) * 100)
          const colorClass = CRIME_CLUSTER_COLORS[cluster.crimeType] ?? 'bg-slate-500/20 text-slate-400'
          return (
            <motion.div key={cluster.crimeTypeRowid} {...FADE_UP} transition={{ duration: 0.25, delay: i * 0.04 }} className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className={colorClass}>{cluster.crimeType}</Badge>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  {cluster.caseCount} {cluster.caseCount === 1 ? 'FIR' : 'FIRs'}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl font-bold text-foreground tabular-nums">{cluster.suspectCount}</span>
                <span className="text-xs text-muted-foreground">suspects linked</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
                <motion.div className="h-full rounded-full bg-emerald-500/60" initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: i * 0.04 + 0.15 }} />
              </div>
              {cluster.topSuspects.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {cluster.topSuspects.map(name => (
                    <span key={name} className="text-[11px] text-muted-foreground bg-white/[0.03] px-1.5 py-0.5 rounded">{name}</span>
                  ))}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
      {clusters.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No cluster data on record.</p>}
    </div>
  )
}

function RepeatOffendersPanel({ offenders }: { offenders: RepeatOffenderRow[] }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return offenders
    return offenders.filter(o =>
      o.suspect.suspect_name.toLowerCase().includes(q) ||
      o.crimeTypes.some(ct => ct.toLowerCase().includes(q)) ||
      o.districts.some(d => d.toLowerCase().includes(q))
    )
  }, [offenders, search])
  return (
    <div>
      <h3 className="section-header text-[13px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        <span>Flagged Repeat Offenders</span>
        {KSP_REPEAT_OFFENDERS.length > 0 && (
          <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 ml-auto">
            <Radio className="w-2.5 h-2.5 mr-1" />
            {KSP_REPEAT_OFFENDERS.length} identified from {KSP_CASES.length} SCRB records
          </Badge>
        )}
      </h3>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, crime type, or district..."
          className="pl-9 h-9 bg-white/[0.03] border-white/[0.06] text-sm placeholder:text-muted-foreground/60" />
      </div>
      <div className="max-h-96 overflow-y-auto custom-scrollbar">
        <table className="table-dossier w-full">
          <thead className="sticky top-0 z-10"><tr className="bg-[#0a0f1a]">
            <th className="text-left rounded-tl-lg">Accused</th><th className="text-left">Offence Types</th>
            <th className="text-left">Districts</th><th className="text-center">Status</th><th className="text-center rounded-tr-lg">Repeat</th>
          </tr></thead>
          <tbody>
            {filtered.map((row, i) => (
              <motion.tr key={row.suspect.ROWID} {...FADE_UP} transition={{ duration: 0.2, delay: i * 0.03 }} className="cursor-default">
                <td>
                  <div className="font-medium text-foreground text-sm">{row.suspect.suspect_name}</div>
                  <div className="text-[11px] text-muted-foreground">{row.suspect.age}y · {row.suspect.gender}</div>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {row.crimeTypes.slice(0, 3).map(ct => (
                      <Badge key={ct} variant="outline" className="text-[11px] px-1.5 py-0 bg-white/[0.03] border-white/[0.06] text-slate-300">{ct}</Badge>
                    ))}
                    {row.crimeTypes.length > 3 && <span className="text-[11px] text-muted-foreground self-center">+{row.crimeTypes.length - 3}</span>}
                  </div>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {row.districts.slice(0, 2).map(d => (
                      <span key={d} className="text-[11px] text-muted-foreground flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{d}</span>
                    ))}
                    {row.districts.length > 2 && <span className="text-[11px] text-muted-foreground">+{row.districts.length - 2}</span>}
                  </div>
                </td>
                <td className="text-center">
                  <Badge variant="outline" className={`text-[11px] ${ARREST_BADGE[row.suspect.arrest_status] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}>{row.suspect.arrest_status}</Badge>
                </td>
                <td className="text-center">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500/15 text-red-400 text-xs font-bold tabular-nums">{row.repeatCount}</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No records matching filter criteria.</p>}
      </div>
    </div>
  )
}

function LinkedCasesPanel({ entries }: { entries: LinkedCaseEntry[] }) {
  return (
    <div>
      <h3 className="section-header text-[13px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2"><Link2 className="w-3.5 h-3.5 text-cyan-500" />Accused Linked to Multiple FIRs</h3>
      <div className="max-h-96 overflow-y-auto custom-scrollbar pr-1 space-y-4">
        {entries.map((entry, i) => (
          <motion.div key={entry.suspectName} {...FADE_UP} transition={{ duration: 0.25, delay: i * 0.04 }} className="glass-card p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-cyan-500/15 flex items-center justify-center flex-shrink-0"><Link2 className="w-3.5 h-3.5 text-cyan-400" /></div>
                <div><p className="text-sm font-medium text-foreground">{entry.suspectName}</p><p className="text-[11px] text-muted-foreground">{entry.cases.length} FIRs linked</p></div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mb-3">
              {entry.cases.map((c, ci) => (
                <div key={c.ROWID} className="flex items-center gap-1.5">
                  {ci > 0 && <div className="w-4 h-px bg-emerald-500/40 flex-shrink-0" />}
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded bg-white/[0.04] flex items-center justify-center">
                      <span className="text-[10px] font-mono text-muted-foreground">{ci + 1}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {entry.cases.map(c => (
                <Badge key={c.ROWID} variant="outline" className="text-[11px] font-mono px-2 py-0.5 bg-white/[0.03] border-white/[0.06] text-slate-300">
                  {c.fir_number}<span className="ml-1.5 text-muted-foreground/60">{getDemoCrimeTypeName(c.crime_type_rowid)}</span>
                </Badge>
              ))}
            </div>
          </motion.div>
        ))}
        {entries.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No linked case data on record.</p>}
      </div>
    </div>
  )
}

function CrossDistrictPanel({ entries }: { entries: CrossDistrictEntry[] }) {
  return (
    <div>
      <h3 className="section-header text-[13px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-rose-500" />Accused Operating Across Multiple Districts</h3>
      <div className="max-h-96 overflow-y-auto custom-scrollbar pr-1 space-y-4">
        {entries.map((entry, i) => (
          <motion.div key={entry.suspectName} {...FADE_UP} transition={{ duration: 0.25, delay: i * 0.04 }} className="glass-card p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-500/15 flex items-center justify-center flex-shrink-0"><MapPin className="w-3.5 h-3.5 text-rose-400" /></div>
                <div>
                  <p className="text-sm font-medium text-foreground">{entry.suspectName}</p>
                  <p className="text-[11px] text-muted-foreground">{entry.districts.length} districts · {entry.totalCases} {entry.totalCases === 1 ? 'FIR' : 'FIRs'}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[11px] bg-rose-500/10 text-rose-400 border-rose-500/20">{entry.districts.length} districts</Badge>
            </div>
            <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
              {entry.districts.map((district, di) => (
                <div key={district} className="flex items-center gap-1">
                  {di > 0 && (
                    <svg width="20" height="12" viewBox="0 0 20 12" className="flex-shrink-0 text-emerald-500/40">
                      <line x1="0" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
                      <polygon points="14,3 20,6 14,9" fill="currentColor" />
                    </svg>
                  )}
                  <div className="flex flex-col items-center bg-white/[0.03] rounded-lg px-2.5 py-1.5 min-w-0">
                    <MapPin className="w-3 h-3 text-emerald-500/60 mb-0.5" />
                    <span className="text-[11px] text-foreground whitespace-nowrap">{district}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{entry.districtCaseCounts[district]} {entry.districtCaseCounts[district] === 1 ? 'FIR' : 'FIRs'}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
        {entries.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No cross-district records found.</p>}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   KSP INTELLIGENCE PANEL — Real KSP Cross-Reference Data
   ═══════════════════════════════════════════════════════════════ */

function KSPIntelligencePanel({
  offenders,
  clusters,
  onOffenderClick,
}: {
  offenders: KSPRepeatOffender[]
  clusters: KSPSpatialCluster[]
  onOffenderClick: (name: string) => void
}) {
  const [offenderSearch, setOffenderSearch] = useState('')
  const [clusterFilter, setClusterFilter] = useState('')

  const topOffenders = useMemo(() => {
    const q = offenderSearch.toLowerCase().trim()
    const base = q
      ? offenders.filter(o => o.name.toLowerCase().includes(q) || o.phone.includes(q))
      : offenders
    return base.sort((a, b) => b.totalCases - a.totalCases).slice(0, 40)
  }, [offenders, offenderSearch])

  const filteredClusters = useMemo(() => {
    if (!clusterFilter) return clusters
    const q = clusterFilter.toLowerCase().trim()
    return clusters.filter(c => c.district.toLowerCase().includes(q) || c.crimeType.toLowerCase().includes(q))
  }, [clusters, clusterFilter])

  return (
    <div className="space-y-6">
      {/* ── Repeat Offenders Section ── */}
      <div>
        <h3 className="section-header text-[13px] font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>SCRB-Cross-Referenced Repeat Offenders</span>
          </div>
          <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">
            {offenders.length} identified from {KSP_CASES.length} SCRB records
          </Badge>
        </h3>
        <p className="text-[11px] text-slate-500 mb-3">
          Synthetic association model links cases using repeat identifiers, locations, and modus-operandi patterns. Click any card to locate linked cases on the graph.
        </p>
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={offenderSearch}
            onChange={e => setOffenderSearch(e.target.value)}
            placeholder="Search by name or phone…"
            className="pl-9 h-8 text-[12px] bg-white/[0.03] border-white/[0.06] placeholder:text-muted-foreground/60"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
          {topOffenders.map((offender, i) => {
            const isHighRisk = offender.totalCases > 2
            return (
              <motion.button
                key={offender.name + offender.phone}
                {...FADE_UP}
                transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.6) }}
                onClick={() => onOffenderClick(offender.name)}
                className="text-left glass-card p-4 hover:bg-white/[0.04] transition-all duration-200 group border border-white/[0.06] hover:border-emerald-500/20"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-red-500/12 flex items-center justify-center shrink-0 border border-red-500/15">
                      <User className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                        {offender.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">{offender.phone}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 ml-2 inline-flex items-center justify-center min-w-[26px] h-6 rounded-full text-[11px] font-bold tabular-nums px-1.5 ${
                    isHighRisk
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  }`}>
                    {offender.totalCases}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-white/[0.03] border-white/[0.06] text-slate-500">
                    {offender.cases.length} linked FIR{offender.cases.length !== 1 ? 's' : ''}
                  </Badge>
                  {isHighRisk && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-red-500/8 border-red-500/15 text-red-400">
                      HIGH RISK
                    </Badge>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>
        {topOffenders.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No matching SCRB records.</p>
        )}
      </div>

      {/* ── Spatial Clusters Section ── */}
      <div>
        <h3 className="section-header text-[13px] font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Spatial Crime Clusters</span>
          </div>
          <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
            {clusters.length} clusters
          </Badge>
        </h3>
        <p className="text-[11px] text-slate-500 mb-3">
          Geospatial concentration analysis — same district + offence type with 3+ FIRs indicates organised or recurring activity.
        </p>
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={clusterFilter}
            onChange={e => setClusterFilter(e.target.value)}
            placeholder="Filter by district or offence type…"
            className="pl-9 h-8 text-[12px] bg-white/[0.03] border-white/[0.06] placeholder:text-muted-foreground/60"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
          {filteredClusters.map((cluster, i) => {
            const hasCritical = cluster.cases.some(c => c.priority === 'Critical')
            const openCount = cluster.cases.filter(c => c.status === 'Open' || c.status === 'Under Investigation').length
            const clusterColor = hasCritical ? 'text-red-400' : 'text-cyan-400'
            const clusterBorder = hasCritical ? 'border-red-500/15' : 'border-cyan-500/15'
            return (
              <motion.div
                key={`${cluster.district}-${cluster.crimeType}`}
                {...FADE_UP}
                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.5) }}
                className={`glass-card p-4 border ${clusterBorder}`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${hasCritical ? 'bg-red-500' : 'bg-cyan-500'}`} />
                    <span className="text-[13px] font-semibold text-slate-200">{cluster.district}</span>
                  </div>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                    CRIME_CLUSTER_COLORS[cluster.crimeType] ?? 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {cluster.crimeType}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center px-2 py-1.5 rounded bg-white/[0.02]">
                    <p className={`text-2xl font-bold tabular-nums ${clusterColor}`}>{cluster.cases.length}</p>
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider">FIRs</p>
                  </div>
                  <div className="text-center px-2 py-1.5 rounded bg-white/[0.02]">
                    <p className="text-2xl font-bold tabular-nums text-amber-400">{openCount}</p>
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider">Active</p>
                  </div>
                  <div className="text-center px-2 py-1.5 rounded bg-white/[0.02]">
                    <p className="text-2xl font-bold tabular-nums text-slate-300">{cluster.cases.filter(c => c.priority === 'Critical').length}</p>
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider">Critical</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {cluster.cases.slice(0, 3).map(c => (
                    <div key={c.rowid} className="flex items-center gap-2 text-[11px]">
                      <FileText className="w-3 h-3 text-slate-600 shrink-0" />
                      <span className="font-mono text-slate-400 flex-1 truncate">{c.fir}</span>
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 shrink-0 ${
                        c.priority === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : c.status === 'Open' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                      }`}>
                        {c.status === 'Open' ? 'Open' : c.priority}
                      </Badge>
                    </div>
                  ))}
                  {cluster.cases.length > 3 && (
                    <p className="text-[10px] text-slate-600 pl-5">+{cluster.cases.length - 3} more FIRs in cluster</p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
        {filteredClusters.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No matching spatial clusters.</p>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function NetworkTab() {
  const [activeTab, setActiveTab] = useState<SubTab>('graph')
  const clusters = useMemo(() => computeCrimeClusters(), [])
  const repeatOffenders = useMemo(() => computeRepeatOffenders(), [])
  const linkedCases = useMemo(() => computeLinkedCases(), [])
  const crossDistrict = useMemo(() => computeCrossDistrict(), [])
  const { setNetworkSearchQuery } = useCrimeSightStore()

  // KSP intelligence data
  const kspForensicCount = useMemo(() => KSP_CASES.filter(c => c.forensicMatches.length > 0).length, [])
  const kspIntelligence = useMemo(() => ({
    repeatOffenders: KSP_REPEAT_OFFENDERS.length,
    spatialClusters: KSP_SPATIAL_CLUSTERS.length,
    forensicCases: kspForensicCount,
  }), [kspForensicCount])

  const stats = useMemo(() => ({
    totalClusters: clusters.length, repeatCount: repeatOffenders.length,
    linkedCount: linkedCases.length, crossDistrictCount: crossDistrict.length,
  }), [clusters, repeatOffenders, linkedCases, crossDistrict])

  // Cross-tab: click KSP offender → switch to graph and search
  const handleKSPOffenderClick = useCallback((name: string) => {
    setNetworkSearchQuery(name)
    setActiveTab('graph')
  }, [setNetworkSearchQuery])

  return (
    <div className="space-y-6">
      {/* ── Section Label ── */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <GitBranch className="size-4 text-emerald-400" />
        <h2 className="text-sm font-semibold text-slate-300 tracking-[0.1em] uppercase">
          Link Analysis — SCRB Association Mapping
        </h2>
        <Badge className="h-5 px-2 text-[9px] font-bold tracking-wider bg-emerald-500/15 text-emerald-400 border-emerald-500/30 flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          LIVE
        </Badge>
        {/* Intelligence Score Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 ml-2 px-3 py-1 rounded-md bg-emerald-500/8 border border-emerald-500/15">
          <Brain className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-semibold text-emerald-400 tracking-wide">INTELLIGENCE SCORE</span>
          <span className="text-slate-600 mx-0.5">—</span>
          <span className="text-[10px] text-slate-300 tabular-nums">
            <span className="text-red-400 font-bold">{kspIntelligence.repeatOffenders}</span> Repeat Offenders
            <span className="text-slate-600 mx-1">|</span>
            <span className="text-cyan-400 font-bold">{kspIntelligence.spatialClusters}</span> Spatial Clusters
            <span className="text-slate-600 mx-1">|</span>
            <span className="text-amber-400 font-bold">{kspIntelligence.forensicCases}</span> Forensic Cases
          </span>
        </div>
        <span className="text-[10px] text-slate-600 tabular-nums hidden sm:inline">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        <LastSynced />
      </div>
      {/* Summary strip — hidden when graph is full height */}
      {activeTab !== 'graph' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Identified Clusters', value: stats.totalClusters, color: 'text-emerald-400' },
            { label: 'Repeat Offenders', value: stats.repeatCount, color: 'text-amber-400' },
            { label: 'Co-Accused Pairs', value: stats.linkedCount, color: 'text-cyan-400' },
            { label: 'Cross-District', value: stats.crossDistrictCount, color: 'text-rose-400' },
          ].map(s => (
            <div key={s.label} className="glass-card p-4 text-center">
              <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sub-tab button group */}
      <div className="flex flex-wrap gap-1.5 bg-white/[0.02] border border-white/[0.06] rounded-lg p-1.5">
        {SUBTABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                isActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03] border border-transparent'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {activeTab === 'graph' && <NetworkGraphPanel />}
        {activeTab === 'networks' && <CrimeNetworksPanel clusters={clusters} />}
        {activeTab === 'repeaters' && <RepeatOffendersPanel offenders={repeatOffenders} />}
        {activeTab === 'linked' && <LinkedCasesPanel entries={linkedCases} />}
        {activeTab === 'cross' && <CrossDistrictPanel entries={crossDistrict} />}
        {activeTab === 'ksp' && (
          <KSPIntelligencePanel
            offenders={KSP_REPEAT_OFFENDERS}
            clusters={KSP_SPATIAL_CLUSTERS}
            onOffenderClick={handleKSPOffenderClick}
          />
        )}
      </motion.div>

      {/* Data Source Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
        <span className="text-[9px] text-slate-600">Synthetic prototype data — modeled on supplied KSP ER schema</span>
        <span className="text-[9px] text-slate-600 tabular-nums">
          Graph data: {new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })} hrs
        </span>
      </div>
    </div>
  )
}
