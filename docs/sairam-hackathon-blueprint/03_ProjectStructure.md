# 03 — Project Structure
## iTech AI Innovation Hackathon 2026

---

## 1. Root Directory Layout

```
dataflow-ai/                          ← Project root
├── backend/                          ← FastAPI Python backend
├── frontend/                         ← React + Vite frontend
├── database/                         ← SQLite DB files
├── docker-compose.yml                ← Full stack orchestration
├── .env.example                      ← Environment variable template
├── .gitignore
└── README.md                         ← Setup + architecture overview
```

---

## 2. Backend Structure

```
backend/
├── main.py                           ← FastAPI app entry point, CORS, routes
├── requirements.txt                  ← Python dependencies
├── Dockerfile                        ← Backend container definition
├── .env                              ← API keys (gitignored)
│
├── api/
│   ├── __init__.py
│   ├── router.py                     ← Chat endpoint: POST /api/chat (SSE)
│   └── schemas.py                    ← Pydantic request/response models
│
├── agent/
│   ├── __init__.py
│   ├── orchestrator.py               ← Main LLM agent loop (tool_use handling)
│   ├── prompt.py                     ← System prompt and prompt templates
│   ├── session.py                    ← In-memory conversation history manager
│   └── tool_registry.py             ← Tool registration and dispatch
│
├── tools/
│   ├── __init__.py
│   ├── get_schema.py                 ← Tool: retrieve DB schema as JSON
│   ├── execute_query.py              ← Tool: run SELECT SQL, return rows
│   ├── generate_chart.py             ← Tool: return chart config JSON
│   ├── generate_flowchart.py         ← Tool: return Mermaid diagram string
│   └── explain_data.py              ← Tool: produce NL summary of data
│
├── db/
│   ├── __init__.py
│   ├── connection.py                 ← aiosqlite connection manager
│   └── validator.py                 ← SQL safety validator (SELECT-only)
│
└── tests/
    ├── test_tools.py                 ← Unit tests for all 5 tools
    ├── test_agent.py                 ← Integration test for agent loop
    └── conftest.py                   ← Pytest fixtures
```

---

## 3. Frontend Structure

```
frontend/
├── index.html                        ← Vite entry HTML
├── vite.config.ts                    ← Vite configuration
├── tsconfig.json                     ← TypeScript config
├── package.json                      ← npm dependencies
├── tailwind.config.ts                ← Tailwind configuration
├── Dockerfile                        ← Frontend container definition
│
├── public/
│   └── favicon.ico
│
└── src/
    ├── main.tsx                      ← React entry point
    ├── App.tsx                       ← Root component + layout
    │
    ├── components/
    │   ├── chat/
    │   │   ├── ChatContainer.tsx     ← Full chat panel (messages + input)
    │   │   ├── MessageBubble.tsx     ← Individual message with role styling
    │   │   ├── MessageInput.tsx      ← Textarea + send button
    │   │   ├── TypingIndicator.tsx   ← Animated "agent is thinking" bubble
    │   │   └── SQLBadge.tsx         ← Collapsible SQL transparency panel
    │   │
    │   ├── visualizations/
    │   │   ├── ChartRenderer.tsx     ← Detects chart type, renders Recharts
    │   │   ├── BarChart.tsx          ← Recharts BarChart wrapper
    │   │   ├── LineChart.tsx         ← Recharts LineChart wrapper
    │   │   ├── PieChart.tsx          ← Recharts PieChart wrapper
    │   │   ├── ScatterChart.tsx      ← Recharts ScatterChart wrapper
    │   │   └── DiagramRenderer.tsx   ← Renders Mermaid.js string
    │   │
    │   ├── sidebar/
    │   │   ├── QueryHistory.tsx      ← Saved query list (bonus)
    │   │   └── HistoryItem.tsx       ← Single history entry
    │   │
    │   └── ui/
    │       ├── Button.tsx
    │       ├── Spinner.tsx
    │       ├── ErrorBubble.tsx
    │       └── ExportButton.tsx      ← PNG/CSV download (bonus)
    │
    ├── hooks/
    │   ├── useChat.ts                ← SSE connection, message state management
    │   ├── useQueryHistory.ts        ← localStorage query history (bonus)
    │   └── useExport.ts              ← Chart PNG / data CSV export (bonus)
    │
    ├── services/
    │   └── api.ts                    ← fetch wrapper for /api/chat
    │
    ├── types/
    │   └── index.ts                  ← Shared TypeScript interfaces
    │
    └── styles/
        └── globals.css               ← Tailwind directives + custom CSS
```

---

## 4. Database Directory

```
database/
├── ecommerce.sqlite                  ← Provided sample DB (orders, products, customers, inventory)
└── schema.sql                        ← Schema documentation (generated from get_schema)
```

---

## 5. Shared Configuration

```
.env.example
─────────────
ANTHROPIC_API_KEY=your_key_here
DATABASE_PATH=../database/ecommerce.sqlite
CORS_ORIGIN=http://localhost:5173
MAX_TOKENS=4096
MODEL=claude-sonnet-4-6
```

---

## 6. Naming Conventions

| Scope | Convention | Example |
|-------|-----------|---------|
| Python files | `snake_case` | `execute_query.py` |
| Python functions | `snake_case` | `def get_schema(db_name)` |
| Python classes | `PascalCase` | `class AgentOrchestrator` |
| React components | `PascalCase` | `MessageBubble.tsx` |
| React hooks | `camelCase` with `use` prefix | `useChat.ts` |
| TypeScript interfaces | `PascalCase` with `I` prefix | `IMessage` |
| CSS classes | Tailwind utilities | `flex flex-col gap-4` |
| API routes | `kebab-case` | `/api/chat`, `/api/history` |
| Environment variables | `SCREAMING_SNAKE_CASE` | `ANTHROPIC_API_KEY` |

---

## 7. Assets & Static Files

```
frontend/public/
├── favicon.ico
└── logo.svg                          ← Project logo (optional, for demo polish)
```

---

## 8. Documentation Files

```
/
├── README.md                         ← Quick start, architecture summary, demo steps
├── docs/
│   ├── tool-api.md                   ← Tool function schemas + examples
│   └── demo-scenarios.md             ← 3 scripted demo paths for judging
```
