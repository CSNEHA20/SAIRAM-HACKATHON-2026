# 14 — Submission Checklist
## iTech AI Innovation Hackathon 2026

---

## Required Deliverables (From Hackathon Brief)

The hackathon requires 4 submission items. Each is listed with exact completion criteria.

---

### ✅ 1. Source Code — Complete Codebase in Git Repository

| Item | Status | Notes |
|------|--------|-------|
| Git repository initialized | ☐ | GitHub / GitLab repo created |
| `backend/` directory complete | ☐ | All Python files committed |
| `frontend/` directory complete | ☐ | All React/TS files committed |
| `database/ecommerce.sqlite` included | ☐ | Sample DB in repo |
| `.env.example` present | ☐ | All env vars documented |
| `.env` in `.gitignore` | ☐ | Real keys NOT committed |
| `node_modules/` in `.gitignore` | ☐ | |
| `__pycache__/` in `.gitignore` | ☐ | |
| `*.pyc` in `.gitignore` | ☐ | |
| Clean commit history | ☐ | No "asdf" or "fix fix fix" commits |
| Final code pushed to main | ☐ | Submission branch is up to date |

---

### ✅ 2. README.md — Setup Instructions + Architecture + Tool Documentation

**README must include all of the following:**

| Section | Status | Content |
|---------|--------|---------|
| Project title + one-line description | ☐ | "DataFlow AI — Conversational Database Analytics" |
| Demo screenshot or GIF | ☐ | Screenshot of chat with chart |
| Tech stack summary | ☐ | Claude, FastAPI, React, Recharts, Mermaid, SQLite |
| Prerequisites | ☐ | Python 3.11+, Node 18+, Docker (optional) |
| Environment setup | ☐ | Copy `.env.example` → `.env`, add `ANTHROPIC_API_KEY` |
| Local run instructions (without Docker) | ☐ | Backend: `pip install -r requirements.txt && uvicorn main:app` |
| Local run instructions (with Docker) | ☐ | `docker-compose up` |
| Architecture overview | ☐ | Mermaid diagram embedded |
| Tool documentation | ☐ | All 5 tools: name, purpose, inputs, outputs |
| Demo scenarios | ☐ | 3 example conversation flows from problem statement |
| Bonus features | ☐ | List of bonus features implemented |
| Team members | ☐ | Dev A name + Dev B name |

**README quick-start block (copy-paste ready):**
```bash
# Clone the repo
git clone https://github.com/your-team/dataflow-ai.git
cd dataflow-ai

# Set up environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Option A: Docker (recommended)
docker-compose up

# Option B: Manual
cd backend && pip install -r requirements.txt
uvicorn main:app --reload &
cd ../frontend && npm install && npm run dev
```

---

### ✅ 3. Demo Video — 3–5 Minute Walkthrough

| Element | Status | Notes |
|---------|--------|-------|
| Video duration: 3–5 minutes | ☐ | Not shorter, not longer |
| Screen recording tool ready | ☐ | OBS / Loom / QuickTime |
| App running locally for recording | ☐ | `docker-compose up` before recording |
| Script prepared (see demo scenarios) | ☐ | Rehearsed at least once |
| Video covers all 3 use case scenarios | ☐ | Scenario 1, 2, 3 all shown |
| SQL transparency shown | ☐ | Expand SQL badge on camera |
| Chart export demonstrated | ☐ | Export PNG live |
| Query history shown | ☐ | Sidebar visible |
| Video narration is clear | ☐ | Explain what's happening |
| Video hosted / shareable link | ☐ | YouTube unlisted / Google Drive / Loom |

**Demo Script Outline (5 minutes):**
```
0:00–0:30  App intro — explain the problem, show the chat interface
0:30–1:30  Use Case 1: "Show top 5 products by revenue" → bar chart
           Follow-up: "Now show the trend over last year" → line chart
1:30–2:30  Use Case 2: "Draw the ER diagram" → Mermaid ER diagram
           Follow-up: "Which tables relate to customers?" → text answer
2:30–3:30  Use Case 3: "Create a flowchart for order flow" → flowchart
3:30–4:00  Show bonus features: SQL badge, export PNG, query history
4:00–4:30  Show architecture briefly (system architecture slide or README)
4:30–5:00  Wrap up: "Thank you, all source code at [repo URL]"
```

---

### ✅ 4. Live Demo — Working Deployment or Local Run

| Item | Status | Notes |
|------|--------|-------|
| `docker-compose up` tested on clean machine | ☐ | Or team member's laptop |
| App runs on `localhost:3000` | ☐ | Frontend accessible |
| API runs on `localhost:8000` | ☐ | Backend accessible |
| Health check passes: `curl localhost:8000/api/health` | ☐ | Returns `{"status": "ok"}` |
| All 3 demo scenarios work | ☐ | Rehearsed on Day 6 |
| Backup `.env` on USB/cloud | ☐ | In case judging machine needs setup |
| Offline SQLite DB ready | ☐ | No internet needed for DB |
| Local Claude API key valid | ☐ | Not expired, has credits |

---

## Code Quality Requirements

| Requirement | Status | How to Verify |
|-------------|--------|--------------|
| No hardcoded API keys | ☐ | `grep -r "sk-ant" backend/` returns nothing |
| `.env` file excluded from git | ☐ | `git status` doesn't show `.env` |
| Well-commented code | ☐ | Every function has a docstring |
| Modular design | ☐ | Each tool is in its own file |
| `requirements.txt` complete | ☐ | `pip install -r requirements.txt` installs all deps |
| `package.json` complete | ☐ | `npm install` installs all deps |
| Docker support | ☐ | `docker-compose up` works |
| Unit tests present | ☐ | `pytest tests/` passes |
| Environment config via `.env` | ☐ | All config from environment, not hardcoded |

---

## Bonus Features Implemented (Check what's done)

| Bonus Feature | Status | Score Impact |
|--------------|--------|-------------|
| Natural Language to SQL Explanation (SQL badge) | ☐ | High |
| Real-time streaming (SSE token-by-token) | ☐ | High |
| Export Functionality (PNG + CSV) | ☐ | Medium |
| Query History & Favorites | ☐ | Medium |
| Scatter Plot (4th chart type) | ☐ | Low |
| Multi-Database Support | ☐ | Medium |
| Advanced Analytics | ☐ | High |

---

## Repository Checklist

```
dataflow-ai/
├── ☐ backend/
│   ├── ☐ main.py
│   ├── ☐ requirements.txt
│   ├── ☐ Dockerfile
│   ├── ☐ api/ (router.py, schemas.py)
│   ├── ☐ agent/ (orchestrator.py, prompt.py, session.py, tool_registry.py)
│   ├── ☐ tools/ (all 5 tool files)
│   ├── ☐ db/ (connection.py, validator.py)
│   └── ☐ tests/ (test_tools.py, test_api.py, test_db.py)
├── ☐ frontend/
│   ├── ☐ package.json
│   ├── ☐ vite.config.ts
│   ├── ☐ Dockerfile
│   └── ☐ src/ (all components, hooks, services, types)
├── ☐ database/
│   └── ☐ ecommerce.sqlite
├── ☐ docker-compose.yml
├── ☐ .env.example
├── ☐ .gitignore
└── ☐ README.md
```

---

## Presentation Checklist (For In-Person Judging)

| Item | Status |
|------|--------|
| Laptop charged + charger packed | ☐ |
| Demo running and tested 30 min before judging | ☐ |
| `ANTHROPIC_API_KEY` valid with credits | ☐ |
| Backup demo video accessible (in case live demo fails) | ☐ |
| README open in browser for reference | ☐ |
| Team name and member names known | ☐ |
| 2-minute elevator pitch practiced | ☐ |
