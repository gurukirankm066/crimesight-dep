import type {
  AIProvider,
  ChatContext,
  ChatResponse,
  BriefingContext,
  BriefingResponse,
  ReportContext,
  ReportResponse,
} from '../types'

/**
 * ZaiProvider — AI provider backed by the local z-ai-web-dev-sdk.
 * Implements the AIProvider interface so it can be swapped with Palantir AIP
 * or any other future provider without changing UI or route code.
 */
export class ZaiProvider implements AIProvider {
  readonly name = 'z-ai-local'

  async chat(context: ChatContext): Promise<ChatResponse> {
    const start = performance.now()
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content:
          'You are CrimeSight AI, an intelligence assistant for Karnataka State Police SCRB. Answer concisely using the provided data. Be professional, use numbers. Keep answers under 150 words.',
      },
      { role: 'user', content: `Crime data context: ${context.data}\n\nQuestion: ${context.question}` },
    ]

    // If conversation history is provided, inject it before the final user message
    if (context.history && context.history.length > 0) {
      const historyMessages = context.history.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))
      // Insert history between system and final user message
      messages.splice(1, 0, ...historyMessages)
    }

    const response = await zai.chat.completions.create({ messages })
    const latencyMs = performance.now() - start

    return {
      answer: response.choices[0]?.message?.content || 'Unable to process.',
      provider: this.name,
      latencyMs: Math.round(latencyMs),
    }
  }

  async briefing(context: BriefingContext): Promise<BriefingResponse> {
    const start = performance.now()
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const contextData = JSON.stringify({
      date: context.date,
      kpis: context.kpis,
      hotspots: context.hotspots,
      criticalAlerts: context.criticalAlerts,
      weeklyDelta: context.weeklyDelta,
    })

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are the Morning Intelligence Briefing officer for Karnataka State Police SCRB. Write a crisp, authoritative 3-paragraph executive summary for senior leadership (ADGP/DGP rank).

Paragraph 1: Overall overnight situation — total new FIRs, any heinous crimes, arrest activity.
Paragraph 2: District-level hotspots — name the top 2-3 districts with highest overnight activity and what types of crimes.
Paragraph 3: Week-over-week trend assessment — is crime trending up or down? Any concerning patterns?

Use specific numbers. Be direct and professional — no fluff. Sign off with "— CrimeSight AI, SCRB Karnataka". Keep under 200 words. Do NOT use markdown formatting — plain text only.`,
        },
        {
          role: 'user',
          content: `Generate today's morning intelligence briefing using this data: ${contextData}`,
        },
      ],
    })

    const latencyMs = performance.now() - start

    return {
      executiveSummary: response.choices[0]?.message?.content || '',
      provider: this.name,
      latencyMs: Math.round(latencyMs),
    }
  }

  async report(context: ReportContext): Promise<ReportResponse> {
    const start = performance.now()
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const caseData = JSON.stringify(context)

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a senior crime analyst for Karnataka State Police SCRB. Generate a professional investigation report for the following case.

Provide exactly 4 sections, each clearly labeled with the section name on its own line:

1. CASE SUMMARY — A concise factual summary of the case including what happened, who was involved, and the current status.

2. EVIDENCE & LEGAL BASIS — List the applicable acts and sections, identify key evidence from the brief facts, and note the strength of the legal basis.

3. RISK ASSESSMENT — Assess the severity, likelihood of escalation, public safety implications, and any patterns with similar crimes in the area.

4. RECOMMENDATIONS — Provide 3-5 specific, actionable investigative recommendations prioritized by importance. Include both immediate actions and medium-term strategies.

Use specific details from the case data. Be professional and direct. Do NOT use markdown formatting or headers with # symbols — use the section names as plain text labels followed by a colon.`,
        },
        {
          role: 'user',
          content: `Generate the investigation report for this case: ${caseData}`,
        },
      ],
    })

    const latencyMs = performance.now() - start
    const rawText = response.choices[0]?.message?.content || ''

    // Parse the 4 sections from the LLM output
    const sections = this.parseReportSections(rawText)

    return {
      report: sections,
      provider: this.name,
      latencyMs: Math.round(latencyMs),
    }
  }

  /**
   * Parse the 4 expected report sections from the LLM's plain-text response.
   * Falls back to putting the entire text into summary if parsing fails.
   */
  private parseReportSections(text: string): ReportResponse['report'] {
    const sectionNames = [
      'CASE SUMMARY',
      'EVIDENCE & LEGAL BASIS',
      'EVIDENCE AND LEGAL BASIS',
      'RISK ASSESSMENT',
      'RECOMMENDATIONS',
    ]

    // Build regex to split on section headers
    const pattern = new RegExp(
      `(?=(?:${sectionNames.join('|')})\\s*[—:\\-])`,
      'i'
    )

    const parts = text.split(pattern).filter((s) => s.trim().length > 0)

    const result: ReportResponse['report'] = {
      summary: '',
      evidence: '',
      riskAssessment: '',
      recommendations: '',
    }

    for (const part of parts) {
      const trimmed = part.trim()

      if (/^CASE\s+SUMMARY/i.test(trimmed)) {
        result.summary = trimmed.replace(/^CASE\s+SUMMARY\s*[—:\\-]\s*/i, '').trim()
      } else if (/^EVIDENCE\s*[&AND]+\s*LEGAL\s*BASIS/i.test(trimmed)) {
        result.evidence = trimmed.replace(/^EVIDENCE\s*[&AND]+\s*LEGAL\s*BASIS\s*[—:\\-]\s*/i, '').trim()
      } else if (/^RISK\s+ASSESSMENT/i.test(trimmed)) {
        result.riskAssessment = trimmed.replace(/^RISK\s+ASSESSMENT\s*[—:\\-]\s*/i, '').trim()
      } else if (/^RECOMMENDATIONS/i.test(trimmed)) {
        result.recommendations = trimmed.replace(/^RECOMMENDATIONS\s*[—:\\-]\s*/i, '').trim()
      } else if (!result.summary) {
        // If no sections matched, dump everything into summary
        result.summary = trimmed
      }
    }

    return result
  }
}