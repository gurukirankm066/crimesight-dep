import { NextResponse } from 'next/server'
import {
  getKSPCase,
  getCaseIntelligenceBrief,
  getLinkedCases,
  getRepeatOffendersForCase,
} from '@/lib/ksp-data'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params
    const kase = getKSPCase(caseId)

    if (!kase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const intelligenceBrief = getCaseIntelligenceBrief(caseId)
    const linkedCases = getLinkedCases(caseId, 10)
    const repeatOffenders = getRepeatOffendersForCase(caseId)

    return NextResponse.json({
      case: kase,
      intelligenceBrief,
      linkedCases,
      repeatOffenders,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[GET /api/cross-reference/[caseId]]', message)
    return NextResponse.json({ error: 'Failed to load case cross-references' }, { status: 500 })
  }
}