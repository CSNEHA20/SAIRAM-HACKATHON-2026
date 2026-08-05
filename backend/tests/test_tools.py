import pytest
from tools.get_schema import get_schema
from tools.execute_query import execute_query

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
    res = await get_schema(table_filter=["products", "orders"])
    assert res["success"] is True
    assert len(res["tables"]) == 2

@pytest.mark.asyncio
async def test_get_schema_invalid_filter():
    res = await get_schema(table_filter=["non_existent_table"])
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
