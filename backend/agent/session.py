from datetime import datetime
from typing import Any, Dict, List, Optional

MAX_WINDOW_TURNS = 10

class SessionStore:
    """In-memory session manager with a sliding window of recent conversation turns."""
    
    def __init__(self):
        # Map session_id -> list of message dicts
        self._sessions: Dict[str, List[Dict[str, Any]]] = {}
        # Cache for database schema
        self._schema_cache: Optional[Dict[str, Any]] = None

    def get_messages(self, session_id: str) -> List[Dict[str, Any]]:
        """Returns session messages limited to the sliding window limit (10 turns = 20 messages)."""
        messages = self._sessions.get(session_id, [])
        max_messages = MAX_WINDOW_TURNS * 2
        if len(messages) > max_messages:
            return messages[-max_messages:]
        return messages

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        charts: Optional[List[Dict[str, Any]]] = None,
        sql_used: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Appends a message to the specified session."""
        if session_id not in self._sessions:
            self._sessions[session_id] = []

        record = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "charts": charts or [],
            "sql_used": sql_used or []
        }
        self._sessions[session_id].append(record)
        return record

    def clear_session(self, session_id: str) -> bool:
        """Clears messages for a session."""
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False

    def get_schema_cache(self) -> Optional[Dict[str, Any]]:
        return self._schema_cache

    def set_schema_cache(self, schema_data: Dict[str, Any]) -> None:
        self._schema_cache = schema_data

session_store = SessionStore()
