import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv

from db.adapters import DatabaseAdapter
from db.adapters.sqlite import SQLiteAdapter
from db.adapters.postgres import PostgreSQLAdapter
from db.adapters.mysql import MySQLAdapter
from db.adapters.mongodb import MongoDBAdapter

load_dotenv()

DEFAULT_DB_PATH = Path(__file__).parent.parent.parent / "database" / "ecommerce.sqlite"


def get_db_path() -> str:
    """Backwards-compatible helper for SQLite path resolution."""
    env_path = os.getenv("DATABASE_PATH")
    if env_path:
        path = Path(env_path)
        if not path.is_absolute():
            path = (Path(__file__).parent.parent / env_path).resolve()
        return str(path)
    return str(DEFAULT_DB_PATH.resolve())


def create_adapter(
    db_type: Optional[str] = None,
    connection_string: Optional[str] = None,
    **kwargs: Any
) -> DatabaseAdapter:
    """Factory that creates the appropriate database adapter from DB_TYPE."""
    db_type = (db_type or os.getenv("DB_TYPE", "sqlite")).lower().strip()

    if db_type in ("sqlite",):
        return SQLiteAdapter(connection_string, **kwargs)
    if db_type in ("postgres", "postgresql", "psql"):
        return PostgreSQLAdapter(connection_string, **kwargs)
    if db_type in ("mysql", "mariadb"):
        return MySQLAdapter(connection_string, **kwargs)
    if db_type in ("mongodb", "mongo"):
        return MongoDBAdapter(connection_string, **kwargs)

    raise ValueError(
        f"Unsupported DB_TYPE: {db_type}. "
        "Choose one of: sqlite, postgresql, mysql, mongodb."
    )


class DatabaseManager:
    """
    Async database manager that delegates to a pluggable DatabaseAdapter.
    Supports SQLite (default), PostgreSQL, MySQL, and MongoDB.
    """

    def __init__(
        self,
        adapter: Optional[DatabaseAdapter] = None,
        db_type: Optional[str] = None,
        connection_string: Optional[str] = None,
        **adapter_kwargs: Any
    ):
        self.adapter = adapter or create_adapter(db_type, connection_string, **adapter_kwargs)
        # Backwards-compatible db_path attribute for tools that introspect SQLite directly.
        self.db_path = getattr(self.adapter, "db_path", get_db_path())
        self.db_type = self.adapter.name

    async def get_connection(self) -> Any:
        """Return a raw connection object when available (SQLite only for legacy callers)."""
        if isinstance(self.adapter, SQLiteAdapter):
            import aiosqlite
            conn = await aiosqlite.connect(self.adapter.db_path)
            conn.row_factory = aiosqlite.Row
            return conn
        raise NotImplementedError("Raw connections are only supported for SQLite adapter.")

    async def execute_query_async(
        self,
        query: str,
        params: Optional[tuple] = None
    ) -> Dict[str, Any]:
        """Executes a query asynchronously and returns a structured envelope."""
        return await self.adapter.execute_query(query, params)

    async def execute_script_async(self, script: str) -> None:
        """Execute a SQL script (typically DDL) that does not return rows."""
        await self.adapter.execute_script(script)

    async def ensure_indexes(self) -> None:
        """Create idempotent performance indexes at startup (SQL adapters only)."""
        if isinstance(self.adapter, SQLiteAdapter):
            await self.adapter.ensure_indexes()

    async def check_health(self) -> bool:
        """Startup health probe to verify database accessibility."""
        return await self.adapter.check_health()

    async def initialize(self) -> None:
        """Run startup probes: health check + adapter initialization."""
        await self.adapter.initialize()

    async def get_schema(self, table_filter: Optional[List[str]] = None) -> Dict[str, Any]:
        """Discover database schema via the active adapter."""
        return await self.adapter.get_schema(table_filter)

    def get_context_description(self) -> str:
        """Return a human-readable description of the connected engine."""
        return self.adapter.get_context_description()


db_manager = DatabaseManager()
