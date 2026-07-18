import { getGeneratedStats } from '@/lib/case-generator'

export async function GET() {
  return Response.json(getGeneratedStats())
}