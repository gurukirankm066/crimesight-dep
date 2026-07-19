import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { generateReport } from '@/lib/ai'
import type { ReportContext } from '@/lib/ai'
import { getActs, getCrimeCategories, getCrimeTypes, getDistricts, getEmployees, getSections, getUnits } from '@/lib/dal'

/** Generate a report from the current FIR schema without assuming Prisma relations. */
export async function GET(request: Request) {
  const caseId = new URL(request.url).searchParams.get('caseId')
  if (!caseId) return NextResponse.json({ error: 'caseId is required' }, { status: 400 })

  try {
    const c = await db.caseMaster.findUnique({ where: { ROWID: caseId } })
    if (!c) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

    const [districts, units, crimeTypes, categories, acts, sections, employees, suspects, victims, arrests, chargesheets] = await Promise.all([
      getDistricts(), getUnits(), getCrimeTypes(), getCrimeCategories(), getActs(), getSections(), getEmployees(),
      db.suspect.findMany({ where: { case_rowid: c.ROWID } }),
      db.victim.findMany({ where: { case_rowid: c.ROWID } }),
      db.arrestSurrender.findMany({ where: { case_rowid: c.ROWID } }),
      db.chargesheet.findMany({ where: { case_rowid: c.ROWID } }),
    ])

    const district = districts.get(c.district_rowid)?.district_name ?? 'Unknown'
    const station = units.get(c.unit_rowid)?.unit_name ?? 'Unknown'
    const crimeType = crimeTypes.get(c.crime_type_rowid)?.crime_type_name ?? 'Unknown'
    const category = categories.get(c.crime_category_rowid)?.crime_category_name ?? 'Unknown'
    const act = acts.get(c.act_rowid)?.act_name ?? ''
    const section = sections.get(c.section_rowid)?.section_code ?? ''
    const officer = employees.get(c.investigation_officer_rowid)?.full_name ?? 'Unassigned'

    const accused = suspects.map(s => `${s.suspect_name} (${s.arrest_status || 'not arrested'})`).join(', ') || 'None recorded'
    const victimList = victims.map(v => `${v.victim_name}${v.age ? ` (${v.age} yrs)` : ''}`).join(', ') || 'None recorded'
    const arrestList = arrests.map(a => `${a.arrest_datetime.substring(0, 10)} — ${a.arrest_type}`).join('; ') || 'None recorded'
    const chargesheetList = chargesheets.map(cs => `${cs.filing_date.substring(0, 10)} — ${cs.filing_status}`).join('; ') || 'None recorded'
    const timeline = [
      `Occurrence: ${c.occurrence_datetime.substring(0, 10)}`,
      `Complaint: ${c.complaint_datetime.substring(0, 10)}`,
      ...arrests.map(a => `Arrest: ${a.arrest_datetime.substring(0, 10)}`),
      ...chargesheets.map(cs => `Chargesheet: ${cs.filing_date.substring(0, 10)}`),
    ].join(' → ')

    const context: ReportContext = {
      caseNo: c.ROWID,
      crimeNo: c.fir_number,
      district,
      station,
      crimeHead: crimeType,
      crimeCategory: category,
      gravity: c.case_priority,
      status: c.case_status,
      registeredDate: c.complaint_datetime,
      incidentDate: c.occurrence_datetime,
      briefFacts: c.ai_summary,
      actsAndSections: [act, section].filter(Boolean).join(' ') || 'Not recorded',
      complainants: 'Not captured in the current prototype schema',
      victims: victimList,
      accused,
      arrests: arrestList,
      chargesheets: chargesheetList,
      investigatingOfficer: officer,
      court: chargesheets[0]?.court_name ?? null,
      timeline,
    }
    const result = await generateReport(context)
    return NextResponse.json({ report: result.report, provider: result.provider, latencyMs: result.latencyMs })
  } catch (error: unknown) {
    console.error('[GET /api/ai/report]', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to generate report' }, { status: 500 })
  }
}
