# 10 — Developer A Task Breakdown
## iTech AI Innovation Hackathon 2026
### Role: Backend Engineer / Agent Architect

---

## Overview

Developer A owns the **entire Python backend**: FastAPI server, LLM agent orchestration, all 5 tool implementations, database layer, SSE streaming, Docker, and README.

**No overlap with Developer B.** Developer A hands off structured JSON to the SSE stream; Developer B consumes it in the frontend.

---

## Day 1 (Aug 1) — Backend Foundation

### Tasks

| # | Task | Est. Time | Deliverable |
|---|------|-----------|-------------|
| A1.1 | Initialize Python project: `requirements.txt`, virtual env | 30 min | `backend/requirements.txt` |
| A1.2 | Create `main.py` with FastAPI app + CORS middleware | 30 min | Server starts on port 8000 |
| A1.3 | Create `.env.example` with all required variables | 15 min | `.env.example` |
| A1.4 | Connect to provided SQLite DB via `aiosqlite` | 30 min | `db/connection.py` |
| A1.5 | Implement `get_schema` tool — full implementation + unit test | 2 hrs | `tools/get_schema.py` |
| A1.6 | Implement `execute_query` tool + SQL validator | 3 hrs | `tools/execute_query.py`, `db/validator.py` |
| A1.7 | Stub `/api/chat` endpoint returning hardcoded SSE | 1 hr | `api/router.py` |

### Dependencies
- None (Day 1 is independent setup)

### Deliverables
- Backend server running at `localhost:8000`
- `get_schema` tested manually via `pytest` or `curl`
- `execute_query` returns rows for demo queries from `04_DatabaseDesign.md`

### Expected Completion
**End of Day 1** — approx. 8 hours of work

---

## Day 2 (Aug 2) — Agent Core

### Tasks

| # | Task | Est. Time | Deliverable |
|---|------|-----------|-------------|
| A2.1 | Create `agent/orchestrator.py` — agent loop skeleton | 2 hrs | `orchestrator.py` |
| A2.2 | Integrate Anthropic SDK: `anthropic.Anthropic()` client | 30 min | Client configured, API key from `.env` |
| A2.3 | Write system prompt in `agent/prompt.py` | 30 min | `prompt.py` |
| A2.4 | Implement tool schemas (JSON schema for all 5 tools) | 1 hr | `TOOLS` list in `orchestrator.py` |
| A2.5 | Implement `Tool Registry` — `tool_registry.py` | 30 min | `agent/tool_registry.py` |
| A2.6 | Implement in-memory session history (`session.py`) | 1 hr | `agent/session.py` |
| A2.7 | Wire agent into `/api/chat` — real SSE streaming | 2 hrs | Agent responds to real user messages |
| A2.8 | Test: "Show all products" → Claude calls tools → streams response | 1 hr | End-to-end text response works |

### Dependencies
- Day 1 complete: `get_schema` + `execute_query` working

### Deliverables
- `POST /api/chat` accepts message, streams Claude's response via SSE
- Claude correctly calls `get_schema` then `execute_query` for a simple query

### Expected Completion
**End of Day 2**

---

## Day 3 (Aug 3) — Remaining 3 Tools + SSE Events

### Tasks

| # | Task | Est. Time | Deliverable |
|---|------|-----------|-------------|
| A3.1 | Implement `generate_chart` tool | 2 hrs | `tools/generate_chart.py` |
| A3.2 | Implement `generate_flowchart` tool (ER + flowchart modes) | 3 hrs | `tools/generate_flowchart.py` |
| A3.3 | Implement `explain_data` tool | 1 hr | `tools/explain_data.py` |
| A3.4 | Emit typed SSE events: `chart`, `diagram`, `sql`, `tool_start`, `tool_end` | 2 hrs | SSE event types match `05_API_Design.md` |
| A3.5 | Test chart tool: "Top 5 products" → SSE emits `chart` event with bar data | 1 hr | Chart JSON correct |
| A3.6 | Test flowchart tool: "Draw ER diagram" → SSE emits `diagram` event | 1 hr | Mermaid string correct |

### Dependencies
- Day 2 complete: Agent loop working

### Deliverables
- All 5 tools implemented and registered
- SSE emits `chart` and `diagram` events that frontend can parse

### Expected Completion
**End of Day 3**

---

## Day 4 (Aug 4) — Integration + Error Handling

### Tasks

| # | Task | Est. Time | Deliverable |
|---|------|-----------|-------------|
| A4.1 | Integration test: Use Case 1 (Top 5 products → bar chart → trend line) | 2 hrs | Full flow works |
| A4.2 | Integration test: Use Case 2 (ER diagram + table relationships) | 1 hr | Mermaid ER diagram generated |
| A4.3 | Integration test: Use Case 3 (Order flow flowchart) | 1 hr | Flowchart generated |
| A4.4 | Tool error handling: inject error as tool_result, test recovery | 1 hr | LLM self-corrects after SQL error |
| A4.5 | API error handling: timeout, rate limit, 503 responses | 1 hr | Frontend sees actionable error message |
| A4.6 | Schema cache per session (prevent repeated `get_schema` calls) | 1 hr | Second turn doesn't re-fetch schema |
| A4.7 | Fix all bugs found during integration | 2 hrs | All 3 demo scenarios pass |

### Dependencies
- Day 3 complete: All tools implemented

### Deliverables
- All 3 hackathon demo use cases work without errors
- Error recovery verified: bad SQL → Claude corrects → query succeeds

### Expected Completion
**End of Day 4**

---

## Day 5 (Aug 5) — Bonus Features

### Tasks

| # | Task | Est. Time | Deliverable |
|---|------|-----------|-------------|
| A5.1 | `/api/export/csv` endpoint — execute SQL, return CSV download | 1.5 hrs | `GET /api/export/csv` works |
| A5.2 | `/api/session/{id}/history` endpoint | 1 hr | Session history returns JSON |
| A5.3 | `/api/health` endpoint | 30 min | Health check returns DB + API status |
| A5.4 | `/api/schema` direct endpoint (for schema panel) | 1 hr | Schema panel data |
| A5.5 | Scatter plot support in `generate_chart` | 30 min | `chart_type: "scatter"` works |
| A5.6 | SQL explanation mode: emit SQL before execution via SSE | 30 min | `sql` SSE event fires for every execute_query |

### Dependencies
- Day 4 complete: All demo scenarios work

### Deliverables
- All bonus endpoints functional
- SQL transparency working

### Expected Completion
**End of Day 5**

---

## Day 6 (Aug 6) — Docker + README + Demo Prep

### Tasks

| # | Task | Est. Time | Deliverable |
|---|------|-----------|-------------|
| A6.1 | `backend/Dockerfile` | 30 min | Docker image builds |
| A6.2 | `docker-compose.yml` (backend + frontend + volume for DB) | 1 hr | `docker-compose up` starts full stack |
| A6.3 | `README.md` — setup instructions | 1 hr | 5-command setup works |
| A6.4 | `README.md` — architecture overview section | 30 min | Mermaid diagram embedded |
| A6.5 | `README.md` — tool documentation section | 30 min | All 5 tools documented |
| A6.6 | Demo scenario rehearsal with Dev B | 1 hr | Scripted demo practiced |
| A6.7 | Unit test suite: `tests/test_tools.py` | 1.5 hrs | All 5 tools have passing unit tests |

### Dependencies
- Frontend Dockerfile from Dev B

### Deliverables
- `docker-compose up` starts the full stack
- README passes a "fresh setup" test
- `pytest tests/` passes

### Expected Completion
**End of Day 6**

---

## Day 7 (Aug 7) — Buffer + Submission

### Tasks

| # | Task | Est. Time | Deliverable |
|---|------|-----------|-------------|
| A7.1 | Final bug fixes (bugs found during demo rehearsal) | 2 hrs | All critical bugs fixed |
| A7.2 | Git cleanup: clean commit messages, `.gitignore` complete | 30 min | Clean repo |
| A7.3 | Verify `.env.example` has every required variable | 15 min | Checklist pass |
| A7.4 | Submit Git repository link | 15 min | Submission complete |

### Expected Completion
**End of Day 7 (noon target)**

---

## Developer A — Full File Ownership

| File | Status |
|------|--------|
| `backend/main.py` | Dev A |
| `backend/requirements.txt` | Dev A |
| `backend/Dockerfile` | Dev A |
| `docker-compose.yml` | Dev A |
| `backend/api/router.py` | Dev A |
| `backend/api/schemas.py` | Dev A |
| `backend/agent/orchestrator.py` | Dev A |
| `backend/agent/prompt.py` | Dev A |
| `backend/agent/session.py` | Dev A |
| `backend/agent/tool_registry.py` | Dev A |
| `backend/tools/get_schema.py` | Dev A |
| `backend/tools/execute_query.py` | Dev A |
| `backend/tools/generate_chart.py` | Dev A |
| `backend/tools/generate_flowchart.py` | Dev A |
| `backend/tools/explain_data.py` | Dev A |
| `backend/db/connection.py` | Dev A |
| `backend/db/validator.py` | Dev A |
| `backend/tests/` | Dev A |
| `README.md` | Dev A (with Dev B input) |
| `.env.example` | Dev A |

---

## Integration Checkpoints with Dev B

| Checkpoint | Day | What Dev A Delivers | What Dev B Needs |
|------------|-----|---------------------|-----------------|
| CP1 | Day 1 EOD | SSE endpoint returns hardcoded `token` events | SSE hook can parse token events |
| CP2 | Day 2 EOD | Real agent responses streaming | Frontend shows streamed text |
| CP3 | Day 3 EOD | `chart` SSE events with correct JSON | `ChartRenderer` parses payload |
| CP3 | Day 3 EOD | `diagram` SSE events with Mermaid string | `DiagramRenderer` parses payload |
| CP4 | Day 4 EOD | All 3 demo scenarios confirmed | Dev B tests UI against all 3 |
| CP5 | Day 6 | Docker backend image | Frontend Dockerfile from Dev B |
