import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import aiosqlite
from dotenv import load_dotenv

load_dotenv()

DEFAULT_DB_PATH = Path(__file__).parent.parent.parent / "database" / "ecommerce.sqlite"

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

    async def check_health(self) -> bool:
        """Startup health probe to verify database accessibility."""
        try:
            res = await self.execute_query_async("SELECT 1 AS health_check;")
            return res.get("row_count", 0) > 0 and res["rows"][0].get("health_check") == 1
        except Exception:
            return False

db_manager = DatabaseManager()
