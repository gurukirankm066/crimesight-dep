import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cases = await db.caseMaster.findMany({ select: { occurrence_datetime: true } })
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0, label: `${i.toString().padStart(2, '0')}:00` }))
    cases.forEach(c => {
      const dt = c.occurrence_datetime
      if (!dt) return
      const h = parseInt(dt.split(' ')[1]?.split(':')[0] || '0')
      if (h >= 0 && h < 24) hours[h].count++
    })
    return NextResponse.json(hours)
  } catch (error: any) {
    console.error('[GET /api/trends/time-of-day]', error)
    return NextResponse.json(Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0, label: `${i.toString().padStart(2, '0')}:00` })))
  }
}