'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, CartesianGrid, Cell
} from 'recharts'
import { Clock, MapPin, TrendingUp, ShieldAlert, Calendar } from 'lucide-react'
import {
  DEMO_CASES, DEMO_DISTRICTS, DEMO_CRIME_TYPES,
  getDemoCrimeTypeName, getDemoDistrictName
} from '@/lib/demo-data'
import { GENERATED_CASES } from '@/lib/case-generator'
import { useCrimeSightStore } from '@/lib/store'
import LastSynced from '@/components/crimesight/last-synced'

const SUBTABS = ['IPC Classification', 'District Analysis', 'Temporal Pattern (24h)', 'Monthly FIR Trend'] as const

const CHART_COLORS = ['#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#475569', '#64748b', '#94a3b8', '#cbd5e1']

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-[12px]">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: p.color }} />
          {p.name}: <span className="text-white font-medium">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, className }: { icon: any; label: string; value: string; color: string; className?: string }) {
  return (
    <div className={`glass-card ${className || 'p-5'} flex items-center gap-3`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="size-4 text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{label}</p>
        <p className="text-[24px] font-bold text-white">{value}</p>
      </div>
    </div>
  )
}

export default function TrendsTab() {
  const [activeSub, setActiveSub] = useState<number>(0)
  const { dateFrom, dateTo, setDateRange, clearDateRange } = useCrimeSightStore()

  // Filter cases by date range
  const filteredCases = useMemo(() => {
    let cases = GENERATED_CASES as any[]
    if (dateFrom) {
      cases = cases.filter(c => (c.occurrenceDate || '').split(' ')[0] >= dateFrom)
    }
    if (dateTo) {
      cases = cases.filter(c => (c.occurrenceDate || '').split(' ')[0] <= dateTo)
    }
    return cases
  }, [dateFrom, dateTo])

  const hasDateFilter = !!(dateFrom || dateTo)

  const crimeTypeData = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of filteredCases) {
      map[c.crimeType] = (map[c.crimeType] || 0) + 1
    }
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [filteredCases])

  const districtData = useMemo(() => {
    const stats: Record<string, { total: number; open: number; critical: number }> = {}
    for (const c of filteredCases) {
      if (!stats[c.district]) stats[c.district] = { total: 0, open: 0, critical: 0 }
      stats[c.district].total++
      if (c.status === 'Open' || c.status === 'Under Investigation') stats[c.district].open++
      if (c.priority === 'Critical' || c.priority === 'High') stats[c.district].critical++
    }
    return Object.entries(stats)
      .map(([name, d]) => ({ name, total: d.total, active: d.open, critical: d.critical }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15)
  }, [filteredCases])

  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2, '0')}:00`, count: 0 }))
    for (const c of filteredCases) {
      const h = parseInt(c.occurrenceDate.split(' ')[1]?.split(':')[0] || '12')
      if (h >= 0 && h < 24) hours[h].count++
    }
    return hours
  }, [filteredCases])

  const monthlyData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const months: Record<string, number> = {}
    for (const c of filteredCases) {
      const m = parseInt(c.occurrenceDate.split('-')[1] || '1')
      const key = monthNames[m - 1] || 'Jan'
      months[key] = (months[key] || 0) + 1
    }
    return monthNames.map(m => ({ month: m, cases: months[m] || 0 }))
  }, [filteredCases])

  const stats = useMemo(() => {
    const peakHour = hourlyData.reduce((max, h) => h.count > max.count ? h : max, hourlyData[0])
    const topType = crimeTypeData[0]
    const topDistrict = districtData[0]
    const totalMonthly = monthlyData.reduce((s, m) => s + m.cases, 0)
    const avgMonthly = Math.round(totalMonthly / 12)
    return { peakHour: `${peakHour.hour}`, topType: topType?.name || 'N/A', topDistrict: topDistrict?.name || 'N/A', avgMonthly }
  }, [hourlyData, crimeTypeData, districtData, monthlyData])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="size-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-slate-300 tracking-[0.1em] uppercase">
            SCRB Statistical Cell — Crime Trend Report, FY 2024-25
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <LastSynced />
          {hasDateFilter && (
            <span className="text-xs text-emerald-400 font-medium">{filteredCases.length} cases in range</span>
          )}
          <button
            onClick={clearDateRange}
            className={`text-xs px-2 py-0.5 rounded transition-colors ${hasDateFilter ? 'text-amber-400 hover:bg-amber-500/10' : 'text-slate-600 hover:text-slate-400'}`}
          >
            {hasDateFilter ? 'Reset' : 'FY 2024-25'}
          </button>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Calendar className="size-3 text-slate-500" />
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateRange(e.target.value, dateTo)}
            className="h-7 px-2 text-xs bg-white/5 border border-white/10 rounded text-slate-300 outline-none focus:border-emerald-500/30 [color-scheme:dark]"
          />
          <span className="text-xs text-slate-600">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateRange(dateFrom, e.target.value)}
            className="h-7 px-2 text-xs bg-white/5 border border-white/10 rounded text-slate-300 outline-none focus:border-emerald-500/30 [color-scheme:dark]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Clock} label="Peak Offence Hour (IST)" value={stats.peakHour} color="bg-emerald-500/10" />
        <StatCard icon={ShieldAlert} label="Top IPC Offence" value={stats.topType} color="bg-emerald-500/10" />
        <StatCard icon={MapPin} label="Highest Volume District" value={stats.topDistrict} color="bg-emerald-500/10" />
        <StatCard icon={TrendingUp} label="Avg Monthly Registration" value={String(stats.avgMonthly)} color="bg-emerald-500/10" />
      </div>

      <div className="flex gap-1 mb-6">
        {SUBTABS.map((label, i) => (
          <button
            key={label}
            onClick={() => setActiveSub(i)}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-all ${
              activeSub === i ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-500 hover:text-emerald-300 hover:bg-emerald-500/5'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <motion.div key={activeSub} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {activeSub === 0 && (
          <div className="chart-container min-h-[250px]" role="region" aria-label="IPC Offence Classification chart">
            <h3 className="text-[13px] font-semibold text-slate-300 uppercase tracking-wider mb-4">IPC Offence Classification — Karnataka (All Districts)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={crimeTypeData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" name="Cases" radius={[0, 4, 4, 0]} barSize={20}>
                  {crimeTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeSub === 1 && (
          <div className="chart-container min-h-[250px]" role="region" aria-label="Crime Volume by District chart">
            <h3 className="text-[13px] font-semibold text-slate-300 uppercase tracking-wider mb-4">Crime Volume by District — Top 12 (FY 2024-25)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={districtData} margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} angle={-30} textAnchor="end" height={80} interval={0} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="total" name="Total" fill="#34d399" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="active" name="Active" fill="#6ee7b7" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="critical" name="Critical" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeSub === 2 && (
          <div className="chart-container min-h-[250px]" role="region" aria-label="Offence Frequency by Hour chart">
            <h3 className="text-[13px] font-semibold text-slate-300 uppercase tracking-wider mb-4">Offence Frequency by Hour of Day (IST) — Statewide</h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={hourlyData} margin={{ left: 10, right: 20 }}>
                <defs>
                  <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                    <stop offset="40%" stopColor="#34d399" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 12 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="Cases" stroke="#34d399" fill="url(#hourGrad)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeSub === 3 && (
          <div className="chart-container min-h-[250px]" role="region" aria-label="Monthly FIR Registration chart">
            <h3 className="text-[13px] font-semibold text-slate-300 uppercase tracking-wider mb-4">Monthly FIR Registration — FY 2024-25 (Apr–Mar)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlyData} margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} interval={0} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="cases" name="Cases" stroke="#34d399" strokeWidth={2.5} dot={{ fill: '#34d399', r: 3.5, strokeWidth: 0 }} activeDot={{ r: 7, fill: '#6ee7b7', stroke: '#34d399', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
        <span className="text-[9px] text-slate-600">Source: SCRB Crime Records Database — 10,000 case dataset, 90-day analysis window, Bengaluru</span>
        <span className="text-[9px] text-slate-600 tabular-nums">
          Report generated: {new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })} hrs
        </span>
      </div>
    </div>
  )
}