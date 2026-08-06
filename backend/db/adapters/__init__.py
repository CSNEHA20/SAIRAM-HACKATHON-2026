"""Database adapter abstraction supporting SQLite, PostgreSQL, MySQL, and MongoDB.

Reference: docs/architecture-repository/07_DatabaseDesign.md
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Tuple


class DatabaseAdapter(ABC):
    """Abstract async database adapter."""

    name: str = "abstract"
    dialect: str = "sql"

    def __init__(self, connection_string: Optional[str] = None, **kwargs: Any) -> None:
        self.connection_string = connection_string
        self.options = kwargs

    @abstractmethod
    async def initialize(self) -> None:
        """Run startup probes (create indexes, validate connectivity)."""
        ...

    @abstractmethod
    async def check_health(self) -> bool:
        """Return True if the database is reachable."""
        ...

    @abstractmethod
    async def execute_query(
        self,
        query: str,
        params: Optional[Tuple[Any, ...]] = None
    ) -> Dict[str, Any]:
        """Execute a read query and return {columns, rows, row_count}."""
        ...

    @abstractmethod
    async def execute_script(self, script: str) -> None:
        """Execute a DDL/script that returns no rows."""
        ...

    @abstractmethod
    async def get_schema(
        self,
        table_filter: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Discover schema and return:
        {
            "success": bool,
            "tables": [
                {
                    "name": str,
                    "columns": [{"name": str, "type": str, "pk": bool, "notnull": bool, "nullable": bool}],
                    "foreign_keys": [{"from_column": str, "target_table": str, "target_column": str}],
                    "row_count": int
                }
            ],
            "total_tables": int,
            "error": Optional[str]
        }
        """
        ...

    def get_context_description(self) -> str:
        """Short description of the connected engine for system prompts."""
        return f"a {self.name} database"
