import pytest
import json
from agent.tool_registry import TOOL_SCHEMAS, TOOL_MAP, execute_tool
from agent.orchestrator import agent_orchestrator

def test_tool_schemas_and_map():
    assert len(TOOL_SCHEMAS) == 5
    assert len(TOOL_MAP) == 5
    names = [s["name"] for s in TOOL_SCHEMAS]
    for expected in ["get_schema", "execute_query", "generate_chart", "generate_flowchart", "explain_data"]:
        assert expected in names
        assert expected in TOOL_MAP

@pytest.mark.asyncio
async def test_execute_tool_generate_chart():
    test_data = [{"product": "Headphones", "revenue": 149.99}]
    res = await execute_tool("generate_chart", {
        "chart_type": "bar",
        "data": test_data,
        "x_key": "product",
        "y_key": "revenue",
        "title": "Revenue by Product"
    })
    assert res["success"] is True
    assert res["chart_type"] == "bar"
    assert res["config"]["x_key"] == "product"

@pytest.mark.asyncio
async def test_execute_tool_generate_flowchart_er():
    schema_sample = {
        "tables": [
            {
                "name": "customers",
                "columns": [{"name": "customer_id", "type": "INTEGER", "pk": True}],
                "foreign_keys": []
            }
        ]
    }
    res = await execute_tool("generate_flowchart", {
        "diagram_type": "er",
        "schema_data": schema_sample
    })
    assert res["success"] is True
    assert "erDiagram" in res["mermaid"]

@pytest.mark.asyncio
async def test_execute_tool_explain_data():
    test_data = [{"price": 100}, {"price": 200}]
    res = await execute_tool("explain_data", {
        "data": test_data,
        "columns": ["price"]
    })
    assert res["success"] is True
    assert res["key_metrics"]["numeric_aggregates"]["price"]["average"] == 150.0

@pytest.mark.asyncio
async def test_execute_tool_unknown():
    res = await execute_tool("unknown_tool_name", {})
    assert res["success"] is False
    assert "Unknown tool" in res["error"]

@pytest.mark.asyncio
async def test_agent_orchestrator_stream():
    events = []
    async for sse_chunk in agent_orchestrator.process_message_stream(
        message="Show top 5 expensive products",
        session_id="agent_test_session",
        show_sql=True
    ):
        events.append(sse_chunk)
    
    combined = "".join(events)
    assert "data: " in combined
    assert "tool_start" in combined
    assert "execute_query" in combined
    assert "token" in combined
    assert "done" in combined
