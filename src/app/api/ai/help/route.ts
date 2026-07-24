import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const question = body.question || body.query
    const { history, currentTab } = body
    if (!question) return Response.json({ answer: 'Please ask a question.' }, { status: 400 })

    const contextNote = currentTab
      ? `\n\nThe user is currently viewing the "${currentTab}" module. Tailor your help to this context when relevant.`
      : ''

    const zai = await ZAI.create()
    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant for CrimeSight AI, the Karnataka State Police crime intelligence dashboard. Provide brief, helpful answers about how to use the system.${contextNote}`,
        },
        ...(history || []).map((m: { role: string; content: string }) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        { role: 'user', content: question },
      ],
    })

    return Response.json({ answer: response.choices[0]?.message?.content || 'Unable to help right now.' })
  } catch (error: any) {
    return Response.json({ answer: 'Help service temporarily unavailable.' })
  }
}