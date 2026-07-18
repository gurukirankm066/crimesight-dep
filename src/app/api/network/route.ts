import { db, serialize } from '@/lib/db'
import { NextResponse } from 'next/server'

interface ApiNode {
  id: string
  name: string
  type: 'accused' | 'case' | 'station'
  cases?: number
  value: number
  subtype?: string
  label?: string
}

interface ApiEdge {
  source: string
  target: string
  value: number
  type: string
}

export async function GET() {
  try {
    // Pick 30 cases with the most accused (richest connections)
    const richCases = await db.$queryRawUnsafe(`
      SELECT c.CaseMasterID, c.CrimeNo, c.CrimeRegisteredDate, c.PoliceStationID,
             COUNT(a.AccusedMasterID) as accusedCount
      FROM CaseMaster c
      JOIN Accused a ON c.CaseMasterID = a.CaseMasterID
      WHERE a.AccusedName != 'Unknown'
      GROUP BY c.CaseMasterID
      ORDER BY accusedCount DESC
      LIMIT 30
    `) as { CaseMasterID: bigint; CrimeNo: string; CrimeRegisteredDate: string; PoliceStationID: bigint; accusedCount: bigint }[]

    const caseIds = richCases.map(c => Number(c.CaseMasterID))
    if (caseIds.length === 0) return NextResponse.json({ nodes: [], edges: [], stats: { accusedNodes: 0, caseNodes: 0, stationNodes: 0, totalEdges: 0 } })

    // All accused from those cases (deduplicated by AccusedMasterID)
    const accused = await db.$queryRawUnsafe(`
      SELECT a.AccusedMasterID, a.AccusedName, a.CaseMasterID
      FROM Accused a
      WHERE a.CaseMasterID IN (${caseIds.join(',')})
        AND a.AccusedName != 'Unknown'
    `) as { AccusedMasterID: bigint; AccusedName: string; CaseMasterID: bigint }[]

    // Station IDs
    const stationIds = [...new Set(richCases.map(c => Number(c.PoliceStationID)))]
    const stations = stationIds.length > 0 ? await db.$queryRawUnsafe(`
      SELECT UnitID, UnitName
      FROM Unit
      WHERE UnitID IN (${stationIds.join(',')})
    `) as { UnitID: bigint; UnitName: string }[] : []

    // Cases per station for sizing
    const stationCaseCount: Record<number, number> = {}
    for (const c of richCases) {
      const sid = Number(c.PoliceStationID)
      stationCaseCount[sid] = (stationCaseCount[sid] || 0) + 1
    }

    // Accused per case count
    const accusedPerCase: Record<number, number> = {}
    for (const c of richCases) accusedPerCase[Number(c.CaseMasterID)] = Number(c.accusedCount)

    // Cases per accused
    const casesPerAccused: Record<number, number> = {}
    for (const a of accused) {
      const aid = Number(a.AccusedMasterID)
      casesPerAccused[aid] = (casesPerAccused[aid] || 0) + 1
    }

    // === BUILD GRAPH ===
    const nodes: ApiNode[] = []
    const edges: ApiEdge[] = []
    const nodeSet = new Set<string>()

    function addNode(n: ApiNode) {
      if (!nodeSet.has(n.id)) { nodeSet.add(n.id); nodes.push(n) }
    }

    // Station nodes (bottom layer)
    const stationNodeIdMap: Record<number, string> = {}
    for (const s of stations) {
      const sid = Number(s.UnitID)
      const id = `station-${sid}`
      stationNodeIdMap[sid] = id
      addNode({
        id,
        name: s.UnitName,
        type: 'station',
        value: Math.max(3, (stationCaseCount[sid] || 1)) * 1.5,
        cases: stationCaseCount[sid] || 1,
        label: s.UnitName,
      })
    }

    // Case nodes (middle layer)
    const caseNodeIdMap: Record<number, string> = {}
    for (const c of richCases) {
      const cid = Number(c.CaseMasterID)
      const id = `case-${cid}`
      caseNodeIdMap[cid] = id
      const accusedCount = accusedPerCase[cid] || 1
      addNode({
        id,
        name: c.CrimeNo || `FIR-${cid}`,
        type: 'case',
        value: Math.max(3, accusedCount) * 1.2,
        cases: accusedCount,
        subtype: c.CrimeRegisteredDate?.substring(0, 7) || '',
        label: c.CrimeNo || `FIR #${cid}`,
      })
      // Case → Station edge
      const sId = stationNodeIdMap[Number(c.PoliceStationID)]
      if (sId) edges.push({ source: id, target: sId, value: 1, type: 'registered-at' })
    }

    // Accused nodes (top layer)
    const accusedNodeIdMap: Record<number, string> = {}
    for (const a of accused) {
      const aid = Number(a.AccusedMasterID)
      if (accusedNodeIdMap[aid]) continue
      const id = `accused-${aid}`
      accusedNodeIdMap[aid] = id
      const caseCount = casesPerAccused[aid] || 1
      addNode({
        id,
        name: a.AccusedName,
        type: 'accused',
        value: Math.max(3, caseCount) * 1.0,
        cases: caseCount,
      })
      // Accused → Case edge
      const cId = caseNodeIdMap[Number(a.CaseMasterID)]
      if (cId) edges.push({ source: id, target: cId, value: 1, type: 'involved-in' })
    }

    // Co-accused edges (accused sharing a case → subtle connection)
    const caseToAccusedIds: Record<number, string[]> = {}
    for (const a of accused) {
      const cid = Number(a.CaseMasterID)
      const aid = accusedNodeIdMap[Number(a.AccusedMasterID)]
      if (!aid) continue
      if (!caseToAccusedIds[cid]) caseToAccusedIds[cid] = []
      caseToAccusedIds[cid].push(aid)
    }
    for (const [, aids] of Object.entries(caseToAccusedIds)) {
      for (let i = 0; i < aids.length; i++) {
        for (let j = i + 1; j < aids.length; j++) {
          edges.push({ source: aids[i], target: aids[j], value: 1, type: 'co-accused' })
        }
      }
    }

    const stats = {
      accusedNodes: nodes.filter(n => n.type === 'accused').length,
      caseNodes: nodes.filter(n => n.type === 'case').length,
      stationNodes: nodes.filter(n => n.type === 'station').length,
      totalEdges: edges.length,
    }

    return NextResponse.json(serialize({ nodes, edges, stats }))
  } catch (error: any) {
    console.error('[GET /api/network]', error)
    return NextResponse.json({ nodes: [], edges: [], stats: { accusedNodes: 0, caseNodes: 0, stationNodes: 0, totalEdges: 0 } })
  }
}