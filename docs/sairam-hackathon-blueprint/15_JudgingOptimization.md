# 15 — Judging Optimization
## iTech AI Innovation Hackathon 2026

---

## 1. Evaluation Rubric Breakdown

| Criterion | Weight | Max Points | Our Target |
|-----------|--------|-----------|-----------|
| Functionality | 30% | 30 | 27–30 |
| Tool Design & Architecture | 25% | 25 | 22–25 |
| Visualization Quality | 20% | 20 | 18–20 |
| User Experience | 15% | 15 | 13–15 |
| Innovation & Creativity | 10% | 10 | 8–10 |
| **Total** | 100% | 100 | **88–100** |

---

## 2. Functionality (30 pts) — Implementation Mapping

**What judges look for:**
> "All required tools working, accurate query generation"

### How Each Task Contributes to Functionality Score

| Implementation | Points Contribution |
|---------------|-------------------|
| `get_schema` tool correctly returns real DB schema | 4 pts |
| `execute_query` tool runs accurate SQL from NL input | 8 pts |
| `generate_chart` tool produces correct chart configs | 5 pts |
| `generate_flowchart` tool produces valid Mermaid code | 5 pts |
| `explain_data` tool returns coherent explanations | 3 pts |
| Multi-turn context retention works across 3+ turns | 3 pts |
| Error recovery when SQL fails | 2 pts |

### Priority Actions for Full Functionality Score
1. **Demo all 3 use cases from the brief** — judges will test exactly these
2. **Ensure NL→SQL accuracy** — test with the 6 demo queries in `04_DatabaseDesign.md`
3. **Tool recovery** — demonstrate one error and recovery on camera

---

## 3. Tool Design & Architecture (25 pts) — Implementation Mapping

**What judges look for:**
> "Clean tool schemas, modular design, extensibility"

### How Code Structure Contributes to Architecture Score

| Implementation | Points Contribution |
|---------------|-------------------|
| Each tool in its own file (`tools/get_schema.py`, etc.) | 4 pts |
| JSON schemas with clear descriptions for all parameters | 5 pts |
| Tool registry pattern (`tool_registry.py`) | 3 pts |
| `db/validator.py` — separate SQL safety layer | 3 pts |
| Agent orchestrator separated from API router | 3 pts |
| Pydantic request/response schemas | 3 pts |
| Error handling returns structured JSON with hints | 4 pts |

### Priority Actions for Full Architecture Score
1. **Write clean docstrings** on every function — judges read code
2. **Each tool returns consistent `{"success": bool, ...}` format**
3. **Clear separation:** `api/` (HTTP) → `agent/` (LLM) → `tools/` (execution) → `db/` (data)
4. **README tool documentation section** — judges check this

---

## 4. Visualization Quality (20 pts) — Implementation Mapping

**What judges look for:**
> "Chart clarity, appropriate visualization choices, aesthetics"

### How Each Visualization Contributes

| Visualization | Points Contribution |
|--------------|-------------------|
| Bar chart renders with correct data + labeled axes | 3 pts |
| Line chart renders with time axis + smooth line | 3 pts |
| Pie chart renders with labeled segments | 3 pts |
| ER diagram renders with correct entities + relationships | 4 pts |
| Process flow diagram renders cleanly | 3 pts |
| Charts use consistent, professional color theme | 2 pts |
| Chart tooltips work on hover | 2 pts |

### Priority Actions for Full Visualization Score
1. **Use consistent color palette** — `#6366f1` primary, from `08_UI_UX_Plan.md`
2. **Always include axis labels and chart title** — judges notice missing labels
3. **Ensure Recharts ResponsiveContainer** — charts should fill their bubble width
4. **ER diagram must show all 5 tables** with correct FK relationships
5. **Choose correct chart type automatically** — line for time data, bar for categories

### Appropriate Chart Selection Guide (give to Claude via system prompt)

```
Time-series data (months, days, dates) → Line Chart
Category comparisons (products, status, region) → Bar Chart  
Proportional data (percentages, distribution) → Pie Chart
Correlation between two numeric fields → Scatter Plot
Database schema → ER Diagram (erDiagram)
Process / workflow → Flowchart (flowchart TD)
```

---

## 5. User Experience (15 pts) — Implementation Mapping

**What judges look for:**
> "Chat interface, responsiveness, error handling UX"

### How UX Implementation Contributes

| Implementation | Points Contribution |
|---------------|-------------------|
| SSE streaming — tokens appear in real-time | 4 pts |
| TypingIndicator with tool name | 2 pts |
| Input disabled during processing | 1 pt |
| Error messages displayed clearly in chat | 2 pts |
| Charts embedded inside message bubbles | 2 pts |
| Responsive layout on different screen sizes | 1 pt |
| Dark theme — professional, ChatGPT-like | 2 pts |
| Auto-scroll to latest message | 1 pt |

### Priority Actions for Full UX Score
1. **Streaming is non-negotiable** — a response that appears all at once looks broken
2. **TypingIndicator must update** — "Querying database..." then "Generating chart..."
3. **Input must lock during processing** — otherwise judges double-send by accident
4. **Charts must be in bubbles, not below** — judge expects inline visualization
5. **Dark theme** — light theme looks amateur compared to dark ChatGPT-like UI

---

## 6. Innovation & Creativity (10 pts) — Implementation Mapping

**What judges look for:**
> "Novel features, creative solutions, bonus challenges"

### How Bonus Features Contribute

| Bonus Feature | Points Contribution | Effort |
|--------------|-------------------|--------|
| SQL transparency (show query before results) | 3 pts | Low |
| Real-time SSE streaming (already built) | 2 pts | Done |
| Export functionality (PNG + CSV) | 2 pts | Low |
| Query history panel | 2 pts | Medium |
| Scatter plot (4th chart type) | 1 pt | Low |

### Priority Actions for Full Innovation Score
1. **SQL badge must be VISIBLE in demo video** — expand it on camera and say "we show the SQL for transparency"
2. **Export demo** — click "Export PNG" live during demo, show file in downloads
3. **Query history** — show how previous queries appear in sidebar

---

## 7. Common Mistakes to Avoid

| Mistake | Which Criterion | How to Avoid |
|---------|----------------|-------------|
| Charts not rendering because of wrong key name | Functionality | Validate x_key/y_key against data before generating |
| Mermaid syntax error causes blank diagram | Visualization | Test every diagram type with real schema data |
| Hardcoded API key in source code | Architecture | `git grep -r "sk-ant"` before submitting |
| Response arrives all at once (not streamed) | UX | Test SSE with actual `EventSource` not mock |
| SQL fails on first try, no recovery | Functionality | Test error recovery: intentionally break a query |
| All queries use bar chart | Visualization | Claude system prompt specifies chart type selection |
| Input stays enabled during processing | UX | `isLoading` state disables button |
| Charts overflow the message bubble | UX | Recharts `ResponsiveContainer` with `width="100%"` |
| README has no demo screenshots | Architecture | Add at least one screenshot with chart visible |
| `.env` committed to git | Security/Architecture | Verify `.gitignore` before Day 7 push |

---

## 8. Prioritized Implementation Order (Score-Optimized)

If short on time, implement in exactly this order:

```
1. SSE streaming text response                    → UX (4 pts)
2. execute_query + get_schema tools               → Functionality (12 pts)
3. generate_chart tool + bar/line/pie charts      → Functionality + Visualization (13 pts)
4. generate_flowchart + ER diagram renderer       → Functionality + Visualization (9 pts)
5. SQL transparency badge                         → Innovation + Architecture (5 pts)
6. TypingIndicator + error states                 → UX (4 pts)
7. explain_data tool                              → Functionality (3 pts)
8. Consistent dark theme + polish                 → UX + Visualization (4 pts)
9. Export features                                → Innovation (2 pts)
10. Query history                                 → Innovation (2 pts)
```

Steps 1–8 cover 87 potential points. Steps 9–10 are pure bonus.

---

## 9. Judge Interaction Preparation

**Likely judge questions and model answers:**

| Question | Answer |
|---------|--------|
| "How does the agent know which tool to call?" | "Claude uses function calling — we pass all 5 tool schemas, Claude reasons and decides which to invoke based on the user's intent." |
| "What if the SQL is wrong?" | "The error is injected as a tool_result back to Claude, which re-reasons and corrects the SQL automatically." |
| "Can it handle follow-up questions?" | "Yes — we maintain conversation history for the last 10 turns in the session." |
| "How does the chart get to the frontend?" | "generate_chart returns a JSON config, which the backend emits as an SSE event. The React frontend parses this and renders it with Recharts." |
| "Why did you choose Claude?" | "Claude's tool_use is best-in-class for multi-step agentic workflows, and its 200K context window handles our entire conversation history and schema." |
