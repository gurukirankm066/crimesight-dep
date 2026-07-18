import { GENERATED_CASES } from '@/lib/case-generator'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params
  const caseData = GENERATED_CASES.find(c => c.fir === caseId || c.rowid === caseId)

  if (!caseData) {
    return Response.json({ error: 'Case not found' }, { status: 404 })
  }

  // Generate AI-style case crack analysis based on case data
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