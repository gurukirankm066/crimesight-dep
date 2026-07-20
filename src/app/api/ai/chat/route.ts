import { runGovernedFirQuery } from '@/lib/query-copilot'

export async function POST(request: Request) {
  try {
    const { messages, question } = await request.json()
    const latestMessage = question ?? messages?.filter((message: { role?: string }) => message.role === 'user').at(-1)?.content

    if (typeof latestMessage !== 'string' || !latestMessage.trim()) {
      return Response.json({ error: 'No question provided' }, { status: 400 })
    }

    // Controlled dataset query: no generated SQL and no unverified model answer.
    // This keeps the prototype reproducible and makes each answer explainable.
    return Response.json(runGovernedFirQuery(latestMessage), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return Response.json({
      reply: 'The governed query service is temporarily unavailable. Please retry your FIR question.',
      intent: 'unsupported',
      filters: ['Service unavailable'],
      resultCount: 0,
      totalDatasetCount: 0,
      cases: [],
      confidence: 'Needs clarification',
      queryId: 'QRY-UNAVAILABLE',
      dataBoundary: 'Synthetic demo dataset only — not live operational police data.',
    }, { status: 503 })
  }
}
