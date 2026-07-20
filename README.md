# CrimeSight AI

> Verified conversational FIR intelligence for Karnataka State Police — a reproducible synthetic prototype for KSP Datathon 2026.

**Live prototype:** https://crimesight-dep-onmoxbpk.onslate.in/

## The problem

Crime data is difficult to navigate quickly across FIRs, districts, crime types, operational status, and linked entities. A generic AI chatbot can sound convincing without showing the data that supports its answer.

CrimeSight makes natural-language crime intelligence **verifiable before action**. It supports officer review; it never makes enforcement decisions.

## Core capability: Query Copilot

Ask a question such as:

> Show high-risk cybercrime FIRs in Mysuru.

CrimeSight compiles it into an allow-listed query against the reproducible FIR dataset and returns:

- matching FIR count and highest-risk records;
- visible district, crime, status, priority, and time filters;
- a query ID and source coverage;
- a clear synthetic-data boundary;
- a safe clarification instead of guessing when the request is ambiguous.

No user-provided SQL is generated or executed.

## Proof Before Action

Each Query Copilot response exposes the evidence behind the answer. The included **Judge Demo Mode** demonstrates the full accountability flow:

1. verified query result;
2. challenge of an ambiguous interpretation;
3. connected FIR context;
4. human review decision and audit trail;
5. field FIR to governed-action readiness.

## Technology and integrations

| Capability | Implementation |
| --- | --- |
| Web interface | Next.js, TypeScript, Tailwind CSS, Zoho Catalyst Slate |
| Reproducible data | 10,000 deterministic synthetic FIR records modeled on the supplied KSP ER schema |
| Field FIR intake | Catalyst Advanced I/O function, Data Store persistence, Stratus-ready evidence flow |
| Governed operational actions | Catalyst-backed review action path with safe local fallback |
| Ontology readiness | Palantir Foundry FIR Case object type and linked Person, Officer, Location, and Evidence objects |
| Query safety | Allow-listed FIR filters and verified in-memory dataset execution |

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Use `npm run build` for a production build.

## Demo

Use the header **Demo Mode** button. A complete 3-minute script is in [docs/JUDGE_DEMO.md](docs/JUDGE_DEMO.md). The architecture is documented in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Safety and data boundary

- All displayed case data is synthetic and reproducible.
- The prototype is not connected to live operational police data.
- CrimeSight recommends review actions only; a human officer approves, requests evidence, or defers.
- No personally identifying data, automated enforcement, or unrestricted model-generated SQL is used in the demo.
