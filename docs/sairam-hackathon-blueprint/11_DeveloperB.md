# 11 — Developer B Task Breakdown
## iTech AI Innovation Hackathon 2026
### Role: Frontend Engineer / UI Developer

---

## Overview

Developer B owns the **entire React frontend**: chat interface, SSE parsing, all chart components, diagram renderer, sidebar, bonus UI features, and the frontend Dockerfile.

**No overlap with Developer A.** Developer B consumes SSE events from the backend; all backend logic is Dev A's domain.

---

## Day 1 (Aug 1) — Frontend Foundation

### Tasks

| # | Task | Est. Time | Deliverable |
|---|------|-----------|-------------|
| B1.1 | Initialize Vite + React + TypeScript project | 20 min | `frontend/` directory scaffolded |
| B1.2 | Install dependencies: Tailwind CSS, Recharts, Mermaid, react-markdown | 30 min | `package.json` complete |
| B1.3 | Configure Tailwind CSS with custom color palette | 30 min | `tailwind.config.ts` |
| B1.4 | Build `App.tsx` — 3-column layout (sidebar + chat + schema) | 1.5 hrs | Layout renders correctly |
| B1.5 | Build `ChatContainer.tsx` — flex column, scroll, message list | 1 hr | Container renders |
| B1.6 | Build `MessageBubble.tsx` — user and assistant variants | 1.5 hrs | Both bubble styles render |
| B1.7 | Build `MessageInput.tsx` — textarea + send button | 1 hr | Input functional |
| B1.8 | Create `types/index.ts` — all shared TypeScript interfaces | 30 min | `IMessage`, `IChartPayload`, `IDiagramPayload` |

### Dependencies
- None — Day 1 is independent

### Deliverables
- Frontend runs at `localhost:5173`
- Chat layout renders with hardcoded mock messages
- Both message bubble styles display correctly

### Expected Completion
**End of Day 1**

---

## Day 2 (Aug 2) — SSE Integration + Live Chat

### Tasks

| # | Task | Est. Time | Deliverable |
|---|------|-----------|-------------|
| B2.1 | Implement `services/api.ts` — `sendMessage()` with `EventSource` | 1 hr | `api.ts` |
| B2.2 | Implement `hooks/useChat.ts` — SSE connection, message state | 2 hrs | `useChat.ts` |
| B2.3 | Parse SSE event types: `token`, `chart`, `diagram`, `sql`, `done`, `error` | 1.5 hrs | All event types handled |
| B2.4 | Token accumulation: stream tokens into `isStreaming` message | 1 hr | Streaming text renders |
| B2.5 | Build `TypingIndicator.tsx` — animated dots + tool name | 1 hr | `TypingIndicator.tsx` |
| B2.6 | Wire `useChat` into `ChatContainer` | 30 min | Full send → stream flow |
| B2.7 | Auto-scroll to bottom on new message | 30 min | Chat scrolls correctly |
| B2.8 | Add `react-markdown` to `MessageBubble` for markdown rendering | 30 min | Bold, code blocks render |

### Dependencies
- Dev A: SSE endpoint returns `token` events (CP1 handoff from Day 1)

### Deliverables
- User can type a message, send it, see streamed response in real-time
- Typing indicator shows "Querying database..." during processing

### Expected Completion
**End of Day 2**

---

## Day 3 (Aug 3) — Chart + Diagram Components

### Tasks

| # | Task | Est. Time | Deliverable |
|---|------|-----------|-------------|
| B3.1 | Build `BarChart.tsx` — Recharts `BarChart` with tooltip + legend | 1 hr | Bar chart renders with data |
| B3.2 | Build `LineChart.tsx` — Recharts `LineChart` with X/Y axes | 1 hr | Line chart renders |
| B3.3 | Build `PieChart.tsx` — Recharts `PieChart` with labels | 1 hr | Pie chart renders |
| B3.4 | Build `ScatterChart.tsx` — Recharts `ScatterChart` (bonus) | 30 min | Scatter chart renders |
| B3.5 | Build `ChartRenderer.tsx` — detects chart_type, renders correct component | 1 hr | Auto-routes to correct chart |
| B3.6 | Wire `chart` SSE event → `ChartRenderer` inside `MessageBubble` | 1 hr | Charts appear in chat bubbles |
| B3.7 | Build `DiagramRenderer.tsx` — Mermaid string → rendered diagram | 1.5 hrs | ER diagrams and flowcharts render |
| B3.8 | Wire `diagram` SSE event → `DiagramRenderer` inside `MessageBubble` | 30 min | Diagrams appear in chat bubbles |
| B3.9 | Add loading skeleton for charts (grey animated bar while loading) | 30 min | Charts have loading state |

### Dependencies
- Dev A: `chart` SSE events with correct payload (CP3 handoff from Day 3)
- Dev A: `diagram` SSE events with Mermaid string (CP3 handoff from Day 3)

### Deliverables
- Bar, line, and pie charts render inside chat bubbles
- ER diagram renders inside chat bubble
- Chart loading skeletons show before data arrives

### Expected Completion
**End of Day 3**

---

## Day 4 (Aug 4) — Polish + Error States + Integration

### Tasks

| # | Task | Est. Time | Deliverable |
|---|------|-----------|-------------|
| B4.1 | Build `SQLBadge.tsx` — collapsible SQL panel with copy button | 1.5 hrs | SQL badge shows/hides correctly |
| B4.2 | Wire `sql` SSE event → `SQLBadge` in assistant bubble | 30 min | SQL appears in correct bubble |
| B4.3 | Build `ErrorBubble.tsx` — red-bordered error message styling | 30 min | Error messages display clearly |
| B4.4 | Wire `error` SSE event → `ErrorBubble` | 30 min | Errors show in chat |
| B4.5 | Disable input + show spinner during agent processing | 30 min | Input locked while streaming |
| B4.6 | Integration test: Use Case 1 (top 5 products) | 1 hr | Bar chart renders from real data |
| B4.7 | Integration test: Use Case 2 (ER diagram) | 1 hr | Mermaid ER diagram renders |
| B4.8 | Integration test: Use Case 3 (order flow) | 1 hr | Flowchart renders |
| B4.9 | Fix all visual/rendering bugs | 2 hrs | Demo-ready UI |

### Dependencies
- Dev A: All 3 demo scenarios work on backend (CP4)

### Deliverables
- All 3 use case demos work end-to-end
- Error states render correctly
- SQL badge functional

### Expected Completion
**End of Day 4**

---

## Day 5 (Aug 5) — Bonus Features + UX Polish

### Tasks

| # | Task | Est. Time | Deliverable |
|---|------|-----------|-------------|
| B5.1 | Build `QueryHistory.tsx` — sidebar list from localStorage | 2 hrs | Query history renders, click to re-run |
| B5.2 | Build `HistoryItem.tsx` — single history entry with delete | 30 min | History items render |
| B5.3 | Implement `hooks/useQueryHistory.ts` — localStorage read/write | 1 hr | History persists on refresh |
| B5.4 | Build `ExportButton.tsx` — PNG download using html2canvas | 1 hr | Chart downloads as PNG |
| B5.5 | Wire CSV export: button calls `/api/export/csv` endpoint | 30 min | CSV downloads from chat |
| B5.6 | Build Welcome screen — icon + heading + 3 example prompt chips | 1 hr | Welcome shows before first message |
| B5.7 | Example prompt chips: click fills input and sends | 30 min | One-click example queries |
| B5.8 | Schema panel — calls `/api/schema`, renders table list on right | 1 hr | Schema panel shows real tables |

### Dependencies
- Dev A: `/api/export/csv` and `/api/schema` endpoints (Day 5)

### Deliverables
- Query history sidebar functional
- Export to PNG and CSV working
- Welcome screen with example prompts
- Schema panel shows live DB tables

### Expected Completion
**End of Day 5**

---

## Day 6 (Aug 6) — Docker + Final UI Polish

### Tasks

| # | Task | Est. Time | Deliverable |
|---|------|-----------|-------------|
| B6.1 | `frontend/Dockerfile` — multi-stage build (build → nginx) | 1 hr | `frontend/Dockerfile` |
| B6.2 | Vite proxy config for `/api` → `http://backend:8000` | 30 min | `vite.config.ts` proxy set |
| B6.3 | Final color/spacing pass — check every component against design | 1 hr | Visually consistent UI |
| B6.4 | Responsive layout: test on tablet viewport | 30 min | Tablet view works |
| B6.5 | `TypingIndicator` shows correct tool names for each SSE `tool_start` | 30 min | Reads "Generating chart..." etc. |
| B6.6 | Demo rehearsal with Dev A — run all 3 scripted scenarios | 1 hr | Demo smooth, no crashes |
| B6.7 | Record demo video — screen capture 3–5 minutes | 1 hr | Demo video ready for submission |

### Dependencies
- Dev A: `docker-compose.yml` ready; backend Dockerfile ready

### Deliverables
- Frontend Dockerfile builds and serves production build
- `docker-compose up` brings up full stack including frontend
- Demo video recorded

### Expected Completion
**End of Day 6**

---

## Day 7 (Aug 7) — Buffer + Submission

### Tasks

| # | Task | Est. Time | Deliverable |
|---|------|-----------|-------------|
| B7.1 | Final bug fixes only (no new features) | 1 hr | All visual bugs fixed |
| B7.2 | Final check: all 3 use cases work on fresh `docker-compose up` | 30 min | Full stack passes smoke test |
| B7.3 | Verify demo video is correct and complete | 15 min | Video ready |
| B7.4 | Assist Dev A with README screenshots if needed | 30 min | UI screenshots in README |

### Expected Completion
**Day 7 noon**

---

## Developer B — Full File Ownership

| File | Status |
|------|--------|
| `frontend/vite.config.ts` | Dev B |
| `frontend/tailwind.config.ts` | Dev B |
| `frontend/package.json` | Dev B |
| `frontend/Dockerfile` | Dev B |
| `frontend/src/App.tsx` | Dev B |
| `frontend/src/main.tsx` | Dev B |
| `frontend/src/types/index.ts` | Dev B |
| `frontend/src/services/api.ts` | Dev B |
| `frontend/src/hooks/useChat.ts` | Dev B |
| `frontend/src/hooks/useQueryHistory.ts` | Dev B |
| `frontend/src/hooks/useExport.ts` | Dev B |
| `frontend/src/components/chat/ChatContainer.tsx` | Dev B |
| `frontend/src/components/chat/MessageBubble.tsx` | Dev B |
| `frontend/src/components/chat/MessageInput.tsx` | Dev B |
| `frontend/src/components/chat/TypingIndicator.tsx` | Dev B |
| `frontend/src/components/chat/SQLBadge.tsx` | Dev B |
| `frontend/src/components/visualizations/ChartRenderer.tsx` | Dev B |
| `frontend/src/components/visualizations/BarChart.tsx` | Dev B |
| `frontend/src/components/visualizations/LineChart.tsx` | Dev B |
| `frontend/src/components/visualizations/PieChart.tsx` | Dev B |
| `frontend/src/components/visualizations/ScatterChart.tsx` | Dev B |
| `frontend/src/components/visualizations/DiagramRenderer.tsx` | Dev B |
| `frontend/src/components/sidebar/QueryHistory.tsx` | Dev B |
| `frontend/src/components/sidebar/HistoryItem.tsx` | Dev B |
| `frontend/src/components/ui/Button.tsx` | Dev B |
| `frontend/src/components/ui/Spinner.tsx` | Dev B |
| `frontend/src/components/ui/ErrorBubble.tsx` | Dev B |
| `frontend/src/components/ui/ExportButton.tsx` | Dev B |
| `frontend/src/styles/globals.css` | Dev B |

---

## Integration Checkpoints with Dev A

| Checkpoint | Day | What Dev B Needs from Dev A | How to Unblock |
|------------|-----|-----------------------------|----------------|
| CP1 | Day 1 EOD | SSE endpoint returns hardcoded `token` events | Dev B uses mock server if Dev A not ready |
| CP2 | Day 2 EOD | Real text responses stream | Dev B tests with mock SSE if needed |
| CP3 | Day 3 EOD | `chart` and `diagram` SSE events with correct payload | Dev B tests with hardcoded JSON if Dev A is delayed |
| CP4 | Day 4 EOD | All 3 demo scenarios work on backend | Dev B focuses on polish if scenarios fail |
| CP5 | Day 6 | Backend Dockerfile from Dev A | Dev B completes frontend Dockerfile independently |

---

## Unblocking Strategy (If Dev A is delayed)

If Dev A hasn't finished the backend by Day 2 CP, Dev B uses a **mock SSE server** for local development:

```javascript
// For local testing: mock SSE server using Express
// Simulates token, chart, and diagram events
const express = require('express');
const app = express();
app.post('/api/chat', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  // Send mock events...
});
```

This allows Dev B to build and test all UI components independently.
