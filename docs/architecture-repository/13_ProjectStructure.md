# 13 — Project Structure: DataFlow AI

**Document Class**: Architecture Repository — Project Structure
**Project**: DataFlow AI — Conversational Database Analytics
**Status**: Final — the canonical repository layout, naming conventions, and ownership boundaries.

---

## Purpose

This document defines the exact repository structure of DataFlow AI: every directory, file, and the conventions that keep the codebase consistent between two developers working in parallel. It is the contract for where code lives — which prevents merge conflicts by construction (ownership boundaries) and which makes the codebase instantly legible to judges.

---

## Overview

The project is a **monorepo** (`dataflow-ai/`) with three top-level areas — `backend/`, `frontend/`, `database/` — plus deployment and documentation files. Ownership is strictly partitioned: Dev A touches `backend/**`, `database/**`, deployment files; Dev B touches `frontend/**`; the only shared file is the frontend types module (`types/index.ts`), which both approve.

---

## 1. Repository Tree

```
dataflow-ai/
├── README.md                  # Setup, architecture overview, tool docs (Dev A, B screenshots)
├── docker-compose.yml         # Full-stack orchestration (Dev A writes, Dev B reviews)
├── .env.example               # Template — no secrets (Dev A)
├── .gitignore                 # .env, node_modules, __pycache__, *.pyc
├── backend/                   # Dev A — entire Python backend
│   ├── main.py                # FastAPI entry: CORS, routers, startup probe
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env                   # gitignored
│   ├── api/
│   │   ├── __init__.py
│   │   ├── router.py          # Chat Router + session/schema/export endpoints
│   │   └── schemas.py         # Pydantic models
│   ├── agent/
│   │   ├── __init__.py
│   │   ├── orchestrator.py    # ReAct loop + SSE event emission
│   │   ├── prompt.py          # System prompt + tool rules
│   │   ├── session.py         # In-memory sessions, window, schema cache
│   │   └── tool_registry.py   # Dispatch map
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── get_schema.py
│   │   ├── execute_query.py
│   │   ├── generate_chart.py
│   │   ├── generate_flowchart.py
│   │   └── explain_data.py
│   ├── db/
│   │   ├── __init__.py
│   │   ├── connection.py      # aiosqlite manager
│   │   └── validator.py       # SELECT-only guard
│   └── tests/
│       ├── conftest.py
│       ├── test_tools.py
│       ├── test_agent.py      # integration-marked (real Claude)
│       ├── test_api.py
│       └── test_db.py
├── frontend/                  # Dev B — entire React application
│   ├── index.html
│   ├── vite.config.ts         # dev proxy /api → backend:8000
│   ├── tsconfig.json
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── Dockerfile             # multi-stage build → nginx
│   ├── public/favicon.ico
│   └── src/
│       ├── main.tsx
│       ├── App.tsx            # 3-column layout
│       ├── components/
│       │   ├── chat/
│       │   │   ├── ChatContainer.tsx
│       │   │   ├── MessageBubble.tsx
│       │   │   ├── MessageInput.tsx
│       │   │   ├── TypingIndicator.tsx
│       │   │   └── SQLBadge.tsx
│       │   ├── visualizations/
│       │   │   ├── ChartRenderer.tsx
│       │   │   ├── BarChart.tsx
│       │   │   ├── LineChart.tsx
│       │   │   ├── PieChart.tsx
│       │   │   ├── ScatterChart.tsx
│       │   │   └── DiagramRenderer.tsx
│       │   ├── sidebar/
│       │   │   ├── QueryHistory.tsx
│       │   │   └── HistoryItem.tsx
│       │   └── ui/
│       │       ├── Button.tsx
│       │       ├── Spinner.tsx
│       │       ├── ErrorBubble.tsx
│       │       └── ExportButton.tsx
│       ├── hooks/
│       │   ├── useChat.ts
│       │   ├── useQueryHistory.ts
│       │   └── useExport.ts
│       ├── services/
│       │   └── api.ts         # SSE client (fetch + ReadableStream)
│       ├── types/
│       │   └── index.ts       # Shared SSE contract types
│       └── styles/
│           └── globals.css    # Tailwind + theme tokens
├── database/
│   ├── ecommerce.sqlite       # Provided sample (kept in repo — provided asset)
│   └── schema.sql             # Design reference DDL
└── docs/
    ├── tool-api.md            # Tool contracts (Dev A)
    └── demo-scenarios.md      # Scripted demo (shared)
```

---

## 2. Naming Conventions

| Domain | Convention | Examples |
|--------|------------|----------|
| Python files/functions/vars | `snake_case` | `get_schema.py`, `process_message` |
| Python classes | `PascalCase` | `ChatRequest`, `SessionStore` |
| React components | `PascalCase` files + components | `MessageBubble.tsx`, `ChartRenderer.tsx` |
| React hooks | `camelCase` with `use` prefix | `useChat.ts`, `useQueryHistory.ts` |
| TypeScript interfaces | `PascalCase` with `I` prefix | `IMessage`, `IChartPayload` |
| API routes | `kebab-case` | `/api/session/{id}/history`, `/api/export/csv` |
| Environment variables | `SCREAMING_SNAKE_CASE` | `ANTHROPIC_API_KEY`, `MAX_TOOL_ITERATIONS` |
| Git branches | `feature/backend-*`, `feature/frontend-*` | `feature/backend-tools` |
| Git commits | Conventional commits | `feat(backend): ...`, `fix(frontend): ...` |

---

## 3. Ownership Boundaries (Conflict Prevention)

| Path | Owner | Notes |
|------|-------|-------|
| `backend/**` | Dev A only | Exclusive |
| `frontend/**` (except types) | Dev B only | Exclusive |
| `frontend/src/types/index.ts` | **Shared** | Both approve any change |
| `docker-compose.yml` | Dev A writes / Dev B reviews | Deployment is shared concern |
| `README.md` | Dev A drafts / Dev B adds screenshots | — |
| `.env.example` | Dev A | Backend env surface |
| `database/**` | Dev A | Provided asset + schema reference |

The SSE contract lives in exactly one place (`types/index.ts`); changing it requires the protocol in `18_IntegrationPlan.md` §4.

---

## 4. What Is Not Committed

| Item | Reason |
|------|--------|
| `.env` | Secrets — mandatory brief requirement |
| `node_modules/` | Generated |
| `__pycache__/`, `*.pyc` | Generated |
| Demo videos/screenshots (except README copies) | External hosting |

Note: `ecommerce.sqlite` **is** committed — it is the provided sample asset and the demo depends on its presence.

---

## 5. Design Decisions

| Decision | Why |
|----------|-----|
| Monorepo over polyrepo | Two devs, one repo, one clone, one compose file — zero repo-sync overhead |
| `backend/` + `frontend/` + `database/` split | Mirrors the 3-tier architecture; judges map structure to system |
| One component per file (frontend) | Testable, reviewable, and matches React conventions |
| Layer directories inside `backend/` | Four-layer dependency direction is visible in the tree itself |
| Shared `types/index.ts` as the only shared file | The integration contract is a first-class artifact, not an afterthought |
| Committed sample DB | Demo reproducibility on the judge machine |

---

## 6. Responsibilities, Dependencies, Advantages, Limitations, Future Scope

**Responsibilities**: structure ownership as in §3; README is the entry document.
**Dependencies**: structure depends on architecture decisions (02/03); in turn it constrains `14_ModuleBreakdown.md`.
**Advantages**: zero-conflict ownership, judge-legible layout, one clone to demo, conventions reduce review friction.
**Limitations**: monorepo size grows with future apps (acceptable); shared types file is a coordination point (managed by protocol).
**Future scope**: `packages/` workspace for shared libraries, CI config (`workflows/`), migrations directory for DB versioning, `infra/` for cloud deployment manifests.

---

## Summary

The DataFlow AI repository is a three-area monorepo — backend (four layers), frontend (shell/chat/visualization/hooks/services/types), database (provided sample) — governed by strict naming conventions and exclusive ownership boundaries, with the SSE contract in a single shared types file. The structure makes the architecture visible in the file tree itself, prevents parallel-build conflicts by construction, and stays demo-ready with a single clone.

---

*Next document: `14_ModuleBreakdown.md` — module map, interfaces, and dependency graph.*
