"""MySQL adapter implementation using aiomysql."""

import os
from typing import Any, Dict, List, Optional, Tuple

from db.adapters import DatabaseAdapter


def _default_connection_string() -> str:
    return os.getenv(
        "DATABASE_URL",
        "mysql://root:root@localhost:3306/dataflow"
    )


def _parse_url(url: str) -> Dict[str, Any]:
    """Parse a mysql://user:pass@host:port/dbname URL."""
    from urllib.parse import urlparse
    parsed = urlparse(url)
    return {
        "host": parsed.hostname or "localhost",
        "port": parsed.port or 3306,
        "user": parsed.username or "root",
        "password": parsed.password or "",
        "db": parsed.path.lstrip("/") if parsed.path else "dataflow",
    }


class MySQLAdapter(DatabaseAdapter):
    name = "mysql"
    dialect = "mysql"

    def __init__(self, connection_string: Optional[str] = None, **kwargs: Any) -> None:
        super().__init__(connection_string or _default_connection_string(), **kwargs)
        self._params = _parse_url(self.connection_string)
        self._params.update(kwargs)
        self._pool = None

    async def _get_pool(self):
        if self._pool is None:
            try:
                import aiomysql
            except ImportError as exc:
                raise RuntimeError(
                    "aiomysql is required for MySQL support. "
                    "Install it with: pip install aiomysql"
                ) from exc
            self._pool = await aiomysql.create_pool(
                host=self._params["host"],
                port=self._params["port"],
                user=self._params["user"],
                password=self._params["password"],
                db=self._params["db"],
                minsize=1,
                maxsize=10,
                autocommit=True
            )
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
            async with conn.cursor() as cur:
                await cur.execute(query, params or ())
                if cur.description:
                    columns = [desc[0] for desc in cur.description]
                    rows = [dict(zip(columns, row)) for row in await cur.fetchall()]
                else:
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
            async with conn.cursor() as cur:
                await cur.execute(script)
                await conn.commit()

    async def get_schema(
        self,
        table_filter: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        try:
            pool = await self._get_pool()
            async with pool.acquire() as conn:
                async with conn.cursor() as cur:
                    await cur.execute(
                        "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE';"
                    )
                    all_tables = [r[0] for r in await cur.fetchall()]

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
                        await cur.execute(
                            """
                            SELECT column_name, data_type, is_nullable, column_key
                            FROM information_schema.columns
                            WHERE table_schema = DATABASE() AND table_name = %s
                            ORDER BY ordinal_position;
                            """,
                            (table_name,)
                        )
                        col_rows = await cur.fetchall()
                        columns = []
                        pk_set = set()
                        for col in col_rows:
                            col_name, data_type, is_nullable, column_key = col
                            columns.append({
                                "name": col_name,
                                "type": data_type,
                                "pk": column_key == "PRI",
                                "nullable": is_nullable.upper() == "YES",
                                "notnull": is_nullable.upper() != "YES"
                            })
                            if column_key == "PRI":
                                pk_set.add(col_name)

                        await cur.execute(
                            """
                            SELECT column_name, referenced_table_name, referenced_column_name
                            FROM information_schema.key_column_usage
                            WHERE table_schema = DATABASE()
                              AND table_name = %s
                              AND referenced_table_name IS NOT NULL;
                            """,
                            (table_name,)
                        )
                        fk_rows = await cur.fetchall()
                        foreign_keys = [
                            {
                                "from": r[0],
                                "table": r[1],
                                "to": r[2],
                                "from_column": r[0],
                                "target_table": r[1],
                                "target_column": r[2]
                            }
                            for r in fk_rows
                        ]

                        await cur.execute(
                            f"SELECT COUNT(*) AS cnt FROM `{table_name}`;"
                        )
                        cnt_row = await cur.fetchone()
                        row_count = cnt_row[0] if cnt_row else 0

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
        return "a MySQL database"
