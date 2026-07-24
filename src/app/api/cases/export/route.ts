import { db } from '@/lib/db'
import { enrichCases, getUnits, getActs, getSections, getEmployees } from '@/lib/dal'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const districtId = searchParams.get('district') || ''
    const priority = searchParams.get('priority') || ''
    const status = searchParams.get('status') || ''

    const where: any = {}

    if (search) {
      where.OR = [
        { fir_number: { contains: search } },
        { place_of_occurrence: { contains: search } },
        { ai_summary: { contains: search } },
      ]
    }
    if (districtId) {
      where.district_rowid = districtId
    }
    if (priority) {
      where.case_priority = priority
    }
    if (status) {
      where.case_status = status
    }

    const cases = await db.caseMaster.findMany({
      where,
      orderBy: { CREATEDTIME: 'desc' },
      take: 5000,
    })

    const [enriched, units, acts, sections, employees] = await Promise.all([
      enrichCases(cases),
      getUnits(),
      getActs(),
      getSections(),
      getEmployees(),
    ])

    const headers = [
      'FIR Number', 'Occurrence Date', 'Complaint Date', 'Priority', 'Status',
      'District', 'Police Station', 'Crime Type', 'Act', 'Section',
      'Investigating Officer', 'Place of Occurrence', 'Summary',
    ]

    const csvRows = enriched.map(c => [
      csvEscape(c.fir_number || ''),
      csvEscape(c.occurrence_datetime || ''),
      csvEscape(c.complaint_datetime || ''),
      csvEscape(c.case_priority || ''),
      csvEscape(c.case_status || ''),
      csvEscape(c.district_name || ''),
      csvEscape(units.get(c.unit_rowid)?.unit_name || ''),
      csvEscape(c.crime_type_name || ''),
      csvEscape(acts.get(c.act_rowid)?.act_name || ''),
      csvEscape(sections.get(c.section_rowid)?.section_code || ''),
      csvEscape(employees.get(c.investigation_officer_rowid)?.full_name || ''),
      csvEscape(c.place_of_occurrence || ''),
      csvEscape(c.ai_summary || ''),
    ].join(','))

    const csv = [headers.join(','), ...csvRows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="crimesight_fir_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error: any) {
    console.error('[GET /api/cases/export]', error?.message || error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

function csvEscape(value: string): string {
  if (!value) return '""'
  const escaped = value.replace(/"/g, '""')
  return `"${escaped}"`
}