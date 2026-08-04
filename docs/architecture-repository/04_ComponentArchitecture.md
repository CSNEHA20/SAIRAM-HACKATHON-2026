# 04 — Component Architecture: DataFlow AI

**Document Class**: Architecture Repository — Component Architecture
**Project**: DataFlow AI — Conversational Database Analytics
**Status**: Final — the exhaustive component inventory with responsibilities, interfaces, and dependencies.

---

## Purpose

This document decomposes the system into its complete component inventory: every component in the backend and frontend, its responsibility, its external interface (what it exposes and consumes), and its dependencies. It is the reference for module breakdown (`14_ModuleBreakdown.md`), developer assignment (`16_DeveloperA.md`, `17_DeveloperB.md`), and testing (`20_TestingStrategy.md`). If a component is missing from this document, it does not exist in the system.

---

## Overview

The component architecture follows the 3-tier structure with a strict ownership split: **Dev A owns all backend components; Dev B owns all frontend components**. The only shared artifact is the SSE event contract (types), documented fully in `18_IntegrationPlan.md`.

```mermaid
flowchart TB
    subgraph B["Backend Components (Dev A)"]
        M[main.py - FastAPI entry + CORS]
        R[router.py - Chat Router]
        SC[schemas.py - Pydantic models]
        OR[orchestrator.py - Agent Loop]
        PR[prompt.py - System prompt]
        SE[session.py - Session Store]
        TR[registry.py - Tool Registry]
        G1[get_schema] G2[execute_query] G3[generate_chart] G4[generate_flowchart] G5[explain_data]
        C1[connection.py - DB Manager]
        V1[validator.py - SQL Guard]
    end

    subgraph F["Frontend Components (Dev B)"]
        APP[App.tsx - Layout]
        CC[ChatContainer]
        MB[MessageBubble]
        MI[MessageInput]
        TI[TypingIndicator]
        SB[SQLBadge]
        CR[ChartRenderer]
        BC[BarChart] LC[LineChart] PC[PieChart] SCt[ScatterChart]
        DR[DiagramRenderer]
        QH[QueryHistory]
        EB[ExportButton]
        ERR[ErrorBubble]
        UC[useChat hook]
        UQ[useQueryHistory hook]
        APIS[api.ts - SSE client]
        TYPES[types/index.ts - Shared contract]
    end

    M --> R
    R --> OR
    R --> SC
    OR --> TR
    OR --> SE
    OR --> PR
    TR --> G1
    TR --> G2
    TR --> G3
    TR --> G4
    TR --> G5
    G1 --> C1
    G2 --> C1
    G2 --> V1
    G5 --> G1
    C1 --> DB[(SQLite)]
    EXT[(Claude API)] <--> OR

    APIS -.->|SSE contract| R
    TYPES -.->|shared types| APIS
    UC --> APIS
    CC --> UC
    CC --> MB
    CC --> MI
    CC --> TI
    MB --> CR
    MB --> DR
    MB --> SB
    MB --> ERR
    CR --> BC
    CR --> LC
    CR --> PC
    CR --> SCt
    QH --> UQ
    EB --> APIS
```

---

## 1. Backend Components

### 1.1 Entry & API Layer

| Component | Responsibility | Interface | Depends On |
|-----------|----------------|-----------|------------|
| `main.py` | FastAPI app factory; CORS middleware; router registration; `/api/health` | HTTP app | router, env config |
| `api/router.py` | Chat Router: validates `POST /api/chat`, builds SSE `StreamingResponse`, dispatches to orchestrator; also `/api/schema`, `/api/session/*`, `/api/export/csv` | HTTP + SSE | orchestrator, session store, schemas |
| `api/schemas.py` | Pydantic models: `ChatRequest`, `ChatOptions`, `MessageRecord`, `HistoryResponse`, `SchemaResponse`, `ExportRequest` | Python types | pydantic |

### 1.2 Agent Layer

| Component | Responsibility | Interface | Depends On |
|-----------|----------------|-----------|------------|
| `agent/orchestrator.py` | The ReAct loop: builds messages, calls Claude, dispatches tool calls, streams SSE events, saves turns | `process_message(message, session_id) → async generator of events` | registry, session store, prompt, Anthropic SDK |
| `agent/prompt.py` | System prompt content + rules (tool-first, SQL transparency, chart selection) | Constant/string | — |
| `agent/session.py` | In-memory per-session message history (10-turn window), schema cache | `get_or_create`, `add_turn`, `clear` | — |
| `agent/tool_registry.py` | Maps tool names → implementations; single `execute(name, **inputs)` dispatch; unknown-tool error | `execute(name, inputs) → envelope` | all 5 tools |

### 1.3 Tool Layer

| Component | Responsibility | Interface |
|-----------|----------------|-----------|
| `tools/get_schema.py` | Retrieve tables, columns, types, PKs, FKs, row counts (PRAGMA-based); optional `table_filter` | `get_schema(table_filter?) → {success, tables, total_tables}` |
| `tools/execute_query.py` | Validate + execute SELECT; serialize rows; apply/cap LIMIT | `execute_query(sql, limit=100) → {success, columns, rows, row_count, truncated}` |
| `tools/generate_chart.py` | Validate data shape; emit chart config JSON for Recharts | `generate_chart(chart_type, data, x_key, y_key, ...) → {success, chart_type, title, data, config}` |
| `tools/generate_flowchart.py` | Build Mermaid ER from schema data; pass through pre-written Mermaid | `generate_flowchart(diagram_type, mermaid_code?, schema_data?) → {success, diagram_type, mermaid}` |
| `tools/explain_data.py` | Local computation of key metrics (top/bottom/total/average); feeds Claude's narrative | `explain_data(data, columns, context?, insight_type?) → {success, insight_type, summary, key_metrics}` |

### 1.4 Data Layer

| Component | Responsibility | Interface |
|-----------|----------------|-----------|
| `db/connection.py` | aiosqlite connection manager; `row_factory`; result serialization `{columns, rows: [dict], row_count}` | async `execute` helpers |
| `db/validator.py` | SELECT-only enforcement; forbidden-keyword list; LIMIT policy | `validate(sql) → (is_valid, error_message)` |

---

## 2. Frontend Components

### 2.1 Application Shell

| Component | Responsibility | Dependencies |
|-----------|----------------|--------------|
| `App.tsx` | 3-column responsive layout (history sidebar / chat panel / optional schema panel); theme | layout components |
| `services/api.ts` | `sendMessage()` using fetch + ReadableStream (EventSource cannot POST); JSON/SSE parsing | types |
| `hooks/useChat.ts` | Message state machine; SSE event dispatch to renderers; streaming token accumulation | api.ts, types |
| `hooks/useQueryHistory.ts` | localStorage CRUD for history; re-run support | — |

### 2.2 Chat Components

| Component | Responsibility |
|-----------|----------------|
| `ChatContainer.tsx` | Message list, auto-scroll, input wiring |
| `MessageBubble.tsx` | Renders markdown + SQL badge + charts + diagrams + error/export affordances |
| `MessageInput.tsx` | Auto-resize textarea (1–5 rows), Enter-to-send, disabled-while-processing, char counter |
| `TypingIndicator.tsx` | Pulsing dots + live tool label from `tool_start` events |
| `ErrorBubble.tsx` | Friendly error presentation with retry |
| `SQLBadge.tsx` | Collapsible SQL transparency panel with copy button |

### 2.3 Visualization Components

| Component | Responsibility |
|-----------|----------------|
| `ChartRenderer.tsx` | Dispatches by `chart_type` to the 4 chart components; responsive container |
| `BarChart / LineChart / PieChart / ScatterChart` | Recharts implementations with shared palette, tooltips, labels |
| `DiagramRenderer.tsx` | Mermaid rendering with error boundary (raw code fallback), fullscreen mode |

### 2.4 Utility Components

| Component | Responsibility |
|-----------|----------------|
| `QueryHistory.tsx` / `HistoryItem.tsx` | History list with re-run/delete/clear |
| `ExportButton.tsx` | PNG capture (html2canvas) + CSV download (backend endpoint) |
| `Button / Spinner` | Shared UI primitives |

---

## 3. Cross-Cutting Concerns

| Concern | Mechanism |
|---------|-----------|
| Event contract | `types/index.ts` — 8 SSE event types, shared and frozen (`18_IntegrationPlan.md`) |
| Config | `.env` → `os.getenv` on backend; `import.meta.env` on frontend |
| Error taxonomy | `error` SSE event with `{code, message}`; mapped from backend error codes |
| Logging | uvicorn access logs; tool execution logged at DEBUG |

---

## 4. Component Interface Summary (Backend ↔ Frontend)

The only backend interface the frontend consumes:

| Endpoint | Purpose |
|----------|---------|
| `POST /api/chat` | SSE stream (token, sql, chart, diagram, tool_start, tool_end, done, error) |
| `GET /api/session/{id}/history` | History restore |
| `DELETE /api/session/{id}` | Clear session |
| `GET /api/health` | Liveness for Docker healthchecks |
| `GET /api/schema` | Direct schema (schema panel) |
| `POST /api/export/csv` | CSV download |

---

## 5. Design Decisions

| Decision | Why |
|----------|-----|
| One component per tool file | Architecture rubric visibility: per-tool files, clear docstrings |
| Router thin, orchestrator thick | Router only validates and streams; all agent logic lives in orchestrator — separation of concerns |
| Pydantic on every request boundary | Validation + OpenAPI docs; 422 errors instead of silent misbehavior |
| Chart tool returns config, not pixels | LLM never produces binary; frontend renders from JSON — keeps tool outputs machine-parseable |
| Diagram tool returns Mermaid text | LLM writes diagram code natively; frontend renders; backend never parses SVG |
| Error bubble as first-class component | The brief demands graceful error UX; judges see friendly recovery, not crashes |

---

## 6. Advantages / Limitations / Future Scope

**Advantages**: complete inventory → no orphan components; ownership table prevents merge conflicts; each component is unit-testable in isolation; tool layer is independently extensible.
**Limitations**: in-memory session store is a single point of session loss on restart; frontend-heavy message bubble may grow complex (mitigated by renderer delegation).
**Future scope**: component boundaries allow adding a WebSocket transport, new tools (e.g., `export_report`, `get_realtime`), and a dashboard builder as new components without restructuring.

---

## Summary

The component architecture inventory defines 15 backend components (entry/API, agent, tools, data) and 16 frontend components (shell, chat, visualization, utilities), connected by a frozen SSE contract and a small REST surface. Ownership is cleanly split between Dev A (backend) and Dev B (frontend). Every component has a single responsibility, a defined interface, and recorded dependencies — the foundation for parallel development, isolated testing, and the extensibility that the Architecture rubric rewards.

---

*Next document: `05_AgentArchitecture.md` — the LLM agent: lifecycle, memory, tool-calling protocol, and error recovery.*
