import { db, serialize } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getDistricts, getCrimeTypes } from '@/lib/dal'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'district'
    const districtName = searchParams.get('districtName') || null

    let matchedDistrictId: string | null = null
    if (districtName) {
      const districts = await getDistricts()
      for (const [, d] of districts) {
        if (d.district_name === districtName) {
          matchedDistrictId = d.ROWID
          break
        }
      }
    }

    const whereCondition = matchedDistrictId ? { district_rowid: matchedDistrictId } : {}

    if (type === 'district') {
      const districts = await getDistricts()
      const cases = await db.caseMaster.findMany({
        select: { district_rowid: true },
      })
      const districtCounts = new Map<string, number>()
      for (const c of cases) {
        districtCounts.set(c.district_rowid, (districtCounts.get(c.district_rowid) || 0) + 1)
      }
      const rows = Array.from(districtCounts.entries()).map(([rowid, count]) => ({
        name: districts.get(rowid)?.district_name || 'Unknown',
        count,
      })).sort((a, b) => b.count - a.count).slice(0, 15)

      return NextResponse.json(serialize(rows))
    }

    if (type === 'crimeType') {
      const crimeTypes = await getCrimeTypes()
      const cases = await db.caseMaster.findMany({
        where: whereCondition,
        select: { crime_type_rowid: true },
      })
      const typeCounts = new Map<string, number>()
      for (const c of cases) {
        typeCounts.set(c.crime_type_rowid, (typeCounts.get(c.crime_type_rowid) || 0) + 1)
      }
      const rows = Array.from(typeCounts.entries()).map(([rowid, count]) => ({
        name: crimeTypes.get(rowid)?.crime_type_name || 'Unknown',
        count,
      })).sort((a, b) => b.count - a.count)

      return NextResponse.json(serialize(rows))
    }

    if (type === 'monthly') {
      const cases = await db.caseMaster.findMany({
        where: whereCondition,
        select: { occurrence_datetime: true },
      })
      const monthCounts = new Map<string, number>()
      for (const c of cases) {
        if (!c.occurrence_datetime) continue
        const month = c.occurrence_datetime.substring(0, 7)
        if (month.length === 7) {
          monthCounts.set(month, (monthCounts.get(month) || 0) + 1)
        }
      }
      const rows = Array.from(monthCounts.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month))

      return NextResponse.json(serialize(rows))
    }

    if (type === 'timeOfDay') {
      const cases = await db.caseMaster.findMany({
        where: whereCondition,
        select: { occurrence_datetime: true },
      })
      const hourCounts = new Map<number, number>()
      for (const c of cases) {
        if (!c.occurrence_datetime) continue
        const dtStr = c.occurrence_datetime.substring(0, 19).replace(' ', 'T')
        const dt = new Date(dtStr)
        if (!isNaN(dt.getTime())) {
          const hour = dt.getHours()
          hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
        }
      }
      const rows = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: hourCounts.get(hour) || 0,
      }))

      return NextResponse.json(serialize(rows))
    }

    if (type === 'timeOfDayComparison') {
      const cases = await db.caseMaster.findMany({
        where: whereCondition,
        select: { occurrence_datetime: true },
      })

      let maxMonth = '2025-12'
      for (const c of cases) {
        if (c.occurrence_datetime && c.occurrence_datetime.substring(0, 7) > maxMonth) {
          maxMonth = c.occurrence_datetime.substring(0, 7)
        }
      }

      const [maxY, maxM] = maxMonth.split('-').map(Number)
      let rY = maxY, rM = maxM - 2
      if (rM <= 0) { rM += 12; rY-- }
      const recentStart = `${rY}-${String(rM).padStart(2, '0')}`

      let pY = rY, pM = rM - 3
      if (pM <= 0) { pM += 12; pY-- }
      const prevStart = `${pY}-${String(pM).padStart(2, '0')}`

      const currentMap = new Map<number, number>()
      const previousMap = new Map<number, number>()

      for (const c of cases) {
        if (!c.occurrence_datetime) continue
        const m = c.occurrence_datetime.substring(0, 7)
        const dtStr = c.occurrence_datetime.substring(0, 19).replace(' ', 'T')
        const dt = new Date(dtStr)
        if (isNaN(dt.getTime())) continue
        const hour = dt.getHours()

        if (m >= recentStart && m <= maxMonth) {
          currentMap.set(hour, (currentMap.get(hour) || 0) + 1)
        } else if (m >= prevStart && m < recentStart) {
          previousMap.set(hour, (previousMap.get(hour) || 0) + 1)
        }
      }

      const result = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        current: currentMap.get(hour) || 0,
        previous: previousMap.get(hour) || 0,
      }))

      return NextResponse.json(serialize(result))
    }

    if (type === 'dayOfWeek') {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const cases = await db.caseMaster.findMany({
        where: whereCondition,
        select: { occurrence_datetime: true },
      })
      const dayCounts = new Map<number, number>()
      for (const c of cases) {
        if (!c.occurrence_datetime) continue
        const dtStr = c.occurrence_datetime.substring(0, 19).replace(' ', 'T')
        const dt = new Date(dtStr)
        if (!isNaN(dt.getTime())) {
          const day = dt.getDay()
          dayCounts.set(day, (dayCounts.get(day) || 0) + 1)
        }
      }
      const mapped = days.map((name, index) => ({
        name,
        count: dayCounts.get(index) || 0,
      }))

      return NextResponse.json(serialize(mapped))
    }

    return NextResponse.json([])
  } catch (error: any) {
    console.error('[GET /api/trends]', error)
    return NextResponse.json([])
  }
}