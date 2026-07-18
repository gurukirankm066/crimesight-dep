import { getGeneratedDistrictStats, getRecentCases } from '@/lib/case-generator'

export async function GET() {
  const districtStats = getGeneratedDistrictStats()
  const recent = getRecentCases(200)

  // Build patrol predictions based on crime density
  const predictions = Object.entries(districtStats)
    .sort((a, b) => b[1].active - a[1].active)
    .slice(0, 10)
    .map(([district, stats]) => {
      const districtRecent = recent.filter(c => c.district === district)
      const highPriority = districtRecent.filter(c => c.priority === 'Critical' || c.priority === 'High').length
      return {
        district,
        activeCases: stats.active,
        criticalCases: stats.critical,
        highPriorityRecent: highPriority,
        riskLevel: stats.critical > 10 ? 'Critical' : stats.active > 100 ? 'High' : 'Medium',
        patrolRecommendation: stats.critical > 10
          ? 'Intensified night patrol recommended'
          : stats.active > 100
            ? 'Enhanced daytime patrol suggested'
            : 'Standard patrol coverage sufficient',
      }
    })

  return Response.json({ predictions })
}