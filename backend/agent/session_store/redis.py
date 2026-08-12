"""Redis-backed persistent session backend."""

import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from agent.session_store import SessionBackend


def _default_url() -> str:
    return os.getenv("REDIS_URL", "redis://localhost:6379/0")


class RedisSessionBackend(SessionBackend):
    """Persistent session manager backed by Redis with JSON message storage.

    Uses the synchronous redis client so the data-access methods stay
    synchronous (matching the SessionBackend interface used by callers
    in the orchestrator and router). Only initialize()/close() are async
    per the interface contract.
    """

    def __init__(self, url: Optional[str] = None, max_turns: int = 10, ttl_seconds: int = 2592000):
        self.url = url or _default_url()
        self.max_turns = max_turns
        self.ttl_seconds = ttl_seconds
        self._client = None

    def _get_client(self):
        if self._client is None:
            try:
                import redis
            except ImportError as exc:
                raise RuntimeError(
                    "redis is required for Redis session support. "
                    "Install it with: pip install redis"
                ) from exc
            self._client = redis.Redis.from_url(self.url, decode_responses=True)
        return self._client

    async def initialize(self) -> None:
        client = self._get_client()
        client.ping()

    async def close(self) -> None:
        if self._client is not None:
            try:
                self._client.close()
            except Exception:
                pass
            self._client = None

    def _messages_key(self, session_id: str) -> str:
        return f"dataflow:session:{session_id}:messages"

    def _schema_key(self, session_id: str) -> str:
        return f"dataflow:session:{session_id}:schema"

    def get_messages(self, session_id: str) -> List[Dict[str, Any]]:
        client = self._get_client()
        raw = client.lrange(self._messages_key(session_id), 0, -1)
        messages = [json.loads(m) for m in raw]
        max_messages = self.max_turns * 2
        if len(messages) > max_messages:
            return messages[-max_messages:]
        return messages

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        charts: Optional[List[Dict[str, Any]]] = None,
        sql_used: Optional[List[str]] = None,
        diagrams: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        client = self._get_client()
        record = {
            "role": role,
            "content": content,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "charts": charts or [],
            "sql_used": sql_used or [],
            "diagrams": diagrams or []
        }
        key = self._messages_key(session_id)
        client.rpush(key, json.dumps(record))
        client.expire(key, self.ttl_seconds)
        return record

    def clear_session(self, session_id: str) -> bool:
        client = self._get_client()
        deleted = client.delete(
            self._messages_key(session_id),
            self._schema_key(session_id)
        )
        return deleted > 0

    def get_schema_cache(self, session_id: str) -> Optional[Dict[str, Any]]:
        client = self._get_client()
        raw = client.get(self._schema_key(session_id))
        if raw:
            return json.loads(raw)
        return None

    def set_schema_cache(self, session_id: str, schema_data: Dict[str, Any]) -> None:
        client = self._get_client()
        key = self._schema_key(session_id)
        client.set(key, json.dumps(schema_data), ex=self.ttl_seconds)

    def clear_schema_cache(self, session_id: str) -> None:
        client = self._get_client()
        client.delete(self._schema_key(session_id))
