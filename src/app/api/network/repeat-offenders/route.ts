import { GENERATED_CASES } from '@/lib/case-generator'

export async function GET() {
  const repeatOffenders = GENERATED_CASES
    .filter(c => c.hasRepeatOffender)
    .slice(0, 20)
    .map(c => ({
      fir: c.fir,
      district: c.district,
      crimeType: c.crimeType,
      priority: c.priority,
      suspectCount: c.suspectCount,
      riskScore: c.riskScore,
      date: c.occurrenceDate,
    }))
  return Response.json({ repeatOffenders })
}