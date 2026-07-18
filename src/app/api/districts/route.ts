import { DEMO_DISTRICTS } from '@/lib/demo-data'

export async function GET() {
  const districts = DEMO_DISTRICTS.map(d => ({
    value: d.ROWID,
    label: d.district_name,
  }))
  return Response.json(districts)
}