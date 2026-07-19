import 'server-only'

type FoundryOntology = { apiName: string; rid?: string }
type FoundryObjectType = { apiName: string }
type FoundryObject = Record<string, unknown>

export type FoundryFir = {
  id: string
  fir: string
  crimeType: string
  crimeCategory: string
  district: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  status: string
  occurrenceDate: string
  riskScore: number
  isSensitive: boolean
  hasRepeatOffender: boolean
}

export type FoundryFirSync = {
  source: 'foundry'
  ontology: string
  syncedAt: string
  data: FoundryFir[]
}

function config() {
  const baseUrl = process.env.FOUNDRY_BASE_URL?.replace(/\/$/, '')
  const token = process.env.FOUNDRY_API_TOKEN
  if (!baseUrl || !token) throw new Error('Foundry token connection is not configured')
  return { baseUrl, token }
}

async function foundryFetch(path: string) {
  const { baseUrl, token } = config()
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Foundry returned ${response.status}`)
  return response.json() as Promise<{ data?: unknown[] }>
}

function value(record: FoundryObject, ...names: string[]) {
  for (const name of names) {
    const candidate = record[name]
    if (candidate !== undefined && candidate !== null && candidate !== '') return candidate
  }
  return undefined
}

function text(record: FoundryObject, ...names: string[]) {
  const candidate = value(record, ...names)
  return candidate === undefined ? '' : String(candidate)
}

function bool(record: FoundryObject, ...names: string[]) {
  const candidate = value(record, ...names)
  return candidate === true || candidate === 'true' || candidate === 1 || candidate === '1'
}

function priority(record: FoundryObject): FoundryFir['priority'] {
  const candidate = text(record, 'priority', 'Priority').toLowerCase()
  if (candidate === 'critical') return 'Critical'
  if (candidate === 'high') return 'High'
  if (candidate === 'low') return 'Low'
  return 'Medium'
}

async function findOntologyAndFirType() {
  const requestedOntology = process.env.FOUNDRY_ONTOLOGY_API_NAME
  const requestedType = process.env.FOUNDRY_FIR_OBJECT_TYPE || 'FirCase'
  if (requestedOntology) return { ontology: requestedOntology, objectType: requestedType }

  const ontologies = await foundryFetch('/api/v2/ontologies')
  for (const ontology of (ontologies.data ?? []) as FoundryOntology[]) {
    const objectTypes = await foundryFetch(`/api/v2/ontologies/${encodeURIComponent(ontology.apiName)}/objectTypes?pageSize=100`)
    const match = (objectTypes.data ?? []).find(item => (item as FoundryObjectType).apiName.toLowerCase() === requestedType.toLowerCase()) as FoundryObjectType | undefined
    if (match) return { ontology: ontology.apiName, objectType: match.apiName }
  }
  throw new Error('No FIR Case object type is accessible to this Foundry token')
}

/** Read-only adapter. Tokens remain server-side and no enforcement action is sent to Foundry. */
export async function listFoundryFirs(): Promise<FoundryFirSync> {
  const { ontology, objectType } = await findOntologyAndFirType()
  const response = await foundryFetch(`/api/v2/ontologies/${encodeURIComponent(ontology)}/objects/${encodeURIComponent(objectType)}?pageSize=100&snapshot=true`)
  const data = (response.data ?? []).map(raw => {
    const record = raw as FoundryObject
    const fir = text(record, 'firNumber', 'fir_number', 'FirNumber', 'Fir Number', '__primaryKey')
    const risk = Number(value(record, 'riskScore', 'risk_score', 'RiskScore', 'Risk Score'))
    const itemPriority = priority(record)
    return {
      id: text(record, '__primaryKey', '__rid', 'firNumber', 'fir_number'),
      fir: fir || 'Unnumbered FIR',
      crimeType: text(record, 'crimeType', 'crime_type', 'CrimeType', 'Crime Type') || 'Unclassified offence',
      crimeCategory: text(record, 'crimeCategory', 'crime_category', 'CrimeCategory', 'Crime Category') || 'Other',
      district: text(record, 'district', 'District') || 'Unspecified district',
      priority: itemPriority,
      status: text(record, 'caseStatus', 'case_status', 'CaseStatus', 'Case Status') || 'Under review',
      occurrenceDate: text(record, 'occurrenceDate', 'occurrence_date', 'OccurrenceDate', 'Occurrence Date'),
      riskScore: Number.isFinite(risk) ? risk : itemPriority === 'Critical' ? 90 : itemPriority === 'High' ? 75 : 50,
      isSensitive: bool(record, 'isSensitive', 'is_sensitive', 'IsSensitive', 'Is Sensitive'),
      hasRepeatOffender: bool(record, 'repeatIndicator', 'repeat_indicator', 'RepeatIndicator', 'Repeat Indicator'),
    }
  })
  return { source: 'foundry', ontology, syncedAt: new Date().toISOString(), data }
}
