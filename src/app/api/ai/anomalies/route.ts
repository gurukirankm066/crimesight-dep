import { getGeneratedDistrictStats, getGeneratedCrimeTypeStats, getRecentCases } from '@/lib/case-generator'

export async function GET() {
  const districtStats = getGeneratedDistrictStats()
  const crimeStats = getGeneratedCrimeTypeStats()
  const recent = getRecentCases(100)

  const anomalies: Array<{
    id: number
    severity: string
    type: string
    district: string
    metric: string
    description: string
    timestamp: string
  }> = []

  // District spike anomalies
  const districts = Object.entries(districtStats).sort((a, b) => b[1].total - a[1].total)
  if (districts[0]) {
    anomalies.push({
      id: 1,
      severity: 'Warning',
      type: 'Spike',
      district: districts[0][0],
      metric: 'Overall Crime',
      description: `${districts[0][1].total} FIRs in ${districts[0][0]} — highest in state`,
      timestamp: new Date().toISOString(),
    })
  }

  // Crime type spike
  if (crimeStats[0]) {
    anomalies.push({
      id: 2,
      severity: 'Critical',
      type: 'Spike',
      district: 'Statewide',
      metric: crimeStats[0].name,
      description: `${crimeStats[0].name}: ${crimeStats[0].count} cases — leading crime type`,
      timestamp: new Date().toISOString(),
    })
  }

  // Recent critical cases
  const criticalRecent = recent.filter(c => c.priority === 'Critical').slice(0, 3)
  for (const c of criticalRecent) {
    anomalies.push({
      id: anomalies.length + 1,
      severity: 'Critical',
      type: 'Pattern',
      district: c.district,
      metric: c.crimeType,
      description: `Critical ${c.crimeType} — ${c.fir}`,
      timestamp: c.occurrenceDate,
    })
  }

  return Response.json({ anomalies })
}