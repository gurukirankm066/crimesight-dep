import { GENERATED_CASES } from '@/lib/case-generator'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const district = searchParams.get('district') || ''
  const status = searchParams.get('status') || ''
  const priority = searchParams.get('priority') || ''
  const search = searchParams.get('search') || ''

  let filtered = [...GENERATED_CASES]
  if (district) filtered = filtered.filter(c => c.district === district)
  if (status) filtered = filtered.filter(c => c.status === status)
  if (priority) filtered = filtered.filter(c => c.priority === priority)
  if (search) filtered = filtered.filter(c =>
    c.fir.toLowerCase().includes(search.toLowerCase()) ||
    c.crimeType.toLowerCase().includes(search.toLowerCase()) ||
    c.district.toLowerCase().includes(search.toLowerCase())
  )

  const total = filtered.length
  const start = (page - 1) * limit
  const cases = filtered.slice(start, start + limit)

  return Response.json({
    cases,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}