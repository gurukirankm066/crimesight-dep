import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: Request) {
  try {
    const { messages, question, history } = await request.json()

    // Support both { messages: [...] } and { question, history } formats
    let chatMessages = messages
    if (!chatMessages && question) {
      chatMessages = [
        ...(history || []).map((m: { role: string; content: string }) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        { role: 'user', content: question },
      ]
    }

    if (!chatMessages?.length) {
      return Response.json({ error: 'No messages provided' }, { status: 400 })
    }

    const zai = await ZAI.create()
    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are CrimeSight AI, an intelligent crime analysis assistant for Karnataka State Police. Provide concise, professional responses about crime data, patterns, and investigations. Use data from the context when available.',
        },
        ...chatMessages,
      ],
    })

    const reply = response.choices[0]?.message?.content || 'Unable to generate response.'
    return Response.json({ reply })
  } catch (error: any) {
    return Response.json({ reply: `AI service temporarily unavailable. Error: ${error.message}` })
  }
}