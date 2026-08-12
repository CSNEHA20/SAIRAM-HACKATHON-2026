# 13 — Testing Strategy
## iTech AI Innovation Hackathon 2026

---

## 1. Testing Philosophy

For a 7-day hackathon, testing must be **fast, targeted, and demo-protecting**. The goal is not 100% code coverage — it's ensuring nothing breaks during the 5-minute judging demo.

**Testing priority:** Demo scenarios > Tool functions > UI rendering > Edge cases

---

## 2. Testing Layers

```mermaid
pyramid
    "E2E Tests (3 demo scenarios)" : 3
    "Agent Integration Tests" : 5
    "Tool Unit Tests (5 tools)" : 15
    "API Contract Tests" : 5
    "UI Component Tests" : 10
```

| Layer | Count | When to Run | Owner |
|-------|-------|------------|-------|
| Tool Unit Tests | 15 | After each tool is implemented | Dev A |
| Agent Integration Tests | 5 | Day 2 & Day 4 | Dev A |
| API Contract Tests | 5 | Day 3 | Dev A |
| UI Component Tests | 10 | Day 3–4 | Dev B |
| E2E Demo Scenarios | 3 | Day 4 & Day 7 | Both |

---

## 3. Unit Testing — Agent Tools

### Test File: `backend/tests/test_tools.py`

#### `get_schema` Tests
```python
import pytest
import asyncio
from tools.get_schema import get_schema

@pytest.mark.asyncio
async def test_get_schema_returns_all_tables():
    result = await get_schema()
    assert result["success"] == True
    assert result["total_tables"] >= 4
    table_names = [t["name"] for t in result["tables"]]
    assert "customers" in table_names
    assert "products" in table_names
    assert "orders" in table_names

@pytest.mark.asyncio
async def test_get_schema_single_table_filter():
    result = await get_schema(table_filter="products")
    assert result["success"] == True
    assert len(result["tables"]) == 1
    assert result["tables"][0]["name"] == "products"

@pytest.mark.asyncio
async def test_get_schema_invalid_table_returns_error():
    result = await get_schema(table_filter="nonexistent_table")
    assert result["success"] == False
    assert "available_tables" in result
```

#### `execute_query` Tests
```python
from tools.execute_query import execute_query

@pytest.mark.asyncio
async def test_execute_query_simple_select():
    result = await execute_query(sql="SELECT * FROM products LIMIT 5")
    assert result["success"] == True
    assert result["row_count"] == 5
    assert "product_id" in result["columns"]

@pytest.mark.asyncio
async def test_execute_query_blocks_insert():
    result = await execute_query(sql="INSERT INTO products VALUES (1, 'hack')")
    assert result["success"] == False
    assert "SQL_UNSAFE" in result.get("error", "") or result.get("code") == "SQL_UNSAFE"

@pytest.mark.asyncio
async def test_execute_query_blocks_drop():
    result = await execute_query(sql="DROP TABLE products")
    assert result["success"] == False

@pytest.mark.asyncio
async def test_execute_query_handles_syntax_error():
    result = await execute_query(sql="SELECT * FORM products")
    assert result["success"] == False
    assert "hint" in result

@pytest.mark.asyncio
async def test_execute_query_aggregation():
    sql = """
    SELECT p.category, SUM(oi.quantity * oi.unit_price) AS revenue
    FROM order_items oi JOIN products p ON oi.product_id = p.product_id
    GROUP BY p.category ORDER BY revenue DESC
    """
    result = await execute_query(sql=sql)
    assert result["success"] == True
    assert "category" in result["columns"]
    assert "revenue" in result["columns"]
```

#### `generate_chart` Tests
```python
from tools.generate_chart import generate_chart

SAMPLE_DATA = [
    {"name": "Product A", "revenue": 45200},
    {"name": "Product B", "revenue": 38100},
]

@pytest.mark.asyncio
async def test_generate_chart_bar():
    result = await generate_chart(
        chart_type="bar", data=SAMPLE_DATA,
        x_key="name", y_key="revenue", title="Test Chart"
    )
    assert result["success"] == True
    assert result["chart_type"] == "bar"
    assert result["data"] == SAMPLE_DATA

@pytest.mark.asyncio
async def test_generate_chart_invalid_type():
    result = await generate_chart(
        chart_type="heatmap", data=SAMPLE_DATA, x_key="name", y_key="revenue"
    )
    assert result["success"] == False

@pytest.mark.asyncio
async def test_generate_chart_invalid_key():
    result = await generate_chart(
        chart_type="bar", data=SAMPLE_DATA, x_key="name", y_key="nonexistent"
    )
    assert result["success"] == False
    assert "nonexistent" in result["error"]
```

#### `generate_flowchart` Tests
```python
from tools.generate_flowchart import generate_flowchart

@pytest.mark.asyncio
async def test_generate_er_diagram_from_schema():
    schema = {
        "tables": [
            {"name": "orders", "columns": [{"name": "order_id", "type": "INTEGER", "pk": True}],
             "foreign_keys": [{"from": "customer_id", "table": "customers", "to": "customer_id"}]},
            {"name": "customers", "columns": [{"name": "customer_id", "type": "INTEGER", "pk": True}],
             "foreign_keys": []},
        ]
    }
    result = await generate_flowchart(diagram_type="er", schema_data=schema)
    assert result["success"] == True
    assert "erDiagram" in result["mermaid"]

@pytest.mark.asyncio
async def test_generate_flowchart_from_mermaid():
    mermaid = "flowchart TD\n    A[Start] --> B[End]"
    result = await generate_flowchart(diagram_type="flowchart", mermaid_code=mermaid)
    assert result["success"] == True
    assert result["mermaid"] == mermaid
```

---

## 4. Agent Integration Testing

### Test File: `backend/tests/test_agent.py`

```python
# These tests make real Claude API calls — run sparingly (Day 4 only)
# Mark with @pytest.mark.integration

@pytest.mark.integration
@pytest.mark.asyncio
async def test_agent_schema_query():
    """Agent should call get_schema when asked about tables."""
    events = []
    async def capture(event_type, data):
        events.append({"type": event_type, **data})
    
    await run_agent("test-001", "What tables are in this database?", capture)
    
    tool_events = [e for e in events if e["type"] in ["tool_start", "tool_end"]]
    tool_names = [e["tool"] for e in tool_events]
    assert "get_schema" in tool_names

@pytest.mark.integration
@pytest.mark.asyncio
async def test_agent_chart_query():
    """Agent should call execute_query + generate_chart for revenue question."""
    events = []
    async def capture(event_type, data):
        events.append({"type": event_type, **data})
    
    await run_agent("test-002", "Show top 5 products by revenue as a bar chart", capture)
    
    chart_events = [e for e in events if e["type"] == "chart"]
    assert len(chart_events) >= 1
    assert chart_events[0]["chart_type"] == "bar"
```

---

## 5. API Contract Testing

```python
# backend/tests/test_api.py
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_schema_endpoint():
    response = client.get("/api/schema")
    assert response.status_code == 200
    data = response.json()
    assert "tables" in data
    assert data["total_tables"] >= 4

def test_chat_endpoint_requires_message():
    response = client.post("/api/chat", json={"session_id": "test"})
    assert response.status_code == 422  # Pydantic validation error

def test_chat_endpoint_requires_session():
    response = client.post("/api/chat", json={"message": "hello"})
    assert response.status_code == 422

def test_session_history_not_found():
    response = client.get("/api/session/nonexistent-session/history")
    assert response.status_code == 404
```

---

## 6. Database Testing

```python
# backend/tests/test_db.py
from db.validator import validate_sql
from db.connection import execute_safe_query

def test_validator_allows_select():
    valid, err = validate_sql("SELECT * FROM products")
    assert valid == True

def test_validator_blocks_insert():
    valid, err = validate_sql("INSERT INTO products VALUES (...)")
    assert valid == False
    assert "INSERT" in err

def test_validator_blocks_drop():
    valid, err = validate_sql("DROP TABLE products")
    assert valid == False

def test_validator_blocks_update():
    valid, err = validate_sql("UPDATE products SET price = 0")
    assert valid == False

@pytest.mark.asyncio
async def test_execute_safe_query_returns_rows():
    result = await execute_safe_query("SELECT COUNT(*) AS cnt FROM products")
    assert result["row_count"] == 1
    assert result["rows"][0]["cnt"] > 0
```

---

## 7. Visualization Testing

### Manual Test Matrix (Dev B verifies each chart type renders correctly)

| Chart Type | Test Data | Pass Criteria |
|-----------|-----------|---------------|
| Bar Chart | 5 product/revenue rows | Bars visible, tooltip on hover, legend shows |
| Line Chart | 12 monthly revenue rows | Line smooth, X-axis shows months |
| Pie Chart | 5 status/count rows | Slices visible, labels show category name |
| Scatter Chart | 20 price/qty rows | Dots visible, axes labeled |
| ER Diagram | E-commerce schema | All 5 tables shown with relationships |
| Flowchart | Order process | Nodes and arrows render correctly |

---

## 8. UI Testing (Manual Checklist, Dev B)

| Test | Pass Criteria |
|------|--------------|
| Send message → TypingIndicator appears | ✅ Dots animate within 200ms |
| Stream starts → TypingIndicator disappears | ✅ Replaced by streaming text |
| Message completes → Input re-enables | ✅ Send button re-enabled |
| Chart renders in bubble | ✅ No layout overflow |
| Diagram renders in bubble | ✅ Readable, not clipped |
| SQL Badge toggles | ✅ Expand/collapse smooth |
| Error message displays | ✅ Red border, icon, message |
| History panel saves query | ✅ Persists after page refresh |
| Export PNG downloads | ✅ File saved to downloads |
| Export CSV downloads | ✅ File saved to downloads |
| Example prompt chip clicked | ✅ Message sent automatically |
| Welcome screen shows on first load | ✅ Disappears on first message |

---

## 9. End-to-End Demo Scenario Tests

These are the most important tests — run on Day 4 and Day 7.

### Scenario 1: Sales Analysis
```
Input 1: "Show me the top 5 products by revenue this quarter"
Expected: Bar chart renders with product names and revenue values
          Text explanation mentions top product by name

Input 2: "Now show me the trend for these products over the last year"
Expected: Line chart renders with months on X-axis
          Multi-line or single-line chart with revenue over time
```

### Scenario 2: Database Understanding
```
Input 1: "Draw me the ER diagram for this database"
Expected: Mermaid ER diagram renders with all 5 tables and relationships

Input 2: "Which tables are related to customers?"
Expected: Text response mentioning orders (via customer_id foreign key)
```

### Scenario 3: Process Visualization
```
Input 1: "Create a flowchart showing how orders flow through our system"
Expected: Mermaid flowchart renders showing: 
          Customer → Order → Order Items → Products → Inventory
```

---

## 10. Acceptance Testing (Before Submission)

```
[ ] docker-compose up starts all services in < 60 seconds
[ ] localhost:3000 loads the chat interface
[ ] Health check passes: curl localhost:8000/api/health
[ ] All 3 scenario tests pass manually
[ ] SQL badge shows generated SQL for data queries
[ ] Export PNG saves a valid image file
[ ] Query history populates after first query
[ ] No console errors in browser DevTools
[ ] No Python exceptions in backend logs
[ ] README setup instructions result in working app in < 5 commands
```
