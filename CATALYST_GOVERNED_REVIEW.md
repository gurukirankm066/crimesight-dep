# Catalyst-governed review backend

CrimeSight uses this Catalyst **Advanced I/O Function** to persist human review decisions. It is purpose-limited: the function records a review or an evidence request; it never updates FIR outcomes or authorises enforcement.

## Resources created in this repository

- `functions/governed-review/` — Node.js Advanced I/O function using `zcatalyst-sdk-node`
- `catalyst.json` and `.catalystrc` — link this workspace to the existing Catalyst project

## Provisioned Catalyst resources

The Development environment now contains:

- Data Store table: `GovernedReviewActions`
- Advanced I/O Function: `governed-review`
- API Gateway route: `ANY /governed-review` → `governed-review`
- Gateway throttling: 120 requests/minute overall and 30 requests/minute per IP

The gateway URL is:

`https://crimesightai-ksp-60075226836.development.catalystserverless.in/governed-review`

## Data Store schema

Create a Data Store table called `GovernedReviewActions` with these columns:

| Column | Type | Required |
|---|---|---|
| `FirId` | Single line | Yes |
| `FirNumber` | Single line | Yes |
| `Decision` | Single line | Yes |
| `Actor` | Single line | Yes |
| `Rationale` | Text | Yes |
| `EvidenceRequirement` | Text | No |
| `Source` | Single line | Yes |
| `CorrelationId` | Single line | Yes |
| `RecordedAt` | Text (ISO timestamp) | Yes |

The function service identity writes to this table. The browser never receives Data Store credentials.

## Function contract

`GET /actions` returns the latest 100 governed review entries.

`POST /actions` accepts a decision with `firId`, `fir`, `status` (`Approved` or `Needs evidence`), `actor`, `reason`, and optional `evidenceRequirement`.

Set this Function environment variable in Catalyst to restrict browser origins:

- `ALLOWED_ORIGINS=https://crimesight-dep-onmoxbpk.onslate.in`

Set this Slate environment variable before deploying the web app:

- `NEXT_PUBLIC_GOVERNED_REVIEW_API_URL=https://crimesightai-ksp-60075226836.development.catalystserverless.in/governed-review`

The client calls only API Gateway. The browser must never receive Data Store credentials.
