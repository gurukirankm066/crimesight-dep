# CrimeSight data governance and prototype dataset

## Current demo dataset

CrimeSight uses a reproducible, privacy-safe synthetic FIR dataset for the Datathon prototype. It is not operational police data and must never be represented as CCTNS, SCRB, or a live KSP feed.

The front-end generator creates 10,000 FIR-shaped records across all 31 Karnataka districts. Its fields align to the supplied FIR ER diagram: case, district, police station, offence, officer, location, date, priority, status, evidence placeholders, and association indicators.

## Why synthetic data

- Police FIR data can include personal, sensitive, and investigation-critical information.
- The competition prototype can demonstrate workflows without exposing citizens, victims, witnesses, or active investigations.
- A deterministic dataset makes the demo repeatable: judges see the same map, queue, and relationship patterns every time.

## What is synthetic and what is not claimed

- Person names, phone numbers, addresses, FIR numbers, case narratives, relationships, scores, and outcomes are synthetic.
- District boundaries are a visual reference layer, not a claim of operational geocoding accuracy.
- Risk scores are transparent prototype rules for triage demonstrations. They are not predictive policing models, evidence of criminality, or automated decisions.

## Production data path

1. Obtain written authorisation and a defined use case from KSP/SCRB.
2. Ingest only approved, de-identified, minimum-necessary fields through a server-side connector.
3. Apply role-based access, immutable audit logging, encryption, retention controls, and a data-quality gate.
4. Validate performance, bias, false positives, and operational usefulness with authorised SMEs before any production use.
5. Keep the officer as the final decision-maker for all alerts and actions.

## Judge demonstration answer

> “We intentionally did not use real FIR data in a competition prototype. CrimeSight uses a reproducible synthetic dataset modeled on the supplied FIR ER schema so we can demonstrate the complete workflow safely. The application is integration-ready: when authorised, approved de-identified data enters through a governed server-side connector, passes quality checks, and remains subject to role-based access and human review.”
