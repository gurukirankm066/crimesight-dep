import { getRecentCases } from '@/lib/case-generator'

export async function GET() {
  const alerts = getRecentCases(30)
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
      timestamp: c.occurrenceDate,
    }))
  return Response.json({ alerts })
}