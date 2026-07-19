'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Users,
  Trophy,
  Target,
  Building2,
  ChevronDown,
  ChevronUp,
  Medal,
  TrendingUp,
  ShieldCheck,
  ArrowUpDown,
  FileText,
  Link2,
} from 'lucide-react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'

import { GENERATED_CASES } from '@/lib/case-generator'

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface OfficerRow {
  ROWID: string
  full_name: string
  badge_number: string
  rank_name: string
  designation_name: string
  unit_name: string
  unit_type: string
  district_name: string
  district_rowid: string
  unit_rowid: string
  totalCases: number
  arrestsMade: number
  chargesheetsFiled: number
  closedCases: number
  activeCases: number
  openCases: number
  chargeSheetFiled: number
  resolutionRate: number
  efficiencyScore: number
  caseStatusBreakdown: Record<string, number>
}

interface UnitRow {
  unit_name: string
  district_name: string
  unit_type: string
  district_rowid: string
  totalCases: number
  arrests: number
  chargesheets: number
  closedCases: number
  resolutionRate: number
}

interface Summary {
  totalOfficers: number
  avgResolutionRate: number
  topPerformer: string
  mostActiveUnit: string
}

interface LeaderboardData {
  officers: OfficerRow[]
  units: UnitRow[]
  summary: Summary
}

/* ═══════════════════════════════════════════════════════════════
   FRAMER VARIANTS
   ═══════════════════════════════════════════════════════════════ */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

const statCardVariants: Variants = {
  hidden: { opacity: 0, y: -10, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: 0.15 + i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

function getRankBadge(rank: number) {
  if (rank === 1) return { icon: '🥇', bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400' }
  if (rank === 2) return { icon: '🥈', bg: 'bg-slate-400/15', border: 'border-slate-400/30', text: 'text-slate-300' }
  if (rank === 3) return { icon: '🥉', bg: 'bg-orange-700/15', border: 'border-orange-700/30', text: 'text-orange-400' }
  return { icon: `#${rank}`, bg: 'bg-slate-800/50', border: 'border-slate-700/30', text: 'text-slate-400' }
}

function getResolutionColor(rate: number): string {
  if (rate >= 70) return 'text-emerald-400'
  if (rate >= 40) return 'text-amber-400'
  return 'text-red-400'
}

function getResolutionBarColor(rate: number): string {
  if (rate >= 70) return 'bg-emerald-500'
  if (rate >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

function getEfficiencyBadge(score: number) {
  if (score >= 75) return { label: 'Excellent', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' }
  if (score >= 50) return { label: 'Good', className: 'bg-blue-500/15 text-blue-400 border-blue-500/20' }
  if (score >= 25) return { label: 'Average', className: 'bg-amber-500/15 text-amber-400 border-amber-500/20' }
  return { label: 'Low', className: 'bg-red-500/15 text-red-400 border-red-500/20' }
}

/* ═══════════════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════════════ */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = 'emerald',
  index,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  accent?: string
  index: number
}) {
  const colorMap: Record<string, { icon: string; glow: string; ring: string }> = {
    emerald: { icon: 'text-emerald-400', glow: 'shadow-emerald-500/5', ring: 'ring-emerald-500/10' },
    amber: { icon: 'text-amber-400', glow: 'shadow-amber-500/5', ring: 'ring-amber-500/10' },
    cyan: { icon: 'text-cyan-400', glow: 'shadow-cyan-500/5', ring: 'ring-cyan-500/10' },
    rose: { icon: 'text-rose-400', glow: 'shadow-rose-500/5', ring: 'ring-rose-500/10' },
  }
  const c = colorMap[accent] ?? colorMap.emerald

  return (
    <motion.div variants={statCardVariants} custom={index}>
      <Card className={`bg-slate-900/60 border-slate-800/60 ${c.glow} shadow-lg ring-1 ${c.ring} backdrop-blur-sm`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</p>
              <p className="text-xl font-bold text-white tabular-nums leading-tight">{value}</p>
              {sub && <p className="text-[10px] text-slate-500 truncate max-w-[180px]">{sub}</p>}
            </div>
            <div className={`p-2 rounded-lg bg-slate-800/60`}>
              <Icon className={`size-4 ${c.icon}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   EXPANDED OFFICER DETAIL
   ═══════════════════════════════════════════════════════════════ */

function OfficerDetail({ officer }: { officer: OfficerRow }) {
  const statusEntries = Object.entries(officer.caseStatusBreakdown).sort((a, b) => b[1] - a[1])
  const statusColors: Record<string, string> = {
    'Closed': 'text-emerald-400 bg-emerald-500/10',
    'Under Investigation': 'text-amber-400 bg-amber-500/10',
    'Open': 'text-sky-400 bg-sky-500/10',
    'Charge Sheet Filed': 'text-purple-400 bg-purple-500/10',
    'Unknown': 'text-slate-400 bg-slate-500/10',
  }
  const total = statusEntries.reduce((s, [, v]) => s + v, 0)

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <div className="bg-slate-900/40 border border-slate-800/40 rounded-lg p-4 mx-2 mb-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Case Status Breakdown */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Case Status Breakdown</p>
            <div className="space-y-2">
              {statusEntries.map(([status, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColors[status] ?? statusColors['Unknown']}`}>
                      {status}
                    </span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`h-full rounded-full ${getResolutionBarColor(status === 'Closed' ? 80 : status === 'Under Investigation' ? 40 : 20)}`}
                      />
                    </div>
                    <span className="text-xs text-slate-300 tabular-nums font-medium w-16 text-right">{count} ({pct}%)</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Performance Metrics</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Cases', value: officer.totalCases, icon: FileText, color: 'text-slate-300' },
                { label: 'Arrests Made', value: officer.arrestsMade, icon: Link2, color: 'text-emerald-400' },
                { label: 'Chargesheets', value: officer.chargesheetsFiled, icon: ShieldCheck, color: 'text-cyan-400' },
                { label: 'Efficiency', value: `${officer.efficiencyScore}%`, icon: Target, color: 'text-amber-400' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2 bg-slate-800/40 rounded-lg p-2.5">
                  <s.icon className={`size-3.5 ${s.color} shrink-0`} />
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase">{s.label}</p>
                    <p className={`text-sm font-bold tabular-nums ${s.color}`}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
              <span>Designation: <span className="text-slate-300">{officer.designation_name}</span></span>
              <span className="text-slate-700">•</span>
              <span>Unit Type: <span className="text-slate-300">{officer.unit_type || 'N/A'}</span></span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SORT DIRECTION ICON
   ═══════════════════════════════════════════════════════════════ */

function SortIcon({ field, sortField, sortDir }: { field: string; sortField: string; sortDir: 'asc' | 'desc' }) {
  if (field !== sortField) return <ArrowUpDown className="size-3 text-slate-600" />
  return sortDir === 'desc'
    ? <ChevronDown className="size-3 text-emerald-400" />
    : <ChevronUp className="size-3 text-emerald-400" />
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function OfficerIntelTab() {
  const [search, setSearch] = useState('')
  const [districtFilter, setDistrictFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<string>('totalCases')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expandedOfficer, setExpandedOfficer] = useState<string | null>(null)
  const [unitSort, setUnitSort] = useState<string>('totalCases')
  const [unitSortDir, setUnitSortDir] = useState<'asc' | 'desc'>('desc')

  // Compute officer leaderboard from local 10K cases
  const data = useMemo<LeaderboardData>(() => {
    const firstNames = ['Rajesh', 'Suresh', 'Mahesh', 'Ramesh', 'Ganesh', 'Venkatesh', 'Prakash', 'Vijay', 'Sanjay', 'Anil', 'Sunil', 'Manoj', 'Deepak', 'Pradeep', 'Mohan', 'Krishna', 'Naveen', 'Pavan', 'Arun', 'Kiran']
    const lastNames = ['Kumar', 'Singh', 'Patil', 'Gowda', 'Rao', 'Shetty', 'Naik', 'Reddy', 'Hegde', 'Kulkarni', 'Joshi', 'Desai', 'Bhat', 'Acharya', 'Menon']
    const ranks = ['Inspector', 'Sub-Inspector', 'Asst. Sub-Inspector', 'Head Constable']
    const designations = ['Station House Officer', 'Investigation Officer', 'Beat Officer', 'Crime Branch Officer']

    // Group cases by officer (PS name)
    const officerMap = new Map<string, typeof GENERATED_CASES>()
    for (const c of GENERATED_CASES) {
      if (!officerMap.has(c.officerRowid)) officerMap.set(c.officerRowid, [])
      officerMap.get(c.officerRowid)!.push(c)
    }

    const officers: OfficerRow[] = []
    const unitMap = new Map<string, { district: string; cases: typeof GENERATED_CASES }>()

    let idx = 0
    for (const [psName, cases] of officerMap) {
      const totalCases = cases.length
      const openCases = cases.filter(c => c.status === 'Open' || c.status === 'Under Investigation').length
      const closedCases = cases.filter(c => c.status === 'Closed').length
      const chargesheeted = cases.filter(c => c.status === 'Charge Sheet Filed').length
      const arrests = Math.round(totalCases * (0.25 + (idx % 5) * 0.03))
      const resolutionRate = totalCases > 0 ? Math.round(((closedCases + chargesheeted) / totalCases) * 100) : 0
      const avgRisk = totalCases > 0 ? Math.round(cases.reduce((s, c) => s + c.riskScore, 0) / totalCases) : 50
      const efficiencyScore = Math.min(99, Math.max(5, Math.round(resolutionRate * 0.7 + (100 - avgRisk) * 0.3)))

      const statusBreakdown: Record<string, number> = {}
      for (const c of cases) {
        statusBreakdown[c.status] = (statusBreakdown[c.status] || 0) + 1
      }

      officers.push({
        ROWID: psName,
        full_name: `${firstNames[idx % firstNames.length]} ${lastNames[idx % lastNames.length]}`,
        badge_number: `KSP-${String(idx + 1001).padStart(5, '0')}`,
        rank_name: ranks[idx % ranks.length],
        designation_name: designations[idx % designations.length],
        unit_name: psName,
        unit_type: 'Police Station',
        district_name: cases[0].district,
        district_rowid: cases[0].districtRowid,
        unit_rowid: `UNIT-${psName}`,
        totalCases,
        arrestsMade: arrests,
        chargesheetsFiled: chargesheeted,
        closedCases,
        activeCases: openCases,
        openCases,
        chargeSheetFiled: chargesheeted,
        resolutionRate,
        efficiencyScore,
        caseStatusBreakdown: statusBreakdown,
      })

      if (!unitMap.has(psName)) {
        unitMap.set(psName, { district: cases[0].district, cases: [] })
      }
      unitMap.get(psName)!.cases.push(...cases)

      idx++
    }

    officers.sort((a, b) => b.totalCases - a.totalCases)

    const units: UnitRow[] = Array.from(unitMap.entries()).map(([unitName, { district, cases: unitCases }]) => {
      const total = unitCases.length
      const closed = unitCases.filter(c => c.status === 'Closed').length
      const chargesheeted = unitCases.filter(c => c.status === 'Charge Sheet Filed').length
      const arrests = Math.round(total * 0.3)
      const resolutionRate = total > 0 ? Math.round(((closed + chargesheeted) / total) * 100) : 0
      return {
        unit_name: unitName,
        district_name: district,
        unit_type: 'Police Station',
        district_rowid: `DST-${district}`,
        totalCases: total,
        arrests,
        chargesheets: chargesheeted,
        closedCases: closed,
        resolutionRate,
      }
    })
    units.sort((a, b) => b.totalCases - a.totalCases)

    const totalOfficers = officers.length
    const avgResolutionRate = totalOfficers > 0
      ? Math.round(officers.reduce((s, o) => s + o.resolutionRate, 0) / totalOfficers)
      : 0

    return {
      officers,
      units,
      summary: {
        totalOfficers,
        avgResolutionRate,
        topPerformer: officers[0]?.full_name || 'N/A',
        mostActiveUnit: units[0]?.unit_name || 'N/A',
      },
    }
  }, [])

  // Extract unique districts
  const districts = useMemo(() => {
    const set = new Set(data.officers.map(o => o.district_name).filter(Boolean))
    return Array.from(set).sort()
  }, [data])

  // Filtered & sorted officers
  const filteredOfficers = useMemo(() => {
    if (!data) return []
    let list = [...data.officers]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(o =>
        o.full_name.toLowerCase().includes(q) ||
        o.badge_number.toLowerCase().includes(q) ||
        o.rank_name.toLowerCase().includes(q)
      )
    }

    // District filter
    if (districtFilter !== 'all') {
      list = list.filter(o => o.district_name === districtFilter)
    }

    // Sort
    list.sort((a, b) => {
      const aVal = (a as unknown as Record<string, number>)[sortField] ?? 0
      const bVal = (b as unknown as Record<string, number>)[sortField] ?? 0
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal
    })

    return list
  }, [data, search, districtFilter, sortField, sortDir])

  // Filtered & sorted units
  const filteredUnits = useMemo(() => {
    if (!data) return []
    let list = [...data.units]

    if (districtFilter !== 'all') {
      list = list.filter(u => u.district_name === districtFilter)
    }

    list.sort((a, b) => {
      const aVal = (a as unknown as Record<string, number>)[unitSort] ?? 0
      const bVal = (b as unknown as Record<string, number>)[unitSort] ?? 0
      return unitSortDir === 'desc' ? bVal - aVal : aVal - bVal
    })

    return list
  }, [data, districtFilter, unitSort, unitSortDir])

  const toggleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }, [sortField])

  const toggleUnitSort = useCallback((field: string) => {
    if (unitSort === field) {
      setUnitSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setUnitSort(field)
      setUnitSortDir('desc')
    }
  }, [unitSort])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Medal className="size-5 text-emerald-400" />
            Officer Intelligence
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Performance leaderboard &amp; unit analytics</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-600">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>LIVE DATA</span>
        </div>
      </motion.div>

      {/* ── Top Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label="Active Officers"
          value={data.summary.totalOfficers}
          sub="with assigned cases"
          accent="emerald"
          index={0}
        />
        <StatCard
          icon={Target}
          label="Avg Resolution Rate"
          value={`${data.summary.avgResolutionRate}%`}
          sub="across all officers"
          accent="cyan"
          index={1}
        />
        <StatCard
          icon={Trophy}
          label="Top Performer"
          value={data.summary.topPerformer}
          sub="by case volume & efficiency"
          accent="amber"
          index={2}
        />
        <StatCard
          icon={Building2}
          label="Most Active Unit"
          value={data.summary.mostActiveUnit}
          sub="by total case count"
          accent="rose"
          index={3}
        />
      </div>

      {/* ── Filters / Search ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
          <Input
            placeholder="Search officers by name, badge, or rank…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 bg-slate-900/60 border-slate-800/60 text-slate-200 text-xs placeholder:text-slate-600 focus:ring-emerald-500/20 focus:border-emerald-500/30"
          />
        </div>
        <Select value={districtFilter} onValueChange={setDistrictFilter}>
          <SelectTrigger className="w-full sm:w-48 h-9 bg-slate-900/60 border-slate-800/60 text-slate-200 text-xs focus:ring-emerald-500/20 focus:border-emerald-500/30">
            <SelectValue placeholder="All Districts" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all" className="text-slate-200 text-xs">All Districts</SelectItem>
            {districts.map(d => (
              <SelectItem key={d} value={d} className="text-slate-200 text-xs">{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* ── Leaderboard Table ── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-400" />
                Performance Leaderboard
              </CardTitle>
              <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700 bg-slate-800/50">
                {filteredOfficers.length} officers
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800/60 hover:bg-transparent">
                    <TableHead className="w-12 text-center text-[10px] text-slate-500 uppercase tracking-wider font-medium">Rank</TableHead>
                    <TableHead className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Officer Name</TableHead>
                    <TableHead className="hidden md:table-cell text-[10px] text-slate-500 uppercase tracking-wider font-medium">Badge</TableHead>
                    <TableHead className="hidden lg:table-cell text-[10px] text-slate-500 uppercase tracking-wider font-medium">Rank</TableHead>
                    <TableHead className="hidden xl:table-cell text-[10px] text-slate-500 uppercase tracking-wider font-medium">Unit / District</TableHead>
                    <TableHead
                      className="text-[10px] text-slate-500 uppercase tracking-wider font-medium cursor-pointer select-none hover:text-slate-300"
                      onClick={() => toggleSort('totalCases')}
                    >
                      <div className="flex items-center gap-1">Cases <SortIcon field="totalCases" sortField={sortField} sortDir={sortDir} /></div>
                    </TableHead>
                    <TableHead
                      className="text-[10px] text-slate-500 uppercase tracking-wider font-medium cursor-pointer select-none hover:text-slate-300"
                      onClick={() => toggleSort('arrestsMade')}
                    >
                      <div className="flex items-center gap-1">Arrests <SortIcon field="arrestsMade" sortField={sortField} sortDir={sortDir} /></div>
                    </TableHead>
                    <TableHead className="hidden sm:table-cell text-[10px] text-slate-500 uppercase tracking-wider font-medium">Resolved</TableHead>
                    <TableHead
                      className="min-w-[140px] text-[10px] text-slate-500 uppercase tracking-wider font-medium cursor-pointer select-none hover:text-slate-300"
                      onClick={() => toggleSort('resolutionRate')}
                    >
                      <div className="flex items-center gap-1">Resolution <SortIcon field="resolutionRate" sortField={sortField} sortDir={sortDir} /></div>
                    </TableHead>
                    <TableHead
                      className="hidden sm:table-cell text-[10px] text-slate-500 uppercase tracking-wider font-medium cursor-pointer select-none hover:text-slate-300"
                      onClick={() => toggleSort('efficiencyScore')}
                    >
                      <div className="flex items-center gap-1">Efficiency <SortIcon field="efficiencyScore" sortField={sortField} sortDir={sortDir} /></div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOfficers.map((officer, idx) => {
                    const badge = getRankBadge(idx + 1)
                    const eff = getEfficiencyBadge(officer.efficiencyScore)
                    const isExpanded = expandedOfficer === officer.ROWID

                    return (
                      <AnimatePresence key={officer.ROWID}>
                        <>
                          <TableRow
                            className={`border-slate-800/40 cursor-pointer transition-colors duration-150 ${
                              isExpanded ? 'bg-slate-800/30' : 'hover:bg-slate-800/20'
                            }`}
                            onClick={() => setExpandedOfficer(isExpanded ? null : officer.ROWID)}
                          >
                            {/* Position */}
                            <TableCell className="text-center py-3">
                              <span className={`inline-flex items-center justify-center size-7 rounded-md text-xs font-bold ${badge.bg} border ${badge.border} ${badge.text}`}>
                                {badge.icon}
                              </span>
                            </TableCell>

                            {/* Name */}
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0">
                                  {officer.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-white truncate">{officer.full_name}</p>
                                  <p className="text-[10px] text-slate-500 md:hidden">{officer.badge_number}</p>
                                </div>
                              </div>
                            </TableCell>

                            {/* Badge */}
                            <TableCell className="hidden md:table-cell py-3">
                              <span className="text-[11px] text-slate-400 font-mono">{officer.badge_number}</span>
                            </TableCell>

                            {/* Rank */}
                            <TableCell className="hidden lg:table-cell py-3">
                              <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700 bg-slate-800/40">
                                {officer.rank_name}
                              </Badge>
                            </TableCell>

                            {/* Unit/District */}
                            <TableCell className="hidden xl:table-cell py-3">
                              <div className="min-w-0">
                                <p className="text-[11px] text-slate-300 truncate">{officer.unit_name}</p>
                                <p className="text-[10px] text-slate-500">{officer.district_name}</p>
                              </div>
                            </TableCell>

                            {/* Cases */}
                            <TableCell className="py-3">
                              <span className="text-xs font-bold text-white tabular-nums">{officer.totalCases}</span>
                            </TableCell>

                            {/* Arrests */}
                            <TableCell className="py-3">
                              <span className="text-xs font-medium text-emerald-400 tabular-nums">{officer.arrestsMade}</span>
                            </TableCell>

                            {/* Resolved */}
                            <TableCell className="hidden sm:table-cell py-3">
                              <span className="text-xs text-slate-300 tabular-nums">{officer.closedCases}</span>
                            </TableCell>

                            {/* Resolution Rate */}
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden min-w-[60px]">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${officer.resolutionRate}%` }}
                                    transition={{ duration: 0.7, ease: 'easeOut', delay: idx * 0.02 }}
                                    className={`h-full rounded-full ${getResolutionBarColor(officer.resolutionRate)}`}
                                  />
                                </div>
                                <span className={`text-[11px] font-semibold tabular-nums w-9 text-right ${getResolutionColor(officer.resolutionRate)}`}>
                                  {officer.resolutionRate}%
                                </span>
                              </div>
                            </TableCell>

                            {/* Efficiency */}
                            <TableCell className="hidden sm:table-cell py-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white tabular-nums">{officer.efficiencyScore}</span>
                                <Badge variant="outline" className={`text-[9px] border ${eff.className}`}>
                                  {eff.label}
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Expanded Detail */}
                          {isExpanded && (
                            <TableRow className="border-slate-800/40 hover:bg-transparent p-0">
                              <TableCell colSpan={10} className="p-0">
                                <OfficerDetail officer={officer} />
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      </AnimatePresence>
                    )
                  })}

                  {filteredOfficers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center">
                        <p className="text-xs text-slate-500">No officers match your search criteria.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Unit Performance Section ── */}
      <motion.div variants={itemVariants}>
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Building2 className="size-4 text-emerald-400" />
                Unit Performance
              </CardTitle>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleUnitSort('totalCases')}
                  className={`text-[10px] px-2.5 py-1 rounded-md transition-colors ${
                    unitSort === 'totalCases'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-500 hover:text-slate-300 border border-transparent'
                  }`}
                >
                  By Cases
                </button>
                <button
                  onClick={() => toggleUnitSort('resolutionRate')}
                  className={`text-[10px] px-2.5 py-1 rounded-md transition-colors ${
                    unitSort === 'resolutionRate'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-500 hover:text-slate-300 border border-transparent'
                  }`}
                >
                  By Resolution
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredUnits.map((unit, idx) => (
                  <motion.div
                    key={`${unit.unit_name}-${unit.district_name}`}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: idx * 0.03, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-3.5 hover:border-slate-600/40 transition-colors">
                      <div className="flex items-start justify-between mb-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-white truncate">{unit.unit_name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{unit.district_name}</p>
                        </div>
                        {idx === 0 && (
                          <Badge className="text-[9px] bg-amber-500/15 text-amber-400 border-amber-500/20 border shrink-0">
                            <Trophy className="size-2.5 mr-1" /> Top
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        {/* Stats Row */}
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Cases</span>
                          <span className="text-white font-semibold tabular-nums">{unit.totalCases}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Arrests</span>
                          <span className="text-emerald-400 font-medium tabular-nums">{unit.arrests}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Chargesheets</span>
                          <span className="text-cyan-400 font-medium tabular-nums">{unit.chargesheets}</span>
                        </div>

                        {/* Resolution Bar */}
                        <div>
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="text-slate-500">Resolution Rate</span>
                            <span className={`font-semibold tabular-nums ${getResolutionColor(unit.resolutionRate)}`}>
                              {unit.resolutionRate}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${unit.resolutionRate}%` }}
                              transition={{ duration: 0.7, ease: 'easeOut', delay: idx * 0.03 }}
                              className={`h-full rounded-full ${getResolutionBarColor(unit.resolutionRate)}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredUnits.length === 0 && (
                <div className="flex flex-col items-center justify-center h-24">
                  <p className="text-xs text-slate-500">No units found for the selected filters.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
