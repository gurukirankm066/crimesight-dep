import { NextResponse } from 'next/server'
import { listFoundryFirs } from '@/lib/foundry/client'

/** Returns read-only FIR data from Foundry. Secrets never leave this server route. */
export async function GET() {
  try {
    const result = await listFoundryFirs()
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Foundry FIR sync failed'
    return NextResponse.json({ source: 'unavailable', message }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
