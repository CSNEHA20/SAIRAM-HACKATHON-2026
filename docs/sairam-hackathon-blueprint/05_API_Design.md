# 05 — API Design
## iTech AI Innovation Hackathon 2026

---

## 1. API Overview

The backend exposes a minimal REST API. The core endpoint streams the agent response via **Server-Sent Events (SSE)**.

**Base URL:** `http://localhost:8000`

**Authentication:** None (hackathon scope — API keys in `.env` only)

**Content-Type:** `application/json` (requests) | `text/event-stream` (SSE responses)

---

## 2. API Endpoints

### 2.1 POST `/api/chat` — Main Chat Endpoint (SSE)

**Purpose:** Send a user message and receive a streaming response from the LLM agent.

**Request Format:**
```json
{
  "message": "Show me the top 5 products by revenue this quarter",
  "session_id": "sess_abc123",
  "options": {
    "show_sql": true,
    "stream": true
  }
}
```

**Request Schema (Pydantic):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | ✅ | User's natural language query |
| `session_id` | string | ✅ | Unique session identifier |
| `options.show_sql` | boolean | ❌ | Show generated SQL in response (default: true) |
| `options.stream` | boolean | ❌ | Enable SSE streaming (default: true) |

**Response Format (SSE stream):**

Each SSE event has a `type` field:

```
event: token
data: {"type": "token", "content": "Here are"}

event: token
data: {"type": "token", "content": " the top 5"}

event: sql
data: {"type": "sql", "content": "SELECT p.name, SUM(...) FROM ..."}

event: chart
data: {"type": "chart", "chart_type": "bar", "data": [...], "config": {...}}

event: diagram
data: {"type": "diagram", "diagram_type": "er", "mermaid": "erDiagram\n ..."}

event: done
data: {"type": "done", "message_id": "msg_xyz789"}

event: error
data: {"type": "error", "code": "DB_ERROR", "message": "Query failed: ..."}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Stream started successfully |
| 400 | Invalid request body |
| 422 | Validation error (Pydantic) |
| 500 | Internal server error |
| 503 | Claude API unavailable |

---

### 2.2 GET `/api/session/{session_id}/history` — Get Conversation History

**Purpose:** Retrieve the message history for a session.

**Request:** No body.

**Response:**
```json
{
  "session_id": "sess_abc123",
  "messages": [
    {
      "role": "user",
      "content": "Show me top 5 products by revenue",
      "timestamp": "2026-08-03T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "Here are the top 5 products...",
      "charts": [
        {
          "chart_type": "bar",
          "data": [...],
          "config": {...}
        }
      ],
      "sql_used": "SELECT ...",
      "timestamp": "2026-08-03T10:00:05Z"
    }
  ],
  "message_count": 2
}
```

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | History returned |
| 404 | Session not found |

---

### 2.3 DELETE `/api/session/{session_id}` — Clear Session

**Purpose:** Reset conversation history for a session.

**Response:**
```json
{
  "success": true,
  "message": "Session cleared"
}
```

---

### 2.4 GET `/api/health` — Health Check

**Purpose:** Verify backend is running (used by Docker health checks).

**Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "claude_api": "reachable",
  "version": "1.0.0"
}
```

---

### 2.5 GET `/api/schema` — Get Database Schema (Direct)

**Purpose:** Return the DB schema without going through the agent (for UI schema preview panel).

**Response:**
```json
{
  "tables": [
    {
      "name": "customers",
      "columns": [
        {"name": "customer_id", "type": "INTEGER", "pk": true, "nullable": false},
        {"name": "name", "type": "TEXT", "pk": false, "nullable": false}
      ],
      "row_count": 500,
      "foreign_keys": []
    }
  ],
  "total_tables": 5
}
```

---

### 2.6 POST `/api/export/csv` — Export Query Results as CSV (Bonus)

**Request:**
```json
{
  "sql": "SELECT * FROM products ORDER BY price DESC",
  "filename": "products_export"
}
```

**Response:** `text/csv` file download.

**Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | CSV returned |
| 400 | Invalid/unsafe SQL |

---

## 3. Request/Response Models (Pydantic)

```python
# api/schemas.py

from pydantic import BaseModel
from typing import Optional, List, Any

class ChatOptions(BaseModel):
    show_sql: bool = True
    stream: bool = True

class ChatRequest(BaseModel):
    message: str
    session_id: str
    options: ChatOptions = ChatOptions()

class MessageRecord(BaseModel):
    role: str           # "user" | "assistant"
    content: str
    timestamp: str
    charts: Optional[List[dict]] = None
    sql_used: Optional[str] = None

class HistoryResponse(BaseModel):
    session_id: str
    messages: List[MessageRecord]
    message_count: int

class SchemaColumn(BaseModel):
    name: str
    type: str
    pk: bool
    nullable: bool

class SchemaTable(BaseModel):
    name: str
    columns: List[SchemaColumn]
    row_count: int
    foreign_keys: List[dict]

class SchemaResponse(BaseModel):
    tables: List[SchemaTable]
    total_tables: int

class ExportRequest(BaseModel):
    sql: str
    filename: str = "export"
```

---

## 4. SSE Event Type Reference

| Event Type | When Fired | Payload |
|------------|-----------|---------|
| `token` | Each text token streamed | `{"type": "token", "content": "..."}` |
| `sql` | When SQL is generated | `{"type": "sql", "content": "SELECT ..."}` |
| `chart` | When chart data is ready | `{"type": "chart", "chart_type": "bar", "data": [...], "config": {...}}` |
| `diagram` | When Mermaid diagram is ready | `{"type": "diagram", "mermaid": "erDiagram\n..."}` |
| `tool_start` | When a tool is invoked | `{"type": "tool_start", "tool": "execute_query"}` |
| `tool_end` | When a tool completes | `{"type": "tool_end", "tool": "execute_query", "success": true}` |
| `done` | Stream complete | `{"type": "done", "message_id": "..."}` |
| `error` | Any error | `{"type": "error", "code": "...", "message": "..."}` |

---

## 5. Error Response Codes

| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_SESSION` | 400 | session_id missing or malformed |
| `EMPTY_MESSAGE` | 400 | message field is empty |
| `DB_ERROR` | 500 | SQLite query failed |
| `SQL_UNSAFE` | 400 | Query contains forbidden keywords |
| `CLAUDE_TIMEOUT` | 503 | Claude API didn't respond in time |
| `CLAUDE_RATE_LIMIT` | 429 | API rate limit hit |
| `TOOL_ERROR` | 500 | Tool execution failed |
| `PARSE_ERROR` | 422 | Request body validation failed |

---

## 6. CORS Configuration

```python
# main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
