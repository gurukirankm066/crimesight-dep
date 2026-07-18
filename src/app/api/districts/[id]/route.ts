import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { enrichCases, clearLookups } from '@/lib/dal'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    clearLookups()
    const { id } = await params

    const district = await db.district.findUnique({ where: { ROWID: id } })
    if (!district) {
      return NextResponse.json({ error: 'District not found' }, { status: 404 })
    }

    const cases = await db.caseMaster.findMany({
      where: { district_rowid: id },
      orderBy: { CREATEDTIME: 'desc' },
    })

    const enriched = await enrichCases(cases)

    return NextResponse.json({
      ...district,
      total_cases: enriched.length,
      cases: enriched,
    })
  } catch (error) {
    console.error('[GET /api/districts/[id]]', error)
    return NextResponse.json({ error: 'District not found' }, { status: 404 })
  }
}