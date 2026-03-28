# Arc Sentinel

AI-driven Structural Health Monitoring (SHM) platform for early detection of infrastructure micro-failures. Arc Sentinel fuses real-time sensor telemetry with lightweight anomaly detection, Infrastructure Health Index (IHI) scoring, and the Argus AI assistant for natural-language diagnostics.

## Highlights
- Vigilance dashboard (Next.js 14 + Tailwind) for IHI, anomaly feed, EMB ticker, charts, and a Digital Twin viewer.
- Backend (FastAPI + Supabase) for ingestion, anomaly scoring (z-score/threshold), IHI calculation, and Argus chat stub with RAG-ready pipeline.
- Supabase Realtime pushes new anomalies to the dashboard; webhooks can broadcast Emergency Maintenance events.
- Virtual sensor simulator to stream synthetic telemetry for demos and tests.

## Architecture
| Layer | Tech | Role |
| --- | --- | --- |
| Edge / Simulation | Python | Synthetic vibration/strain readings via virtual sensor |
| Data | Supabase (PostgreSQL + Realtime) | Stores `sensor_logs`, `anomalies`, `ihi_snapshots`; drives realtime UI |
| Intelligence | FastAPI services + optional LangChain/OpenAI | Anomaly detection, IHI fusion, Argus RAG stub |
| UI | Next.js + Tailwind + Three.js | Vigilance dashboard, EMB ticker, Argus chat, Digital Twin viewer |

## Repository Layout
```
arc-sentinel-backend/   FastAPI service, Supabase schema, simulator, tests
arc-sentinel-frontend/  Next.js dashboard and Argus UI
Docs/                   Developer notes and project description
```
- API entrypoint: [arc-sentinel-backend/app/main.py](arc-sentinel-backend/app/main.py)
- Supabase schema: [arc-sentinel-backend/supabase/schema.sql](arc-sentinel-backend/supabase/schema.sql)
- Virtual sensor: [arc-sentinel-backend/simulator/virtual_sensor.py](arc-sentinel-backend/simulator/virtual_sensor.py)
- Dashboard shell: [arc-sentinel-frontend/app/dashboard/page.tsx](arc-sentinel-frontend/app/dashboard/page.tsx)
- Digital Twin asset lives in [arc-sentinel-frontend/public/models](arc-sentinel-frontend/public/models)

## Quickstart (Dev)
Prereqs: Python 3.11+, Node 18+, Supabase project.

1) Backend
1. `cd arc-sentinel-backend`
2. `python -m venv .venv && .venv/Scripts/activate`
3. `pip install -r requirements.txt`
4. Copy `.env.example` to `.env` and fill keys (see variables below).
5. Apply schema: run the SQL in [arc-sentinel-backend/supabase/schema.sql](arc-sentinel-backend/supabase/schema.sql) in Supabase.
6. Start API: `uvicorn app.main:app --reload --port 8000`
7. (Optional) Simulator: `python simulator/virtual_sensor.py`

2) Frontend
1. `cd arc-sentinel-frontend`
2. `npm install`
3. Copy `.env.local.example` to `.env.local` and set Supabase + API base URL.
4. `npm run dev` (defaults to port 3000)

Visit http://localhost:3000 to see the dashboard.

## Environment Variables
Backend `.env` (FastAPI):
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
OPENAI_API_KEY=sk-...
CORS_ORIGINS=http://localhost:3000
APP_ENV=development
```

Frontend `.env.local` (Next.js):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Testing
- Backend: from `arc-sentinel-backend`, run `pytest`.
- Frontend: no formal tests yet; add React/Playwright coverage as needed.

## Notes
- Anomaly detection currently uses a lightweight z-score + threshold path (scikit-learn optional via `app/ml` stub).
- Argus chat has a RAG-ready pipeline; plug in LangChain/OpenAI when API keys are available.
- Digital Twin viewer is a placeholder; drop `bridge.glb` into [arc-sentinel-frontend/public/models](arc-sentinel-frontend/public/models) and replace the placeholder scene when ready.

## Roadmap
- Drone-assisted inspections triggered by low IHI.
- InSAR satellite cross-checks for ground movement.
- Immutable audit logs (blockchain) for safety reporting.
