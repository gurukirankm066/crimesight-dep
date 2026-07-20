import type { FieldFirReport } from '@/lib/store'

const apiUrl = process.env.NEXT_PUBLIC_FIELD_FIR_API_URL?.replace(/\/$/, '')

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

  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
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
