import type { FieldFirReport } from '@/lib/store'

const DEFAULT_FIELD_FIR_API_URL = 'https://crimesightai-ksp-60075226836.development.catalystserverless.in/field-fir-intake'
const apiUrl = (process.env.NEXT_PUBLIC_FIELD_FIR_API_URL || DEFAULT_FIELD_FIR_API_URL).replace(/\/$/, '')

export type FieldFirSubmission = Omit<FieldFirReport, 'id' | 'fir' | 'submittedAt' | 'status' | 'lastStatusUpdate' | 'source' | 'correlationId'>

interface FieldFirResponse {
  source: 'catalyst-data-store'
  reports?: FieldFirReport[]
  report?: FieldFirReport
}

export function isFieldFirApiConfigured() {
  return Boolean(apiUrl)
}

async function request(path: string, init?: RequestInit) {
  if (!apiUrl) throw new Error('Field FIR intake API is not configured.')

  // Catalyst's gateway consumes OPTIONS before the Advanced I/O handler. A
  // text/plain JSON body keeps this cross-origin request "simple", while the
  // server still validates and parses the exact same JSON payload.
  const method = init?.method ?? 'GET'
  const headers = new Headers(init?.headers)
  if (method !== 'GET' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'text/plain;charset=UTF-8')
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) throw new Error(`Field FIR intake service returned ${response.status}.`)
  return response.json() as Promise<FieldFirResponse>
}

export async function fetchFieldFirReports() {
  const response = await request('')
  return response.reports ?? []
}

export async function submitFieldFir(report: FieldFirSubmission) {
  const response = await request('', {
    method: 'POST',
    body: JSON.stringify(report),
  })

  if (!response.report) throw new Error('Field FIR intake service did not return the saved report.')
  return response.report
}
