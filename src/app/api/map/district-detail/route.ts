import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { clearLookups, getDistricts, getCrimeTypes, enrichCases } from '@/lib/dal'

/**
 * Extract area/city name from a place_of_occurrence string.
 * Format: "H.No. 40, Sehgal Street, Amritsar 656299"
 * The last comma-separated segment contains "CityName Pincode" or "CityName-Pincode".
 * We strip the trailing pincode (digits or dash+digits) to get the area name.
 */
function extractArea(place: string): string {
  const parts = place.split(', ')
  const lastPart = parts[parts.length - 1] || place
  // Remove trailing pincode: dash+digits or space+digits at end of string
  const cleaned = lastPart.replace(/[\s-]\d{5,8}\s*$/, '').trim()
  return cleaned || lastPart.trim()
}

export async function GET(req: NextRequest) {
  try {
    clearLookups()

    const districtName = req.nextUrl.searchParams.get('district')
    if (!districtName) {
      return NextResponse.json({ error: 'Missing district query parameter' }, { status: 400 })
    }

    // Look up the district by display name
    const districts = await getDistricts()
    let matchedDistrictId: string | null = null
    for (const [, d] of districts) {
      if (d.district_name === districtName) {
        matchedDistrictId = d.ROWID
        break
      }
    }
    if (!matchedDistrictId) {
      return NextResponse.json(
        { error: `District "${districtName}" not found` },
        { status: 404 }
      )
    }

    // Fetch cases and police stations in parallel
    const [rawCases, policeStations] = await Promise.all([
      db.caseMaster.findMany({
        where: { district_rowid: matchedDistrictId },
        select: {
          fir_number: true,
          place_of_occurrence: true,
          latitude: true,
          longitude: true,
          case_priority: true,
          case_status: true,
          crime_type_rowid: true,
          occurrence_datetime: true,
        },
      }),
      db.unit.findMany({
        where: { district_rowid: matchedDistrictId },
        select: {
          unit_name: true,
          unit_type: true,
          address: true,
          latitude: true,
          longitude: true,
        },
      }),
    ])

    // Enrich cases with crime type names
    const cases = await enrichCases(rawCases)

    // Build location clusters from place_of_occurrence
    const clusterMap = new Map<string, {
      area: string
      cases: { fir: string; lat: string; lng: string }[]
    }>()

    for (const c of cases) {
      const area = extractArea(c.place_of_occurrence || '')
      if (!clusterMap.has(area)) {
        clusterMap.set(area, { area, cases: [] })
      }
      clusterMap.get(area)!.cases.push({
        fir: c.fir_number,
        lat: c.latitude,
        lng: c.longitude,
      })
    }

    const locationClusters = Array.from(clusterMap.values())
      .map((cluster) => {
        const totalLat = cluster.cases.reduce((sum, c) => sum + parseFloat(c.lat || '0'), 0)
        const totalLng = cluster.cases.reduce((sum, c) => sum + parseFloat(c.lng || '0'), 0)
        const count = cluster.cases.length
        return {
          area: cluster.area,
          caseCount: count,
          lat: (totalLat / count).toFixed(2),
          lng: (totalLng / count).toFixed(2),
          cases: cluster.cases.map((c) => c.fir),
        }
      })
      .sort((a, b) => b.caseCount - a.caseCount)

    // Format cases for response
    const formattedCases = cases.map((c) => {
      const dt = c.occurrence_datetime
        ? c.occurrence_datetime.substring(0, 10)
        : null
      return {
        fir: c.fir_number,
        place: c.place_of_occurrence,
        latitude: c.latitude,
        longitude: c.longitude,
        crimeType: c.crime_type_name,
        priority: c.case_priority,
        status: c.case_status,
        date: dt,
      }
    })

    // Format police stations for response
    const formattedStations = policeStations.map((s) => ({
      name: s.unit_name,
      type: s.unit_type,
      address: s.address,
      latitude: s.latitude,
      longitude: s.longitude,
    }))

    return NextResponse.json({
      district: districtName,
      totalCases: cases.length,
      cases: formattedCases,
      policeStations: formattedStations,
      locationClusters,
    })
  } catch (error) {
    console.error('[GET /api/map/district-detail]', error)
    const districtParam = req.nextUrl.searchParams.get('district') || ''
    return NextResponse.json({ district: districtParam, totalCases: 0, cases: [], policeStations: [], locationClusters: [] })
  }
}