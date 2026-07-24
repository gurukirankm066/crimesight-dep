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
    // 1. Fetch suspects grouped by case
    const suspects = await db.suspect.findMany({
      where: {
        suspect_name: {
          notIn: ['Unknown', '']
        }
      },
      take: 100,
    })

    if (suspects.length === 0) {
      return NextResponse.json({ nodes: [], edges: [], stats: { accusedNodes: 0, caseNodes: 0, stationNodes: 0, totalEdges: 0 } })
    }

    // Get case IDs for these suspects
    const caseRowids = [...new Set(suspects.map(s => s.case_rowid))].slice(0, 30)
    
    // Fetch cases and their corresponding police station units
    const cases = await db.caseMaster.findMany({
      where: {
        ROWID: { in: caseRowids }
      }
    })

    const unitRowids = [...new Set(cases.map(c => c.unit_rowid))]
    const units = await db.unit.findMany({
      where: {
        ROWID: { in: unitRowids }
      }
    })

    const unitMap = new Map(units.map(u => [u.ROWID, u]))
    const filteredSuspects = suspects.filter(s => caseRowids.includes(s.case_rowid))

    // Count cases per station
    const stationCaseCount: Record<string, number> = {}
    for (const c of cases) {
      stationCaseCount[c.unit_rowid] = (stationCaseCount[c.unit_rowid] || 0) + 1
    }

    // Count suspects per case
    const suspectPerCaseCount: Record<string, number> = {}
    for (const s of filteredSuspects) {
      suspectPerCaseCount[s.case_rowid] = (suspectPerCaseCount[s.case_rowid] || 0) + 1
    }

    // Count cases per suspect
    const casesPerSuspect: Record<string, number> = {}
    for (const s of filteredSuspects) {
      casesPerSuspect[s.suspect_name] = (casesPerSuspect[s.suspect_name] || 0) + 1
    }

    // Build Graph Nodes & Edges
    const nodes: ApiNode[] = []
    const edges: ApiEdge[] = []
    const nodeSet = new Set<string>()

    function addNode(n: ApiNode) {
      if (!nodeSet.has(n.id)) { nodeSet.add(n.id); nodes.push(n) }
    }

    // Station nodes
    for (const u of units) {
      const id = `station-${u.ROWID}`
      const caseCount = stationCaseCount[u.ROWID] || 1
      addNode({
        id,
        name: u.unit_name,
        type: 'station',
        value: Math.max(3, caseCount) * 1.5,
        cases: caseCount,
        label: u.unit_name,
      })
    }

    // Case nodes
    for (const c of cases) {
      const id = `case-${c.ROWID}`
      const accusedCount = suspectPerCaseCount[c.ROWID] || 1
      addNode({
        id,
        name: c.fir_number || `FIR-${c.ROWID}`,
        type: 'case',
        value: Math.max(3, accusedCount) * 1.2,
        cases: accusedCount,
        subtype: c.occurrence_datetime?.substring(0, 7) || '',
        label: c.fir_number || `FIR #${c.ROWID}`,
      })

      // Case -> Station edge
      if (unitMap.has(c.unit_rowid)) {
        edges.push({ source: id, target: `station-${c.unit_rowid}`, value: 1, type: 'registered-at' })
      }
    }

    // Accused nodes
    const suspectNodeIdMap: Record<string, string> = {}
    for (const s of filteredSuspects) {
      const id = `accused-${s.ROWID}`
      suspectNodeIdMap[s.ROWID] = id
      const caseCount = casesPerSuspect[s.suspect_name] || 1
      addNode({
        id,
        name: s.suspect_name,
        type: 'accused',
        value: Math.max(3, caseCount) * 1.0,
        cases: caseCount,
      })

      // Accused -> Case edge
      edges.push({ source: id, target: `case-${s.case_rowid}`, value: 1, type: 'involved-in' })
    }

    // Co-accused edges (suspects sharing a case)
    const caseToSuspectIds: Record<string, string[]> = {}
    for (const s of filteredSuspects) {
      const nid = suspectNodeIdMap[s.ROWID]
      if (!nid) continue
      if (!caseToSuspectIds[s.case_rowid]) caseToSuspectIds[s.case_rowid] = []
      caseToSuspectIds[s.case_rowid].push(nid)
    }

    for (const [, sids] of Object.entries(caseToSuspectIds)) {
      for (let i = 0; i < sids.length; i++) {
        for (let j = i + 1; j < sids.length; j++) {
          edges.push({ source: sids[i], target: sids[j], value: 1, type: 'co-accused' })
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