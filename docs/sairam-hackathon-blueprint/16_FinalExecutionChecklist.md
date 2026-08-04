# 16 — Final Execution Checklist
## iTech AI Innovation Hackathon 2026
### Complete this before submission on Aug 7

---

## Section A: Required Features

### A1 — Chat Interface
- [ ] Chat UI renders correctly at `localhost:3000`
- [ ] User messages appear right-aligned with correct styling
- [ ] Assistant messages appear left-aligned with avatar icon
- [ ] Input textarea accepts text and sends on Enter key
- [ ] Shift+Enter creates newline (does not send)
- [ ] Real-time SSE streaming: tokens appear character by character
- [ ] TypingIndicator shows with animated dots during processing
- [ ] TypingIndicator disappears when first token arrives
- [ ] Input is disabled while agent is processing
- [ ] Input re-enables after `done` SSE event
- [ ] Chat auto-scrolls to the latest message
- [ ] Message history persists within the session (reload chat loses it — that's ok)

### A2 — Agent Tools
- [ ] `get_schema` tool returns correct schema from SQLite DB
- [ ] `execute_query` tool runs SELECT queries successfully
- [ ] `execute_query` blocks INSERT/UPDATE/DELETE/DROP
- [ ] `generate_chart` tool returns correct chart config JSON
- [ ] `generate_flowchart` tool returns valid Mermaid string
- [ ] `explain_data` tool returns natural language summary
- [ ] All 5 tools registered in `tool_registry.py`
- [ ] Tool errors return `{"success": false, "error": "...", "hint": "..."}` format

### A3 — Database Integration
- [ ] SQLite DB connected via `aiosqlite`
- [ ] Schema auto-discovered (not hardcoded)
- [ ] NL→SQL works for all 6 demo queries from `04_DatabaseDesign.md`
- [ ] Multi-turn: second query retains context from first

### A4 — Visualization
- [ ] Bar Chart renders from real DB data
- [ ] Line Chart renders from real DB data
- [ ] Pie Chart renders from real DB data
- [ ] ER Diagram renders (Mermaid erDiagram) from real schema
- [ ] Process Flow Diagram renders (Mermaid flowchart)
- [ ] Charts have titles, axis labels, and tooltips
- [ ] Diagrams are readable and correctly structured
- [ ] Charts + diagrams appear inside chat message bubbles

---

## Section B: Required Deliverables

### B1 — Source Code
- [ ] Git repository created and accessible
- [ ] All source code committed and pushed
- [ ] `.gitignore` excludes: `.env`, `node_modules/`, `__pycache__/`, `*.pyc`
- [ ] `.env` is NOT committed (verify with `git log -- .env`)
- [ ] `.env.example` IS committed with all variable names
- [ ] `ecommerce.sqlite` is in `database/` folder
- [ ] Clean commit history (no debug/temp commits on main)

### B2 — README.md
- [ ] Project title and one-line description
- [ ] Screenshot or GIF of the app with a chart visible
- [ ] Prerequisites listed (Python 3.11+, Node 18+, Docker)
- [ ] 5-command quick-start block (copy-paste ready)
- [ ] Architecture diagram (Mermaid or image)
- [ ] All 5 tools documented with inputs and outputs
- [ ] List of bonus features implemented
- [ ] Team member names

### B3 — Demo Video
- [ ] Duration: 3–5 minutes exactly
- [ ] All 3 use case scenarios demonstrated
- [ ] SQL badge visible and expanded on camera
- [ ] Export PNG demonstrated live
- [ ] Query history visible in sidebar
- [ ] Video hosted at shareable URL (YouTube/Loom/Drive)
- [ ] URL included in submission form

### B4 — Live Demo
- [ ] `docker-compose up` starts full stack in under 60 seconds
- [ ] `localhost:3000` loads the chat interface
- [ ] `localhost:8000/api/health` returns `{"status": "ok"}`
- [ ] All 3 demo scenarios run without errors
- [ ] Backup: demo video accessible if live demo fails

---

## Section C: Code Quality

### C1 — Documentation
- [ ] Every Python function has a docstring
- [ ] Every React component has a brief comment at top
- [ ] All tool JSON schemas have `description` fields for every parameter
- [ ] `README.md` passes "could a stranger set this up?" test

### C2 — Environment & Security
- [ ] `ANTHROPIC_API_KEY` loaded from `.env` only
- [ ] `DATABASE_PATH` configurable via `.env`
- [ ] No secrets in any committed file
- [ ] `requirements.txt` is complete: `pip install -r requirements.txt` works from scratch
- [ ] `package.json` is complete: `npm install` works from scratch

### C3 — Error Handling
- [ ] DB connection failure returns friendly error message
- [ ] Claude API timeout returns friendly error message
- [ ] Unsafe SQL returns `SQL_UNSAFE` error code
- [ ] Empty/invalid message returns 400 with clear message
- [ ] Tool failure triggers LLM recovery (not crash)

### C4 — Testing
- [ ] `pytest tests/` passes (all tool unit tests)
- [ ] `npm run build` succeeds (no TypeScript errors)
- [ ] `docker-compose up` works on a clean machine

---

## Section D: Bonus Features

### D1 — Natural Language to SQL Explanation
- [ ] SQL badge appears in every assistant message that runs a query
- [ ] SQL badge is collapsed by default, expands on click
- [ ] SQL is syntax-highlighted
- [ ] Copy button copies SQL to clipboard

### D2 — Real-time Data Streaming
- [ ] SSE streaming works (tokens appear progressively)
- [ ] TypingIndicator shows current tool name during execution
- [ ] `tool_start` events update the indicator label

### D3 — Export Functionality
- [ ] "Export PNG" button saves chart as image file
- [ ] "Export CSV" button downloads query results as `.csv`
- [ ] Export buttons appear below every chart bubble

### D4 — Query History
- [ ] Previous queries listed in left sidebar
- [ ] Clicking a history item re-sends that query
- [ ] History persists after page refresh (localStorage)
- [ ] "Clear All" button clears history

### D5 — Scatter Plot (4th chart type)
- [ ] Scatter chart renders when Claude selects it for correlation data

---

## Section E: Every Documentation Requirement

- [ ] `README.md` present and complete
- [ ] `docs/tool-api.md` present (tool schemas reference)
- [ ] `.env.example` documents all variables
- [ ] `docker-compose.yml` has comments explaining each service
- [ ] All Python files have module-level docstrings

---

## Section F: Everything Must Be Tickable

### Final Smoke Test (Run Day 7, before submission)

```bash
# 1. Clone fresh
git clone https://github.com/your-team/dataflow-ai.git
cd dataflow-ai

# 2. Setup
cp .env.example .env
# Add ANTHROPIC_API_KEY to .env

# 3. Start
docker-compose up

# 4. Test
curl http://localhost:8000/api/health
# → {"status": "ok", "database": "connected"}

# 5. Open browser
open http://localhost:3000
# → Chat interface loads

# 6. Run demo query
# Type: "Show top 5 products by revenue"
# → Bar chart renders in 10-15 seconds

# 7. Run ER diagram
# Type: "Draw the ER diagram"
# → Mermaid ER diagram renders

# 8. Run flowchart
# Type: "Show how orders flow through the system"
# → Process flowchart renders

# 9. Verify bonus
# → SQL badge visible, expand it
# → Click "Export PNG", check downloads
# → Query history appears in sidebar
```

**If all steps pass → SUBMIT ✅**

**If any step fails → fix it before submitting ❌**

---

## Submission Form Data to Prepare

- Team Name: _______________
- Member 1: Name / Email / Student ID / Department / Year / Phone
- Member 2: Name / Email / Student ID / Department / Year / Phone
- Git Repository URL: _______________
- Demo Video URL: _______________
- Live Demo URL (if deployed): `http://localhost:3000` or cloud URL
