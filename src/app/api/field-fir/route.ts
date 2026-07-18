import { NextResponse } from 'next/server'

// Simple echo endpoint for field FIR submission validation
// Actual storage is client-side via Zustand store
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { crimeType, district, place, description, priority } = body

    // Basic validation
    if (!crimeType || !district || !place || !description) {
      return NextResponse.json({ error: 'Missing required fields: crimeType, district, place, description' }, { status: 400 })
    }

    const validPriorities = ['Low', 'Medium', 'High', 'Critical']
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Field FIR received for processing' })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Field FIR API — use POST to submit' })
}