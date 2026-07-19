import { NextResponse } from 'next/server'
import { getFoundryReadiness } from '@/lib/foundry/ontology'

/** Safe readiness endpoint: it never returns hosts, tokens, client IDs, or secrets. */
export async function GET() {
  return NextResponse.json(getFoundryReadiness())
}
