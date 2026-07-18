import type { ContextRetriever } from '../types'
import { db, serialize } from '@/lib/db'

/**
 * DatabaseContextRetriever — keyword-based context retrieval from the crime database.
 * Matches user questions against known keywords to run targeted SQL queries
 * and return structured data for LLM consumption.
 */
export class DatabaseContextRetriever implements ContextRetriever {
  async retrieve(question: string): Promise<string> {
    const q = question.toLowerCase()
    let contextData = ''

    if (q.includes('district') || q.includes('area') || q.includes('region') || q.includes('which')) {
      const raw = await db.$queryRawUnsafe(`
        SELECT d.DistrictName, COUNT(c.CaseMasterID) as total,
               SUM(CASE WHEN c.CaseStatusID = 1 THEN 1 ELSE 0 END) as active,
               SUM(CASE WHEN c.GravityOffenceID = 1 THEN 1 ELSE 0 END) as heinous
        FROM CaseMaster c
        JOIN Unit u ON c.PoliceStationID = u.UnitID
        JOIN District d ON u.DistrictID = d.DistrictID
        GROUP BY d.DistrictID ORDER BY total DESC LIMIT 10
      `)
      const rows = serialize(raw)
      contextData = 'District crime data (top 10): ' + JSON.stringify(rows)
    } else if (q.includes('crime type') || q.includes('theft') || q.includes('murder') || q.includes('assault') || q.includes('robbery') || q.includes('cyber') || q.includes('type')) {
      const raw = await db.$queryRawUnsafe(`
        SELECT ch.CrimeGroupName, COUNT(*) as count
        FROM CaseMaster c JOIN CrimeHead ch ON c.CrimeMajorHeadID = ch.CrimeHeadID
        GROUP BY ch.CrimeHeadID ORDER BY count DESC
      `)
      const rows = serialize(raw)
      contextData = 'Crime type distribution: ' + JSON.stringify(rows)
    } else if (q.includes('most wanted') || q.includes('repeat') || q.includes('offender') || q.includes('criminal') || q.includes('dangerous')) {
      const raw = await db.$queryRawUnsafe(`
        SELECT a.AccusedName, COUNT(DISTINCT a.CaseMasterID) as cases,
               COUNT(ar.ArrestSurrenderID) as arrests
        FROM Accused a
        LEFT JOIN ArrestSurrender ar ON ar.AccusedMasterID = a.AccusedMasterID
        GROUP BY a.AccusedMasterID HAVING cases >= 2
        ORDER BY cases DESC LIMIT 10
      `)
      const rows = serialize(raw)
      contextData = 'Repeat offenders (top 10): ' + JSON.stringify(rows)
    } else if (q.includes('arrest') || q.includes('charge') || q.includes('convict')) {
      const total = await db.caseMaster.count()
      const arrests = await db.arrestSurrender.count()
      const cs = await db.chargesheetDetails.count()
      contextData = `Total FIRs: ${total}, Arrests made: ${arrests} (${((arrests / total) * 100).toFixed(1)}%), Chargesheets filed: ${cs} (${((cs / total) * 100).toFixed(1)}%)`
    } else {
      const total = await db.caseMaster.count()
      const active = await db.caseMaster.count({ where: { CaseStatusID: 1 } })
      const arrests = await db.arrestSurrender.count()
      const cs = await db.chargesheetDetails.count()
      const heinous = await db.caseMaster.count({ where: { GravityOffenceID: 1 } })
      contextData = `Total FIRs: ${total}, Under Investigation: ${active}, Arrests: ${arrests}, Chargesheets: ${cs}, Heinous crimes: ${heinous}`
    }

    return contextData
  }
}