# 00 — Project Overview
## iTech AI Innovation Hackathon 2026
**Team:** [Your Team Name] | **Duration:** Aug 1–7, 2026 | **Track:** Intermediate → Advanced

---

## 1. Problem Understanding

Non-technical business users cannot extract insights from relational databases without knowing SQL or understanding schema structures. This creates a bottleneck — only engineers and analysts can query data, leaving decision-makers dependent on intermediaries.

The challenge is to build a **ChatGPT-like conversational AI system** where a natural language query like *"Show me top 5 products by revenue this quarter"* triggers an LLM agent that:
1. Understands intent
2. Queries the correct database tables
3. Returns a rendered chart + a natural language explanation — all within a streaming chat interface.

---

## 2. Objectives

### 2.1 Primary Objectives
| # | Objective | Success Metric |
|---|-----------|----------------|
| P1 | Chat Interface | Streaming responses, message history, loading states |
| P2 | Agent Tool Suite | 5 required tools implemented with function-calling schemas |
| P3 | Database Integration | Schema discovery + NL→SQL generation + execution |
| P4 | Visualization Generation | ≥3 chart types + ≥2 diagram types rendered in-chat |

### 2.2 Secondary Objectives
| # | Objective |
|---|-----------|
| S1 | Multi-turn conversation with context window retention |
| S2 | Graceful error handling & LLM recovery prompts |
| S3 | SQL transparency — show generated SQL before execution |

---

## 3. Functional Requirements

### 3.1 Chat Interface
- Real-time streaming message display (SSE or WebSocket)
- Persistent in-session message history
- Typing/processing indicator when agent is working
- Embedded chart and diagram rendering within chat bubbles
- Markdown rendering for explanations

### 3.2 Required Agent Tools (Non-Negotiable)
| Tool | Input | Output |
|------|-------|--------|
| `get_schema` | database name / table filter | JSON schema (tables, columns, types, PKs, FKs) |
| `execute_query` | SQL string, database name | JSON rows, column metadata, row count |
| `generate_chart` | data array, chart type, title, axes | Rendered chart component (React/Plotly) |
| `generate_flowchart` | diagram type, nodes/edges or table names | Mermaid/SVG diagram string |
| `explain_data` | query result, context | Natural language markdown summary |

### 3.3 Visualization Requirements
**Charts (minimum 3):**
- Bar Chart — categorical comparisons
- Line Chart — trends over time
- Pie Chart — proportional distribution
- Scatter Plot — correlation analysis *(bonus)*

**Diagrams (minimum 2):**
- ER Diagram — database entity relationships
- Process Flow Diagram — order/data pipelines
- Decision Tree — conditional logic *(bonus)*

---

## 4. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | First response token < 2s; chart render < 500ms |
| Reliability | Graceful fallback on DB error or LLM timeout |
| Security | No hardcoded API keys; `.env` file configuration |
| Scalability | Stateless backend; session state in frontend |
| Deployability | Docker support; local run in < 5 commands |
| Code Quality | Well-commented; modular tool functions; README |

---

## 5. Scope

### In Scope
- Single SQLite sample database (e-commerce: orders, products, customers, inventory)
- Anthropic Claude (claude-sonnet-4-6) as the LLM provider
- React frontend + FastAPI backend
- 5 required agent tools
- 3 chart types + 2 diagram types
- Bonus: SQL explanation, export to CSV/PNG, query history

### Out of Scope
- User authentication / multi-user accounts
- Production database hosting
- Mobile-native app

---

## 6. Constraints
- Team Size: 2 Developers (Developer A & Developer B)
- Duration: 7 days (Aug 1–7, 2026)
- LLM: Must use provider from hackathon-approved list (using Anthropic Claude)
- Database: Provided SQLite e-commerce sample DB
- No hardcoded secrets

---

## 7. Success Criteria

| Criterion | Weight | Our Target |
|-----------|--------|------------|
| Functionality | 30% | All 5 tools working; accurate NL→SQL |
| Tool Design & Architecture | 25% | Clean schemas, modular, extensible |
| Visualization Quality | 20% | All chart/diagram types; aesthetically polished |
| User Experience | 15% | Streaming chat; error states; responsive |
| Innovation & Creativity | 10% | SQL transparency + export + query history |

**Target Score: 90+/100**

---

## 8. Judging Strategy

Focus areas to maximize score:
1. **Functionality (30%)** — Ensure all 5 tools are demo-ready with the provided e-commerce DB. Prepare 3 polished demo scenarios from the problem statement use cases.
2. **Architecture (25%)** — Use clean function-calling schema with proper JSON types, descriptions, and error handling. This is visible in code review.
3. **Visualization (20%)** — Use Recharts for charts (consistent with React), Mermaid.js for diagrams. Invest in color themes and chart labels.
4. **UX (15%)** — Streaming is non-negotiable. Add loading skeletons. Handle empty states.
5. **Innovation (10%)** — Ship SQL transparency (show query before execution), CSV export, and query history panel. These are low-effort, high-impact.

---

## 9. Bonus Features (Ranked by Effort × Impact)

| Priority | Bonus Feature | Effort | Impact |
|----------|--------------|--------|--------|
| 1 | Natural Language to SQL Explanation | Low | High |
| 2 | Real-time Data Streaming (SSE responses) | Medium | High |
| 3 | Export Functionality (PNG/CSV) | Low | Medium |
| 4 | Query History & Favorites | Medium | Medium |
| 5 | Multi-Database Support | High | Medium |
| 6 | Advanced Analytics (trend detection) | High | High |
| 7 | Voice Input | High | Low |
| 8 | Collaborative Features | High | Low |
