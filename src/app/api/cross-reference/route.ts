import { NextResponse } from 'next/server'
import {
  KSP_CASES,
  KSP_REPEAT_OFFENDERS,
  KSP_SPATIAL_CLUSTERS,
  KSP_INTELLIGENCE_INSIGHTS,
  KSP_TOTAL_CASES,
  KSP_TOTAL_SUSPECTS,
} from '@/lib/ksp-data'

export async function GET() {
  try {
    // Count total forensic matches across all cases
    const totalForensicMatches = KSP_CASES.reduce((sum, c) => sum + c.forensicMatches.length, 0)

    // Count linked case pairs (each similar case link is a pair)
    const linkedCasePairs = KSP_CASES.reduce((sum, c) => sum + c.similarCases.length, 0)

    // Top 10 repeat offenders sorted by case count descending
    const topRepeatOffenders = [...KSP_REPEAT_OFFENDERS]
      .sort((a, b) => b.totalCases - a.totalCases)
      .slice(0, 10)
      .map(ro => ({
        name: ro.name,
        phone: ro.phone,
        totalCases: ro.totalCases,
        caseRowids: ro.cases,
      }))

    const summary = {
      totalCases: KSP_TOTAL_CASES,
      totalSuspects: KSP_TOTAL_SUSPECTS,
      repeatOffenders: KSP_REPEAT_OFFENDERS.length,
      spatialClusters: KSP_SPATIAL_CLUSTERS.length,
      totalForensicMatches,
      linkedCasePairs,
    }

    return NextResponse.json({
      summary,
      topRepeatOffenders,
      spatialClusters: KSP_SPATIAL_CLUSTERS,
      insights: KSP_INTELLIGENCE_INSIGHTS,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[GET /api/cross-reference]', message)
    return NextResponse.json({ error: 'Failed to load cross-reference intelligence' }, { status: 500 })
  }
}