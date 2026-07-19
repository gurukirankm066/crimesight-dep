# CrimeSight × Palantir Foundry / AIP setup

## What is already built

CrimeSight has an Ontology contract and a safe readiness endpoint. The prototype continues to run without Foundry credentials, but it now has canonical object types, links, and governed actions ready to map to Foundry.

## Build this in Foundry

Create these object types:

1. `firCase` — FIR number, category, occurrence date, priority, status, risk explanation, sensitivity flag.
2. `person` — pseudonymous person identifier and role. Do not ingest direct identifiers unless explicitly approved.
3. `location` and `district` — jurisdiction, police station, coordinates, and approved geospatial context.
4. `officer` — employee identifier, rank, unit, and authorised responsibility fields.
5. `evidenceItem` — type, collection state, chain-of-custody reference, and availability state.
6. `reviewTask` — the operational object produced from a human-reviewed recommendation.

Create the links and actions listed in `src/lib/foundry/ontology.ts`. Every action must capture actor, timestamp, rationale, and outcome.

## Configure the deployment

Set these as server-side deployment secrets only. Do not use `NEXT_PUBLIC_` variables.

```text
FOUNDRY_BASE_URL=https://your-foundry-tenant
FOUNDRY_OAUTH_CLIENT_ID=...
FOUNDRY_OAUTH_CLIENT_SECRET=...
FOUNDRY_ONTOLOGY_API_NAME=crimesight
```

Then generate an Ontology SDK or configure the approved Foundry REST/OAuth client inside a server-only adapter. The browser must call CrimeSight API routes, never Foundry directly.

## AIP workflow to demo

The first AIP workflow should be **Morning Brief Copilot**:

1. Read authorised FIR, hotspot, evidence-state, and review-task objects.
2. Draft a short briefing with source object links and stated limitations.
3. Suggest review tasks only; do not recommend enforcement action or assert criminality.
4. Require a supervisor to approve, edit, or dismiss every task through an Ontology action.
5. Save the decision and reason as an audit event.

## Demo positioning

Say: “Foundry provides the governed operational layer; CrimeSight provides the officer-friendly intelligence workflow. AIP drafts explainable briefs over approved objects, while humans retain all operational authority.”
