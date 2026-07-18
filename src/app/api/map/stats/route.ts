import { getDistrictMapData } from '@/lib/case-generator'

export async function GET() {
  return Response.json(getDistrictMapData())
}