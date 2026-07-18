// Types for the AI service abstraction layer
// This is the contract that any AI provider must fulfill

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatContext {
  /** Structured data retrieved from the database before calling the LLM */
  data: string
  /** The user's question */
  question: string
  /** Optional conversation history */
  history?: ChatMessage[]
}

export interface ChatResponse {
  answer: string
  /** Which provider was used */
  provider: string
  /** Latency in ms */
  latencyMs: number
}

export interface BriefingContext {
  date: string
  kpis: Record<string, number>
  hotspots: Array<{ district: string; cases: number; heinous: number }>
  criticalAlerts: number
  weeklyDelta: string
  crimeTypeTrends: Array<{ name: string; thisWeek: number; lastWeek: number }>
}

export interface BriefingResponse {
  executiveSummary: string
  provider: string
  latencyMs: number
}

export interface ReportContext {
  caseNo: string
  crimeNo: string
  district: string
  station: string
  crimeHead: string
  crimeCategory: string
  gravity: string
  status: string
  registeredDate: string
  incidentDate: string | null
  briefFacts: string | null
  actsAndSections: string
  complainants: string
  victims: string
  accused: string
  arrests: string
  chargesheets: string
  investigatingOfficer: string
  court: string | null
  timeline: string
}

export interface ReportResponse {
  report: {
    summary: string
    evidence: string
    riskAssessment: string
    recommendations: string
  }
  provider: string
  latencyMs: number
}

/** The core AI provider interface */
export interface AIProvider {
  readonly name: string

  /** Answer a natural language question with database context */
  chat(context: ChatContext): Promise<ChatResponse>

  /** Generate a morning intelligence briefing */
  briefing(context: BriefingContext): Promise<BriefingResponse>

  /** Generate a case investigation report */
  report(context: ReportContext): Promise<ReportResponse>
}

/** Context retrieval strategy — how to get data from the DB for a given question */
export interface ContextRetriever {
  /** Given a user question, fetch relevant data from the DB */
  retrieve(question: string): Promise<string>
}