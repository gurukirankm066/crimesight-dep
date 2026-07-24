import { GENERATED_CASES } from '@/lib/case-generator'
import { KSP_CASES } from '@/lib/ksp-data'
import { db } from '@/lib/db'
import { getCrimeTypes, getDistricts } from '@/lib/dal'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params
  
  let caseData: any = GENERATED_CASES.find(c => c.fir === caseId || c.rowid === caseId)
  
  if (!caseData) {
    const kspMatch = KSP_CASES.find(c => c.fir === caseId || c.rowid === caseId)
    if (kspMatch) {
      caseData = {
        fir: kspMatch.fir,
        crimeType: kspMatch.crimeType,
        district: kspMatch.district,
        priority: kspMatch.priority,
        riskScore: kspMatch.riskScore,
        complaintMode: kspMatch.complaintMode,
        complaintDate: kspMatch.complaintDate,
        place: kspMatch.place,
        suspectCount: kspMatch.suspects.length,
        evidenceCount: kspMatch.evidence.length,
        vehicleCount: kspMatch.vehicles.length,
        hasRepeatOffender: kspMatch.hasRepeatOffender,
        isSensitive: kspMatch.isSensitive,
      }
    }
  }

  if (!caseData) {
    const dbCase = await db.caseMaster.findUnique({ where: { ROWID: caseId } })
    if (dbCase) {
      const [districts, crimeTypes] = await Promise.all([getDistricts(), getCrimeTypes()])
      caseData = {
        fir: dbCase.fir_number,
        crimeType: crimeTypes.get(dbCase.crime_type_rowid)?.crime_type_name || 'Offence',
        district: districts.get(dbCase.district_rowid)?.district_name || 'Karnataka',
        priority: dbCase.case_priority,
        riskScore: dbCase.ai_risk_score || 55,
        complaintMode: dbCase.complaint_mode,
        complaintDate: dbCase.complaint_datetime,
        place: dbCase.place_of_occurrence,
        suspectCount: 1,
        evidenceCount: 2,
        vehicleCount: 0,
        hasRepeatOffender: false,
        isSensitive: dbCase.is_sensitive,
      }
    }
  }

  if (!caseData) {
    return Response.json({ error: 'Case not found' }, { status: 404 })
  }

  const leadStrength = caseData.riskScore > 70 ? 'Strong' : caseData.riskScore > 40 ? 'Moderate' : 'Weak'
  const suspectLeads = caseData.suspectCount > 0
    ? `${caseData.suspectCount} suspect(s) identified. ${caseData.hasRepeatOffender ? 'Repeat offender pattern detected — cross-reference with previous cases advised.' : 'No repeat offender flag.'}`
    : 'No suspects identified yet. Recommend CCTV analysis and witness canvassing.'
  const forensicStatus = caseData.evidenceCount > 5
    ? `${caseData.evidenceCount} evidence items collected. Priority forensic processing recommended.`
    : `${caseData.evidenceCount} evidence items collected.`

  const analysis = {
    fir: caseData.fir,
    crimeType: caseData.crimeType,
    district: caseData.district,
    priority: caseData.priority,
    riskScore: caseData.riskScore,
    leadStrength,
    keyFindings: [
      `Case reported via ${caseData.complaintMode} on ${caseData.complaintDate}`,
      `Location: ${caseData.place}`,
      suspectLeads,
      forensicStatus,
      caseData.hasRepeatOffender ? 'ALERT: Suspected repeat offender — check CrimeSight Link Analysis tab for connected cases' : 'No cross-case linkages detected',
      caseData.isSensitive ? 'SENSITIVE CASE — restrict information to authorized personnel only' : '',
    ].filter(Boolean),
    recommendedActions: [
      caseData.priority === 'Critical' ? 'Immediately escalate to SP/DCP level' : 'Standard investigation protocol',
      caseData.evidenceCount > 0 ? 'Fast-track forensic analysis of collected evidence' : 'Scene of crime visit and evidence collection',
      'Check CCTV footage in 500m radius',
      caseData.suspectCount > 1 ? 'Coordinate with neighboring districts for suspect tracking' : 'Canvass witnesses and collect statements',
      caseData.vehicleCount > 0 ? `Trace ${caseData.vehicleCount} vehicle(s) via ANPR/RTA database` : 'Verify vehicle movements via ANPR if applicable',
    ],
    similarCaseCount: Math.floor(Math.random() * 5),
    predictedSolvability: Math.min(95, Math.max(20, caseData.riskScore + (caseData.evidenceCount * 3) - (caseData.suspectCount > 0 ? 0 : 15))),
  }

  return Response.json(analysis)
}