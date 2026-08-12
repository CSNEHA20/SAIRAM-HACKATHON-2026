from typing import Any, Dict, List, Optional
from db.connection import db_manager


def _normalize_table_filter(table_filter: Optional[Any]) -> Optional[List[str]]:
    """Normalize table_filter to a list of strings per the tool contract."""
    if not table_filter:
        return None
    if isinstance(table_filter, str):
        normalized = [t.strip() for t in table_filter.split(",") if t.strip()]
    elif isinstance(table_filter, list):
        normalized = [str(t).strip() for t in table_filter if str(t).strip()]
    else:
        normalized = [str(table_filter).strip()]
    return normalized if normalized else None


async def get_schema(table_filter: Optional[Any] = None) -> Dict[str, Any]:
    """
    Discovers database schema dynamically via the active DatabaseAdapter.
    Returns structured table metadata including columns, types, primary keys, foreign keys, and row counts.
    """
    normalized_filter = _normalize_table_filter(table_filter)
    return await db_manager.get_schema(normalized_filter)

