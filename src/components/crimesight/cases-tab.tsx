'use client'

import { Fragment, useState, useMemo, useEffect } from 'react'

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
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Search, Filter, ChevronDown, ChevronUp, FileText, MapPin,
  ChevronLeft, ChevronRight, Check, Shield, Network, X, Users, Search as SearchIcon,
  Car, Fingerprint, AlertTriangle, RotateCcw, ClipboardEdit, Eye, Clock
} from 'lucide-react'
import { toast } from 'sonner'
import LastSynced from '@/components/crimesight/last-synced'
import {
  KSP_CASES, KSP_DISTRICT_STATS, type KSPCase,
  getRepeatOffendersForCase, getLinkedCases, getCaseIntelligenceBrief,
} from '@/lib/ksp-data'
import { GENERATED_CASES, getGeneratedDistrictStats, type GeneratedCase } from '@/lib/case-generator'
import CaseCrackerModal from '@/components/crimesight/case-cracker-modal'
import AiReportModal from '@/components/crimesight/ai-report-modal'
import { useCrimeSightStore, type FieldFirReport } from '@/lib/store'

const ITEMS_PER_PAGE = 50

const PRIORITY_STYLES: Record<string, string> = {
  Critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  High: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  Low: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
}

const STATUS_STYLES: Record<string, string> = {
  Open: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'Under Investigation': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Closed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Charge Sheet Filed': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
}

const RISK_COLORS: Record<string, string> = {
  high: '#ef4444', medium: '#f59e0b', low: '#10b981',
}

const ARREST_STYLES: Record<string, string> = {
  'Arrested': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Absconding': 'text-red-400 bg-red-500/10 border-red-500/20',
  'Released on Bail': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'Not Arrested': 'text-slate-400 bg-slate-500/10 border-slate-500/20',
}

// Merge KSP cases (for rich detail) + Generated cases (for 10K scale)
type DisplayCase = KSPCase | GeneratedCase
function isGenerated(c: DisplayCase): c is GeneratedCase {
  return 'daysAgo' in c
}
const ALL_CASES: DisplayCase[] = [
  ...GENERATED_CASES,
  ...KSP_CASES as any[],
]

type DateScope = 'all' | 'today' | 'earlier'

function getRiskColor(score: number) {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

const SPATIAL_RISK_STYLES: Record<string, string> = {
  high: 'text-red-400 bg-red-500/10 border-red-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low: 'text-emerald-400/60 bg-emerald-500/5 border-emerald-500/10',
}

function GeneratedFirDetail({
  kase,
  onCaseCracker,
  onViewDistrict,
  onOpenGovernedReview,
}: {
  kase: GeneratedCase
  onCaseCracker: () => void
  onViewDistrict: () => void
  onOpenGovernedReview: () => void
}) {
  const reviewPlan = kase.hasRepeatOffender
    ? {
        action: 'Validate linked FIRs and nominate a lead investigator.',
        evidence: 'Cross-reference the identifier and existing evidence before escalation.',
      }
    : kase.isSensitive
      ? {
          action: 'Confirm safeguarding protocol with a supervisor.',
          evidence: 'Check access controls and the safeguarding record before further review.',
        }
      : {
          action: 'Triage the case with the district review officer.',
          evidence: 'Validate the FIR facts and initial evidence checklist before follow-up.',
        }
  const reviewTarget = kase.priority === 'Critical'
    ? 'Prototype target: supervisor review within 2 hours'
    : kase.priority === 'High'
      ? 'Prototype target: supervisor review within 1 working day'
      : 'Prototype target: review at the next district triage'

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 bg-white/[0.02]"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">FIR case summary</p>
          <p className="text-[10px] text-slate-500 mt-1">Synthetic prototype record — use for demonstration and review only.</p>
        </div>
        <Badge variant="outline" className={`text-[9px] px-1.5 shrink-0 ${PRIORITY_STYLES[kase.priority] || ''}`}>
          {kase.priority} priority
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div><p className="text-slate-500 mb-1">FIR Number</p><p className="font-mono text-emerald-400">{kase.fir}</p></div>
        <div><p className="text-slate-500 mb-1">Crime classification</p><p className="text-slate-300">{kase.crimeType}</p><p className="text-[10px] text-slate-600 mt-0.5">{kase.crimeCategory}</p></div>
        <div><p className="text-slate-500 mb-1">Place of occurrence</p><p className="text-slate-300">{kase.place}</p><p className="text-[10px] text-slate-600 mt-0.5">{kase.district}</p></div>
        <div><p className="text-slate-500 mb-1">Case status</p><p className="text-slate-300">{kase.status}</p><p className="text-[10px] text-slate-600 mt-0.5">{kase.complaintMode}</p></div>
        <div><p className="text-slate-500 mb-1">Occurrence</p><p className="text-slate-300">{kase.occurrenceDate}</p></div>
        <div><p className="text-slate-500 mb-1">Complaint filed</p><p className="text-slate-300">{kase.complaintDate}</p></div>
        <div><p className="text-slate-500 mb-1">Risk score</p><p className="font-bold" style={{ color: RISK_COLORS[getRiskColor(kase.riskScore)] }}>{Math.round(kase.riskScore)}/100</p></div>
        <div><p className="text-slate-500 mb-1">Record indicators</p><p className="text-slate-300">{kase.suspectCount} suspect cue{kase.suspectCount !== 1 ? 's' : ''} · {kase.evidenceCount} evidence cue{kase.evidenceCount !== 1 ? 's' : ''}</p></div>
      </div>

      <div className="mt-4 p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15">
        <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Shield className="size-3.5" /> Review cue</p>
        <p className="text-xs text-slate-300 leading-relaxed">
          {kase.hasRepeatOffender
            ? 'A repeat-pattern indicator is present. Validate against source records before taking any operational action.'
            : 'No validated cross-record link is displayed for this generated case. Continue review using the FIR details and local procedure.'}
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/[0.045] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-sky-300"><ClipboardEdit className="size-3.5" /> Explainable case action plan</p>
            <p className="mt-2 text-xs font-medium text-slate-200">{reviewPlan.action}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">Evidence needed: {reviewPlan.evidence}</p>
            <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-500"><Clock className="size-3" /> {reviewTarget}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onOpenGovernedReview} className="h-7 shrink-0 border-sky-500/25 bg-sky-500/[0.04] px-2.5 text-[10px] text-sky-200 hover:bg-sky-500/[0.12]">
            <ClipboardEdit className="mr-1 size-3" /> Review in Actions
          </Button>
        </div>
        <p className="mt-3 border-t border-sky-500/10 pt-2 text-[9px] leading-relaxed text-slate-500">This is a transparent, synthetic demonstration plan. It supports human review and does not direct enforcement action.</p>
      </div>

      <div className="flex items-center gap-2 pt-2 mt-3 border-t border-white/[0.04]">
        <Button variant="outline" size="sm" onClick={onCaseCracker} className="h-7 px-3 text-[10px] border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30">
          <SearchIcon className="size-3 mr-1.5" /> Case Cracker
        </Button>
        <Button variant="outline" size="sm" onClick={onViewDistrict} className="h-7 px-3 text-[10px] border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-300">
          <MapPin className="size-3 mr-1.5" /> View District
        </Button>
        <span className="ml-auto text-[9px] text-slate-600">Record ID: {kase.rowid}</span>
      </div>
    </motion.div>
  )
}

export default function CasesTab() {
  const [search, setSearch] = useState('')
  const [districtFilter, setDistrictFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [dateScope, setDateScope] = useState<DateScope>('all')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 300)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [crackCase, setCrackCase] = useState<{ caseId: string; fir: string; crimeType: string; district: string } | null>(null)
  const [reportCaseRowid, setReportCaseRowid] = useState<string | null>(null)
  const {
    selectedFirId, selectedCaseDistrict, setSelectedCaseDistrict, navigateToDistrict,
    openDossier, setActiveTab,
    fieldFirReports, fieldFirStorage, hydrateFieldFirReports,
    showFieldFirsOnly, setShowFieldFirsOnly, updateFieldFirStatus,
  } = useCrimeSightStore()

  useEffect(() => {
    void hydrateFieldFirReports()
  }, [hydrateFieldFirReports])

  // Map drill-downs open the registry with the exact district already applied.
  useEffect(() => {
    if (!selectedCaseDistrict) return
    setDistrictFilter(selectedCaseDistrict)
    setShowFieldFirsOnly(false)
    setExpandedRow(null)
    setSelectedCaseDistrict(null)
  }, [selectedCaseDistrict, setSelectedCaseDistrict, setShowFieldFirsOnly])

  // When navigated from another tab, selectedFirId takes precedence for expansion
  const effectiveExpandedRow = selectedFirId || expandedRow

  const filtered = useMemo(() => {
    let data = [...ALL_CASES]
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      data = data.filter(c =>
        c.fir.toLowerCase().includes(q) ||
        c.crimeType.toLowerCase().includes(q) ||
        c.place.toLowerCase().includes(q)
      )
    }
    if (districtFilter !== 'all') data = data.filter(c => c.district === districtFilter)
    if (statusFilter !== 'all') data = data.filter(c => c.status === statusFilter)
    if (priorityFilter !== 'all') data = data.filter(c => c.priority === priorityFilter)
    if (dateScope === 'today') data = data.filter(c => isGenerated(c) && c.daysAgo === 0)
    if (dateScope === 'earlier') data = data.filter(c => !isGenerated(c) || c.daysAgo > 0)
    return data
  }, [debouncedSearch, districtFilter, statusFilter, priorityFilter, dateScope])

  const todayCaseCount = useMemo(() => ALL_CASES.filter(c => isGenerated(c) && c.daysAgo === 0).length, [])
  const earlierCaseCount = ALL_CASES.length - todayCaseCount

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const genStats = useMemo(() => getGeneratedDistrictStats(), [])
  const uniqueDistricts = useMemo(() =>
    [...new Set([...Object.keys(genStats), ...Object.keys(KSP_DISTRICT_STATS)])].sort((a, b) => a.localeCompare(b)),
  [genStats])

  const uniqueStatuses = useMemo(() =>
    [...new Set(ALL_CASES.map(c => c.status))].sort(),
  [])

  const uniquePriorities = ['Critical', 'High', 'Medium', 'Low']

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [debouncedSearch, districtFilter, statusFilter, priorityFilter, dateScope])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <FileText className="size-4 text-emerald-400" />
          <h2 className="text-[13px] font-semibold text-slate-300 tracking-[0.12em] uppercase">
            {showFieldFirsOnly ? 'Field FIR Reports' : 'FIR Registry'}
          </h2>
          {showFieldFirsOnly && (
            <>
              <Badge className="h-4 px-1.5 text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                {fieldFirReports.length} field reports
              </Badge>
              <Badge className="h-4 px-1.5 text-[9px] font-medium bg-white/[0.03] text-slate-400 border-white/10">
                {fieldFirStorage === 'catalyst' ? 'Catalyst stored' : fieldFirStorage === 'syncing' ? 'Syncing' : fieldFirStorage === 'unavailable' ? 'Local fallback' : 'Local demo'}
              </Badge>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 tabular-nums">
            {showFieldFirsOnly ? fieldFirReports.length : filtered.length} {showFieldFirsOnly ? 'field' : ''} cases
          </span>
          <LastSynced />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
          <Input
            placeholder="Search FIR, crime type, place…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && search.trim()) {
                toast(`Searching: "${search.trim()}"`, { duration: 2000 })
              }
            }}
            className="h-8 text-xs bg-white/5 border-white/10 pl-8 placeholder:text-slate-600"
          />
        </div>

        {/* District filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-8 text-xs bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15 text-slate-300 justify-between min-w-[160px] font-normal">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3 text-slate-500" />
                {districtFilter === 'all' ? 'All Districts' : districtFilter}
              </span>
              <ChevronDown className="size-3 text-slate-500" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-1.5 bg-[#0d1424] border-white/10" align="start">
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              <button
                onClick={() => { setDistrictFilter('all'); setPage(1) }}
                className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md flex items-center justify-between ${districtFilter === 'all' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-white/5'}`}
              >
                All Districts
                {districtFilter === 'all' && <Check className="size-3" />}
              </button>
              {uniqueDistricts.map(d => (
                <button
                  key={d}
                  onClick={() => { setDistrictFilter(d); setPage(1) }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md flex items-center justify-between ${districtFilter === d ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-white/5'}`}
                >
                  {d}
                  {districtFilter === d && <Check className="size-3" />}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Synthetic demo-day timeline — keeps new intake separate from historical FIRs. */}
        <div className="flex h-8 items-center rounded-md border border-white/10 bg-white/[0.03] p-0.5">
          {([
            ['all', `All ${ALL_CASES.length.toLocaleString('en-IN')}`],
            ['today', `Today ${todayCaseCount}`],
            ['earlier', `Earlier ${earlierCaseCount.toLocaleString('en-IN')}`],
          ] as const).map(([scope, label]) => (
            <button
              key={scope}
              onClick={() => setDateScope(scope)}
              className={`h-6 rounded px-2 text-[10px] font-medium transition-colors ${
                dateScope === scope
                  ? 'bg-emerald-500/15 text-emerald-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-8 text-xs bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15 text-slate-300 justify-between min-w-[140px] font-normal">
              <span className="flex items-center gap-1.5">
                <Filter className="size-3 text-slate-500" />
                {statusFilter === 'all' ? 'All Status' : statusFilter}
              </span>
              <ChevronDown className="size-3 text-slate-500" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1.5 bg-[#0d1424] border-white/10" align="start">
            <button
              onClick={() => { setStatusFilter('all'); setPage(1) }}
              className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md flex items-center justify-between ${statusFilter === 'all' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-white/5'}`}
            >
              All Status
              {statusFilter === 'all' && <Check className="size-3" />}
            </button>
            {uniqueStatuses.map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1) }}
                className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md flex items-center justify-between ${statusFilter === s ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-white/5'}`}
              >
                {s}
                {statusFilter === s && <Check className="size-3" />}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Priority filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-8 text-xs bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15 text-slate-300 justify-between min-w-[120px] font-normal">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="size-3 text-slate-500" />
                {priorityFilter === 'all' ? 'Priority' : priorityFilter}
              </span>
              <ChevronDown className="size-3 text-slate-500" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-1.5 bg-[#0d1424] border-white/10" align="start">
            <button
              onClick={() => { setPriorityFilter('all'); setPage(1) }}
              className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md flex items-center justify-between ${priorityFilter === 'all' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-white/5'}`}
            >
              All Priority
              {priorityFilter === 'all' && <Check className="size-3" />}
            </button>
            {uniquePriorities.map(p => (
              <button
                key={p}
                onClick={() => { setPriorityFilter(p); setPage(1) }}
                className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md flex items-center justify-between ${priorityFilter === p ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-white/5'}`}
              >
                {p}
                {priorityFilter === p && <Check className="size-3" />}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Clear filters */}
        {(search || districtFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all' || dateScope !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-slate-400 hover:text-white hover:bg-white/5"
            onClick={() => {
              setSearch(''); setDistrictFilter('all'); setStatusFilter('all'); setPriorityFilter('all'); setDateScope('all'); setPage(1)
              toast('Filters cleared', { duration: 1500 })
            }}
          >
            <RotateCcw className="size-3 mr-1.5" />
            Clear
          </Button>
        )}

        {/* Field Reports Toggle */}
        <button
          onClick={() => { setShowFieldFirsOnly(!showFieldFirsOnly); setPage(1) }}
          className={`flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[11px] font-medium transition-all ${
            showFieldFirsOnly
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25'
              : 'text-slate-500 hover:text-cyan-400/80 hover:bg-cyan-500/5 border border-transparent'
          }`}
        >
          <ClipboardEdit className="size-3" />
          <span className="hidden sm:inline">Field Reports</span>
          {fieldFirReports.length > 0 && (
            <span className="text-[9px] font-bold tabular-nums">{fieldFirReports.length}</span>
          )}
        </button>
      </div>

      {/* Table — Field FIR Reports View */}
      {showFieldFirsOnly ? (
        <div className="glass-card overflow-hidden border-t border-cyan-500/15">
          <div className="px-4 py-2.5 border-b border-white/[0.04] flex items-center gap-2">
            <ClipboardEdit className="size-3.5 text-cyan-400" />
            <span className="text-[12px] font-semibold text-slate-300">Field FIR Reports</span>
            <Badge className="h-4 px-1.5 text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border-cyan-500/20">{fieldFirReports.length}</Badge>
            <span className="text-[10px] text-slate-600 ml-auto">Submitted by field officers</span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            {fieldFirReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-600">
                <ClipboardEdit className="size-6 mb-2 opacity-40" />
                <p className="text-[12px]">No field reports yet</p>
                <p className="text-[10px] mt-1">Use the Field FIR button in the header to submit</p>
              </div>
            ) : (
              <table className="table-dossier w-full">
                <thead>
                  <tr>
                    <th className="text-left text-[10px] text-slate-400 font-medium uppercase tracking-wider pb-2 pr-3">FIR</th>
                    <th className="text-left text-[10px] text-slate-400 font-medium uppercase tracking-wider pb-2 pr-3">Crime</th>
                    <th className="text-left text-[10px] text-slate-400 font-medium uppercase tracking-wider pb-2 pr-3 hidden md:table-cell">District</th>
                    <th className="text-left text-[10px] text-slate-400 font-medium uppercase tracking-wider pb-2 pr-3">Officer</th>
                    <th className="text-left text-[10px] text-slate-400 font-medium uppercase tracking-wider pb-2 pr-3">Status</th>
                    <th className="text-left text-[10px] text-slate-400 font-medium uppercase tracking-wider pb-2 pr-3 hidden lg:table-cell">Priority</th>
                    <th className="text-left text-[10px] text-slate-400 font-medium uppercase tracking-wider pb-2 hidden lg:table-cell">Submitted</th>
                    <th className="text-right text-[10px] text-slate-400 font-medium uppercase tracking-wider pb-2 pl-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldFirReports.map((r) => {
                    const FIELD_STATUS_STYLES: Record<string, string> = {
                      'Submitted': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                      'Under Review': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                      'Assigned': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                      'Under Investigation': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                      'Charge Sheet Filed': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                      'Closed': 'text-slate-400 bg-slate-500/10 border-slate-500/20',
                    }
                    const nextStatusMap: Record<string, string> = {
                      'Submitted': 'Under Review',
                      'Under Review': 'Assigned',
                      'Assigned': 'Under Investigation',
                      'Under Investigation': 'Charge Sheet Filed',
                      'Charge Sheet Filed': 'Closed',
                    }
                    const timeAgoStr = (() => {
                      const diffMs = Date.now() - new Date(r.submittedAt).getTime()
                      const mins = Math.floor(diffMs / 60000)
                      if (mins < 1) return 'just now'
                      if (mins < 60) return `${mins}m ago`
                      const hrs = Math.floor(mins / 60)
                      if (hrs < 24) return `${hrs}h ago`
                      return `${Math.floor(hrs / 24)}d ago`
                    })()
                    return (
                      <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 pr-3">
                          <span className="font-mono text-[11px] text-cyan-400">{r.fir}</span>
                          {r.photos.length > 0 && (
                            <span className="ml-1.5 text-[9px] text-slate-500 bg-white/5 px-1 rounded">{r.photos.length}📷</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className="text-[11px] text-slate-200">{r.crimeType}</span>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 max-w-[200px]">{r.place}</p>
                        </td>
                        <td className="py-2.5 pr-3 text-[11px] text-slate-400 hidden md:table-cell">{r.district}</td>
                        <td className="py-2.5 pr-3">
                          <p className="text-[11px] text-slate-300">{r.officerName}</p>
                          <p className="text-[9px] text-slate-600">{r.policeStation}</p>
                        </td>
                        <td className="py-2.5 pr-3">
                          <Badge variant="outline" className={`text-[9px] px-1.5 ${FIELD_STATUS_STYLES[r.status] || ''}`}>
                            {r.status}
                          </Badge>
                          {r.assignedTo && r.status !== 'Submitted' && (
                            <p className="text-[9px] text-slate-600 mt-0.5">→ {r.assignedTo}</p>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 hidden lg:table-cell">
                          <Badge variant="outline" className={`text-[9px] px-1.5 ${PRIORITY_STYLES[r.priority] || ''}`}>
                            {r.priority}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-3 hidden lg:table-cell">
                          <span className="text-[10px] text-slate-500">{timeAgoStr}</span>
                        </td>
                        <td className="py-2.5 pl-2 text-right">
                          {nextStatusMap[r.status] && r.status !== 'Closed' && (
                            <button
                              onClick={() => { updateFieldFirStatus(r.id, nextStatusMap[r.status] as any); toast(`Status → ${nextStatusMap[r.status]}`, { duration: 2000 }) }}
                              className="text-[10px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 rounded transition-colors"
                            >
                              Advance
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
          <div className="px-4 py-2 border-t border-white/[0.04] flex items-center justify-between">
            <span className="text-[9px] text-slate-600">Field Officer Submissions — Real-time</span>
            <span className="text-[9px] text-slate-600">{fieldFirReports.filter(r => r.status === 'Submitted').length} pending review</span>
          </div>
        </div>
      ) : (
      <>

      {/* Table */}
      <div className="glass-card overflow-hidden border-t border-emerald-500/10 relative">
        <div className="overflow-x-auto -mx-5 lg:mx-0 px-5 lg:px-0 custom-scrollbar relative scroll-hint-right">
          <table className="table-dossier w-full">
            <thead>
              <tr>
                <th className="w-8"></th>
                <th>FIR Number</th>
                <th>Crime Type</th>
                <th className="hidden md:table-cell">District</th>
                <th>Status</th>
                <th>Priority</th>
                <th className="hidden lg:table-cell">Date</th>
                <th className="hidden lg:table-cell w-28">Risk Score</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {paged.map((kase, i) => {
                  const expanded = effectiveExpandedRow === kase.rowid
                  const riskColor = getRiskColor(kase.riskScore)
                  return (
                    <Fragment key={kase.rowid}>
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="cursor-pointer hover:bg-white/[0.02]"
                      onClick={() => setExpandedRow(expanded ? null : kase.rowid)}
                    >
                      <td className="text-slate-600">
                        {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-emerald-400">{kase.fir}</span>
                          {'daysAgo' in kase && kase.daysAgo === 0 && (
                            <span title="Filed on the synthetic demo day" className="inline-flex items-center px-1.5 py-0 rounded text-[8px] font-bold tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">TODAY</span>
                          )}
                          {'daysAgo' in kase && kase.daysAgo === 1 && (
                            <span title="Filed one day before the synthetic demo day" className="inline-flex items-center px-1.5 py-0 rounded text-[8px] font-bold tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">1d ago</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-xs">{kase.crimeType}</span>
                        </div>
                      </td>
                      <td className="hidden md:table-cell">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigateToDistrict(kase.districtRowid) }}
                          className="text-xs text-slate-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                        >
                          <MapPin className="size-2.5" />
                          {kase.district}
                        </button>
                      </td>
                      <td>
                        <Badge variant="outline" className={`text-[10px] px-1.5 ${STATUS_STYLES[kase.status] || ''}`}>
                          {kase.status}
                        </Badge>
                      </td>
                      <td>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 ${PRIORITY_STYLES[kase.priority] || ''}`}
                        >
                          {kase.priority}
                        </Badge>
                      </td>
                      <td className="hidden lg:table-cell">
                        <span className="text-xs text-slate-500">
                          {kase.occurrenceDate?.split(' ')[0] || '—'}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="threat-bar flex-1">
                            <div 
                              className="threat-bar-fill" 
                              style={{ 
                                width: `${kase.riskScore}%`, 
                                background: `linear-gradient(90deg, #10b981, ${kase.riskScore >= 70 ? '#ef4444' : kase.riskScore >= 40 ? '#f59e0b' : '#10b981'})` 
                              }} 
                            />
                          </div>
                          <span className="text-[10px] font-mono w-7 text-right font-bold tabular-nums" style={{ color: kase.riskScore >= 70 ? '#f87171' : kase.riskScore >= 40 ? '#fbbf24' : '#34d399' }}>{Math.round(kase.riskScore)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          {kase.hasRepeatOffender && (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 bg-amber-500/10 text-amber-400 border-amber-500/20 whitespace-nowrap">
                              REPEAT
                            </Badge>
                          )}
                          {kase.similarCases.length > 0 && (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 bg-blue-500/10 text-blue-400 border-blue-500/20 whitespace-nowrap">
                              {kase.similarCases.length}
                            </Badge>
                          )}
                          {kase.forensicMatches.length > 0 && (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 bg-violet-500/10 text-violet-400 border-violet-500/20 whitespace-nowrap">
                              FORENSIC
                            </Badge>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                    {expanded && isGenerated(kase) && (
                      <tr className="border-t border-emerald-500/15 bg-white/[0.015]">
                        <td colSpan={9} className="p-0">
                          <GeneratedFirDetail
                            kase={kase}
                            onCaseCracker={() => setCrackCase({ caseId: kase.rowid, fir: kase.fir, crimeType: kase.crimeType, district: kase.district })}
                            onViewDistrict={() => navigateToDistrict(kase.districtRowid)}
                            onOpenGovernedReview={() => setActiveTab('operations')}
                          />
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Expanded row detail */}
        {effectiveExpandedRow && (() => {
          const kase = KSP_CASES.find(x => x.rowid === effectiveExpandedRow)
          if (!kase) return null
          const brief = getCaseIntelligenceBrief(kase.rowid)
          const linkedCases = getLinkedCases(kase.rowid)
          const repeatOffenders = getRepeatOffendersForCase(kase.rowid)

          // Evidence grouped by type
          const evidenceByType = kase.evidence.reduce<Record<string, number>>((acc, e) => {
            acc[e.name] = (acc[e.name] || 0) + 1
            return acc
          }, {})
          const forensicPending = kase.evidence.filter(e => e.forensicStatus && e.forensicStatus !== 'Completed').length
          const forensicCompleted = kase.evidence.filter(e => e.forensicStatus === 'Completed').length

          return (
            <motion.div
              key={`detail-${kase.rowid}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/[0.06] p-5 bg-white/[0.02]"
              onClick={e => e.stopPropagation()}
            >
              {/* Case details grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-slate-500 mb-1">FIR Number</p>
                  <p className="font-mono text-emerald-400">{kase.fir}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Place of Occurrence</p>
                  <p className="text-slate-300">{kase.place}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Complaint Mode</p>
                  <p className="text-slate-300">{kase.complaintMode}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Occurrence</p>
                  <p className="text-slate-300">{kase.occurrenceDate || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Complaint Filed</p>
                  <p className="text-slate-300">{kase.complaintDate || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Risk Score</p>
                  <p className="font-bold" style={{ color: RISK_COLORS[getRiskColor(kase.riskScore)] }}>{Math.round(kase.riskScore)}/100</p>
                </div>
                <div className="hidden md:block">
                  <p className="text-slate-500 mb-1">Investigation Status</p>
                  <p className="text-slate-300">
                    {kase.status === 'Closed' ? 'Case disposed' : kase.status === 'Under Investigation' ? 'IO assigned, investigation in progress' : kase.status === 'Charge Sheet Filed' ? "Chargesheet filed before Hon'ble Court" : kase.status}
                  </p>
                </div>
              </div>

              {/* SCRB Intelligence Brief */}
              <div className="mt-4 p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15">
                <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield className="size-3.5" />
                  SCRB Intelligence Brief
                </p>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {brief.repeatOffenderCount > 0 && (
                    <Badge variant="outline" className="text-[9px] px-1.5 bg-amber-500/10 text-amber-400 border-amber-500/20">
                      {brief.repeatOffenderCount} repeat offender{brief.repeatOffenderCount !== 1 ? 's' : ''} linked
                    </Badge>
                  )}
                  {brief.linkedCaseCount > 0 && (
                    <Badge variant="outline" className="text-[9px] px-1.5 bg-blue-500/10 text-blue-400 border-blue-500/20">
                      {brief.linkedCaseCount} similar case{brief.linkedCaseCount !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {brief.forensicMatchCount > 0 && (
                    <Badge variant="outline" className="text-[9px] px-1.5 bg-violet-500/10 text-violet-400 border-violet-500/20">
                      {brief.forensicMatchCount} forensic match{brief.forensicMatchCount !== 1 ? 'es' : ''}
                    </Badge>
                  )}
                  <Badge variant="outline" className={`text-[9px] px-1.5 ${SPATIAL_RISK_STYLES[brief.spatialClusterRisk]}`}>
                    Spatial risk: {brief.spatialClusterRisk}
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{brief.topInsight}</p>
              </div>

              {/* Linked Suspects */}
              {kase.suspects.length > 0 && (
                <div className="mt-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Users className="size-3" />
                    Linked Suspects ({kase.suspects.length})
                  </p>
                  <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                    {kase.suspects.map(s => (
                      <div key={s.rowid} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            onClick={() => openDossier(s.name, kase.fir)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors truncate"
                          >
                            {s.name}
                          </button>
                          <span className="text-[10px] text-slate-600 shrink-0">
                            {s.gender}, {s.age}y, {s.occupation}
                          </span>
                          {s.isRepeatOffender && (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 bg-amber-500/10 text-amber-400 border-amber-500/20 whitespace-nowrap">
                              Repeat Offender
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className={`text-[9px] px-1.5 shrink-0 ${ARREST_STYLES[s.arrestStatus] || 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
                          {s.arrestStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vehicles */}
              {kase.vehicles.length > 0 && (
                <div className="mt-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Car className="size-3" />
                    Vehicles ({kase.vehicles.length})
                  </p>
                  <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                    {kase.vehicles.map(v => (
                      <div key={v.rowid} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-xs text-slate-300">{v.number}</span>
                          <span className="text-[10px] text-slate-500">
                            {v.color} {v.make} {v.model}
                          </span>
                          <span className="text-[10px] text-slate-600">
                            Owner: {v.owner}
                          </span>
                        </div>
                        {v.seized && (
                          <Badge variant="outline" className="text-[8px] px-1 py-0 bg-red-500/10 text-red-400 border-red-500/20 whitespace-nowrap">
                            Seized
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence Summary */}
              {kase.evidence.length > 0 && (
                <div className="mt-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Fingerprint className="size-3" />
                    Evidence Summary ({kase.evidence.length} items)
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {Object.entries(evidenceByType).map(([type, count]) => (
                      <span key={type} className="text-[10px] text-slate-400 bg-white/5 rounded px-2 py-0.5">
                        {type}: <span className="text-slate-300 font-medium">{count}</span>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-3 text-[10px]">
                    {forensicCompleted > 0 && (
                      <span className="text-emerald-400">✓ {forensicCompleted} forensically matched</span>
                    )}
                    {forensicPending > 0 && (
                      <span className="text-amber-400">⏳ {forensicPending} pending analysis</span>
                    )}
                    {forensicCompleted === 0 && forensicPending === 0 && (
                      <span className="text-slate-500">No forensic analysis requested</span>
                    )}
                  </div>
                </div>
              )}

              {/* Linked / Similar Cases */}
              {linkedCases.length > 0 && (
                <div className="mt-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Network className="size-3" />
                    Linked Cases ({linkedCases.length})
                  </p>
                  <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1.5">
                    {linkedCases.map(lc => (
                      <div key={lc.rowid} className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-emerald-400">{lc.fir}</span>
                          <span className="text-slate-400">{lc.crimeType}</span>
                          <span className="text-slate-600">• {lc.district}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={`text-[9px] px-1.5 ${STATUS_STYLES[lc.status] || 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
                            {lc.status}
                          </Badge>
                          {lc.matchReason && (
                            <span className="text-[9px] text-slate-500 max-w-[180px] truncate">{lc.matchReason}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Repeat Offenders Detail */}
              {repeatOffenders.length > 0 && (
                <div className="mt-3 p-4 rounded-xl bg-amber-500/[0.04] border border-amber-500/15">
                  <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <AlertTriangle className="size-3" />
                    Repeat Offender Detail
                  </p>
                  <div className="space-y-2">
                    {repeatOffenders.map(ro => (
                      <div key={ro.phone} className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            onClick={() => openDossier(ro.name, kase.fir)}
                            className="text-xs text-amber-300 hover:text-amber-200 transition-colors truncate"
                          >
                            {ro.name}
                          </button>
                          <span className="text-[10px] text-slate-600">Ph: {ro.phone}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] px-1.5 bg-red-500/10 text-red-400 border-red-500/20 shrink-0">
                          {ro.totalCases} FIRs
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2 mt-3 border-t border-white/[0.04]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCrackCase({
                    caseId: kase.rowid,
                    fir: kase.fir,
                    crimeType: kase.crimeType,
                    district: kase.district,
                  })}
                  className="h-7 px-3 text-[10px] border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30"
                >
                  <SearchIcon className="size-3 mr-1.5" />
                  Case Cracker
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReportCaseRowid(kase.rowid)}
                  className="h-7 px-3 text-[10px] border-amber-500/20 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/30"
                >
                  <FileText className="size-3 mr-1.5" />
                  Generate Report
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (kase.suspects.length > 0) {
                      openDossier(kase.suspects[0].name, kase.fir)
                    } else {
                      setActiveTab('network')
                    }
                  }}
                  className="h-7 px-3 text-[10px] border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-300 ml-auto"
                >
                  <Network className="size-3 mr-1.5" />
                  View in Network
                </Button>
              </div>
            </motion.div>
          )
        })()}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-xs">
        <span className="text-slate-400 tabular-nums">
          Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} synthetic FIRs
        </span>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" className="h-7 px-3 text-[10px] border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/30" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="size-3 mr-1" /> Prev
          </Button>
          <Button variant="outline" size="sm" className="h-7 px-3 text-[10px] border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/30" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Next <ChevronRight className="size-3 ml-1" />
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.04]">
        <span className="text-[9px] text-slate-600">Synthetic prototype data — modeled on supplied KSP ER schema</span>
        <span className="text-[9px] text-slate-600 tabular-nums">Last sync: {new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })} hrs</span>
      </div>
      </>
      )}

      {crackCase && (
        <CaseCrackerModal
          caseId={crackCase.caseId}
          fir={crackCase.fir}
          crimeType={crackCase.crimeType}
          district={crackCase.district}
          onClose={() => setCrackCase(null)}
        />
      )}
      {reportCaseRowid !== null && (
        <AiReportModal
          caseRowid={reportCaseRowid}
          onClose={() => setReportCaseRowid(null)}
        />
      )}
    </div>
  )
}
