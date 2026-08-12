import os
import pytest

from db.connection import create_adapter, DatabaseManager
from db.adapters.sqlite import SQLiteAdapter


def test_create_adapter_default_is_sqlite():
    adapter = create_adapter()
    assert isinstance(adapter, SQLiteAdapter)


def test_create_adapter_from_env():
    os.environ["DB_TYPE"] = "postgresql"
    try:
        adapter = create_adapter()
        assert adapter.name == "postgresql"
    finally:
        os.environ.pop("DB_TYPE", None)


def test_create_adapter_unsupported():
    with pytest.raises(ValueError):
        create_adapter("oracle")


@pytest.mark.asyncio
async def test_sqlite_adapter_health_and_query():
    adapter = SQLiteAdapter()
    await adapter.initialize()
    assert await adapter.check_health() is True

    res = await adapter.execute_query("SELECT COUNT(*) AS cnt FROM products;")
    assert res["row_count"] == 1
    assert res["rows"][0]["cnt"] > 0

    schema = await adapter.get_schema()
    assert schema["success"] is True
    assert schema["total_tables"] >= 5
