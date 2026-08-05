from typing import Any, Dict, Optional
from db.connection import db_manager
from db.validator import sql_validator, DEFAULT_LIMIT

async def execute_query(sql: str, limit: Optional[int] = DEFAULT_LIMIT) -> Dict[str, Any]:
    """
    Validates and executes a SELECT SQL query against the database.
    Applies safety rules and row limits.
    """
    is_valid, validated_sql_or_error = sql_validator.validate_and_format(sql, limit=limit or DEFAULT_LIMIT)
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
            "truncated": row_count >= (limit or DEFAULT_LIMIT)
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"SQL execution error: {str(e)}",
            "sql": validated_sql_or_error,
            "sql_attempted": validated_sql_or_error
        }

