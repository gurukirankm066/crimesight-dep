export interface QuickMlConversationResponse {
  reply: string
  provider: 'zoho-quickml'
}

const apiUrl = process.env.NEXT_PUBLIC_QUICKML_CHAT_URL?.replace(/\/$/, '')

export function isQuickMlConversationConfigured() {
  return Boolean(apiUrl)
}

/**
 * Calls a Catalyst Advanced I/O proxy, never QuickML directly. The proxy keeps
 * OAuth credentials private and may be enabled only after QuickML is configured.
 */
export async function askQuickMlConversation(message: string, history: Array<{ role: 'user' | 'ai'; content: string }>) {
  if (!apiUrl) throw new Error('QuickML conversation service is not configured.')

  const response = await fetch(apiUrl, {
    method: 'POST',
    // A simple request avoids a Catalyst gateway preflight before the proxy.
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({ message, history: history.slice(-6) }),
  })

  if (!response.ok) throw new Error(`QuickML conversation service returned ${response.status}.`)
  const data = await response.json() as Partial<QuickMlConversationResponse>
  if (!data.reply) throw new Error('QuickML conversation service returned no reply.')
  return { reply: data.reply, provider: 'zoho-quickml' as const }
}
