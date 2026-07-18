import { DEMO_CRIME_TYPES } from '@/lib/demo-data'

export async function GET() {
  const types = DEMO_CRIME_TYPES.map(ct => ({
    value: ct.ROWID,
    label: ct.crime_type_name,
  }))
  return Response.json(types)
}