/**
 * CrimeSight's Foundry Ontology contract.
 *
 * This stays vendor-SDK-free so the prototype can run without a Foundry
 * tenant, while providing one canonical mapping for the eventual OSDK/API
 * adapter.
 */

export const CRIMESIGHT_ONTOLOGY = {
  objectTypes: [
    { apiName: 'firCase', label: 'FIR Case', key: 'firNumber', source: 'CaseMaster' },
    { apiName: 'person', label: 'Person', key: 'personId', source: 'Suspect / Victim / Witness' },
    { apiName: 'location', label: 'Location', key: 'locationId', source: 'Case location / Police Station' },
    { apiName: 'district', label: 'District', key: 'districtCode', source: 'District' },
    { apiName: 'officer', label: 'Officer', key: 'officerId', source: 'Employee' },
    { apiName: 'evidenceItem', label: 'Evidence Item', key: 'evidenceId', source: 'Evidence' },
    { apiName: 'reviewTask', label: 'Review Task', key: 'taskId', source: 'CrimeSight Operations Queue' },
  ],
  linkTypes: [
    'firCaseInvolvesPerson',
    'firCaseOccurredAtLocation',
    'firCaseAssignedToOfficer',
    'firCaseHasEvidence',
    'locationBelongsToDistrict',
    'reviewTaskForFirCase',
  ],
  actionTypes: [
    { apiName: 'approveReview', label: 'Approve review', humanApproval: true },
    { apiName: 'requestEvidence', label: 'Request evidence', humanApproval: true },
    { apiName: 'assignCaseOwner', label: 'Assign case owner', humanApproval: true },
    { apiName: 'recordReviewOutcome', label: 'Record review outcome', humanApproval: true },
  ],
} as const

export type FoundryReadiness = {
  configured: boolean
  mode: 'not-configured' | 'ready-for-connection'
  missing: string[]
  ontologyObjectCount: number
  actionCount: number
}

export function getFoundryReadiness(): FoundryReadiness {
  const required = {
    FOUNDRY_BASE_URL: process.env.FOUNDRY_BASE_URL,
    FOUNDRY_OAUTH_CLIENT_ID: process.env.FOUNDRY_OAUTH_CLIENT_ID,
    FOUNDRY_OAUTH_CLIENT_SECRET: process.env.FOUNDRY_OAUTH_CLIENT_SECRET,
    FOUNDRY_ONTOLOGY_API_NAME: process.env.FOUNDRY_ONTOLOGY_API_NAME,
  }
  const missing = Object.entries(required).filter(([, value]) => !value).map(([key]) => key)
  return {
    configured: missing.length === 0,
    mode: missing.length === 0 ? 'ready-for-connection' : 'not-configured',
    missing,
    ontologyObjectCount: CRIMESIGHT_ONTOLOGY.objectTypes.length,
    actionCount: CRIMESIGHT_ONTOLOGY.actionTypes.length,
  }
}
