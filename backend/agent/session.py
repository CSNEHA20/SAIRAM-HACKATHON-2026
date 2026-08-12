import os
from typing import Any, Dict, List, Optional

from agent.session_store import SessionBackend
from agent.session_store.memory import MemorySessionBackend
from agent.session_store.sqlite import SQLiteSessionBackend
from agent.session_store.redis import RedisSessionBackend

MAX_WINDOW_TURNS = 10


def create_session_backend(
    backend: Optional[str] = None,
    **kwargs: Any
) -> SessionBackend:
    """Factory for session backends: memory (default) or sqlite (persistent)."""
    backend = (backend or os.getenv("SESSION_BACKEND", "memory")).lower().strip()
    if backend in ("sqlite", "sql", "persistent"):
        return SQLiteSessionBackend(**kwargs)
    if backend in ("redis",):
        return RedisSessionBackend(**kwargs)
    if backend in ("memory", "mem", "inmemory"):
        return MemorySessionBackend(max_turns=kwargs.get("max_turns", MAX_WINDOW_TURNS))
    raise ValueError(
        f"Unsupported SESSION_BACKEND: {backend}. Choose one of: memory, sqlite, redis."
    )


class SessionStore:
    """
    Session manager with a pluggable backend.
    Supports in-memory (default) and SQLite persistent storage.
    Reference: docs/architecture-repository/32_ConversationFlow.md
    """

    def __init__(self, backend: Optional[SessionBackend] = None):
        self.backend = backend or create_session_backend()

    async def initialize(self) -> None:
        await self.backend.initialize()

    async def close(self) -> None:
        await self.backend.close()

    def get_messages(self, session_id: str) -> List[Dict[str, Any]]:
        """Returns session messages limited to the sliding window limit (10 turns = 20 messages)."""
        return self.backend.get_messages(session_id)

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        charts: Optional[List[Dict[str, Any]]] = None,
        sql_used: Optional[List[str]] = None,
        diagrams: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Appends a message to the specified session."""
        return self.backend.add_message(session_id, role, content, charts, sql_used, diagrams)

    def clear_session(self, session_id: str) -> bool:
        """Clears messages and schema cache for a session."""
        return self.backend.clear_session(session_id)

    def get_schema_cache(self, session_id: str) -> Optional[Dict[str, Any]]:
        return self.backend.get_schema_cache(session_id)

    def set_schema_cache(self, session_id: str, schema_data: Dict[str, Any]) -> None:
        self.backend.set_schema_cache(session_id, schema_data)

    def clear_schema_cache(self, session_id: str) -> None:
        self.backend.clear_schema_cache(session_id)


session_store = SessionStore()
