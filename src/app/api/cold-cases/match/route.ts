import { GENERATED_CASES } from '@/lib/case-generator'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const crimeType = searchParams.get('crimeType') || ''
  const district = searchParams.get('district') || ''
  const modus = searchParams.get('modus') || ''

  // Find potential matches based on criteria (closed cases that could be linked)
  let matches = GENERATED_CASES.filter(
    c => c.status === 'Closed' || c.status === 'Charge Sheet Filed'
  )
  if (crimeType) matches = matches.filter(c => c.crimeType.toLowerCase().includes(crimeType.toLowerCase()))
  if (district) matches = matches.filter(c => c.district === district)

  return Response.json({
    matches: matches.slice(0, 20).map(c => ({
      fir: c.fir,
      crimeType: c.crimeType,
      district: c.district,
      priority: c.priority,
      status: c.status,
      date: c.occurrenceDate,
      riskScore: c.riskScore,
      similarityScore: Math.floor(Math.random() * 30 + 65), // 65-95% similarity
    })),
  })
}