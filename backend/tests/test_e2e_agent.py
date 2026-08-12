import json
import pytest
from agent.orchestrator import AgentOrchestrator
from db.validator import sql_validator
from tools.execute_query import execute_query
from tools.get_schema import get_schema
from tools.generate_chart import generate_chart
from tools.generate_flowchart import generate_flowchart


@pytest.mark.asyncio
async def test_e2e_offline_top_products_revenue():
    """Test UC1 offline flow: user asks for top products by revenue."""
    orchestrator = AgentOrchestrator()
    events = []
    async for sse_line in orchestrator.process_message_stream(
        message="Show me top 5 products by revenue",
        session_id="test_e2e_uc1",
        show_sql=True
    ):
        if sse_line.startswith("data: "):
            events.append(json.loads(sse_line[6:].strip()))

    event_types = [e["type"] for e in events]
    assert "tool_start" in event_types
    assert "tool_end" in event_types
    assert "sql" in event_types
    assert "chart" in event_types
    assert "token" in event_types
    assert "done" in event_types

    # Verify chart structure
    chart_events = [e for e in events if e["type"] == "chart"]
    assert len(chart_events) > 0
    assert chart_events[0]["chart_type"] in ["bar", "line", "pie", "scatter"]
    assert len(chart_events[0]["data"]) > 0


@pytest.mark.asyncio
async def test_e2e_offline_er_diagram():
    """Test UC2 offline flow: user asks for ER diagram."""
    orchestrator = AgentOrchestrator()
    events = []
    async for sse_line in orchestrator.process_message_stream(
        message="Draw the ER diagram for the database",
        session_id="test_e2e_uc2",
        show_sql=True
    ):
        if sse_line.startswith("data: "):
            events.append(json.loads(sse_line[6:].strip()))

    event_types = [e["type"] for e in events]
    assert "diagram" in event_types
    diagram_events = [e for e in events if e["type"] == "diagram"]
    assert len(diagram_events) > 0
    assert "erDiagram" in diagram_events[0]["mermaid"] or "flowchart" in diagram_events[0]["mermaid"]


@pytest.mark.asyncio
async def test_e2e_offline_process_flowchart():
    """Test UC3 offline flow: user asks how orders flow."""
    orchestrator = AgentOrchestrator()
    events = []
    async for sse_line in orchestrator.process_message_stream(
        message="Show me how orders flow through the system",
        session_id="test_e2e_uc3",
        show_sql=True
    ):
        if sse_line.startswith("data: "):
            events.append(json.loads(sse_line[6:].strip()))

    diagram_events = [e for e in events if e["type"] == "diagram"]
    assert len(diagram_events) > 0
    assert "flowchart" in diagram_events[0]["mermaid"] or "graph" in diagram_events[0]["mermaid"]


@pytest.mark.asyncio
async def test_sql_validator_safety():
    """Verify destructive SQL statements are rejected by validator."""
    valid, err = sql_validator.validate_and_format("DROP TABLE customers;")
    assert not valid
    assert "Forbidden SQL command" in err or "Only SELECT" in err

    valid, err = sql_validator.validate_and_format("DELETE FROM orders WHERE 1=1;")
    assert not valid
    assert "Forbidden SQL command" in err or "Only SELECT" in err

    valid, err = sql_validator.validate_and_format("UPDATE products SET price = 0;")
    assert not valid

    valid, res = sql_validator.validate_and_format("SELECT * FROM products")
    assert valid
    assert "LIMIT" in res


@pytest.mark.asyncio
async def test_query_recovery_pipeline():
    """Verify execute_query rejects invalid column and then succeeds on valid query."""
    invalid_res = await execute_query("SELECT invalid_column_xyz FROM products")
    assert not invalid_res["success"]
    assert "error" in invalid_res

    valid_res = await execute_query("SELECT product_id, name, price FROM products LIMIT 5")
    assert valid_res["success"]
    assert len(valid_res["rows"]) > 0
