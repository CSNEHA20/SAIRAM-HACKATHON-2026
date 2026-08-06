import pytest
from tools.get_schema import get_schema
from tools.execute_query import execute_query
from tools.explain_data import explain_data
from tools.generate_chart import generate_chart
from tools.generate_flowchart import generate_flowchart

@pytest.mark.asyncio
async def test_get_schema_all():
    res = await get_schema()
    assert res["success"] is True
    assert res["total_tables"] >= 5
    table_names = [t["name"] for t in res["tables"]]
    assert "customers" in table_names
    assert "products" in table_names
    assert "orders" in table_names

@pytest.mark.asyncio
async def test_get_schema_filter():
    res = await get_schema(table_filter="products,orders")
    assert res["success"] is True
    assert len(res["tables"]) == 2

@pytest.mark.asyncio
async def test_get_schema_invalid_filter():
    res = await get_schema(table_filter="non_existent_table")
    assert res["success"] is False
    assert "available_tables" in res

@pytest.mark.asyncio
async def test_execute_query_valid():
    res = await execute_query("SELECT name, price FROM products ORDER BY price DESC LIMIT 3;")
    assert res["success"] is True
    assert len(res["rows"]) == 3
    assert "name" in res["columns"]

@pytest.mark.asyncio
async def test_execute_query_unsafe():
    res = await execute_query("DELETE FROM customers WHERE customer_id = 1;")
    assert res["success"] is False
    assert "error" in res

@pytest.mark.asyncio
async def test_explain_data_summary():
    data = [
        {"category": "Electronics", "revenue": 1200},
        {"category": "Clothing", "revenue": 800},
    ]
    res = await explain_data(data=data, columns=["category", "revenue"])
    assert res["success"] is True
    assert res["row_count"] == 2
    assert "revenue" in res["key_metrics"]["numeric_aggregates"]
    assert res["key_metrics"]["numeric_aggregates"]["revenue"]["average"] == 1000

@pytest.mark.asyncio
async def test_explain_data_empty():
    res = await explain_data(data=[], columns=[])
    assert res["success"] is False
    assert "empty" in res["error"].lower()

@pytest.mark.asyncio
async def test_generate_chart_bar():
    data = [{"name": "A", "value": 10}, {"name": "B", "value": 20}]
    res = await generate_chart(chart_type="bar", data=data, x_key="name", y_key="value")
    assert res["success"] is True
    assert res["chart_type"] == "bar"
    assert res["config"]["x_key"] == "name"
    assert res["config"]["y_key"] == "value"
    assert res["config"]["color"] == "#6366f1"

@pytest.mark.asyncio
async def test_generate_chart_invalid_type():
    data = [{"x": 1, "y": 2}]
    res = await generate_chart(chart_type="donut", data=data, x_key="x", y_key="y")
    assert res["success"] is False

@pytest.mark.asyncio
async def test_generate_chart_missing_column():
    data = [{"x": 1}]
    res = await generate_chart(chart_type="bar", data=data, x_key="x", y_key="y")
    assert res["success"] is False
    assert "not found" in res["error"].lower()

@pytest.mark.asyncio
async def test_generate_flowchart_er_from_schema():
    schema = {
        "tables": [
            {
                "name": "customers",
                "columns": [
                    {"name": "customer_id", "type": "INTEGER", "pk": True},
                    {"name": "name", "type": "TEXT", "pk": False},
                ],
                "foreign_keys": [],
            }
        ]
    }
    res = await generate_flowchart(diagram_type="er", schema_data=schema, title="Test ER")
    assert res["success"] is True
    assert "erDiagram" in res["mermaid"]
    assert "CUSTOMERS" in res["mermaid"]

@pytest.mark.asyncio
async def test_generate_flowchart_direct_code():
    res = await generate_flowchart(
        diagram_type="flowchart",
        mermaid_code="A --> B",
        title="Simple Flow"
    )
    assert res["success"] is True
    assert "flowchart TD" in res["mermaid"]
    assert "A --> B" in res["mermaid"]

@pytest.mark.asyncio
async def test_generate_flowchart_invalid_type():
    res = await generate_flowchart(diagram_type="gantt")
    assert res["success"] is False
