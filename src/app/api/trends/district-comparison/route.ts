import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [cases, districts] = await Promise.all([
      db.caseMaster.findMany({ select: { district_rowid: true } }),
      db.district.findMany({ select: { ROWID: true, district_name: true } }),
    ])
    const dMap = Object.fromEntries(districts.map(d => [d.ROWID, d.district_name]))
    const dist: Record<string, number> = {}
    cases.forEach(c => { const n = dMap[c.district_rowid] || 'Unknown'; dist[n] = (dist[n] || 0) + 1 })
    return NextResponse.json(Object.entries(dist).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count))
  } catch (error: any) {
    console.error('[GET /api/trends/district-comparison]', error)
    return NextResponse.json([])
  }
}