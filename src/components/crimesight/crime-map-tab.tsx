'use client'

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { geoMercator, geoPath, geoCentroid } from 'd3-geo'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, AlertTriangle, ChevronLeft, Building2, Navigation, MapPinned, Flame,
  Gavel, Radio, Users, Shield, TrendingUp, X
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCrimeSightStore, type TickerItem } from '@/lib/store'
import { DEMO_DISTRICTS, getDemoDistrictName } from '@/lib/demo-data'
import { getDistrictMapData, getGeneratedStats, getRecentCases, getCasesByDistrict } from '@/lib/case-generator'
import LastSynced from '@/components/crimesight/last-synced'
import karnatakaGeojson from '@/data/karnataka-geojson'
import type { GeoJsonProperties, Feature } from 'geojson'

/* ─── Types ─── */
interface DistrictData {
  id: string
  name: string
  totalCases: number
  activeCases: number
  criticalCases: number
  byType: Record<string, number>
  latitude: string
  longitude: string
}

interface AlertData {
  id: string
  fir: string
  district: string
  crimeType: string
  priority: string
  status: string
  date: string
}

interface DashboardStats {
  totalCases: number
  activeInvestigations: number
  arrests: number
  chargesheets: number
  districts: number
  officers: number
}

interface CaseLocation {
  fir: string
  place: string
  latitude: string
  longitude: string
  crimeType: string
  priority: string
  status: string
  date: string
}

interface PoliceStation {
  name: string
  type: string
  address: string
  latitude: string
  longitude: string
}

interface LocationCluster {
  area: string
  caseCount: number
  lat: string
  lng: string
  cases: string[]
}

interface DistrictDetail {
  district: string
  totalCases: number
  cases: CaseLocation[]
  policeStations: PoliceStation[]
  locationClusters: LocationCluster[]
}

/* ─── GeoJSON name -> DB name mapping ─── */
const GEOJSON_TO_DB: Record<string, string> = {
  'Bagalkot': 'Bagalkote',
  'Bangalore Rural': 'Bengaluru Rural',
  'Bangalore Urban': 'Bengaluru Urban',
  'Belgaum': 'Belagavi',
  'Bellary': 'Ballari',
  'Bijapur': 'Vijayapura',
  'Chamrajnagar': 'Chamarajanagar',
  'Chikmagalur': 'Chikkamagaluru',
  'Dakshin Kannad': 'Dakshina Kannada',
  'Gulbarga': 'Kalaburagi',
  'Mysore': 'Mysuru',
  'Shimoga': 'Shivamogga',
  'Tumkur': 'Tumakuru',
  'Uttar Kannand': 'Uttara Kannada',
  'Chikkaballapur': 'Chikkaballapur',
  'Chikballapur': 'Chikkaballapur',
  'Ramanagara': 'Ramanagara',
  'Yadgir': 'Yadgir',
  'Vijayanagara': 'Vijayanagara',
  // Already-modern names (no change needed)
  'Ballari': 'Ballari',
  'Belagavi': 'Belagavi',
  'Bengaluru Rural': 'Bengaluru Rural',
  'Bengaluru Urban': 'Bengaluru Urban',
  'Bidar': 'Bidar',
  'Chamarajanagar': 'Chamarajanagar',
  'Chikkamagaluru': 'Chikkamagaluru',
  'Chitradurga': 'Chitradurga',
  'Dakshina Kannada': 'Dakshina Kannada',
  'Davanagere': 'Davanagere',
  'Dharwad': 'Dharwad',
  'Gadag': 'Gadag',
  'Hassan': 'Hassan',
  'Haveri': 'Haveri',
  'Kalaburagi': 'Kalaburagi',
  'Kodagu': 'Kodagu',
  'Kolar': 'Kolar',
  'Koppal': 'Koppal',
  'Mandya': 'Mandya',
  'Mysuru': 'Mysuru',
  'Raichur': 'Raichur',
  'Shivamogga': 'Shivamogga',
  'Tumakuru': 'Tumakuru',
  'Udupi': 'Udupi',
  'Uttara Kannada': 'Uttara Kannada',
  'Vijayapura': 'Vijayapura',
}

/* A few compact districts sit close together. These offsets keep desktop labels
   readable while the map hides non-selected labels on narrow screens. */
const DISTRICT_LABEL_OFFSETS: Record<string, { x: number; y: number }> = {
  'Vijayanagara': { x: 0, y: -8 },
  'Davanagere': { x: -15, y: 15 },
  'Gadag': { x: -13, y: 8 },
  'Haveri': { x: -15, y: 2 },
  'Bengaluru Urban': { x: 17, y: 14 },
  'Bengaluru Rural': { x: 22, y: -9 },
  'Ramanagara': { x: -10, y: 18 },
  'Chikkaballapur': { x: 16, y: -2 },
  'Kolar': { x: 13, y: 12 },
  'Mandya': { x: -10, y: -8 },
  'Chamarajanagar': { x: 9, y: 13 },
}

const COMPACT_DISTRICT_LABELS: Record<string, string> = {
  'Bengaluru Urban': 'Bengaluru U.',
  'Bengaluru Rural': 'Bengaluru R.',
  'Chikkamagaluru': 'Chikkamagaluru',
  'Dakshina Kannada': 'D. Kannada',
  'Uttara Kannada': 'U. Kannada',
}

/* ─── Color helpers ─── */
function getCaseColor(totalCases: number, p33: number, p66: number): string {
  if (totalCases <= p33) return '#22c55e'
  if (totalCases <= p66) return '#eab308'
  return '#ef4444'
}

function getCaseColorHover(totalCases: number, p33: number, p66: number): string {
  if (totalCases <= p33) return '#4ade80'
  if (totalCases <= p66) return '#facc15'
  return '#f87171'
}

function getPriorityColor(priority: string): string {
  if (priority === 'Critical') return '#ef4444'
  if (priority === 'High') return '#f97316'
  if (priority === 'Medium') return '#eab308'
  return '#22c55e'
}

const PRIORITY_DOT: Record<string, string> = {
  Critical: 'bg-red-500', High: 'bg-amber-500', Medium: 'bg-yellow-500', Low: 'bg-slate-500',
}

const PRIORITY_BORDER: Record<string, string> = {
  Critical: 'border-l-red-500', High: 'border-l-amber-500', Medium: 'border-l-yellow-500', Low: 'border-l-slate-500',
}

function formatDemoTimestamp(dateStr: string): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return dateStr
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

/* ─── Component ─── */
export default function CrimeMapTab() {
  const [mapStats, setMapStats] = useState<DistrictData[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [alerts, setAlerts] = useState<AlertData[]>([])
  // Pre-populate with Bengaluru Urban so sidebar is never empty (data from 10K generator)
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(() => {
    const districts = getDistrictMapData()
    const blr = districts.find(d => d.name === 'Bengaluru Urban')
    return blr ? { id: 'bangalore-urban', name: blr.name, totalCases: blr.totalCases, activeCases: blr.activeCases, criticalCases: blr.criticalCases, byType: blr.byType, latitude: String(blr.latitude), longitude: String(blr.longitude) } : null
  })
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; name: string; cases: number; activeCases: number; criticalCases: number; topCrime: string } | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [svgDimensions, setSvgDimensions] = useState({ width: 800, height: 600 })

  // Drill-down state
  const [drillDown, setDrillDown] = useState<DistrictDetail | null>(null)
  const [drillLoading, setDrillLoading] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)
  const [activeCluster, setActiveCluster] = useState<LocationCluster | null>(null)

  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const {
    selectedDistrict: storeSelectedDistrict,
    setSelectedDistrict: storeSetSelectedDistrict,
    navigateToDistrictCases,
  } = useCrimeSightStore()

  // Respond to cross-tab district navigation
  useEffect(() => {
    if (storeSelectedDistrict && mapStats.length > 0) {
      const districtName = getDemoDistrictName(storeSelectedDistrict)
      // Find the matching GeoJSON name
      const geoName = Object.entries(GEOJSON_TO_DB).find(([_, db]) => db === districtName)?.[0] || districtName
      const match = mapStats.find(d => d.name === geoName || d.name === districtName)
      if (match) {
        setSelectedDistrict(match)
        setDrillDown(null)
        setDrillLoading(false)
        setSelectedFeature(null)
      }
      storeSetSelectedDistrict(null)
    }
  }, [storeSelectedDistrict, mapStats, storeSetSelectedDistrict])

  /* ─── Lookup: DB name -> DistrictData ─── */
  const districtDataMap = useMemo(() => {
    const map: Record<string, DistrictData> = {}
    mapStats.forEach(d => { map[d.name] = d })
    return map
  }, [mapStats])

  /* ─── Percentile thresholds ─── */
  const { p33, p66 } = useMemo(() => {
    const sorted = mapStats.map(d => d.totalCases).sort((a, b) => a - b)
    return {
      p33: sorted[Math.floor(sorted.length * 0.33)] ?? 0,
      p66: sorted[Math.floor(sorted.length * 0.66)] ?? 1,
    }
  }, [mapStats])

  /* ─── Stat cards ─── */
  const statCards = useMemo(() => {
    const s = dashboardStats
    if (!s) return []
    return [
      { label: 'Registered FIRs', value: s.totalCases, icon: Gavel, color: 'text-red-400' },
      { label: 'Active Investigations', value: s.activeInvestigations, icon: Radio, color: 'text-amber-400' },
      { label: 'Arrests Made', value: s.arrests, icon: Shield, color: 'text-emerald-400' },
      { label: 'Chargesheets', value: s.chargesheets, icon: Users, color: 'text-cyan-400' },
    ]
  }, [dashboardStats])

  /* ─── Use 10K generated data directly ─── */
  useEffect(() => {
    const genDistricts = getDistrictMapData().map(d => ({
      id: d.name.toLowerCase().replace(/\s+/g, '-'),
      name: d.name,
      totalCases: d.totalCases,
      activeCases: d.activeCases,
      criticalCases: d.criticalCases,
      byType: d.byType,
      latitude: String(d.latitude),
      longitude: String(d.longitude),
    }))
    setMapStats(genDistricts)

    // Wire dashboard stats from 10K generator
    const stats = getGeneratedStats()
    setDashboardStats({
      totalCases: stats.totalCases,
      activeInvestigations: stats.activeInvestigations,
      arrests: stats.arrests,
      chargesheets: stats.chargesheets,
      districts: stats.districts,
      officers: stats.officers,
    })

    // Wire alerts from recent high-priority cases
    const recentAlerts = getRecentCases(30)
      .filter(c => c.priority === 'Critical' || c.priority === 'High')
      .slice(0, 15)
      .map(c => ({
        id: c.rowid,
        fir: c.fir,
        district: c.district,
        crimeType: c.crimeType,
        priority: c.priority,
        status: c.status,
        date: c.occurrenceDate,
      }))
    setAlerts(recentAlerts)

    // Pre-populate with highest-crime district
    const top = [...genDistricts].sort((a, b) => b.totalCases - a.totalCases)[0]
    if (top) setSelectedDistrict(top)
  }, [])

  /* ─── Resize observer ─── */
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) setSvgDimensions({ width: Math.floor(width), height: Math.floor(height) })
      }
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  /* ─── D3 projection ─── */
  const { projection, pathGenerator } = useMemo(() => {
    const fitTarget = drillDown && selectedFeature
      ? { type: 'FeatureCollection' as const, features: [selectedFeature] }
      : karnatakaGeojson
    const padding = drillDown ? 40 : 20
    const proj = geoMercator().fitExtent([[padding, padding], [svgDimensions.width - padding, svgDimensions.height - padding]], fitTarget)
    return { projection: proj, pathGenerator: geoPath().projection(proj) }
  }, [svgDimensions, drillDown, selectedFeature])

  /* ─── Handle district click ─── */
  const handleDistrictClick = useCallback(async (geoName: string, feature: Feature) => {
    const dbName = GEOJSON_TO_DB[geoName] || geoName
    const data = districtDataMap[dbName]
    setSelectedDistrict(data ?? { id: geoName, name: dbName, totalCases: 0, activeCases: 0, criticalCases: 0, byType: {}, latitude: '', longitude: '' })
    setSelectedFeature(feature)
    setActiveCluster(null)
    setDrillLoading(true)
    try {
      // Use local 10K data instead of missing API
      const districtCases = getCasesByDistrict(dbName)
      if (districtCases.length === 0) { setDrillDown(null); return }

      // Build location clusters from cases (group by area name)
      const areaMap: Record<string, CaseLocation[]> = {}
      for (const c of districtCases) {
        const area = c.place.split(',')[1]?.trim() || c.place
        if (!areaMap[area]) areaMap[area] = []
        areaMap[area].push({
          fir: c.fir, place: c.place,
          latitude: String(c.latitude), longitude: String(c.longitude),
          crimeType: c.crimeType, priority: c.priority, status: c.status, date: c.occurrenceDate,
        })
      }
      const locationClusters: LocationCluster[] = Object.entries(areaMap)
        .map(([area, cases]) => ({
          area,
          caseCount: cases.length,
          lat: String(cases[0].latitude),
          lng: String(cases[0].longitude),
          cases: cases.map(c => c.fir),
        }))
        .sort((a, b) => b.caseCount - a.caseCount)
        .slice(0, 12)

      // Build police stations from the district data in case-generator
      const DISTRICT_PS: Record<string, { name: string; address: string; lat: number; lng: number }[]> = {
        'Bengaluru Urban': [
          { name: 'MG Road PS', address: 'MG Road, Bengaluru', lat: 12.9757, lng: 77.6063 },
          { name: 'Whitefield PS', address: 'Whitefield, Bengaluru', lat: 12.9698, lng: 77.7500 },
          { name: 'Koramangala PS', address: 'Koramangala, Bengaluru', lat: 12.9352, lng: 77.6245 },
          { name: 'Jayanagar PS', address: 'Jayanagar, Bengaluru', lat: 12.9250, lng: 77.5838 },
          { name: 'Rajajinagar PS', address: 'Rajajinagar, Bengaluru', lat: 12.9870, lng: 77.5533 },
        ],
      }
      const psList = DISTRICT_PS[dbName] || [{ name: `${dbName} City PS`, address: `${dbName}, Karnataka`, lat: data?.latitude ? parseFloat(data.latitude) : 12.97, lng: data?.longitude ? parseFloat(data.longitude) : 77.59 }]
      const policeStations: PoliceStation[] = psList.map(ps => ({
        name: ps.name, type: 'City', address: ps.address,
        latitude: String(ps.lat), longitude: String(ps.lng),
      }))

      const caseLocations: CaseLocation[] = districtCases.slice(0, 200).map(c => ({
        fir: c.fir, place: c.place,
        latitude: String(c.latitude), longitude: String(c.longitude),
        crimeType: c.crimeType, priority: c.priority, status: c.status, date: c.occurrenceDate,
      }))

      setDrillDown({
        district: dbName,
        totalCases: districtCases.length,
        cases: caseLocations,
        policeStations,
        locationClusters,
      })
    } catch { setDrillDown(null) } finally { setDrillLoading(false) }
  }, [districtDataMap])

  const handleBackToMap = useCallback(() => {
    setDrillDown(null); setSelectedFeature(null); setActiveCluster(null)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGPathElement>, name: string, cases: number, activeCases: number, criticalCases: number, topCrime: string) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, name, cases, activeCases, criticalCases, topCrime })
  }, [])

  const handleMouseLeave = useCallback(() => { setTooltipPos(null); setHoveredDistrict(null) }, [])

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col gap-6 min-h-0">
      {/* ── Section Label ── */}
      <div className="flex items-center gap-2.5">
        <MapPinned className="size-4 text-emerald-400" />
        <h2 className="text-[13px] font-semibold text-slate-300 tracking-[0.12em] uppercase">
          Geo Intelligence — Karnataka District Mapping
        </h2>
        <Badge className="h-5 px-2 text-[9px] font-bold tracking-wider bg-emerald-500/15 text-emerald-400 border-emerald-500/30 flex items-center gap-1.5">
          <Radio className="size-2.5" />
          LIVE
        </Badge>
        <span className="text-[10px] text-slate-600 ml-auto tabular-nums">
          {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
        <LastSynced />
      </div>
      {/* ── 1. Top Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-5 flex items-center gap-3 animate-pulse">
                <div className="w-5 h-5 bg-white/5 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/5 rounded w-16" />
                  <div className="h-5 bg-white/5 rounded w-12" />
                </div>
              </div>
            ))
          : statCards.map((card, i) => {
              const Icon = card.icon
              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3 }}
                  className="glass-card p-5 flex items-center gap-3 hover:border-white/[0.12] transition-colors"
                >
                  <div className={`${card.color} opacity-80`}><Icon className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{card.label}</p>
                    <p className="text-[24px] font-bold text-white tabular-nums leading-none">{card.value?.toLocaleString('en-IN')}</p>
                  </div>
                </motion.div>
              )
            })
        }
      </div>

      {/* ── 2. Map + Right Sidebar ── */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">

        {/* ── MAP ── */}
        <div className="glass-card flex-1 min-h-[300px] lg:min-h-[500px] relative overflow-hidden hidden md:block">
          {/* Header bar inside map */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2.5 bg-gradient-to-b from-[#111118] via-[#111118]/90 to-transparent pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
              {drillDown && (
                <button onClick={handleBackToMap} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors bg-black/50 backdrop-blur-sm px-2.5 py-1.5 rounded-md border border-white/[0.08]">
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>
              )}
              <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1.5 rounded-md border border-white/[0.08]">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-medium text-white">
                  {drillDown ? drillDown.district + ' — Crime Locations & FIR Mapping' : 'Karnataka — District Crime Choropleth'}
                </span>
                {drillDown && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">{drillDown.totalCases} cases</Badge>}
              </div>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3 pointer-events-auto bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-md border border-white/[0.08]">
              {!drillDown ? (
                <>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#22c55e' }} /><span className="text-[10px] text-slate-400">Low</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#eab308' }} /><span className="text-[10px] text-slate-400">Moderate</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#ef4444' }} /><span className="text-[10px] text-slate-400">High</span></div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5"><Flame className="w-3 h-3 text-red-400" /><span className="text-[10px] text-slate-400">Case</span></div>
                  <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3 text-blue-400" /><span className="text-[10px] text-slate-400">Station</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border-2 border-amber-400 bg-amber-400/20" /><span className="text-[10px] text-slate-400">Cluster</span></div>
                </>
              )}
            </div>
          </div>

          {/* SVG Map */}
          <div ref={containerRef} className="w-full h-full" onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}>
            <svg ref={svgRef} width={svgDimensions.width} height={svgDimensions.height} viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`} className="w-full h-full" role="img">
              <title>Karnataka District Crime Map</title>
              {pathGenerator && projection && karnatakaGeojson.features.map((feature, i) => {
                const geoName = (feature.properties as GeoJsonProperties)?.NAME_2 as string
                const dbName = GEOJSON_TO_DB[geoName] || geoName
                const data = districtDataMap[dbName]
                const cases = data?.totalCases ?? 0
                const isHovered = hoveredDistrict === geoName
                const isSelected = selectedDistrict?.name === dbName
                const isDimmed = drillDown && selectedFeature && !isSelected
                const topCrime = data?.byType ? Object.entries(data.byType).sort(([, a], [, b]) => b - a)[0]?.[0] ?? '—' : '—'
                const fill = isDimmed ? 'rgba(17,17,24,0.85)' : isHovered ? getCaseColorHover(cases, p33, p66) : getCaseColor(cases, p33, p66)
                const strokeColor = isSelected ? 'rgba(52,211,153,0.8)' : isHovered ? 'rgba(255,255,255,0.55)' : drillDown && !isDimmed ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'
                const strokeWidth = isSelected ? 2.5 : isHovered ? 1.5 : drillDown && !isDimmed ? 1 : 0.5
                const centroid = geoCentroid(feature)
                const [cx, cy] = projection(centroid) ?? [0, 0]
                const labelOffset = DISTRICT_LABEL_OFFSETS[dbName] ?? { x: 0, y: 0 }
                const showLabel = svgDimensions.width >= 880 || isSelected || isHovered
                const label = svgDimensions.width < 1040 ? (COMPACT_DISTRICT_LABELS[dbName] ?? dbName) : dbName
                return (
                  <g key={`${geoName}-${i}`}>
                    <path d={pathGenerator(feature) || ''} fill={fill} stroke={strokeColor} strokeWidth={strokeWidth} className="cursor-pointer transition-all duration-150"
                      role="button"
                      tabIndex={0}
                      aria-label={`${dbName}: ${cases} cases`}
                      onMouseEnter={() => !drillDown && setHoveredDistrict(geoName)}
                      onMouseMove={(e) => !drillDown && handleMouseMove(e, dbName, cases, data?.activeCases ?? 0, data?.criticalCases ?? 0, topCrime)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => !drillDown && handleDistrictClick(geoName, feature)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDistrictClick(geoName, feature) } }}
                    />
                    {showLabel && <text x={cx + labelOffset.x} y={cy + labelOffset.y} textAnchor="middle" dominantBaseline="central" className="pointer-events-none select-none"
                      fill={isDimmed ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'} fontSize={drillDown && isDimmed ? 7 : 8} fontWeight={isSelected ? 700 : 500}
                      style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{label}</text>}
                    {cases > 0 && !isDimmed && showLabel && (
                      <text x={cx + labelOffset.x} y={cy + labelOffset.y + 12} textAnchor="middle" dominantBaseline="central" className="pointer-events-none select-none"
                        fill="rgba(255,255,255,0.5)" fontSize={7} fontWeight={600}>{cases}</text>
                    )}
                  </g>
                )
              })}

              {/* Drill-down markers */}
              {drillDown && projection && (
                <>
                  {drillDown.locationClusters.map((cluster) => {
                    const [cx, cy] = projection([parseFloat(cluster.lng), parseFloat(cluster.lat)]) ?? [0, 0]
                    const isActive = activeCluster?.area === cluster.area
                    return (
                      <g key={cluster.area} className="cursor-pointer" onClick={() => setActiveCluster(isActive ? null : cluster)}>
                        <circle cx={cx} cy={cy} r={isActive ? 16 : 10 + Math.min(cluster.caseCount, 10)} fill={isActive ? 'rgba(234,179,8,0.15)' : 'rgba(234,179,8,0.08)'} stroke={isActive ? '#eab308' : 'rgba(234,179,8,0.4)'} strokeWidth={isActive ? 2 : 1} className="transition-all duration-200" />
                        <circle cx={cx} cy={cy} r={isActive ? 5 : 3} fill="#eab308" className="transition-all duration-200" />
                        <text x={cx} y={cy + (isActive ? 24 : 18)} textAnchor="middle" fill={isActive ? '#facc15' : 'rgba(255,255,255,0.6)'} fontSize={isActive ? 10 : 8} fontWeight={isActive ? 700 : 500} style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }} className="pointer-events-none">{cluster.area}</text>
                        <text x={cx} y={cy + (isActive ? 34 : 26)} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={7} className="pointer-events-none">{cluster.caseCount} cases</text>
                      </g>
                    )
                  })}
                  {drillDown.cases.map((c) => {
                    const lat = parseFloat(c.latitude); const lng = parseFloat(c.longitude)
                    if (isNaN(lat) || isNaN(lng)) return null
                    const [cx, cy] = projection([lng, lat]) ?? [0, 0]
                    const color = getPriorityColor(c.priority)
                    const isHighlighted = activeCluster?.cases.includes(c.fir)
                    return (
                      <g key={c.fir} className="pointer-events-none">
                        <circle cx={cx} cy={cy} r={isHighlighted ? 5 : 3} fill={color} opacity={isHighlighted ? 1 : 0.7}>
                          <animate attributeName="r" values={`${isHighlighted ? 4 : 2};${isHighlighted ? 6 : 4};${isHighlighted ? 4 : 2}`} dur="2s" repeatCount="indefinite" />
                        </circle>
                        {c.priority === 'Critical' && (
                          <circle cx={cx} cy={cy} r={3} fill="none" stroke={color} strokeWidth={0.5} opacity={0.6}>
                            <animate attributeName="r" values="3;10;3" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                          </circle>
                        )}
                      </g>
                    )
                  })}
                  {drillDown.policeStations.map((s) => {
                    const lat = parseFloat(s.latitude); const lng = parseFloat(s.longitude)
                    if (isNaN(lat) || isNaN(lng)) return null
                    const [cx, cy] = projection([lng, lat]) ?? [0, 0]
                    return (
                      <g key={s.name} className="pointer-events-none">
                        <rect x={cx - 5} y={cy - 6} width={10} height={12} rx={2} fill="#3b82f6" stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
                        <text x={cx} y={cy - 1} textAnchor="middle" fill="white" fontSize={7} fontWeight={700}>★</text>
                      </g>
                    )
                  })}
                </>
              )}

              {/* SVG Tooltip removed — replaced by DOM tooltip below */}
            </svg>
          </div>

          {/* Loading overlay */}
          {drillLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#111118]/80 z-20">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                Loading district data…
              </div>
            </div>
          )}

          {/* ── Drill-Down Panel Overlay ── */}
          <AnimatePresence>
            {drillDown && selectedDistrict && (
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="absolute top-14 right-3 bottom-3 w-80 z-30 bg-[#0c1120]/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
              >
                {/* Panel Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{selectedDistrict.name}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Showing FIRs mapped to {drillDown.district} · {drillDown.totalCases} total cases</p>
                  </div>
                  <button onClick={handleBackToMap} className="p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors text-slate-400 hover:text-white shrink-0 ml-2" aria-label="Close drill-down panel">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="px-3 pt-3 shrink-0">
                  <button
                    onClick={() => navigateToDistrictCases(drillDown.district)}
                    className="w-full rounded-lg border border-emerald-500/25 bg-emerald-500/[0.08] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 transition-colors hover:bg-emerald-500/[0.15]"
                  >
                    View all {drillDown.totalCases} FIRs in {drillDown.district}
                  </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-2 p-3 shrink-0">
                  <div className="bg-white/[0.03] rounded-lg p-2.5">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">Total FIRs</p>
                    <p className="text-lg font-bold text-white leading-tight mt-0.5">{selectedDistrict.totalCases.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-2.5">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">Active</p>
                    <p className="text-lg font-bold text-amber-400 leading-tight mt-0.5">{selectedDistrict.activeCases.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-2.5">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">Critical</p>
                    <p className="text-lg font-bold text-red-400 leading-tight mt-0.5">{selectedDistrict.criticalCases.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-2.5">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">Closed</p>
                    <p className="text-lg font-bold text-emerald-400 leading-tight mt-0.5">{(selectedDistrict.totalCases - selectedDistrict.activeCases).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Top 5 Crime Types — Mini Bar Chart */}
                {selectedDistrict.byType && Object.keys(selectedDistrict.byType).length > 0 && (
                  <div className="px-3 pb-2 shrink-0">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Top Crime Types</p>
                    <div className="space-y-1.5">
                      {Object.entries(selectedDistrict.byType)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([type, count]) => {
                          const maxCount = Math.max(...Object.values(selectedDistrict.byType)) || 1
                          const pct = (count / maxCount) * 100
                          return (
                            <div key={type}>
                              <div className="flex justify-between text-[11px] mb-0.5">
                                <span className="text-slate-300 truncate mr-2">{type}</span>
                                <span className="text-slate-400 shrink-0 tabular-nums">{count}</span>
                              </div>
                              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                                <motion.div className="h-full rounded-full" style={{ background: pct > 60 ? '#ef4444' : pct > 30 ? '#eab308' : '#22c55e' }}
                                  initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* Recent 5 Cases */}
                <div className="flex-1 min-h-0 border-t border-white/[0.06] px-3 pt-2 pb-3 flex flex-col">
                  <div className="mb-2 flex items-center justify-between gap-2 shrink-0">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Latest FIRs in {drillDown.district}</p>
                    <span className="text-[9px] text-slate-600">5 of {drillDown.totalCases}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 min-h-0">
                    {drillDown.cases.slice(0, 5).map(c => (
                      <div key={c.fir} className="bg-white/[0.02] rounded-lg px-2.5 py-2 border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-mono text-slate-200 truncate">{c.fir}</span>
                          <Badge className={`h-3.5 px-1 text-[8px] border shrink-0 ${PRIORITY_DOT[c.priority] === 'bg-red-500' ? 'bg-red-500/15 text-red-400 border-red-500/30' : PRIORITY_DOT[c.priority] === 'bg-amber-500' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}>
                            {c.priority}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{c.crimeType} · {c.place}</div>
                        <div className="text-[9px] text-slate-600 mt-0.5">{formatDemoTimestamp(c.date)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Drill-down: Crime Hotspots (bottom-left overlay) */}
          {drillDown && (
            <div className="absolute bottom-3 left-3 z-10 w-72 max-h-48 bg-black/60 backdrop-blur-sm rounded-lg border border-white/[0.08] p-3 flex flex-col">
              <div className="flex items-center gap-2 mb-2 shrink-0">
                <MapPinned className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-white">Identified Hotspots</span>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 ml-auto">{drillDown.locationClusters.length} areas</Badge>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 min-h-0">
                {drillDown.locationClusters.map((cluster) => {
                  const isActive = activeCluster?.area === cluster.area
                  return (
                    <div key={cluster.area} onClick={() => setActiveCluster(isActive ? null : cluster)}
                      className={`px-2 py-1.5 rounded cursor-pointer text-[11px] transition-all ${isActive ? 'bg-amber-500/15 border border-amber-500/30' : 'hover:bg-white/[0.05] border border-transparent'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium truncate">{cluster.area}</span>
                        <Badge variant={cluster.caseCount > 5 ? 'destructive' : 'secondary'} className="text-[9px] px-1 py-0 shrink-0">{cluster.caseCount}</Badge>
                      </div>
                      {isActive && (
                        <div className="mt-1.5 space-y-0.5 border-t border-white/[0.06] pt-1.5">
                          {drillDown.cases.filter(c => cluster.cases.includes(c.fir)).map(c => (
                            <div key={c.fir} className="flex items-center gap-1.5">
                              <Navigation className="w-2.5 h-2.5 shrink-0" style={{ color: getPriorityColor(c.priority) }} />
                              <span className="text-slate-300 truncate">{c.place}</span>
                              <span className="text-slate-600 shrink-0">{c.crimeType}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Mobile-only: Ranked District List */}
        <div className="md:hidden glass-card p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
          <h3 className="text-[13px] font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <MapPin className="size-3.5 text-emerald-400" />
            Districts by Crime Volume
          </h3>
          <div className="space-y-1.5">
            {mapStats
              .filter(d => d.totalCases > 0)
              .sort((a, b) => b.totalCases - a.totalCases)
              .map((d, i) => {
                const maxCases = Math.max(...mapStats.filter(x => x.totalCases > 0).map(x => x.totalCases), 1)
                const pct = (d.totalCases / maxCases) * 100
                const barColor = pct > 66 ? '#ef4444' : pct > 33 ? '#eab308' : '#22c55e'
                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelectedDistrict(d)
                      setHoveredDistrict(null)
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                      selectedDistrict?.name === d.name
                        ? 'bg-emerald-500/10 border-emerald-500/25'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-bold text-slate-600 tabular-nums w-5">{i + 1}</span>
                        <span className="text-[12px] font-medium text-slate-200 truncate">{d.name}</span>
                      </div>
                      <span className="text-[12px] font-bold text-white tabular-nums shrink-0 ml-2">{d.totalCases.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] text-amber-400">{d.activeCases} active</span>
                      <span className="text-[9px] text-red-400">{d.criticalCases} critical</span>
                    </div>
                  </button>
                )
              })}
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-6 lg:max-h-[600px] overflow-y-auto custom-scrollbar">

          {/* Panel 1: District Overview / District Intelligence */}
          <div className="glass-card p-5">
            <h3 className="text-[13px] font-semibold text-white mb-3 flex items-center gap-2 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-emerald-500" />
              {drillDown ? 'District Intelligence' : 'District Overview'}
            </h3>

            <AnimatePresence mode="wait">
              {selectedDistrict ? (
                <motion.div key={selectedDistrict.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                  <h4 className="text-xl font-bold text-white">{selectedDistrict.name}</h4>

                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="bg-white/[0.03] rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Registered FIRs</p>
                      <p className="text-[24px] font-bold text-white leading-none">{selectedDistrict.totalCases}</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Open Investigations</p>
                      <p className="text-[24px] font-bold text-amber-400 leading-none">{selectedDistrict.activeCases}</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">High-Priority FIRs</p>
                      <p className="text-[24px] font-bold text-red-400 leading-none">{selectedDistrict.criticalCases}</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Resolved</p>
                      <p className="text-[24px] font-bold text-emerald-400 leading-none">{selectedDistrict.totalCases - selectedDistrict.activeCases}</p>
                    </div>
                  </div>

                  {/* Crime type breakdown */}
                  {selectedDistrict.byType && Object.keys(selectedDistrict.byType).length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Offence Classification</p>
                      <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                        {Object.entries(selectedDistrict.byType).sort(([, a], [, b]) => b - a).slice(0, 6).map(([type, count]) => {
                          const pct = selectedDistrict.totalCases > 0 ? (count / selectedDistrict.totalCases) * 100 : 0
                          return (
                            <div key={type}>
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="text-slate-300 truncate mr-2">{type}</span>
                                <span className="text-slate-400 shrink-0">{count}</span>
                              </div>
                              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                                <motion.div className="h-full rounded-full" style={{ background: pct > 30 ? '#ef4444' : pct > 15 ? '#eab308' : '#22c55e' }}
                                  initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-slate-500 py-8 text-center flex flex-col items-center gap-2">
                  <MapPin className="w-8 h-8 text-slate-700" />
                  <p>Select a district for crime statistics and FIR breakdown</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Panel 2: Threat Alerts */}
          <div className="glass-card flex-1 min-h-0 flex flex-col">
            <div className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-2 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[13px] font-semibold text-slate-300 uppercase tracking-wider">Threat Alerts</span>
              <Badge className="ml-auto h-4 px-1.5 text-[9px] font-bold bg-red-500/15 text-red-400 border-red-500/30">
                {alerts.length}
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                  <AlertTriangle className="w-5 mb-2 opacity-40" />
                  <p className="text-[11px]">No pending alerts</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.03]">
                  {alerts.map((alert, idx) => (
                    <motion.div
                      key={`${alert.id}-${idx}`}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + idx * 0.04, duration: 0.25 }}
                      className="px-4 py-3 hover:bg-white/[0.015] transition-colors border-l-2 ${PRIORITY_BORDER[alert.priority] || PRIORITY_BORDER.Low}"
                    >
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-[11px] font-mono font-medium text-slate-200">{alert.fir}</span>
                        <Badge className={`h-4 px-1.5 text-[9px] font-semibold border ${PRIORITY_DOT[alert.priority] === 'bg-red-500' ? 'bg-red-500/15 text-red-400 border-red-500/30' : PRIORITY_DOT[alert.priority] === 'bg-amber-500' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : PRIORITY_DOT[alert.priority] === 'bg-yellow-500' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' : 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}>
                          {alert.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <span>{alert.crimeType}</span>
                        <span className="text-slate-700">·</span>
                        <span className="flex items-center gap-0.5"><MapPin className="size-2.5" />{alert.district}</span>
                        <span className="text-slate-700 ml-auto shrink-0">{formatDemoTimestamp(alert.date)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      {/* ── DOM Hover Tooltip ── */}
      {tooltipPos && !drillDown && (
        <div
          ref={tooltipRef}
          className="fixed z-50 pointer-events-none rounded-lg shadow-xl border border-white/10 px-4 py-3 text-sm max-w-[260px]"
          style={{
            left: mousePos.x + 16,
            top: mousePos.y - 10,
            background: 'rgba(12, 17, 32, 0.96)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <p className="text-white font-semibold text-[13px] leading-tight">{tooltipPos.name}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-300">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white/40 inline-block" />{tooltipPos.cases} total</span>
            <span className="text-amber-400">{tooltipPos.activeCases} active</span>
            <span className="text-red-400">{tooltipPos.criticalCases} critical</span>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-white/[0.06]">
            <span className="text-[10px] text-slate-500">Top crime: </span>
            <span className="text-[10px] text-emerald-400 font-medium">{tooltipPos.topCrime}</span>
          </div>
          <p className="text-[9px] text-slate-600 mt-1.5">Click to drill down →</p>
        </div>
      )}

      {/* Data Source Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
        <span className="text-[9px] text-slate-600">Synthetic prototype data — modeled on supplied KSP ER schema</span>
        <span className="text-[9px] text-slate-600 tabular-nums">
          Map data: {new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })} hrs
        </span>
      </div>
      </div>
    </div>
  )
}
