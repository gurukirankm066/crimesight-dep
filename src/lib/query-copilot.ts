import { GENERATED_CASES, type GeneratedCase } from '@/lib/case-generator'

export interface QueryCopilotCase {
  id: string
  fir: string
  crimeType: string
  district: string
  priority: string
  status: string
  riskScore: number
  occurrenceDate: string
  repeatPattern: boolean
}

export interface QueryCopilotResponse {
  reply: string
  intent: 'case-search' | 'aggregate' | 'unsupported'
  filters: string[]
  resultCount: number
  totalDatasetCount: number
  cases: QueryCopilotCase[]
  confidence: 'Verified dataset query' | 'Needs clarification'
  queryId: string
  dataBoundary: string
}

const DISTRICTS = [...new Set(GENERATED_CASES.map(item => item.district))]

const CRIME_ALIASES: Array<{ term: string; match: (item: GeneratedCase) => boolean; label: string }> = [
  { term: 'cyber', match: item => item.crimeCategory === 'Cyber', label: 'Cyber crime' },
  { term: 'theft', match: item => item.crimeType.toLowerCase().includes('theft'), label: 'Theft' },
  { term: 'assault', match: item => item.crimeType.toLowerCase().includes('assault'), label: 'Assault' },
  { term: 'cheating', match: item => item.crimeType.toLowerCase().includes('cheating'), label: 'Cheating' },
  { term: 'fraud', match: item => item.crimeType.toLowerCase().includes('fraud'), label: 'Fraud' },
  { term: 'burglary', match: item => item.crimeType.toLowerCase().includes('burglary'), label: 'Burglary' },
  { term: 'robbery', match: item => item.crimeType.toLowerCase().includes('robbery'), label: 'Robbery' },
  { term: 'chain snatching', match: item => item.crimeType.toLowerCase().includes('chain snatching'), label: 'Chain snatching' },
  { term: 'kidnapping', match: item => item.crimeType.toLowerCase().includes('kidnapping'), label: 'Kidnapping' },
  { term: 'murder', match: item => item.crimeType.toLowerCase().includes('murder'), label: 'Murder' },
]

function titleCase(value: string) {
  return value.replace(/\b\w/g, character => character.toUpperCase())
}

function createQueryId() {
  return `QRY-${Date.now().toString(36).toUpperCase()}`
}

function toResult(item: GeneratedCase): QueryCopilotCase {
  return {
    id: item.rowid,
    fir: item.fir,
    crimeType: item.crimeType,
    district: item.district,
    priority: item.priority,
    status: item.status,
    riskScore: item.riskScore,
    occurrenceDate: item.occurrenceDate.slice(0, 10),
    repeatPattern: item.hasRepeatOffender,
  }
}

function unsupported(reply: string): QueryCopilotResponse {
  return {
    reply,
    intent: 'unsupported',
    filters: ['Governed query boundary'],
    resultCount: 0,
    totalDatasetCount: GENERATED_CASES.length,
    cases: [],
    confidence: 'Needs clarification',
    queryId: createQueryId(),
    dataBoundary: 'Synthetic demo dataset only — not live operational police data.',
  }
}

/**
 * Keeps the governed data boundary explicit. Conversation is handled by the
 * assistant layer, while only FIR-intelligence questions reach this
 * deterministic query compiler.
 */
export function isGovernedFirQuestion(input: string) {
  return /(fir|case|crime|district|theft|cyber|assault|fraud|burglary|robbery|repeat|open|closed|investigation|risk|count|show|how many|most common|highest)/.test(input.trim().toLowerCase())
}

/**
 * Controlled natural-language query layer for the synthetic FIR prototype.
 * It never executes user-provided SQL; every question is compiled to an
 * allow-listed set of filters over the reproducible demo dataset.
 */
export function runGovernedFirQuery(input: string): QueryCopilotResponse {
  const question = input.trim().toLowerCase()
  if (!question) return unsupported('Ask about FIRs, districts, crime types, case status, priority, or repeat-pattern signals.')

  if (!isGovernedFirQuestion(question)) {
    return unsupported('I can safely answer FIR and crime-pattern questions from this synthetic dataset. Try: “Show high-risk cybercrime FIRs in Mysuru.”')
  }

  const filters: string[] = []
  let filtered = GENERATED_CASES

  const district = DISTRICTS.find(value => question.includes(value.toLowerCase()))
  if (district) {
    filtered = filtered.filter(item => item.district === district)
    filters.push(`District: ${district}`)
  }

  const crime = CRIME_ALIASES.find(value => question.includes(value.term))
  if (crime) {
    filtered = filtered.filter(crime.match)
    filters.push(`Crime: ${crime.label}`)
  }

  if (/(critical|high[- ]?risk|high[- ]?priority)/.test(question)) {
    filtered = filtered.filter(item => item.priority === 'Critical' || item.priority === 'High')
    filters.push('Priority: High or Critical')
  } else if (/medium/.test(question)) {
    filtered = filtered.filter(item => item.priority === 'Medium')
    filters.push('Priority: Medium')
  } else if (/low[- ]?priority|low risk/.test(question)) {
    filtered = filtered.filter(item => item.priority === 'Low')
    filters.push('Priority: Low')
  }

  if (/under investigation|investigat/.test(question)) {
    filtered = filtered.filter(item => item.status === 'Under Investigation')
    filters.push('Status: Under Investigation')
  } else if (/charge.?sheet/.test(question)) {
    filtered = filtered.filter(item => item.status === 'Charge Sheet Filed')
    filters.push('Status: Charge Sheet Filed')
  } else if (/\bclosed\b/.test(question)) {
    filtered = filtered.filter(item => item.status === 'Closed')
    filters.push('Status: Closed')
  } else if (/\bopen\b/.test(question)) {
    filtered = filtered.filter(item => item.status === 'Open')
    filters.push('Status: Open')
  }

  if (/repeat/.test(question)) {
    filtered = filtered.filter(item => item.hasRepeatOffender)
    filters.push('Signal: Repeat identifier present')
  }

  const periodMatch = question.match(/(?:last|past)\s+(7|30|90)\s+days?/)
  if (periodMatch) {
    const days = Number(periodMatch[1])
    filtered = filtered.filter(item => item.daysAgo <= days)
    filters.push(`Period: Last ${days} days`)
  }

  const wantsMostCommon = /most common|highest.*crime|top crime/.test(question)
  const wantsCount = /how many|count|number of|total/.test(question)
  const sorted = [...filtered].sort((left, right) => right.riskScore - left.riskScore || left.daysAgo - right.daysAgo)
  const queryId = createQueryId()

  if (wantsMostCommon) {
    if (!filtered.length) {
      return { reply: 'No matching FIRs were found for those filters.', intent: 'aggregate', filters, resultCount: 0, totalDatasetCount: GENERATED_CASES.length, cases: [], confidence: 'Verified dataset query', queryId, dataBoundary: 'Synthetic demo dataset only — not live operational police data.' }
    }
    const counts = new Map<string, number>()
    filtered.forEach(item => counts.set(item.crimeType, (counts.get(item.crimeType) ?? 0) + 1))
    const [crimeType, count] = [...counts.entries()].sort((left, right) => right[1] - left[1])[0]
    return {
      reply: `**${crimeType}** is the most common matching crime type, with **${count.toLocaleString()} FIRs** out of ${filtered.length.toLocaleString()} verified matching records.`,
      intent: 'aggregate', filters: filters.length ? filters : ['All districts · all crime types'], resultCount: filtered.length, totalDatasetCount: GENERATED_CASES.length, cases: sorted.slice(0, 5).map(toResult), confidence: 'Verified dataset query', queryId, dataBoundary: 'Synthetic demo dataset only — not live operational police data.',
    }
  }

  const noun = filtered.length === 1 ? 'FIR' : 'FIRs'
  const reply = wantsCount
    ? `I found **${filtered.length.toLocaleString()} ${noun}** matching the verified filters below.`
    : filtered.length
      ? `I found **${filtered.length.toLocaleString()} ${noun}**. The highest-risk matching records are shown below for human review.`
      : 'No matching FIRs were found for those filters. Try changing the district, crime type, status, or time period.'

  return {
    reply,
    intent: wantsCount ? 'aggregate' : 'case-search',
    filters: filters.length ? filters : ['All districts · all crime types'],
    resultCount: filtered.length,
    totalDatasetCount: GENERATED_CASES.length,
    cases: sorted.slice(0, 5).map(toResult),
    confidence: 'Verified dataset query',
    queryId,
    dataBoundary: 'Synthetic demo dataset only — not live operational police data.',
  }
}
