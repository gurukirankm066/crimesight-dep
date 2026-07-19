import { listFoundryFirs } from '@/lib/foundry/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Returns read-only FIR data from Foundry. Secrets never leave this server route. */
export async function GET() {
  try {
    const result = await listFoundryFirs()
    return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Foundry FIR sync failed'
    return new Response(JSON.stringify({ source: 'unavailable', message }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    })
  }
}
