import type {
  AIProvider,
  ChatContext,
  ChatResponse,
  BriefingContext,
  BriefingResponse,
  ReportContext,
  ReportResponse,
} from './types'
import { ZaiProvider } from './providers/zai-provider'
import { DatabaseContextRetriever } from './context/retriever'

// Provider factory — currently only z-ai, will add Palantir AIP later
function createProvider(): AIProvider {
  // Future: if (process.env.AI_PROVIDER === 'palantir') return new PalantirAipProvider()
  return new ZaiProvider()
}

// Singleton
let _provider: AIProvider | null = null
let _retriever: DatabaseContextRetriever | null = null

export function getAIProvider(): AIProvider {
  if (!_provider) _provider = createProvider()
  return _provider
}

export function getContextRetriever(): DatabaseContextRetriever {
  if (!_retriever) _retriever = new DatabaseContextRetriever()
  return _retriever
}

// High-level convenience functions
export async function askQuestion(
  question: string,
  history?: Array<{ role: string; content: string }>
): Promise<ChatResponse> {
  const retriever = getContextRetriever()
  const provider = getAIProvider()
  const data = await retriever.retrieve(question)
  return provider.chat({
    data,
    question,
    history: history?.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  })
}

export async function generateBriefing(context: BriefingContext): Promise<BriefingResponse> {
  return getAIProvider().briefing(context)
}

export async function generateReport(context: ReportContext): Promise<ReportResponse> {
  return getAIProvider().report(context)
}