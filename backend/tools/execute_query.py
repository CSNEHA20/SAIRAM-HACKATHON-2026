from typing import Any, Dict, Optional
from db.connection import db_manager
from db.validator import sql_validator, DEFAULT_LIMIT


async def execute_query(sql: str, limit: Optional[int] = DEFAULT_LIMIT) -> Dict[str, Any]:
    """
    Validates and executes a query against the active database adapter.
    For SQL adapters this is a SELECT statement; for MongoDB it is collection|pipeline JSON.
    Applies safety rules and row limits where applicable.
    """
    effective_limit = limit if limit and limit > 0 else DEFAULT_LIMIT

    # MongoDB uses a custom "collection|[pipeline]" syntax; skip SQL validation.
    if db_manager.db_type == "mongodb":
        try:
            res = await db_manager.execute_query_async(sql)
            if "error" in res:
                return {
                    "success": False,
                    "error": res["error"],
                    "sql": sql,
                    "sql_attempted": sql
                }
            return {
                "success": True,
                "sql": sql,
                "sql_executed": sql,
                "columns": res["columns"],
                "rows": res["rows"],
                "row_count": res["row_count"],
                "truncated": False
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Query execution error: {str(e)}",
                "sql": sql,
                "sql_attempted": sql
            }

    is_valid, validated_sql_or_error = sql_validator.validate_and_format(
        sql,
        limit=effective_limit,
        dialect=db_manager.adapter.dialect
    )
    if not is_valid:
        return {
            "success": False,
            "error": validated_sql_or_error,
            "sql": sql,
            "sql_attempted": sql
        }

    try:
        res = await db_manager.execute_query_async(validated_sql_or_error)
        rows = res["rows"]
        row_count = res["row_count"]
        return {
            "success": True,
            "sql": validated_sql_or_error,
            "sql_executed": validated_sql_or_error,
            "columns": res["columns"],
            "rows": rows,
            "row_count": row_count,
            "truncated": row_count >= effective_limit
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"SQL execution error: {str(e)}",
            "sql": validated_sql_or_error,
            "sql_attempted": validated_sql_or_error
        }

