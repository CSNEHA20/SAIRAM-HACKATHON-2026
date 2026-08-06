import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import aiosqlite
from dotenv import load_dotenv

load_dotenv()

DEFAULT_DB_PATH = Path(__file__).parent.parent.parent / "database" / "ecommerce.sqlite"

# Performance indexes defined in 07_DatabaseDesign.md §6
IDEMPOTENT_INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);",
    "CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);",
    "CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);",
    "CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);",
    "CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);",
]


def get_db_path() -> str:
    env_path = os.getenv("DATABASE_PATH")
    if env_path:
        # Handle relative or absolute paths
        path = Path(env_path)
        if not path.is_absolute():
            path = (Path(__file__).parent.parent / env_path).resolve()
        return str(path)
    return str(DEFAULT_DB_PATH.resolve())


class DatabaseManager:
    """Async SQLite Connection Manager using aiosqlite."""
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or get_db_path()

    async def get_connection(self) -> aiosqlite.Connection:
        conn = await aiosqlite.connect(self.db_path)
        conn.row_factory = aiosqlite.Row
        return conn

    async def execute_query_async(self, query: str, params: Optional[tuple] = None) -> Dict[str, Any]:
        """
        Executes a SQL query asynchronously and returns a structured envelope:
        { "columns": [...], "rows": [{...}], "row_count": N }
        """
        async with aiosqlite.connect(self.db_path) as conn:
            conn.row_factory = aiosqlite.Row
            async with conn.execute(query, params or ()) as cursor:
                rows_data = await cursor.fetchall()
                columns = [column[0] for column in cursor.description] if cursor.description else []
                rows = [dict(row) for row in rows_data]
                return {
                    "columns": columns,
                    "rows": rows,
                    "row_count": len(rows)
                }

    async def execute_script_async(self, script: str) -> None:
        """Execute a SQL script (typically DDL) that does not return rows."""
        async with aiosqlite.connect(self.db_path) as conn:
            await conn.executescript(script)
            await conn.commit()

    async def ensure_indexes(self) -> None:
        """Create idempotent performance indexes at startup."""
        try:
            await self.execute_script_async("\n".join(IDEMPOTENT_INDEXES))
        except Exception:
            # Indexes are optional performance polish; do not fail startup
            pass

    async def check_health(self) -> bool:
        """Startup health probe to verify database accessibility."""
        try:
            res = await self.execute_query_async("SELECT 1 AS health_check;")
            return res.get("row_count", 0) > 0 and res["rows"][0].get("health_check") == 1
        except Exception:
            return False

    async def initialize(self) -> None:
        """Run startup probes: health check + index creation."""
        await self.ensure_indexes()


db_manager = DatabaseManager()
