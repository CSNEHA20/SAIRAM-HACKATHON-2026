# 01 — System Architecture
## iTech AI Innovation Hackathon 2026

---

## 1. High-Level Architecture

The system follows a **3-tier conversational AI architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                    USER BROWSER                          │
│              React Chat Interface (Vite)                 │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/SSE (streaming)
┌─────────────────────▼───────────────────────────────────┐
│                  FASTAPI BACKEND                         │
│           Agent Orchestration Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │ Chat Router  │  │ Tool Registry│  │ Session Store │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────────┘ │
│         │                 │                              │
│  ┌──────▼─────────────────▼──────────────────────────┐ │
│  │              LLM Agent Core                        │ │
│  │    (Anthropic Claude + Function Calling)           │ │
│  └──────┬───────────────────────────────────────────┘  │
│         │ Tool Calls                                     │
│  ┌──────▼────────────────────────────────────────────┐ │
│  │              Tool Execution Layer                  │ │
│  │  get_schema │ execute_query │ generate_chart       │ │
│  │  generate_flowchart │ explain_data                 │ │
│  └──────┬────────────────────────────────────────────┘  │
└─────────┼───────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────┐
│                  DATA LAYER                              │
│              SQLite (e-commerce DB)                      │
│    orders | products | customers | inventory             │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Component Diagram

```mermaid
graph TB
    subgraph Frontend ["Frontend (React + Vite)"]
        UI[Chat UI Component]
        MSG[Message Renderer]
        CHART[Chart Renderer - Recharts]
        DIAG[Diagram Renderer - Mermaid]
        HIST[Query History Panel]
        EXPORT[Export Controls]
    end

    subgraph Backend ["Backend (FastAPI)"]
        ROUTER[Chat Router /api/chat]
        SESSION[Session Manager]
        AGENT[LLM Agent Orchestrator]
        REGISTRY[Tool Registry]
        
        subgraph Tools ["Agent Tools"]
            T1[get_schema]
            T2[execute_query]
            T3[generate_chart]
            T4[generate_flowchart]
            T5[explain_data]
        end
    end

    subgraph DataLayer ["Data Layer"]
        DB[(SQLite DB)]
        DBMGR[DB Connection Manager]
    end

    subgraph External ["External Services"]
        CLAUDE[Anthropic Claude API]
    end

    UI -->|SSE Stream| ROUTER
    ROUTER --> SESSION
    ROUTER --> AGENT
    AGENT -->|Function Calling| CLAUDE
    CLAUDE -->|Tool Call Request| REGISTRY
    REGISTRY --> T1 & T2 & T3 & T4 & T5
    T1 & T2 --> DBMGR
    DBMGR --> DB
    T3 --> CHART
    T4 --> DIAG
    AGENT -->|Stream Tokens| ROUTER
    ROUTER -->|SSE| UI
    MSG --> CHART
    MSG --> DIAG
```

---

## 3. Data Flow Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React Frontend
    participant API as FastAPI Backend
    participant AG as LLM Agent
    participant CL as Claude API
    participant TO as Tool Executor
    participant DB as SQLite DB

    U->>UI: "Show top 5 products by revenue"
    UI->>API: POST /api/chat {message, session_id}
    API->>AG: process_message(message, history)
    AG->>CL: messages + tools schema
    CL-->>AG: tool_call: get_schema()
    AG->>TO: execute get_schema
    TO->>DB: PRAGMA table_info(...)
    DB-->>TO: schema JSON
    TO-->>AG: schema result
    AG->>CL: tool_result + continue
    CL-->>AG: tool_call: execute_query(SQL)
    AG->>TO: execute_query
    TO->>DB: SELECT ... LIMIT 5
    DB-->>TO: rows JSON
    TO-->>AG: query result
    AG->>CL: tool_result + continue
    CL-->>AG: tool_call: generate_chart(data, "bar")
    AG->>TO: generate_chart
    TO-->>AG: chart config JSON
    AG->>CL: tool_result + continue
    CL-->>AG: text: "Here are the top 5..."
    AG-->>API: Stream tokens + chart payload
    API-->>UI: SSE chunks
    UI-->>U: Renders chat + chart
```

---

## 4. Agent Workflow

```mermaid
flowchart TD
    START([User Message]) --> PARSE[Parse Intent]
    PARSE --> HISTORY[Load Conversation History]
    HISTORY --> LLM{Claude LLM\nReasoning}
    
    LLM -->|Needs Schema| SCHEMA[get_schema Tool]
    LLM -->|Needs Data| QUERY[execute_query Tool]
    LLM -->|Needs Chart| CHART[generate_chart Tool]
    LLM -->|Needs Diagram| FLOW[generate_flowchart Tool]
    LLM -->|Needs Summary| EXPLAIN[explain_data Tool]
    LLM -->|Done| RESPOND[Stream Response to User]
    
    SCHEMA --> RESULT1[Schema JSON]
    QUERY --> RESULT2[Query Rows JSON]
    CHART --> RESULT3[Chart Config JSON]
    FLOW --> RESULT4[Mermaid/SVG String]
    EXPLAIN --> RESULT5[NL Summary]
    
    RESULT1 & RESULT2 & RESULT3 & RESULT4 & RESULT5 --> LLM
    
    RESPOND --> SAVE[Save to Session History]
    SAVE --> END([Display to User])
    
    QUERY -->|Error| RECOVER[Error Recovery Prompt]
    RECOVER --> LLM
```

---

## 5. Tool Calling Workflow

```mermaid
sequenceDiagram
    participant AG as Agent Core
    participant CL as Claude API
    participant REG as Tool Registry
    participant EX as Tool Executor

    AG->>CL: Send message + tool_schemas[]
    
    loop Until stop_reason = "end_turn"
        CL-->>AG: {stop_reason: "tool_use", tool_calls: [...]}
        AG->>REG: lookup_tool(tool_name)
        REG-->>AG: tool_function
        AG->>EX: execute(tool_function, tool_input)
        
        alt Success
            EX-->>AG: {success: true, result: {...}}
        else Error
            EX-->>AG: {success: false, error: "message"}
        end
        
        AG->>CL: Send tool_result (success or error)
    end
    
    CL-->>AG: {stop_reason: "end_turn", content: "..."}
    AG-->>AG: Stream final text response
```

---

## 6. Database Flow

```mermaid
flowchart LR
    Q[User Query] --> NL2SQL[NL → SQL via Claude]
    NL2SQL --> VALIDATE{Validate SQL}
    VALIDATE -->|Safe SELECT only| EXEC[Execute via SQLite]
    VALIDATE -->|Unsafe/DDL| BLOCK[Return Error]
    EXEC --> ROWS[Return JSON Rows]
    ROWS --> VIZ{Visualization\nNeeded?}
    VIZ -->|Yes| CHART_GEN[generate_chart / generate_flowchart]
    VIZ -->|No| TEXT[explain_data]
    CHART_GEN --> RENDER[Render in Chat]
    TEXT --> RENDER
```

---

## 7. Visualization Flow

```mermaid
flowchart TD
    DATA[Query Result Data] --> DETECT{Chart Type\nDetection}
    
    DETECT -->|Categorical| BAR[Bar Chart\nRecharts BarChart]
    DETECT -->|Time Series| LINE[Line Chart\nRecharts LineChart]
    DETECT -->|Proportional| PIE[Pie Chart\nRecharts PieChart]
    DETECT -->|Correlation| SCATTER[Scatter Plot\nRecharts ScatterChart]
    DETECT -->|Schema| ER[ER Diagram\nMermaid erDiagram]
    DETECT -->|Process| PROC[Flow Diagram\nMermaid flowchart]
    
    BAR & LINE & PIE & SCATTER --> RECHARTS[React Recharts\nComponent Props]
    ER & PROC --> MERMAID[Mermaid.js\nRender String]
    
    RECHARTS --> EMBED[Embed in Chat Message]
    MERMAID --> EMBED
    EMBED --> EXPORT[Optional: PNG/SVG Export]
```

---

## 8. Request Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Receiving: User submits message
    Receiving --> Streaming: POST /api/chat
    
    state Streaming {
        [*] --> AgentThinking
        AgentThinking --> ToolExecution: tool_use event
        ToolExecution --> AgentThinking: tool_result
        AgentThinking --> TextStreaming: end_turn
        TextStreaming --> [*]
    }
    
    Streaming --> Rendering: SSE complete
    Rendering --> Idle: Message displayed
    
    Streaming --> Error: Timeout / API failure
    Error --> Idle: Show error bubble
```

---

## 9. Error Flow

```mermaid
flowchart TD
    ERR_INPUT[Bad User Input] --> REPHRASE[Ask LLM to clarify]
    ERR_SQL[SQL Generation Fail] --> RETRY[Retry with schema hint]
    ERR_DB[DB Execution Error] --> SAFE_MSG[Return friendly error message]
    ERR_API[Claude API Timeout] --> FALLBACK[Return timeout message to user]
    ERR_CHART[Chart Render Fail] --> TABLE[Fallback: render data as table]
    
    REPHRASE & RETRY & SAFE_MSG & FALLBACK & TABLE --> USER[User sees actionable message]
```

---

## 10. Security Architecture

- All DB queries validated as `SELECT`-only (no DDL/DML)
- API keys loaded from `.env` via `python-dotenv`
- CORS restricted to frontend origin
- Input sanitized before passing to SQL executor
- No user data persisted beyond session lifetime
