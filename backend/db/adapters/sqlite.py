"""SQLite adapter implementation using aiosqlite."""

import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import aiosqlite

from db.adapters import DatabaseAdapter

DEFAULT_DB_PATH = Path(__file__).parent.parent.parent.parent / "database" / "ecommerce.sqlite"

# Performance indexes defined in 07_DatabaseDesign.md §6
IDEMPOTENT_INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);",
    "CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);",
    "CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);",
    "CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);",
    "CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);",
]


def _resolve_db_path(connection_string: Optional[str]) -> str:
    if connection_string:
        conn_path = Path(connection_string).expanduser().resolve()
        if conn_path.exists():
            return str(conn_path)

    env_path = os.getenv("DATABASE_PATH")
    if env_path:
        candidates = [
            Path(env_path),
            (Path.cwd() / env_path).resolve(),
            (Path(__file__).parent.parent.parent.parent / env_path).resolve(),
            (Path(__file__).parent.parent.parent / env_path).resolve(),
        ]
        for c in candidates:
            if c.exists():
                return str(c)

    default_candidates = [
        DEFAULT_DB_PATH.resolve(),
        (Path.cwd() / "database" / "ecommerce.sqlite").resolve(),
        (Path.cwd() / "backend" / "database" / "ecommerce.sqlite").resolve(),
        (Path.cwd() / ".." / "database" / "ecommerce.sqlite").resolve(),
        (Path(__file__).parent.parent.parent / "database" / "ecommerce.sqlite").resolve(),
        (Path(__file__).parent.parent.parent.parent / "database" / "ecommerce.sqlite").resolve(),
    ]
    for c in default_candidates:
        if c.exists():
            return str(c)

    return str(DEFAULT_DB_PATH.resolve())



class SQLiteAdapter(DatabaseAdapter):
    name = "sqlite"
    dialect = "sqlite"

    def __init__(self, connection_string: Optional[str] = None, **kwargs: Any) -> None:
        super().__init__(connection_string, **kwargs)
        self.db_path = _resolve_db_path(self.connection_string)

    async def initialize(self) -> None:
        await self.ensure_indexes()

    async def check_health(self) -> bool:
        try:
            res = await self.execute_query("SELECT 1 AS health_check;")
            return res.get("row_count", 0) > 0 and res["rows"][0].get("health_check") == 1
        except Exception:
            return False

    async def execute_query(
        self,
        query: str,
        params: Optional[Tuple[Any, ...]] = None
    ) -> Dict[str, Any]:
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

    async def execute_script(self, script: str) -> None:
        async with aiosqlite.connect(self.db_path) as conn:
            await conn.executescript(script)
            await conn.commit()

    async def ensure_indexes(self) -> None:
        try:
            await self.execute_script("\n".join(IDEMPOTENT_INDEXES))
        except Exception:
            pass

    async def get_schema(
        self,
        table_filter: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        try:
            async with aiosqlite.connect(self.db_path) as conn:
                conn.row_factory = aiosqlite.Row

                async with conn.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
                ) as cursor:
                    table_rows = await cursor.fetchall()
                    all_tables = [row["name"] for row in table_rows]

                if not all_tables:
                    return {
                        "success": False,
                        "error": "No tables found in database.",
                        "available_tables": [],
                        "tables": [],
                        "total_tables": 0
                    }

                target_tables = all_tables
                if table_filter:
                    filter_set = {t.lower() for t in table_filter}
                    target_tables = [t for t in all_tables if t.lower() in filter_set]
                    missing = [t for t in table_filter if t.lower() not in {t.lower() for t in all_tables}]
                    if missing:
                        return {
                            "success": False,
                            "error": f"Table(s) not found: {', '.join(missing)}.",
                            "available_tables": all_tables,
                            "tables": [],
                            "total_tables": 0
                        }

                schema_tables = []
                for table_name in target_tables:
                    async with conn.execute(f"PRAGMA table_info('{table_name}');") as cursor:
                        col_rows = await cursor.fetchall()
                        columns = [
                            {
                                "name": col["name"],
                                "type": col["type"],
                                "pk": bool(col["pk"]),
                                "nullable": not bool(col["notnull"]),
                                "notnull": bool(col["notnull"])
                            }
                            for col in col_rows
                        ]

                    async with conn.execute(f"PRAGMA foreign_key_list('{table_name}');") as cursor:
                        fk_rows = await cursor.fetchall()
                        foreign_keys = [
                            {
                                "from": fk["from"],
                                "table": fk["table"],
                                "to": fk["to"],
                                "from_column": fk["from"],
                                "target_table": fk["table"],
                                "target_column": fk["to"]
                            }
                            for fk in fk_rows
                        ]

                    async with conn.execute(f"SELECT COUNT(*) AS cnt FROM '{table_name}';") as cursor:
                        cnt_row = await cursor.fetchone()
                        row_count = cnt_row["cnt"] if cnt_row else 0

                    schema_tables.append({
                        "name": table_name,
                        "columns": columns,
                        "foreign_keys": foreign_keys,
                        "row_count": row_count
                    })

                return {
                    "success": True,
                    "tables": schema_tables,
                    "total_tables": len(schema_tables)
                }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to retrieve schema: {str(e)}",
                "tables": [],
                "total_tables": 0
            }

    def get_context_description(self) -> str:
        return "a SQLite database"
