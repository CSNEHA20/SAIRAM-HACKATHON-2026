# 01 — Requirements Analysis: DataFlow AI

**Document Class**: Architecture Repository — Requirements
**Project**: DataFlow AI — Conversational Database Analytics
**Derived From**: Official iTech AI Hackathon 2026 Problem Statement (authoritative), `docs/blueprint/` solution vision, `docs/sairam-hackathon-blueprint/00_ProjectOverview.md`
**Status**: Final — this is the requirement baseline; all implementation documents comply with it.

---

## Purpose

This document translates the official hackathon problem statement into a precise, implementation-ready requirements baseline: functional requirements, non-functional requirements, user requirements, constraints, and deliverables — each mapped to the judging criteria it serves. It also records what is **explicitly mandatory** versus **optional** versus **bonus**, so the team never invents requirements and never misses a scored requirement.

---

## Overview

The problem statement defines a ChatGPT-like application whose LLM agent must (1) understand natural-language queries, (2) connect to and query SQL/NoSQL databases, (3) generate dynamic visualizations (charts, graphs, flowcharts), and (4) provide conversational explanations. The brief separates requirements into primary objectives (core functionality), secondary objectives (quality attributes), tool requirements, visualization requirements, technical recommendations, sample use cases, evaluation criteria, and deliverables.

The requirements analysis below preserves that structure and adds: personas, acceptance criteria per requirement, a traceability matrix to the rubric, and priority ordering for a 2-day sprint.

---

## 1. Functional Requirements

### FR-1: Chat Interface (Primary Objective 1)

| ID | Requirement | Detail / Acceptance | Rubric |
|----|-------------|---------------------|--------|
| FR-1.1 | Real-time message display with streaming | Tokens appear incrementally as generated; SSE-driven | UX 15% |
| FR-1.2 | Message history persistence within session | Conversation retained across turns; visible in the message list; survives page reload within the session via session store | Functionality 30% |
| FR-1.3 | Clear processing/querying indication | Typing indicator with live tool name (e.g., "Reading schema…", "Running query…"); input disabled while processing | UX 15% |
| FR-1.4 | Embedded visualization rendering in chat | Charts and diagrams render inside assistant message bubbles; no navigation away from chat | Functionality 30% |

### FR-2: Agent Tools (Primary Objective 2 — the core engineering challenge)

A minimum of **5 custom tools** with function-calling schemas. Each tool must have: typed parameters with descriptions, a structured JSON return the LLM can interpret, graceful error messages that help the LLM recover, and clear docstrings.

| Tool | Output Contract | Mandatory |
|------|-----------------|-----------|
| `get_schema` | JSON: tables, columns, types, primary keys, foreign keys | Yes |
| `execute_query` | JSON/tabular result of executed SQL | Yes |
| `generate_chart` | Rendered chart image/component (via chart config JSON consumed by frontend) | Yes |
| `generate_flowchart` | Mermaid/SVG diagram string | Yes |
| `explain_data` | Natural-language summary of data | Yes |

### FR-3: Database Integration (Primary Objective 3)

| ID | Requirement | Detail | Rubric |
|----|-------------|--------|--------|
| FR-3.1 | Schema discovery | `get_schema` retrieves tables/columns/types/relationships at runtime (PRAGMA-based for SQLite) | Functionality 30% |
| FR-3.2 | Query generation | Natural language → valid SQL via LLM function calling | Functionality 30% |
| FR-3.3 | Query execution | Safe SELECT-only execution with structured results | Functionality 30% |
| FR-3.4 | Query transparency | Generated SQL is surfaced to the user (secondary objective S3 + bonus) | Innovation 10% |

### FR-4: Visualization Generation (Primary Objective 4)

| Category | Types | Mandatory Minimum | Bonus |
|----------|-------|-------------------|-------|
| Charts | Bar (categorical), Line (trends over time), Pie (proportional), Scatter (correlation) | **3 types** | Scatter |
| Diagrams | ER diagrams, Process Flow, Decision Trees | **2 types** | Decision Tree |

Visualization quality bar (rubric 20%): clarity, appropriate chart choice for the analytical task, aesthetic consistency (shared color palette, labels, tooltips).

### FR-5: Secondary Objectives

| ID | Requirement | Detail |
|----|-------------|--------|
| FR-5.1 | Multi-turn context retention | Follow-ups resolve entities/filters/time-ranges from prior turns without restating them |
| FR-5.2 | Error handling + graceful fallbacks | LLM recovers from tool errors via `tool_result` feedback; user sees friendly, actionable messages |
| FR-5.3 | Query explanation and SQL transparency | Show SQL before/with results; explain what was computed and why |

---

## 2. Non-Functional Requirements

| ID | Requirement | Target / Rule | Rationale |
|----|-------------|---------------|-----------|
| NFR-1 | First-response latency | First streamed token < 2 s | Streaming credibility; UX rubric |
| NFR-2 | Chart render latency | < 500 ms after chart event | Visualization rubric polish |
| NFR-3 | Graceful degradation | DB error, LLM timeout/rate-limit, chart failure → friendly fallback; never a crash | UX + Functionality rubric |
| NFR-4 | Secret hygiene | All keys via `.env`; zero hardcoded keys in source | Mandatory code requirement |
| NFR-5 | Backend statelessness | Sessions in memory; frontend holds session state | Scalability + demo reliability |
| NFR-6 | Setup ergonomics | Docker compose up OR local run in < 5 commands | Deliverable requirement |
| NFR-7 | Code quality | Well-commented, modular, docstrings, type-safe TS | Architecture rubric 25% |
| NFR-8 | Security posture | SELECT-only enforcement; CORS restricted to frontend origin; no PII persisted | Brief guideline: "secure database connections" |
| NFR-9 | Performance | Token budget control (MAX_TOKENS=4096), tool iteration cap (8), result row caps (100/1000) | Reliability under demo conditions |
| NFR-10 | Compatibility | Python 3.11+, Node 18+, Docker optional; runs on judge machine | Deliverable requirement |

---

## 3. User Requirements & Personas

| Persona | Profile | Core Needs | Journey Impact |
|---------|---------|------------|----------------|
| **Business User** | Non-technical; wants answers, not SQL | Plain-language answers; readable charts; trust in the data used | Journey 1 (analytical question → insight) |
| **Technical Reviewer** | Judge/mentor; evaluates architecture | Schema awareness; query transparency; tool-selection rationale; clean code | All journeys; code review |
| **Team Operator** | Demo runner | Deterministic flows; clear states; graceful recovery; scriptable scenarios | Journeys 1–3 with exact scripted inputs |

Design implications (from `docs/blueprint/11-users-and-journeys.md`):

- First response must establish trust quickly — judges form impressions within minutes.
- Visuals are a natural extension of the answer, not an add-on.
- Follow-up questions preserve filters, entities, and time ranges.
- Assumptions are surfaced in explanations (e.g., "I assumed this quarter = Q2 2026").

---

## 4. Mandatory vs Optional vs Bonus Requirements

| Tier | Items | Ship Status |
|------|-------|-------------|
| **Mandatory** | FR-1.1–1.4, FR-2 (all 5 tools), FR-3.1–3.3, FR-4 (≥3 charts + ≥2 diagrams), FR-5.1–5.3, all deliverables, NFR-4/6/7 | Non-negotiable; Days 1–2 core |
| **Optional (low effort, scored via Innovation)** | SQL transparency (FR-3.4), SSE streaming (already core), PNG/CSV export, query history & favorites, scatter chart | Day 2 afternoon |
| **Bonus (official brief list)** | Multi-database support, voice input, collaborative sharing, custom dashboard builder, real-time data feeds, ML insights/trend detection, decision trees, PDF export | Documented as future scope; only low-cost ones shipped |

---

## 5. Sample Use Cases (Must Work — Official)

| UC | Input | Expected Flow | Expected Output |
|----|-------|---------------|-----------------|
| UC1 | "Show me the top 5 products by revenue this quarter" | get_schema → execute_query → generate_chart (bar) → explain | Bar chart + insight; follow-up "trend over last year" → line chart |
| UC2 | "Draw me the ER diagram for this database" | get_schema → generate_flowchart (ER, auto-built from schema) | Rendered ER diagram; follow-up "Which tables are related to customers?" → textual answer |
| UC3 | "Create a flowchart showing how orders flow through our system" | schema analysis → inferred process → generate_flowchart (flowchart) | Rendered process flowchart |

---

## 6. Judging Criteria Traceability Matrix

| Rubric Criterion | Weight | Requirements Served | Primary Evidence |
|------------------|--------|---------------------|------------------|
| Functionality | 30% | FR-1.x, FR-2, FR-3.x, FR-4 | 3 use cases; 6 reference queries; tools demonstrably working |
| Tool Design & Architecture | 25% | FR-2, NFR-7, NFR-8 | Tool registry, JSON schemas, validator, modular layout |
| Visualization Quality | 20% | FR-4, NFR-2 | Chart/diagram rendering quality, palette, labels |
| User Experience | 15% | FR-1, FR-5.2, NFR-1/3 | Streaming, indicators, error UX, responsiveness |
| Innovation & Creativity | 10% | FR-3.4, bonus tier | SQL transparency, export, history, scatter |

---

## 7. Constraints

| Constraint | Implication |
|------------|-------------|
| 2 developers (official brief assumes 3–5) | Parallel split Dev A/B; single integration surface |
| 2-day build sprint (Aug 4–5) | Strict priority ordering; cut-order for bonus |
| Approved LLM providers only | Anthropic Claude chosen (approved; best tool_use) |
| Provided SQLite sample database | Anchor demo reliability; schema auto-discovery handles variance |
| No hardcoded secrets | `.env` via python-dotenv; `.env.example` committed |
| Docker support preferred | Required for judge-friendly demo |
| Limited API credits | Cache get_schema; cap iterations; offline fallbacks |

---

## 8. Deliverables (from official brief)

1. **Git repository** — complete codebase, clean history, no secrets.
2. **README.md** — setup, architecture overview, tool documentation.
3. **Demo video** — 3–5 minutes, scripted walkthrough of all use cases.
4. **Live demo** — via docker-compose or local run during judging.

---

## 9. Design Decisions

| Decision | Why |
|----------|-----|
| Requirements captured as a traceable matrix | Ensures every rubric point is traceable to a build item; nothing scored is forgotten |
| SQL transparency elevated from bonus to core behavior | It is simultaneously a secondary objective (S3) and an innovation item — highest leverage |
| Streaming (NFR-1) treated as non-negotiable | The brief requires "real-time message display with streaming"; UX rubric explicitly rewards it |
| Sample DB as sole data source for the sprint | Reliability over breadth; multi-DB documented as future scope |
| Personas derived from judge/mark/mentor reality | Demo scripts must satisfy technical reviewers, not just end users |

---

## 10. Responsibilities & Dependencies

| Stakeholder | Responsibility |
|-------------|----------------|
| Dev A | Implement backend FRs, NFRs, validation; evidence of Functionality/Architecture criteria |
| Dev B | Implement frontend FRs, UX criteria; evidence of Visualization/UX criteria |
| Both | Verify deliverables checklist (`35_SubmissionChecklist.md`); demo rehearsals |

Dependencies: Requirements → Architecture (02) → Component breakdown (04) → Implementation roadmap (19).

---

## 11. Advantages / Limitations / Future Scope

**Advantages**: complete traceability; explicit mandatory/bonus split prevents scope creep; NFRs are measurable and demo-verifiable.
**Limitations**: no auth/multi-user (out of scope by design); single-database breadth; session memory is volatile.
**Future scope**: multi-DB connectors, persistent sessions, real-time data, ML trend detection, collaborative features — all documented for post-hackathon evolution.

---

## Summary

The requirement baseline for DataFlow AI comprises 5 functional areas (chat interface, tools, DB integration, visualization, secondary objectives), 10 measurable non-functional requirements, 3 personas, 3 mandatory use cases, and 4 deliverables — all traceable to the official rubric. The team commits to mandatory items as non-negotiable, ships a curated set of high-leverage bonus features, and defers breadth features to future scope. This baseline drives every design decision in the documents that follow.

---

*Next document: `02_SystemArchitecture.md` — the 3-tier system architecture with component, sequence, and state diagrams.*
