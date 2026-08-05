from typing import Any, Dict
from db.connection import db_manager
from db.validator import sql_validator

async def execute_query(sql: str) -> Dict[str, Any]:
    """
    Validates and executes a SELECT SQL query against the database.
    Applies safety rules and row limits.
    """
    is_valid, validated_sql_or_error = sql_validator.validate_and_format(sql)
    if not is_valid:
        return {
            "success": False,
            "error": validated_sql_or_error,
            "sql": sql
        }

    try:
        res = await db_manager.execute_query_async(validated_sql_or_error)
        return {
            "success": True,
            "sql": validated_sql_or_error,
            "columns": res["columns"],
            "rows": res["rows"],
            "row_count": res["row_count"]
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"SQL execution error: {str(e)}",
            "sql": validated_sql_or_error
        }
