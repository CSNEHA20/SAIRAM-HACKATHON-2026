# 06 — Agent Architecture
## iTech AI Innovation Hackathon 2026

---

## 1. Agent Overview

The LLM Agent is the brain of the system. It uses **Anthropic Claude's native tool_use (function calling)** capability to iteratively reason, invoke tools, observe results, and produce a final response — all within a single user turn.

**Agent Type:** ReAct-style (Reason + Act) loop using Claude's built-in tool_use protocol  
**Framework:** Custom implementation (no LangChain overhead — faster, more controllable)  
**LLM:** `claude-sonnet-4-6` via Anthropic Python SDK  

---

## 2. Agent Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Initialized: Session created
    Initialized --> Idle: Ready for input

    Idle --> Planning: User message received
    Planning --> ToolExecution: Claude decides tool_use
    ToolExecution --> Observing: Tool returns result
    Observing --> Planning: More tools needed
    Observing --> Responding: Claude reaches end_turn
    Responding --> Streaming: Tokens streamed to frontend
    Streaming --> Idle: Response complete

    Planning --> Responding: No tools needed (direct answer)
    ToolExecution --> ErrorRecovery: Tool fails
    ErrorRecovery --> Planning: Retry with error context
    ErrorRecovery --> Responding: Max retries exceeded
```

---

## 3. Prompt Flow

### 3.1 System Prompt

```
You are DataFlow AI, an expert data analyst assistant. You help users explore 
and visualize database data through natural conversation.

You have access to these tools:
- get_schema: Discover database tables and column structures
- execute_query: Run SELECT SQL queries against the database
- generate_chart: Create data visualizations (bar, line, pie, scatter)
- generate_flowchart: Create ER diagrams and process flow diagrams
- explain_data: Produce natural language insights from query results

RULES:
1. Always call get_schema first if you don't know the table structure.
2. Always show the SQL you're using (include it in your response before results).
3. Generate a chart when presenting numerical data comparisons or trends.
4. Generate an ER diagram when asked about database structure.
5. If a query fails, explain what went wrong and try a corrected version.
6. Keep explanations concise and business-focused.
7. Only use SELECT statements — never modify data.

Current database: E-commerce dataset (orders, products, customers, inventory)
```

### 3.2 Message Construction Per Turn

```python
def build_messages(session: Session, user_message: str) -> list:
    messages = []
    
    # Include conversation history (last N turns for context window management)
    for msg in session.get_recent_history(max_turns=10):
        messages.append({
            "role": msg.role,
            "content": msg.content
        })
    
    # Append current user message
    messages.append({
        "role": "user",
        "content": user_message
    })
    
    return messages
```

---

## 4. Memory Strategy

### 4.1 In-Session Memory (Conversation History)

```mermaid
flowchart LR
    M1[Turn 1] --> M2[Turn 2] --> M3[Turn 3] --> WINDOW[Sliding Window\n≤10 turns]
    WINDOW -->|Full history| CLAUDE[Claude API]
```

- Stored in-memory on the backend (`session.py` → Python dict keyed by `session_id`)
- Sliding window: last **10 user+assistant turns** included in each API call
- Tool results are included as `tool_result` blocks within the history
- No database persistence (hackathon scope — session dies when server restarts)

### 4.2 Schema Cache

- `get_schema` result cached per session after first call
- Avoids redundant DB introspection on every turn
- Invalidated when session is cleared

### 4.3 Context Window Budget

| Component | Tokens (estimate) |
|-----------|------------------|
| System prompt | ~300 |
| Conversation history (10 turns) | ~8,000 |
| Tool schemas | ~1,500 |
| Current user message | ~100 |
| Claude response + tool calls | up to 4,096 |
| **Total** | ~14,000 of 200K limit ✅ |

---

## 5. Context Handling

### 5.1 Tool Result Injection

When a tool executes, its result is injected back into the message array as a `tool_result` block, which Claude reads before deciding the next step:

```python
# After tool execution
messages.append({
    "role": "assistant",
    "content": [
        {
            "type": "tool_use",
            "id": tool_call.id,
            "name": tool_call.name,
            "input": tool_call.input
        }
    ]
})

messages.append({
    "role": "user",
    "content": [
        {
            "type": "tool_result",
            "tool_use_id": tool_call.id,
            "content": json.dumps(tool_result)
        }
    ]
})
```

### 5.2 Schema Injection into System Prompt (Optional)

For complex queries, the schema JSON can be appended to the system prompt:
```
...
Available Tables:
customers(customer_id, name, email, city, country)
products(product_id, name, category, price, stock_quantity)
orders(order_id, customer_id, order_date, total_amount, status)
order_items(item_id, order_id, product_id, quantity, unit_price)
inventory(inventory_id, product_id, warehouse_location, quantity)
```

---

## 6. Tool Calling Protocol

### 6.1 Tool Schema Registration

All tools are registered with Claude using the Anthropic `tools` parameter:

```python
TOOLS = [
    {
        "name": "get_schema",
        "description": "Retrieve the database schema including tables, columns, and types.",
        "input_schema": {
            "type": "object",
            "properties": {
                "table_filter": {
                    "type": "string",
                    "description": "Optional: filter to a specific table name. Leave empty for full schema."
                }
            },
            "required": []
        }
    },
    # ... other tools
]
```

### 6.2 Agent Loop (Core Logic)

```python
async def run_agent(session_id: str, user_message: str, stream_callback):
    session = session_manager.get_or_create(session_id)
    messages = build_messages(session, user_message)
    
    max_tool_iterations = 8  # Prevent infinite loops
    iteration = 0
    
    while iteration < max_tool_iterations:
        response = await anthropic_client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages
        )
        
        if response.stop_reason == "end_turn":
            # Stream final text to frontend
            for block in response.content:
                if block.type == "text":
                    await stream_callback("token", {"content": block.text})
            break
        
        elif response.stop_reason == "tool_use":
            for block in response.content:
                if block.type == "tool_use":
                    await stream_callback("tool_start", {"tool": block.name})
                    
                    # Execute tool
                    result = await tool_registry.execute(block.name, block.input)
                    
                    await stream_callback("tool_end", {
                        "tool": block.name, 
                        "success": result.get("success", True)
                    })
                    
                    # Emit chart/diagram events to frontend
                    if block.name == "generate_chart":
                        await stream_callback("chart", result)
                    elif block.name == "generate_flowchart":
                        await stream_callback("diagram", result)
                    elif block.name == "execute_query" and session.options.show_sql:
                        await stream_callback("sql", {"content": block.input.get("sql")})
                    
                    # Inject tool result back into conversation
                    messages = inject_tool_result(messages, response, block.id, result)
        
        iteration += 1
    
    # Save to session history
    session.add_turn(user_message, final_text)
    await stream_callback("done", {"message_id": generate_id()})
```

---

## 7. Error Recovery Strategy

```mermaid
flowchart TD
    TOOL_FAIL[Tool Returns Error] --> INJECT[Inject error as tool_result]
    INJECT --> CLAUDE_RETRY[Claude sees error, re-reasons]
    CLAUDE_RETRY --> REPHRASE{Can Claude\ncorrect it?}
    REPHRASE -->|Yes| NEWTOOL[Invoke corrected tool call]
    REPHRASE -->|No after 2 retries| FRIENDLY[Return friendly error message]
    NEWTOOL --> SUCCESS[Continue normal flow]
    FRIENDLY --> USER[User sees actionable message]
```

**Error messages injected to Claude look like:**
```json
{
  "success": false,
  "error": "SQL syntax error near 'FORM': expected FROM",
  "hint": "Check table name spelling. Available tables: customers, products, orders, order_items, inventory"
}
```

---

## 8. Conversation Flow (Sample)

```mermaid
sequenceDiagram
    participant U as User
    participant AG as Agent
    participant CL as Claude
    participant T as Tools

    U->>AG: "Show top 5 products by revenue"
    AG->>CL: [user message + tools schema]
    CL-->>AG: tool_use: get_schema()
    AG->>T: get_schema()
    T-->>AG: {tables: [...schema...]}
    AG->>CL: tool_result: schema JSON
    CL-->>AG: tool_use: execute_query(SELECT ...)
    AG->>T: execute_query(sql)
    Note over AG: Emit SSE event: sql
    T-->>AG: {rows: [...], columns: [...]}
    AG->>CL: tool_result: rows JSON
    CL-->>AG: tool_use: generate_chart(data, "bar")
    AG->>T: generate_chart(...)
    Note over AG: Emit SSE event: chart
    T-->>AG: {chart_type: "bar", data: [...]}
    AG->>CL: tool_result: chart config
    CL-->>AG: end_turn: "Here are the top 5 products..."
    Note over AG: Stream tokens via SSE
    AG->>U: Rendered chart + explanation
```

---

## 9. Agent Configuration

```python
# agent/orchestrator.py — Configuration constants

MODEL = os.getenv("MODEL", "claude-sonnet-4-6")
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "4096"))
MAX_TOOL_ITERATIONS = 8
MAX_HISTORY_TURNS = 10
TOOL_TIMEOUT_SECONDS = 30

SYSTEM_PROMPT = """..."""  # See section 3.1
```
