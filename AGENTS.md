# AGENTS.md — DataFlow AI Hackathon 2026

## Project Overview
Conversational database analytics app: natural language → validated SQL → real-time insights/charts/diagrams over SQLite.
- **Backend**: FastAPI (Python 3.11), Anthropic Claude SDK, aiosqlite, Pydantic
- **Frontend**: React 18 + TypeScript + Vite + Tailwind + Recharts + Mermaid.js
- **Database**: SQLite (`database/ecommerce.sqlite`)
- **Container**: Docker Compose, Nginx, Kubernetes manifests in `k8s/`

## Architecture (High-Level)
```
React Frontend (Vite) → POST /api/chat (SSE) → FastAPI → Agent Orchestrator (ReAct loop)
                                                        ↓
                                    Tool Registry: get_schema, execute_query, generate_chart, generate_flowchart, explain_data
                                                        ↓
                                                        SQLite DB
```

## Quick Start Commands

### Docker Compose (Recommended)
```bash
cp .env.example .env          # Add ANTHROPIC_API_KEY or set OFFLINE_DEMO_MODE=true
docker-compose up --build
# Frontend: http://localhost:3000 | Backend: http://localhost:8000/api/health
```

### Local Development
**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example ../.env   # Edit with ANTHROPIC_API_KEY
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 (proxies /api to localhost:8000)
```

## Testing
```bash
# Backend (from backend/)
python -m pytest

# Frontend (from frontend/)
npm run test          # vitest run
npm run test:watch    # vitest watch mode
```

## Build / Typecheck / Lint
```bash
# Frontend
npm run build         # tsc && vite build (typecheck + build)
# No separate lint script; TS strict mode in tsconfig.json

# Backend
# No formal lint; relies on pytest and type hints
```

## Environment Configuration
Key `.env` variables (see `.env.example`):
- `ANTHROPIC_API_KEY` — required unless `OFFLINE_DEMO_MODE=true`
- `DB_TYPE=sqlite|postgresql|mysql|mongodb`
- `DATABASE_PATH` / `DATABASE_URL`
- `SESSION_BACKEND=memory|sqlite|redis`
- `CORS_ORIGIN` — comma-separated, default `http://localhost:3000,http://localhost:5173`
- `AUTH_ENABLED=false` — set `true` + configure `API_KEY` or basic auth for production
- `RATE_LIMIT_RPM=0` — disabled by default

## Important Paths & Entrypoints
- **Backend API**: `backend/main.py` → `backend/api/router.py` (SSE `/api/chat`, REST `/api/health`, `/api/schema`, `/api/session/{id}/history`, DELETE `/api/session/{id}`, `/api/export/csv`, `/api/auth/login`, `/api/auth/me`)
- **Agent Orchestrator**: `backend/agent/orchestrator.py` (ReAct loop with function calling)
- **Tools**: `backend/tools/*.py` (get_schema, execute_query, generate_chart, generate_flowchart, explain_data)
- **DB Adapters**: `backend/db/adapters/` (sqlite, postgres, mysql, mongodb)
- **Frontend App**: `frontend/src/main.tsx` → `App.tsx` (chat UI, chart rendering, schema panel)
- **Frontend API Client**: `frontend/src/services/api.ts` (SSE event handling)

## Kubernetes Deployment
```bash
docker-compose -f ../docker-compose.yml build
kubectl apply -k k8s/
kubectl port-forward -n dataflow svc/dataflow-frontend 3000:80
kubectl port-forward -n dataflow svc/dataflow-backend 8000:8000
```
Edit `k8s/configmap.yaml` and `k8s/secret.yaml` before production deploy.

## Gotchas & Non-Obvious Details
- **SSE streaming**: Frontend expects typed events (`token`, `sql`, `chart`, `diagram`, `tool_start`, `tool_end`, `done`, `error`)
- **SQL validation**: `execute_query` enforces SELECT-only, safety keywords, auto-applies `LIMIT 100`
- **Offline demo**: Set `OFFLINE_DEMO_MODE=true` in `.env` to run without Anthropic API key (deterministic mock responses)
- **Session store**: Defaults to in-memory; use `sqlite` or `redis` backend for persistence across restarts
- **PVC for SQLite**: In K8s, backend uses PVC — switch to PostgreSQL/MySQL + Redis before scaling replicas >1
- **CORS**: Configured via `CORS_ORIGIN` env var; Vite dev server proxies `/api` to `localhost:8000`
- **No separate lint/typecheck for backend** — run `pytest` as primary verification

## Frontend Test Notes
- Vitest + jsdom + React Testing Library
- Setup file: `frontend/src/test/setup.ts` (mocks `window.matchMedia`)
- Tests in `src/**/*.test.{ts,tsx}`

## Backend Test Notes
- Tests in `backend/tests/` (test_tools.py, test_session_store.py, test_db.py, test_auth.py, test_api.py, test_agent.py, test_adapters.py)
- Uses `pytest-asyncio` for async tests