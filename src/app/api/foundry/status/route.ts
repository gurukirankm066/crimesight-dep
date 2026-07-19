import { getFoundryReadiness } from '@/lib/foundry/ontology'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Safe readiness endpoint: it never returns hosts, tokens, client IDs, or secrets. */
export async function GET() {
  return new Response(JSON.stringify(getFoundryReadiness()), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}
