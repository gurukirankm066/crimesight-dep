import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getDistricts, getCrimeTypes } from '@/lib/dal'

export async function GET() {
  try {
    const [suspects, cases, districts, crimeTypes] = await Promise.all([
      db.suspect.findMany({
        select: { ROWID: true, case_rowid: true, suspect_name: true, arrest_status: true, is_repeat_offender: true },
      }),
      db.caseMaster.findMany({
        select: { ROWID: true, crime_type_rowid: true, case_status: true, district_rowid: true },
      }),
      getDistricts(),
      getCrimeTypes(),
    ])

    const caseMap = Object.fromEntries(cases.map(c => [c.ROWID, c]))

    // Group suspects by name
    const personMap = new Map<string, {
      name: string
      caseIds: Set<string>
      isRepeat: boolean
      hasArrest: boolean
      arrestStatuses: Set<string>
      crimeTypeIds: Set<string>
      districtIds: Set<string>
    }>()

    for (const s of suspects) {
      if (!s.suspect_name || s.suspect_name === 'Unknown') continue
      let person = personMap.get(s.suspect_name)
      if (!person) {
        person = {
          name: s.suspect_name,
          caseIds: new Set(),
          isRepeat: false,
          hasArrest: false,
          arrestStatuses: new Set(),
          crimeTypeIds: new Set(),
          districtIds: new Set(),
        }
        personMap.set(s.suspect_name, person)
      }
      person.caseIds.add(s.case_rowid)
      if (s.is_repeat_offender) person.isRepeat = true
      if (s.arrest_status === 'Arrested') person.hasArrest = true
      person.arrestStatuses.add(s.arrest_status)

      const c = caseMap[s.case_rowid]
      if (c) {
        if (c.crime_type_rowid) person.crimeTypeIds.add(c.crime_type_rowid)
        if (c.district_rowid) person.districtIds.add(c.district_rowid)
      }
    }

    const criminals = Array.from(personMap.values())
      .map(p => {
        const caseArr = Array.from(p.caseIds)
        const openCases = caseArr.filter(id => caseMap[id]?.case_status === 'Under Investigation').length
        const threatScore = (caseArr.length * 2) + (openCases * 3) + (p.isRepeat ? 5 : 0)
        const topCharges = Array.from(p.crimeTypeIds)
          .map(id => crimeTypes.get(id)?.crime_type_name)
          .filter(Boolean)
          .slice(0, 3) as string[]
        const districtId = Array.from(p.districtIds)[0]
        const district = districtId ? districts.get(districtId)?.district_name || 'Unknown' : 'Unknown'

        return {
          name: p.name,
          caseCount: caseArr.length,
          openCases,
          threatScore,
          status: p.hasArrest ? 'In Custody' : 'At Large',
          topCharges,
          district,
        }
      })
      .sort((a, b) => b.threatScore - a.threatScore)
      .slice(0, 50)

    const maxScore = criminals.length > 0 ? criminals[0].threatScore : 1

    return NextResponse.json({ criminals, maxScore })
  } catch (error: any) {
    console.error('[GET /api/most-wanted]', error)
    return NextResponse.json({ criminals: [], maxScore: 1 })
  }
}