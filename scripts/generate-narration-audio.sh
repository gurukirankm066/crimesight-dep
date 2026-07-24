#!/bin/bash

OUTPUT_FILE="/Users/madhu/.gemini/antigravity/scratch/crimesight-dep/crimesight_demo_voiceover.aiff"

echo "🎙️ Generating professional demo video voiceover audio..."

say -v Rishi -o "$OUTPUT_FILE" "Welcome to CrimeSight AI, an intelligent, human-governed crime intelligence platform built for the Karnataka State Police.

Police departments handle thousands of First Information Reports every day across over 30 districts. Crucial connections between repeat offenders, stolen vehicles, and spatial crime patterns remain hidden in siloed station databases. Traditional manual searches are slow, prone to delays, and lack clear audit trails.

CrimeSight AI solves this by transforming static FIR records into an interactive, spatial, and network-connected intelligence workspace with strict zero-hallucination governance.

Here on the Geo Intel Command Center, officers gain real-time visibility across all 30 Karnataka police districts, covering 1,250 plus cases and over 22,000 synthetic records.

When a new high-priority incident occurs in the field, CrimeSight instantly streams live alert notifications and updates spatial risk counters.

Navigating to the Network Tab, CrimeSight renders a 3-tier entity graph linking Police Stations, FIR cases, and repeat offenders. Officers can immediately spot criminal syndicates and shared co-accused links across district boundaries.

CrimeSight follows a strict Human-in-the-Loop governance policy. It never automates enforcement action or invents unverified claims.

Using our verified Query Copilot, officers ask natural language questions like: Show critical FIRs with repeat identifiers. The system compiles questions into allow-listed database filters and presents evidence to a supervisor for formal audit approval.

Officers in the field can also record structured reports on mobile or dictate Voice FIRs using speech recognition.

CrimeSight AI bridges field reports, spatial intelligence, and accountable review into one unified workspace. Thank you for watching!"

echo "✅ Audio voiceover file generated at: $OUTPUT_FILE"
