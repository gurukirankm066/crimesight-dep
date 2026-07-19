import { listFoundryFirs } from '@/lib/foundry/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Returns read-only FIR data from Foundry. Secrets never leave this server route. */
export async function GET() {
  if (process.env.FOUNDRY_PUBLIC_READ_ONLY_DEMO !== 'true') {
    return new Response(JSON.stringify({ source: 'disabled', message: 'Public Foundry reads are disabled until authenticated access is configured.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    })
  }

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
