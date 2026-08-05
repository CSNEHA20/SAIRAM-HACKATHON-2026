import aiosqlite
from typing import Any, Dict, List, Optional
from db.connection import db_manager

async def get_schema(table_filter: Optional[Any] = None) -> Dict[str, Any]:
    """
    Discovers database schema dynamically using SQLite PRAGMA commands.
    Returns structured table metadata including columns, types, primary keys, foreign keys, and row counts.
    """
    try:
        if isinstance(table_filter, str):
            table_filter = [table_filter] if table_filter.strip() else None

        async with aiosqlite.connect(db_manager.db_path) as conn:
            conn.row_factory = aiosqlite.Row
            # 1. Fetch table names from sqlite_master
            async with conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
            ) as cursor:
                table_rows = await cursor.fetchall()
                all_tables = [row["name"] for row in table_rows]

            if not all_tables:
                return {
                    "success": False,
                    "error": "No tables found in database.",
                    "available_tables": []
                }

            # Normalize filter if provided
            target_tables = all_tables
            if table_filter:
                filter_set = set(t.lower() for t in table_filter)
                target_tables = [t for t in all_tables if t.lower() in filter_set]
                
                # Check for invalid requested tables
                missing = [t for t in table_filter if t.lower() not in set(t.lower() for t in all_tables)]
                if missing:
                    return {
                        "success": False,
                        "error": f"Table(s) not found: {', '.join(missing)}.",
                        "available_tables": all_tables
                    }

            schema_tables = []
            for table_name in target_tables:
                # Columns via PRAGMA table_info
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

                # Foreign keys via PRAGMA foreign_key_list
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

                # Row count
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
            "error": f"Failed to retrieve schema: {str(e)}"
        }

