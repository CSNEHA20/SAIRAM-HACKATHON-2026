"""Session store backends for agent conversation memory.

Reference: docs/architecture-repository/02_SystemArchitecture.md
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class SessionBackend(ABC):
    """Abstract backend for persisting session messages and schema cache."""

    @abstractmethod
    def get_messages(self, session_id: str) -> List[Dict[str, Any]]:
        ...

    @abstractmethod
    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        charts: Optional[List[Dict[str, Any]]] = None,
        sql_used: Optional[List[str]] = None,
        diagrams: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        ...

    @abstractmethod
    def clear_session(self, session_id: str) -> bool:
        ...

    @abstractmethod
    def get_schema_cache(self, session_id: str) -> Optional[Dict[str, Any]]:
        ...

    @abstractmethod
    def set_schema_cache(self, session_id: str, schema_data: Dict[str, Any]) -> None:
        ...

    @abstractmethod
    def clear_schema_cache(self, session_id: str) -> None:
        ...

    @abstractmethod
    async def initialize(self) -> None:
        """Optional async initialization (e.g. create tables)."""
        ...

    @abstractmethod
    async def close(self) -> None:
        ...
