# Catalyst Field FIR Intake

This is the second live Catalyst integration in CrimeSight. It turns the **Field FIR** form into a governed intake workflow while retaining the local synthetic-demo fallback.

## Resources to provision

| Catalyst service | Resource | Why it is needed |
| --- | --- | --- |
| Data Store | `FieldFirReports` | Stores structured synthetic FIR submissions and their audit metadata. |
| Stratus | private bucket `crimesight-field-evidence` | Stores uploaded evidence images privately; the browser receives no bucket credentials. |
| Serverless | Advanced I/O function `field-fir-intake` | Validates submissions, stores rows, and uploads evidence through the server-side Catalyst SDK. |
| API Gateway | `POST`/`GET` route `/field-fir-intake` | Applies CORS and throttling before the function is exposed to the web app. |
| Slate | `NEXT_PUBLIC_FIELD_FIR_API_URL` | The gateway URL only; it contains no secret. |

## Data Store columns

Create the following columns as **Text**: `FirNumber`, `OfficerName`, `BadgeNumber`, `District`, `PoliceStation`, `CrimeType`, `Place`, `Description`, `CasePriority`, `CaseStatus`, `PhotoCount`, `EvidenceKeys`, `SubmittedAt`, `LastStatusUpdate`, `IntakeSource`, and `CorrelationId`. The prefixed names avoid Catalyst reserved-column keywords.

## Safety controls

- The handler only accepts prototype submissions and never automates enforcement or case decisions.
- Five images maximum; JPEG, PNG, and WebP only; each image is capped at 2 MB after compression.
- Evidence object keys are stored, but no public download URL is returned.
- A configured `ALLOWED_ORIGINS` list restricts browser access to the live Slate deployment.
- The UI remains usable in clearly-labelled local-demo fallback if the intake service is unavailable.
