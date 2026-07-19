import type { ContextRetriever } from '../types'
import { db } from '@/lib/db'
import { getCrimeTypes, getDistricts } from '@/lib/dal'

/** Retrieves only schema-valid, aggregated context for the prototype assistant. */
export class DatabaseContextRetriever implements ContextRetriever {
  async retrieve(question: string): Promise<string> {
    const q = question.toLowerCase()
    const cases = await db.caseMaster.findMany({ select: { district_rowid: true, crime_type_rowid: true, case_status: true, case_priority: true } })
    const [districts, crimeTypes] = await Promise.all([getDistricts(), getCrimeTypes()])

    if (q.includes('district') || q.includes('area') || q.includes('region')) {
      const totals = new Map<string, number>()
      for (const c of cases) totals.set(c.district_rowid, (totals.get(c.district_rowid) ?? 0) + 1)
      return `District case totals: ${JSON.stringify([...totals.entries()].map(([id, total]) => ({ district: districts.get(id)?.district_name ?? 'Unknown', total })).sort((a, b) => b.total - a.total).slice(0, 10))}`
    }
    if (q.includes('crime type') || q.includes('theft') || q.includes('murder') || q.includes('assault') || q.includes('robbery') || q.includes('cyber') || q.includes('type')) {
      const totals = new Map<string, number>()
      for (const c of cases) totals.set(c.crime_type_rowid, (totals.get(c.crime_type_rowid) ?? 0) + 1)
      return `Crime type distribution: ${JSON.stringify([...totals.entries()].map(([id, count]) => ({ crimeType: crimeTypes.get(id)?.crime_type_name ?? 'Unknown', count })).sort((a, b) => b.count - a.count))}`
    }
    const [arrests, chargesheets] = await Promise.all([db.arrestSurrender.count(), db.chargesheet.count()])
    const active = cases.filter(c => c.case_status === 'Open' || c.case_status === 'Under Investigation').length
    const critical = cases.filter(c => c.case_priority === 'Critical').length
    return `Prototype FIRs: ${cases.length}, active investigations: ${active}, critical-priority cases: ${critical}, arrests: ${arrests}, chargesheets: ${chargesheets}.`
  }
}
