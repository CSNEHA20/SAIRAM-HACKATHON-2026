"""PostgreSQL adapter implementation using asyncpg."""

import os
from typing import Any, Dict, List, Optional, Tuple

from db.adapters import DatabaseAdapter


def _default_connection_string() -> str:
    return os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/dataflow"
    )


class PostgreSQLAdapter(DatabaseAdapter):
    name = "postgresql"
    dialect = "postgresql"

    def __init__(self, connection_string: Optional[str] = None, **kwargs: Any) -> None:
        super().__init__(connection_string or _default_connection_string(), **kwargs)
        self._pool = None

    async def _get_pool(self):
        if self._pool is None:
            try:
                import asyncpg
            except ImportError as exc:
                raise RuntimeError(
                    "asyncpg is required for PostgreSQL support. "
                    "Install it with: pip install asyncpg"
                ) from exc
            self._pool = await asyncpg.create_pool(self.connection_string, min_size=1, max_size=10)
        return self._pool

    async def initialize(self) -> None:
        await self._get_pool()

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
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            rows_data = await conn.fetch(query, *(params or ()))
            if rows_data:
                columns = [str(k) for k in rows_data[0].keys()]
                rows = [dict(r) for r in rows_data]
            else:
                # Try to infer columns from the query; if not possible, return empty list.
                columns = []
                rows = []
            return {
                "columns": columns,
                "rows": rows,
                "row_count": len(rows)
            }

    async def execute_script(self, script: str) -> None:
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            await conn.execute(script)

    async def get_schema(
        self,
        table_filter: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        try:
            pool = await self._get_pool()
            async with pool.acquire() as conn:
                schema = conn.fetchval("SELECT current_schema();") or "public"

                table_sql = """
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = $1
                    AND table_type = 'BASE TABLE'
                    ORDER BY table_name;
                """
                table_rows = await conn.fetch(table_sql, schema)
                all_tables = [r["table_name"] for r in table_rows]

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
                    col_rows = await conn.fetch(
                        """
                        SELECT column_name, data_type, is_nullable
                        FROM information_schema.columns
                        WHERE table_schema = $1 AND table_name = $2
                        ORDER BY ordinal_position;
                        """,
                        schema, table_name
                    )
                    columns = [
                        {
                            "name": col["column_name"],
                            "type": col["data_type"],
                            "pk": False,
                            "nullable": col["is_nullable"].upper() == "YES",
                            "notnull": col["is_nullable"].upper() != "YES"
                        }
                        for col in col_rows
                    ]

                    pk_rows = await conn.fetch(
                        """
                        SELECT kcu.column_name
                        FROM information_schema.table_constraints tc
                        JOIN information_schema.key_column_usage kcu
                            ON tc.constraint_name = kcu.constraint_name
                            AND tc.table_schema = kcu.table_schema
                        WHERE tc.constraint_type = 'PRIMARY KEY'
                            AND tc.table_schema = $1
                            AND tc.table_name = $2;
                        """,
                        schema, table_name
                    )
                    pk_set = {r["column_name"] for r in pk_rows}
                    for col in columns:
                        if col["name"] in pk_set:
                            col["pk"] = True

                    fk_rows = await conn.fetch(
                        """
                        SELECT
                            kcu.column_name AS from_column,
                            ccu.table_name AS target_table,
                            ccu.column_name AS target_column
                        FROM information_schema.table_constraints tc
                        JOIN information_schema.key_column_usage kcu
                            ON tc.constraint_name = kcu.constraint_name
                            AND tc.table_schema = kcu.table_schema
                        JOIN information_schema.constraint_column_usage ccu
                            ON tc.constraint_name = ccu.constraint_name
                            AND tc.table_schema = ccu.table_schema
                        WHERE tc.constraint_type = 'FOREIGN KEY'
                            AND tc.table_schema = $1
                            AND tc.table_name = $2;
                        """,
                        schema, table_name
                    )
                    foreign_keys = [
                        {
                            "from": r["from_column"],
                            "table": r["target_table"],
                            "to": r["target_column"],
                            "from_column": r["from_column"],
                            "target_table": r["target_table"],
                            "target_column": r["target_column"]
                        }
                        for r in fk_rows
                    ]

                    cnt_row = await conn.fetchrow(
                        f'SELECT COUNT(*) AS cnt FROM "{table_name}";'
                    )
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
        return "a PostgreSQL database"
