import { db, serialize } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const districtId = searchParams.get('district') || ''
    const districtName = searchParams.get('districtName') || ''
    const statusId = searchParams.get('status') || ''

    const conditions: string[] = []

    if (search) {
      conditions.push(`(c.CrimeNo LIKE '%${search}%' OR c.CaseNo LIKE '%${search}%')`)
    }
    if (districtId) {
      conditions.push(`u.DistrictID = ${districtId}`)
    }
    if (districtName) {
      conditions.push(`d.DistrictName = '${districtName}'`)
    }
    if (statusId) {
      conditions.push(`c.CaseStatusID = ${statusId}`)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const raw = await db.$queryRawUnsafe(`
      SELECT
        c.CrimeNo,
        c.CaseNo,
        c.CrimeRegisteredDate,
        c.IncidentFromDate,
        c.InfoReceivedPSDate,
        c.BriefFacts,
        d.DistrictName,
        u.UnitName AS StationName,
        ch.CrimeGroupName AS MajorHead,
        csh.CrimeHeadName AS MinorHead,
        csm.CaseStatusName,
        cc.CategoryName,
        go.LookupValue AS Gravity,
        ct.CourtName
      FROM CaseMaster c
      INNER JOIN Unit u ON c.PoliceStationID = u.UnitID
      INNER JOIN District d ON u.DistrictID = d.DistrictID
      LEFT JOIN CrimeHead ch ON c.CrimeMajorHeadID = ch.CrimeHeadID
      LEFT JOIN CrimeSubHead csh ON c.CrimeMinorHeadID = csh.CrimeSubHeadID
      LEFT JOIN CaseStatusMaster csm ON c.CaseStatusID = csm.CaseStatusID
      LEFT JOIN CaseCategory cc ON c.CaseCategoryID = cc.CaseCategoryID
      LEFT JOIN GravityOffence go ON c.GravityOffenceID = go.GravityOffenceID
      LEFT JOIN Court ct ON c.CourtID = ct.CourtID
      ${where}
      ORDER BY c.CrimeRegisteredDate DESC
      LIMIT 10000
    `)

    const rows = serialize(raw) as Record<string, any>[]
    const headers = [
      'FIR Number', 'Case Number', 'Date of Registration', 'Date of Incident',
      'Info Received at PS', 'District', 'Police Station', 'Major Crime Head',
      'Minor Crime Head', 'Status', 'Category', 'Gravity', 'Court', 'Brief Facts',
    ]

    const csvRows = rows.map(row => [
      csvEscape(String(row.CrimeNo || '')),
      csvEscape(String(row.CaseNo || '')),
      csvEscape(String(row.CrimeRegisteredDate || '')),
      csvEscape(String(row.IncidentFromDate || '')),
      csvEscape(String(row.InfoReceivedPSDate || '')),
      csvEscape(String(row.DistrictName || '')),
      csvEscape(String(row.StationName || '')),
      csvEscape(String(row.MajorHead || '')),
      csvEscape(String(row.MinorHead || '')),
      csvEscape(String(row.CaseStatusName || '')),
      csvEscape(String(row.CategoryName || '')),
      csvEscape(String(row.Gravity || '')),
      csvEscape(String(row.CourtName || '')),
      csvEscape(String(row.BriefFacts || '')),
    ].join(','))

    const csv = [headers.join(','), ...csvRows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="crimesight_fir_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error: any) {
    console.error('[GET /api/cases/export]', error.message)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

function csvEscape(value: string): string {
  if (!value) return '""'
  const escaped = value.replace(/"/g, '""')
  return `"${escaped}"`
}