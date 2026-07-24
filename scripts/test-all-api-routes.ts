import { db } from '../src/lib/db'
import { GET as getHealth } from '../src/app/api/health/route'
import { GET as getCases } from '../src/app/api/cases/route'
import { GET as getCaseCrack } from '../src/app/api/cases/[caseId]/crack/route'
import { GET as getDashboard } from '../src/app/api/dashboard/route'
import { GET as getMapStats } from '../src/app/api/map/stats/route'
import { GET as getDistrictDetail } from '../src/app/api/map/district-detail/route'
import { GET as getMostWanted } from '../src/app/api/most-wanted/route'
import { GET as getNetwork } from '../src/app/api/network/route'
import { GET as getNetworkGraph } from '../src/app/api/network/graph/route'
import { GET as getRepeatOffenders } from '../src/app/api/network/repeat-offenders/route'
import { GET as getOfficerLeaderboard } from '../src/app/api/officers/leaderboard/route'
import { GET as getTrends } from '../src/app/api/trends/route'
import { GET as getTrendsCrimeTypes } from '../src/app/api/trends/crime-types/route'
import { GET as getTrendsDistrictComp } from '../src/app/api/trends/district-comparison/route'
import { GET as getTrendsMonthly } from '../src/app/api/trends/monthly/route'
import { GET as getTrendsTimeOfDay } from '../src/app/api/trends/time-of-day/route'
import { GET as getBriefing } from '../src/app/api/briefing/route'
import { GET as getAlerts } from '../src/app/api/alerts/route'
import { GET as getTicker } from '../src/app/api/ticker/route'
import { GET as getCrossReference } from '../src/app/api/cross-reference/route'
import { GET as getCrossRefCase } from '../src/app/api/cross-reference/[caseId]/route'
import { GET as getFieldFir, POST as postFieldFir } from '../src/app/api/field-fir/route'
import { POST as postAiChat } from '../src/app/api/ai/chat/route'
import { GET as getAiReport } from '../src/app/api/ai/report/route'
import { GET as getAiAnomalies } from '../src/app/api/ai/anomalies/route'
import { GET as getAiRiskScores } from '../src/app/api/ai/risk-scores/route'
import { POST as postAiHelp } from '../src/app/api/ai/help/route'
import { GET as getColdCasesMatch } from '../src/app/api/cold-cases/match/route'
import { GET as getPatrolPredict } from '../src/app/api/patrol/predict/route'
import { POST as postFirVoice } from '../src/app/api/fir/voice/route'
import { GET as getFoundryStatus } from '../src/app/api/foundry/status/route'
import { GET as getFoundryFirCases } from '../src/app/api/foundry/fir-cases/route'
import { GET as getMasterType } from '../src/app/api/master/[type]/route'
import { GET as getCasesExport } from '../src/app/api/cases/export/route'

async function runTests() {
  console.log('--- Starting Complete API Route Audit ---')
  const errors: { endpoint: string; error: any }[] = []

  async function testRoute(name: string, fn: () => Promise<any>) {
    try {
      const res = await fn()
      const status = res.status
      if (status >= 400) {
        const body = await res.json().catch(() => ({}))
        console.error(`❌ [${name}] Returned HTTP ${status}:`, body)
        errors.push({ endpoint: name, error: { status, body } })
      } else {
        console.log(`✅ [${name}] HTTP ${status}`)
      }
    } catch (err: any) {
      console.error(`💥 [${name}] Exception thrown:`, err.stack || err.message || err)
      errors.push({ endpoint: name, error: err.message || err })
    }
  }

  const sampleCase = await db.caseMaster.findFirst()
  const realCaseRowid = sampleCase?.ROWID || '49093000000157258'

  await testRoute('GET /api/health', () => getHealth())
  await testRoute('GET /api/cases', () => getCases(new Request('http://localhost/api/cases?limit=10&page=1')))
  await testRoute('GET /api/dashboard', () => getDashboard())
  await testRoute('GET /api/map/stats', () => getMapStats())
  await testRoute('GET /api/map/district-detail', () => getDistrictDetail(new Request('http://localhost/api/map/district-detail?district=Bengaluru%20Urban') as any))
  await testRoute('GET /api/most-wanted', () => getMostWanted())
  await testRoute('GET /api/network', () => getNetwork())
  await testRoute('GET /api/network/graph', () => getNetworkGraph())
  await testRoute('GET /api/network/repeat-offenders', () => getRepeatOffenders())
  await testRoute('GET /api/officers/leaderboard', () => getOfficerLeaderboard())
  await testRoute('GET /api/trends', () => getTrends(new Request('http://localhost/api/trends?type=district')))
  await testRoute('GET /api/trends/crime-types', () => getTrendsCrimeTypes())
  await testRoute('GET /api/trends/district-comparison', () => getTrendsDistrictComp())
  await testRoute('GET /api/trends/monthly', () => getTrendsMonthly())
  await testRoute('GET /api/trends/time-of-day', () => getTrendsTimeOfDay())
  await testRoute('GET /api/briefing', () => getBriefing())
  await testRoute('GET /api/alerts', () => getAlerts())
  await testRoute('GET /api/ticker', () => getTicker())
  await testRoute('GET /api/cross-reference', () => getCrossReference())
  await testRoute('GET /api/ai/anomalies', () => getAiAnomalies())
  await testRoute('GET /api/ai/risk-scores', () => getAiRiskScores())
  await testRoute('GET /api/foundry/status', () => getFoundryStatus())
  await testRoute('GET /api/cases/export', () => getCasesExport(new Request('http://localhost/api/cases/export') as any))

  // Dynamic route tests with real seeded IDs
  await testRoute('GET /api/cases/[caseId]/crack', () => getCaseCrack(new Request('http://localhost'), { params: Promise.resolve({ caseId: realCaseRowid }) }))
  await testRoute('GET /api/cross-reference/[caseId]', () => getCrossRefCase(new Request('http://localhost'), { params: Promise.resolve({ caseId: realCaseRowid }) }))
  await testRoute('GET /api/master/[type]', () => getMasterType(new Request('http://localhost'), { params: Promise.resolve({ type: 'crime-type' }) }))
  await testRoute('GET /api/ai/report', () => getAiReport(new Request(`http://localhost/api/ai/report?caseId=${realCaseRowid}`)))
  await testRoute('GET /api/cold-cases/match', () => getColdCasesMatch(new Request('http://localhost/api/cold-cases/match?crimeType=Robbery')))
  await testRoute('GET /api/patrol/predict', () => getPatrolPredict(new Request('http://localhost/api/patrol/predict?district=Bengaluru%20Urban')))

  // POST route tests
  await testRoute('POST /api/field-fir', () => postFieldFir(new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify({ officerName: 'Test Officer', crimeType: 'Theft', district: 'Bengaluru Urban', place: 'Koramangala', description: 'Test FIR' })
  })))

  await testRoute('POST /api/ai/chat', () => postAiChat(new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify({ question: 'What are high risk areas?' })
  })))

  await testRoute('POST /api/ai/help', () => postAiHelp(new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify({ question: 'How to use field FIR?' })
  })))

  await testRoute('POST /api/fir/voice', () => postFirVoice(new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify({ audioTranscript: 'Chain snatching near Koramangala 4th block' })
  })))

  console.log('\n--- Summary ---')
  console.log(`Unexpected Failures: ${errors.length}`)
  if (errors.length > 0) {
    console.log(JSON.stringify(errors, null, 2))
  }
}

runTests().catch(console.error)
