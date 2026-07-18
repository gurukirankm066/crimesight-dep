import { getTickerItems } from '@/lib/case-generator'

export async function GET() {
  return Response.json({ incidents: getTickerItems() })
}