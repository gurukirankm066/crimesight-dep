# Catalyst-governed review backend

CrimeSight uses this Catalyst **Advanced I/O Function** to persist human review decisions. It is purpose-limited: the function records a review or an evidence request; it never updates FIR outcomes or authorises enforcement.

## Resources created in this repository

- `functions/governed-review/` — Node.js Advanced I/O function using `zcatalyst-sdk-node`
- `catalyst.json` and `.catalystrc` — link this workspace to the existing Catalyst project

## One-time Data Store configuration

Create a Data Store table called `GovernedReviewActions` with these columns:

| Column | Type | Required |
|---|---|---|
| `FirId` | Single line | Yes |
| `FirNumber` | Single line | Yes |
| `Decision` | Single line | Yes |
| `Actor` | Single line | Yes |
| `Rationale` | Multi-line | Yes |
| `EvidenceRequirement` | Multi-line | No |
| `Source` | Single line | Yes |
| `CorrelationId` | Single line | Yes |
| `RecordedAt` | Date-time | Yes |

Enable a search index for `FirNumber`, `Decision`, and `RecordedAt`. Give the Function service identity write access; do not grant direct browser write access to this table.

## Function contract

`GET /actions` returns the latest 100 governed review entries.

`POST /actions` accepts a decision with `firId`, `fir`, `status` (`Approved` or `Needs evidence`), `actor`, `reason`, and optional `evidenceRequirement`.

Set these Function environment variables before deployment:

- `GOVERNED_REVIEW_TABLE=GovernedReviewActions`
- `ALLOWED_ORIGINS=https://crimesight-dep-onmoxbpk.onslate.in`

The client should call this function through Catalyst API Gateway after an authenticated route is configured. The browser must never receive Data Store credentials.
