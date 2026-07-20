import type { ReviewAction, ReviewStatus } from '@/lib/store'

const apiUrl = process.env.NEXT_PUBLIC_GOVERNED_REVIEW_API_URL?.replace(/\/$/, '')

export interface GovernedReviewInput {
  firId: string
  fir: string
  status: ReviewStatus
  actor: string
  reason: string
  evidenceRequirement?: string
}

interface GovernedReviewResponse {
  source: 'catalyst-data-store'
  actions?: ReviewAction[]
  action?: ReviewAction
}

export function isGovernedReviewApiConfigured() {
  return Boolean(apiUrl)
}

async function request(path: string, init?: RequestInit) {
  if (!apiUrl) throw new Error('Governed review API is not configured.')

  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) throw new Error(`Governed review service returned ${response.status}.`)
  return response.json() as Promise<GovernedReviewResponse>
}

export async function fetchGovernedReviewActions() {
  const response = await request('')
  return response.actions ?? []
}

export async function saveGovernedReviewAction(input: GovernedReviewInput) {
  const response = await request('', {
    method: 'POST',
    body: JSON.stringify(input),
  })

  if (!response.action) throw new Error('Governed review service did not return the saved action.')
  return response.action
}
