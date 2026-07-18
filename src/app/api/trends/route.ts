import { db, serialize } from '@/lib/db'
import { NextResponse } from 'next/server'

/** Escape single quotes for safe SQL interpolation */
function esc(str: string) { return str.replace(/'/g, "''") }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'district'
  const districtName = searchParams.get('districtName') || null

  // Common district JOIN + WHERE fragment for queries that don't already have District
  const districtJoin = districtName
    ? `JOIN Unit u ON c.PoliceStationID = u.UnitID JOIN District d ON u.DistrictID = d.DistrictID`
    : ''
  const districtWhere = districtName
    ? `WHERE d.DistrictName = '${esc(districtName)}'`
    : ''

  try {
    if (type === 'district') {
      const rows = await db.$queryRawUnsafe(`
        SELECT d.DistrictName as name, COUNT(c.CaseMasterID) as count
        FROM CaseMaster c
        JOIN Unit u ON c.PoliceStationID = u.UnitID
        JOIN District d ON u.DistrictID = d.DistrictID
        ${districtName ? `WHERE d.DistrictName = '${esc(districtName)}'` : ''}
        GROUP BY d.DistrictID
        ORDER BY count DESC
        LIMIT 15
      `)
      return NextResponse.json(serialize(rows))
    }

    if (type === 'crimeType') {
      const rows = await db.$queryRawUnsafe(`
        SELECT ch.CrimeGroupName as name, COUNT(c.CaseMasterID) as count
        FROM CaseMaster c
        ${districtJoin}
        JOIN CrimeHead ch ON c.CrimeMajorHeadID = ch.CrimeHeadID
        ${districtWhere}
        GROUP BY ch.CrimeHeadID
        ORDER BY count DESC
      `)
      return NextResponse.json(serialize(rows))
    }

    if (type === 'monthly') {
      const rows = await db.$queryRawUnsafe(`
        SELECT substr(CrimeRegisteredDate, 1, 7) as month, COUNT(*) as count
        FROM CaseMaster c
        ${districtJoin}
        ${districtWhere}
        GROUP BY month
        ORDER BY month
      `)
      return NextResponse.json(serialize(rows))
    }

    if (type === 'timeOfDay') {
      const whereClause = districtName
        ? `AND d.DistrictName = '${esc(districtName)}'`
        : ''
      const rows = await db.$queryRawUnsafe(`
        SELECT 
          CAST(strftime('%H', IncidentFromDate) AS INTEGER) as hour,
          COUNT(*) as count
        FROM CaseMaster c
        ${districtJoin}
        WHERE IncidentFromDate IS NOT NULL ${whereClause}
        GROUP BY hour
        ORDER BY hour
      `)
      return NextResponse.json(serialize(rows))
    }

    if (type === 'timeOfDayComparison') {
      // Anchor to data's max date and compute month boundaries in JS
      const maxDateSQL = districtName
        ? `SELECT MAX(substr(c.CrimeRegisteredDate, 1, 7)) as maxMonth FROM CaseMaster c ${districtJoin} WHERE d.DistrictName = '${esc(districtName)}'`
        : `SELECT MAX(substr(CrimeRegisteredDate, 1, 7)) as maxMonth FROM CaseMaster`
      const maxDateRaw = await db.$queryRawUnsafe(maxDateSQL)
      const maxMonth = (maxDateRaw as { maxMonth: string }[])[0]?.maxMonth || '2025-12'
      const [maxY, maxM] = maxMonth.split('-').map(Number)
      let rY = maxY, rM = maxM - 2
      if (rM <= 0) { rM += 12; rY-- }
      const recentStart = `${rY}-${String(rM).padStart(2, '0')}`
      let pY = rY, pM = rM - 3
      if (pM <= 0) { pM += 12; pY-- }
      const prevStart = `${pY}-${String(pM).padStart(2, '0')}`

      const districtFilterWhere = districtName
        ? `AND d.DistrictName = '${esc(districtName)}'`
        : ''

      // Current period (most recent 3 months)
      const currentRaw = await db.$queryRawUnsafe(`
        SELECT 
          CAST(strftime('%H', IncidentFromDate) AS INTEGER) as hour,
          COUNT(*) as count
        FROM CaseMaster c
        ${districtJoin}
        WHERE IncidentFromDate IS NOT NULL
          AND substr(CrimeRegisteredDate, 1, 7) >= '${recentStart}'
          AND substr(CrimeRegisteredDate, 1, 7) <= '${maxMonth}'
          ${districtFilterWhere}
        GROUP BY hour
        ORDER BY hour
      `)

      // Previous period (3 months before that)
      const previousRaw = await db.$queryRawUnsafe(`
        SELECT 
          CAST(strftime('%H', IncidentFromDate) AS INTEGER) as hour,
          COUNT(*) as count
        FROM CaseMaster c
        ${districtJoin}
        WHERE IncidentFromDate IS NOT NULL
          AND substr(CrimeRegisteredDate, 1, 7) >= '${prevStart}'
          AND substr(CrimeRegisteredDate, 1, 7) < '${recentStart}'
          ${districtFilterWhere}
        GROUP BY hour
        ORDER BY hour
      `)

      const currentMap = new Map<number, number>()
      for (const row of serialize(currentRaw) as { hour: number; count: number }[]) {
        currentMap.set(row.hour, row.count)
      }
      const previousMap = new Map<number, number>()
      for (const row of serialize(previousRaw) as { hour: number; count: number }[]) {
        previousMap.set(row.hour, row.count)
      }

      const result = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        current: currentMap.get(i) ?? 0,
        previous: previousMap.get(i) ?? 0,
      }))

      return NextResponse.json(serialize(result))
    }

    if (type === 'dayOfWeek') {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const districtFilterWhere = districtName
        ? `AND d.DistrictName = '${esc(districtName)}'`
        : ''
      const rows = await db.$queryRawUnsafe(`
        SELECT 
          CAST(strftime('%w', IncidentFromDate) AS INTEGER) as dayIndex,
          COUNT(*) as count
        FROM CaseMaster c
        ${districtJoin}
        WHERE IncidentFromDate IS NOT NULL ${districtFilterWhere}
        GROUP BY dayIndex
        ORDER BY dayIndex
      `)
      const mapped = (rows as { dayIndex: number; count: number }[]).map(r => ({ name: days[r.dayIndex] ?? 'Unknown', count: r.count }))
      return NextResponse.json(serialize(mapped))
    }

    return NextResponse.json([])
  } catch (error: any) {
    console.error('[GET /api/trends]', error)
    return NextResponse.json([])
  }
}