# Arc-Sentinel

AI-powered structural health monitoring platform for infrastructure (bridges, piers, cables).

## Architecture

- **Frontend**: Next.js 14 (App Router) — `arc-sentinel-frontend/`
- **Backend**: Python FastAPI — `arc-sentinel-backend/`
- **Database**: Supabase (PostgreSQL + Realtime)
- **AI**: OpenAI GPT (Argus chat assistant)
- **3D Visualization**: Three.js / React Three Fiber

## Workflows

- **Start application** — Next.js dev server on port 5000 (`cd arc-sentinel-frontend && npm run dev`)
- **Backend API** — FastAPI/uvicorn on port 8000 (`cd arc-sentinel-backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`)

## Required Secrets

| Key | Used By | Description |
|-----|---------|-------------|
| `SUPABASE_URL` | Backend | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Backend | Supabase service role key |
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Supabase anon key |
| `OPENAI_API_KEY` | Backend | OpenAI key for Argus AI chat |

## Environment Variables

| Key | Value | Description |
|-----|-------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | Frontend → Backend API URL |

## CORS

The backend (`app/main.py`) reads `CORS_EXTRA_ORIGINS` (comma-separated) to allow additional origins beyond the hardcoded list. Set this env var when deploying to a custom domain.

## Dependency Notes

- `gotrue` is pinned to `==1.3.1` in `requirements.txt` for compatibility with `supabase==2.3.0` and `httpx==0.24.1`.
