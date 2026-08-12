import pytest
from db.connection import db_manager
from db.validator import sql_validator

@pytest.mark.asyncio
async def test_db_connection_and_health():
    is_healthy = await db_manager.check_health()
    assert is_healthy is True

@pytest.mark.asyncio
async def test_db_query_execution():
    res = await db_manager.execute_query_async("SELECT COUNT(*) as total FROM products;")
    assert "columns" in res
    assert "rows" in res
    assert "row_count" in res
    assert res["row_count"] == 1
    assert res["rows"][0]["total"] > 0

def test_sql_validator_select():
    is_valid, sql = sql_validator.validate_and_format("SELECT * FROM customers")
    assert is_valid is True
    assert "LIMIT 100" in sql

def test_sql_validator_forbids_mutation():
    for forbidden in ["DROP TABLE customers", "DELETE FROM orders", "INSERT INTO products VALUES (1)", "UPDATE products SET price=0"]:
        is_valid, err = sql_validator.validate_and_format(forbidden)
        assert is_valid is False, f"Should reject: {forbidden}"
        assert "Forbidden" in err or "Only SELECT" in err

def test_sql_validator_limit_cap():
    is_valid, sql = sql_validator.validate_and_format("SELECT * FROM products LIMIT 5000")
    assert is_valid is True
    assert "LIMIT 1000" in sql
