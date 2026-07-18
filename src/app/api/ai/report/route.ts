import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { generateReport } from '@/lib/ai'
import type { ReportContext } from '@/lib/ai'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const caseId = searchParams.get('caseId')
  if (!caseId) {
    return NextResponse.json({ error: 'caseId is required' }, { status: 400 })
  }

  try {
    const c = await db.caseMaster.findUnique({
      where: { CaseMasterID: parseInt(caseId) },
      include: {
        policeStation: { include: { district: true } },
        policePerson: { include: { rank: true, designation: true, unit: true } },
        majorHead: true,
        minorHead: true,
        caseStatus: true,
        caseCategory: true,
        gravityOffence: true,
        court: true,
        complainants: true,
        victims: true,
        accused: { include: { arrests: true } },
        actSections: { include: { act: true, section: true } },
        arrests: { include: { accused: true, investigatingOfficer: { include: { rank: true } } } },
        chargesheets: { include: { policePerson: true } },
      },
    })

    if (!c) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Build acts and sections string
    const actsAndSections = c.actSections
      .map((as) => {
        const prefix = as.act?.ShortName || as.act?.ActCode || as.ActID
        const sec = as.section?.SectionCode || as.SectionID
        return `${prefix} ${sec}`
      })
      .join(', ')

    // Build complainants string
    const complainants = c.complainants
      .map((cp) => `${cp.ComplainantName}${cp.AgeYear ? ` (${cp.AgeYear} yrs)` : ''}`)
      .join(', ') || 'None'

    // Build victims string
    const victims = c.victims
      .map((v) => `${v.VictimName}${v.AgeYear ? ` (${v.AgeYear} yrs)` : ''}`)
      .join(', ') || 'None'

    // Build accused string
    const accused = c.accused
      .map((a) => {
        const arrested = a.arrests.length > 0 ? 'Arrested' : 'Not Arrested'
        return `${a.AccusedName} (${a.PersonID || 'N/A'} — ${arrested})`
      })
      .join(', ') || 'None'

    // Build arrests string
    const arrests = c.arrests
      .filter((a) => a.ArrestSurrenderDate)
      .map((a) => {
        const date = a.ArrestSurrenderDate?.substring(0, 10) || 'N/A'
        const name = a.accused?.AccusedName || 'Unknown'
        const io = a.investigatingOfficer
          ? `${a.investigatingOfficer.FirstName}${a.investigatingOfficer.rank?.RankName ? ` (${a.investigatingOfficer.rank.RankName})` : ''}`
          : 'N/A'
        return `${date} — ${name}, IO: ${io}`
      })
      .join('; ') || 'None'

    // Build chargesheets string
    const chargesheets = c.chargesheets
      .filter((cs) => cs.csdate)
      .map((cs) => {
        const date = cs.csdate?.substring(0, 10) || 'N/A'
        const type = cs.ctype === 'A' ? 'Final' : cs.ctype === 'B' ? 'Supplementary' : cs.ctype || 'N/A'
        const officer = cs.policePerson?.FirstName || 'N/A'
        return `${date} — ${type} Chargesheet, Filed by: ${officer}`
      })
      .join('; ') || 'None'

    // Build investigating officer string
    const io = c.policePerson
    const investigatingOfficer = `${io.FirstName}${io.LastName ? ' ' + io.LastName : ''}${io.rank?.RankName ? `, ${io.rank.RankName}` : ''}`

    // Build timeline
    const timelineParts: string[] = []
    if (c.IncidentFromDate) {
      timelineParts.push(`Incident: ${c.IncidentFromDate.substring(0, 10)}`)
    }
    timelineParts.push(`FIR Registered: ${c.CrimeRegisteredDate.substring(0, 10)}`)
    if (c.InfoReceivedPSDate) {
      timelineParts.push(`Info Received at PS: ${c.InfoReceivedPSDate.substring(0, 10)}`)
    }
    c.arrests
      .filter((a) => a.ArrestSurrenderDate)
      .forEach((a) => {
        timelineParts.push(`Arrest: ${a.ArrestSurrenderDate!.substring(0, 10)} — ${a.accused?.AccusedName || 'Unknown'}`)
      })
    c.chargesheets
      .filter((cs) => cs.csdate)
      .forEach((cs) => {
        const type = cs.ctype === 'A' ? 'Final' : cs.ctype === 'B' ? 'Supplementary' : cs.ctype || ''
        timelineParts.push(`${type} Chargesheet Filed: ${cs.csdate!.substring(0, 10)}`)
      })
    if (c.court?.CourtName) {
      timelineParts.push(`Court: ${c.court.CourtName}`)
    }
    const timeline = timelineParts.join(' → ')

    const context: ReportContext = {
      caseNo: c.CaseNo,
      crimeNo: c.CrimeNo,
      district: c.policeStation?.district?.DistrictName || 'Unknown',
      station: c.policeStation?.UnitName || 'Unknown',
      crimeHead: c.majorHead?.CrimeGroupName || 'Unknown',
      crimeCategory: c.caseCategory?.CategoryName || 'Unknown',
      gravity: c.gravityOffence?.LookupValue || 'Unknown',
      status: c.caseStatus?.CaseStatusName || 'Unknown',
      registeredDate: c.CrimeRegisteredDate,
      incidentDate: c.IncidentFromDate,
      briefFacts: c.BriefFacts,
      actsAndSections,
      complainants,
      victims,
      accused,
      arrests,
      chargesheets,
      investigatingOfficer,
      court: c.court?.CourtName || null,
      timeline,
    }

    const result = await generateReport(context)

    return NextResponse.json({
      report: result.report,
      provider: result.provider,
      latencyMs: result.latencyMs,
    })
  } catch (error: any) {
    console.error('[GET /api/ai/report]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    )
  }
}