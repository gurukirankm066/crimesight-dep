# CrimeSight AI

> AI-Powered Crime Analytics & Intelligence Platform for Karnataka State Police

**Karnataka State Police Datathon 2026**

---

## 🎯 Problem Statement

Karnataka processes 500,000+ FIRs annually across 31 districts. Manual analysis is slow, error-prone, and cannot detect cross-district patterns. Cold cases pile up without systematic revival mechanisms, patrol allocation is reactive, and critical intelligence about repeat offenders remains hidden in silos.

**CrimeSight AI** transforms 8,353+ FIR records into actionable intelligence through 8 integrated analytical modules.

---

## ✨ Features

### Core Modules

| Module | Description |
|--------|-------------|
| 🗺️ **Crime Map** | Interactive Karnataka district map with crime heat visualization and district-level drill-down |
| 🔗 **Network Intelligence** | Links 230+ repeat offenders across 10 crime type clusters with cross-district tracking |
| 🧠 **AI Analysis** | Anomaly detection, risk scoring, and automated pattern identification |
| 📊 **Crime Trends** | Temporal and spatial crime pattern analysis with monthly, hourly, and district comparison views |
| 📋 **Case Management** | End-to-end tracking of 500+ FIR cases with suspects, victims, evidence, and chargesheets |
| 🚔 **Predictive Patrol** | ML-based 24-hour hotspot forecasting across all 31 districts |
| 👮 **Officer Intelligence** | Performance leaderboards for 50+ officers across 62 units with resolution metrics |
| ❄️ **Cold Case Revival** | AI-powered 6-factor similarity scoring matching 174 cold cases to active investigations |

### Special Features

- **Command Center Mode** — Press `F` for full-screen situational awareness with auto-rotating district views
- **AI Chat Bar** — Natural language queries about crimes, suspects, and trends
- **Voice FIR** — Hands-free FIR filing using speech-to-text
- **Case Cracker** — AI-assisted case analysis suggesting linked suspects, patterns, and evidence
- **Boot Sequence** — Cinematic system initialization animation

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4, shadcn/ui |
| **Animation** | Framer Motion |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma 6 |
| **Charts** | Recharts |
| **Maps** | D3-Geo with Karnataka GeoJSON |
| **State** | Zustand, TanStack Query |

---

## 📊 Database

- **24 normalized tables** covering the complete crime data lifecycle
- **8,353 seeded records** including 500 cases, 491 suspects, 758 victims, 782 witnesses, 1,290 evidence items
- **31 Karnataka districts** with geographic boundaries
- **186 officers** across 62 police units

### Key Tables
`CaseMaster` · `Suspect` · `Victim` · `Witness` · `Evidence` · `ArrestSurrender` · `Chargesheet` · `InvestigationActivity` · `Property` · `Vehicle` · `District` · `Employee` · `CrimeType` · `Network` · `Patrol` · `ColdCase`

---

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh) runtime
- PostgreSQL database (Supabase recommended)

### Local Setup (SQLite)

```bash
# Clone the repo
git clone https://github.com/gurukirankm066/CrimeSight-AI.git
cd CrimeSight-AI

# Install dependencies
bun install

# Switch to SQLite (local, no external DB needed)
cp .env.sqlite .env
cp prisma/schema.sqlite.prisma prisma/schema.prisma

# Setup database and seed data
bun run setup:sqlite
bun run seed

# Start dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Supabase Setup (Production)

```bash
# Switch to PostgreSQL schema
cp prisma/schema.postgres.prisma prisma/schema.prisma

# Set your Supabase connection string
DATABASE_URL="postgresql://postgres.xxx:password@aws-0-xx.pooler.supabase.com:5432/postgres"

# Push schema and migrate data
bun run scripts/switch-to-supabase.sh "$DATABASE_URL"
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main dashboard with 8-tab navigation
│   ├── layout.tsx            # Root layout
│   └── api/                  # 22 REST API endpoints
│       ├── dashboard/        # Stats, alerts, recent cases
│       ├── map/              # District stats, drill-down
│       ├── network/          # Offender graph, repeat offenders
│       ├── ai/               # Anomalies, risk scores, chat
│       ├── trends/           # Monthly, time-of-day, crime types
│       ├── cases/            # CRUD, case cracking
│       ├── patrol/           # Predictive hotspot forecasting
│       ├── officers/         # Performance leaderboards
│       └── cold-cases/       # AI case matching
├── components/
│   ├── crimesight/           # 11 feature components
│   │   ├── crime-map-tab.tsx
│   │   ├── network-tab.tsx
│   │   ├── ai-intel-tab.tsx
│   │   ├── trends-tab.tsx
│   │   ├── cases-tab.tsx
│   │   ├── predictive-patrol-tab.tsx
│   │   ├── officer-intel-tab.tsx
│   │   ├── cold-case-tab.tsx
│   │   ├── command-center-mode.tsx
│   │   ├── ai-chat-bar.tsx
│   │   ├── voice-fir-modal.tsx
│   │   ├── case-cracker-modal.tsx
│   │   └── prototype-deck.tsx
│   └── ui/                   # 45 shadcn/ui components
├── lib/
│   ├── db.ts                 # Prisma client
│   ├── dal.ts                # Data access layer
│   └── utils.ts
├── hooks/
│   ├── use-speech-recognition.ts
│   └── use-mobile.ts
prisma/
├── schema.prisma             # Active schema
├── schema.sqlite.prisma      # SQLite schema
├── schema.postgres.prisma    # PostgreSQL schema
└── data/                     # 24 CSV seed files
```

---

## 🌐 Live Deployment

Deployed on **Zoho Catalyst**: [CrimeSight AI](https://crimesight-ai-odgiulor.onslate.in)

---

## 📸 Screenshots

| Crime Map | AI Analysis | Crime Trends |
|-----------|-------------|--------------|
| ![Crime Map](public/demo-home.png) | ![AI Analysis](public/demo-ai.png) | ![Trends](public/demo-trends.png) |

| Case Management | Network Intelligence | Predictive Patrol |
|-----------------|---------------------|-------------------|
| ![Cases](public/demo-cases.png) | ![Network](public/demo-network.png) | ![Patrol](public/screenshot-patrol.png) |

---

## 📝 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/dashboard` | Dashboard stats, alerts, recent cases |
| `GET /api/map/stats` | Crime statistics per district |
| `GET /api/map/district-detail/:id` | District drill-down data |
| `GET /api/network/graph` | Offender network graph data |
| `GET /api/network/repeat-offenders` | Repeat offender profiles |
| `GET /api/ai/anomalies` | AI-detected anomalies |
| `GET /api/ai/risk-scores` | Case risk scoring |
| `POST /api/ai/chat` | AI chat query processing |
| `GET /api/trends/monthly` | Monthly crime trends |
| `GET /api/trends/time-of-day` | Hourly crime distribution |
| `GET /api/trends/crime-types` | Crime type breakdown |
| `GET /api/trends/district-comparison` | Cross-district comparison |
| `GET /api/cases` | List cases with filters |
| `GET /api/cases/:id` | Case detail with sub-entities |
| `POST /api/cases/:id/crack` | AI case cracking analysis |
| `GET /api/patrol/predict` | Patrol hotspot predictions |
| `GET /api/officers/leaderboard` | Officer performance data |
| `GET /api/cold-cases/match` | Cold case AI matching |
| `POST /api/fir/voice` | Voice FIR processing |
| `GET /api/districts` | All districts |
| `GET /api/districts/:id` | District detail |
| `GET /api/master/:type` | Master data lookup |

---

## 🏆 Impact

| Metric | Value |
|--------|-------|
| Records Analyzed | 8,353+ |
| FIR Cases Tracked | 500+ |
| Districts Covered | 31 (All Karnataka) |
| Repeat Offenders Identified | 230+ |
| Cold Cases Matched | 20 connections |
| API Endpoints | 22 |
| Analytical Modules | 8 |

---

## 📄 License

MIT

---

**Built for Karnataka State Police Datathon 2026** by Team CrimeSight