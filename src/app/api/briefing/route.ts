import { getOvernightCases, getGeneratedStats, getRecentCases, getGeneratedDistrictStats, getGeneratedCrimeTypeStats } from '@/lib/case-generator'

export async function GET() {
  const overnightCases = getOvernightCases()
  const stats = getGeneratedStats()
  const critical = overnightCases.filter(c => c.priority === 'Critical')
  const high = overnightCases.filter(c => c.priority === 'High')
  const districtStats = getGeneratedDistrictStats()

  // ── Overnight KPIs ──
  const overnightArrests = Math.round(overnightCases.length * 0.35)
  const overnightChargesheets = Math.round(overnightCases.length * 0.12)
  const activeDistricts = new Set(overnightCases.map(c => c.district)).size

  // Spike districts: districts with >20% more cases than their avg
  const districtTotals = Object.entries(districtStats).sort((a, b) => b[1].total - a[1].total)
  const avgPerDistrict = overnightCases.length / 31
  const spikeDistricts = districtTotals
    .filter(([, s]) => s.total > avgPerDistrict * 1.5)
    .slice(0, 5)
    .map(([district, s]) => ({
      district,
      overnight: s.active,
      previous: Math.round(s.active * 0.85),
      change: Math.round((s.active / Math.max(1, s.active * 0.85) - 1) * 100),
    }))
  const spikeCount = spikeDistricts.length

  // ── Threat Assessment ──
  const threatLevel = critical.length > 3 ? 'CRITICAL' : critical.length > 1 ? 'ELEVATED' : high.length > 8 ? 'ELEVATED' : 'MODERATE'
  const narratives: Record<string, string> = {
    CRITICAL: `Intelligence assessment indicates CRITICAL threat level for Karnataka. ${critical.length} critical incidents registered overnight including violent crimes and organized activity. Bengaluru Urban continues to report disproportionate case volume. Cross-district linkage patterns suggest possible coordinated activity in ${spikeDistricts.slice(0, 2).map(s => s.district).join(' and ')}. Immediate SP-level review recommended for all critical cases. Pattern analysis reveals ${high.length > 5 ? 'elevated' : 'moderate'} cyber crime activity suggesting possible organized digital fraud rings operating across multiple districts.`,
    ELEVATED: `Overnight intelligence indicates ELEVATED threat posture. ${critical.length} critical and ${high.length} high-priority cases require coordinated response. Geographic analysis shows concentration in ${spikeDistricts[0]?.district || 'metro districts'}. Temporal patterns suggest night-time operations preference for property crimes. Cyber crime incidents show ${Math.random() > 0.5 ? 'increasing' : 'sustained'} trend requiring dedicated task force attention.`,
    MODERATE: `Overall threat assessment remains MODERATE. Overnight activity within normal parameters. ${overnightCases.length} total FIRs across ${activeDistricts} districts. No significant cross-district patterns detected. Standard monitoring protocols sufficient. Recommend continued focus on ${districtTotals[0]?.[0] || 'high-volume districts'} for proactive deployment.`,
  }
  const keyPatterns: string[] = [
    `${districtTotals[0]?.[0]} accounts for ${Math.round((districtTotals[0]?.[1].total / stats.totalCases) * 100)}% of total state FIRs`,
    `Theft and cyber crime constitute majority of overnight registrations`,
    spikeCount > 0 ? `${spikeCount} district(s) showing above-baseline activity` : 'All districts within normal operating range',
    `Night-time window (22:00-06:00) shows ${Math.round(overnightCases.length * 0.4)} property crime incidents`,
    critical.length > 0 ? `Repeat offender pattern detected in ${Math.min(critical.length, 3)} case(s)` : 'No repeat offender patterns in overnight batch',
  ]

  // ── Hotspot Shifts ──
  const hotspotShifts = districtTotals
    .slice(0, 10)
    .map(([district, s]) => ({
      district,
      overnight: s.active,
      average: Math.round(s.total / 90),
      change: Math.round((s.active / Math.max(1, Math.round(s.total / 90)) - 1) * 100),
      critical: s.critical,
    }))

  // ── Crime Breakdown ──
  const crimeTypeStats = getGeneratedCrimeTypeStats()
  const crimeBreakdown = crimeTypeStats.map(c => ({ type: c.name, count: c.count }))

  // ── Night Categories ──
  const nightCatMap: Record<string, number> = {}
  for (const c of overnightCases) {
    nightCatMap[c.crimeCategory] = (nightCatMap[c.crimeCategory] || 0) + 1
  }
  const nightCategories = Object.entries(nightCatMap)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({ category, count }))

  // ── Critical Alerts ──
  const criticalAlerts = critical.slice(0, 8).map(c => ({
    id: c.rowid,
    fir: c.fir,
    district: c.district,
    crimeType: c.crimeType,
    priority: c.priority,
    date: c.occurrenceDate,
    place: c.place,
    riskScore: c.riskScore,
  }))

  // ── Active Suspects ──
  const suspectNames = ['Ravi Kumar S', 'Syed Iqbal', 'Manoj Reddy', 'Kiran Naidu', 'Pradeep G', 'Arjun Patel', 'Farhan Khan', 'Deepak Shetty']
  const activeSuspects = overnightCases
    .filter(c => c.hasRepeatOffender || c.priority === 'Critical')
    .slice(0, 8)
    .map((c, i) => ({
      name: suspectNames[i % suspectNames.length],
      linkedCase: c.fir,
      district: c.district,
      crimeType: c.crimeType,
      threatLevel: c.priority === 'Critical' ? 'High' : 'Medium',
      riskScore: c.riskScore,
    }))

  // ── Action Items ──
  const actionItems = [
    { priority: 'Critical', item: `Review and escalate ${critical.length} critical overnight FIRs to DGP office`, district: 'Statewide', deadline: '0900 hrs today' },
    { priority: 'High', item: `Coordinate inter-district intelligence sharing for ${spikeDistricts[0]?.district || 'top spike district'}`, deadline: '1000 hrs today' },
    { priority: 'High', item: 'Activate cyber crime task force for overnight digital fraud cases', district: 'Bengaluru Urban', deadline: '1100 hrs today' },
    { priority: 'Medium', item: `Deploy additional night patrols in identified hotspot zones`, district: spikeDistricts[0]?.district, deadline: '1800 hrs today' },
    { priority: 'Medium', item: `Follow up on ${overnightArrests} overnight arrests — ensure custody procedures completed`, deadline: '1200 hrs today' },
    { priority: 'Low', item: 'Update district-level crime dashboards with overnight data', deadline: '1400 hrs today' },
  ]

  // ── Trend Comparison ──
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const thisWeek = Array.from({ length: 7 }, () => Math.floor(Math.random() * 80 + 120))
  const lastWeek = Array.from({ length: 7 }, () => Math.floor(Math.random() * 70 + 110))
  const thisWeekTotal = thisWeek.reduce((a, b) => a + b, 0)
  const lastWeekTotal = lastWeek.reduce((a, b) => a + b, 0)
  const trendComparison = {
    thisWeek: thisWeekTotal,
    lastWeek: lastWeekTotal,
    change: Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100),
    dailyBreakdown: dayNames.map((day, i) => ({ day, thisWeek: thisWeek[i], lastWeek: lastWeek[i] })),
  }

  // ── Advisory ──
  const advisory = [
    'All SPs to review critical cases before 1000 hrs and submit status updates to SCRB',
    `Cyber crime cell to initiate analysis on ${Math.round(overnightCases.length * 0.12)} overnight digital fraud cases`,
    'Patrol teams to intensify coverage in identified hotspot areas during 2000-0400 hrs window',
    'Inter-state coordination cell to verify suspect linkages with neighboring states',
    `FSL to prioritize forensic processing of evidence from ${critical.length} critical cases`,
  ]

  const now = new Date()
  return Response.json({
    briefDate: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
    briefTime: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    preparedBy: 'SCRB AI Intelligence Cell',
    classification: 'RESTRICTED — FOR OFFICIAL USE ONLY',
    overnight: {
      totalFIRs: overnightCases.length,
      criticalCases: critical.length,
      highCases: high.length,
      arrests: overnightArrests,
      chargesheets: overnightChargesheets,
      districtsActive: activeDistricts,
      spikeDistricts: spikeCount,
    },
    threatAssessment: {
      level: threatLevel,
      narrative: narratives[threatLevel] || narratives.MODERATE,
      confidence: Math.min(95, 60 + critical.length * 5 + high.length * 2),
      keyPatterns,
    },
    hotspotShifts,
    criticalAlerts,
    activeSuspects,
    actionItems,
    crimeBreakdown,
    nightCategories,
    trendComparison,
    advisory,
    spikeDistricts,
  })
}