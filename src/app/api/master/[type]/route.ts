import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const MODEL_MAP: Record<string, any> = {
  rank: db.rank, designation: db.designation, 'user-role': db.userRole,
  'crime-type': db.crimeType, 'crime-category': db.crimeCategory,
  act: db.act, section: db.section, 'evidence-type': db.evidenceType,
  'vehicle-type': db.vehicleType, district: db.district, unit: db.unit,
}

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await params
    const model = MODEL_MAP[type]
    if (!model) return NextResponse.json({ error: `Unknown type: ${type}. Valid: ${Object.keys(MODEL_MAP).join(', ')}` }, { status: 400 })
    const data = await model.findMany()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[GET /api/master/[type]]', error)
    return NextResponse.json([])
  }
}