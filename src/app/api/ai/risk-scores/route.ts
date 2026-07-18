import { getRecentCases } from '@/lib/case-generator'

export async function GET() {
  const cases = getRecentCases(50)
  const riskScores = cases.map(c => ({
    fir: c.fir,
    district: c.district,
    crimeType: c.crimeType,
    riskScore: c.riskScore,
    priority: c.priority,
    daysAgo: c.daysAgo,
  }))
  return Response.json({ riskScores })
}