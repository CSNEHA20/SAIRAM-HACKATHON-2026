"""Redis-backed persistent session backend."""

import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from agent.session_store import SessionBackend


def _default_url() -> str:
    return os.getenv("REDIS_URL", "redis://localhost:6379/0")


class RedisSessionBackend(SessionBackend):
    """Persistent session manager backed by Redis with JSON message storage."""

    def __init__(self, url: Optional[str] = None, max_turns: int = 10, ttl_seconds: int = 2592000):
        self.url = url or _default_url()
        self.max_turns = max_turns
        self.ttl_seconds = ttl_seconds
        self._redis = None

    def _get_redis(self):
        if self._redis is None:
            try:
                import redis.asyncio as aioredis
            except ImportError as exc:
                raise RuntimeError(
                    "redis is required for Redis session support. "
                    "Install it with: pip install redis"
                ) from exc
            self._redis = aioredis.from_url(self.url, decode_responses=True)
        return self._redis

    async def initialize(self) -> None:
        r = self._get_redis()
        await r.ping()

    async def close(self) -> None:
        if self._redis is not None:
            await self._redis.close()
            self._redis = None

    def _messages_key(self, session_id: str) -> str:
        return f"dataflow:session:{session_id}:messages"

    def _schema_key(self, session_id: str) -> str:
        return f"dataflow:session:{session_id}:schema"

    def get_messages(self, session_id: str) -> List[Dict[str, Any]]:
        # Synchronous wrapper: Redis operations are async, so this backend requires
        # an event loop. We run the coroutine synchronously for interface compatibility.
        import asyncio
        try:
            return asyncio.get_event_loop().run_until_complete(self._aget_messages(session_id))
        except RuntimeError:
            return asyncio.run(self._aget_messages(session_id))

    async def _aget_messages(self, session_id: str) -> List[Dict[str, Any]]:
        r = self._get_redis()
        raw = await r.lrange(self._messages_key(session_id), 0, -1)
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
        sql_used: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        import asyncio
        record = {
            "role": role,
            "content": content,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "charts": charts or [],
            "sql_used": sql_used or []
        }
        try:
            asyncio.get_event_loop().run_until_complete(self._aadd_message(session_id, record))
        except RuntimeError:
            asyncio.run(self._aadd_message(session_id, record))
        return record

    async def _aadd_message(self, session_id: str, record: Dict[str, Any]) -> None:
        r = self._get_redis()
        key = self._messages_key(session_id)
        await r.rpush(key, json.dumps(record))
        await r.expire(key, self.ttl_seconds)

    def clear_session(self, session_id: str) -> bool:
        import asyncio
        try:
            return asyncio.get_event_loop().run_until_complete(self._aclear_session(session_id))
        except RuntimeError:
            return asyncio.run(self._aclear_session(session_id))

    async def _aclear_session(self, session_id: str) -> bool:
        r = self._get_redis()
        deleted = await r.delete(self._messages_key(session_id), self._schema_key(session_id))
        return deleted > 0

    def get_schema_cache(self, session_id: str) -> Optional[Dict[str, Any]]:
        import asyncio
        try:
            return asyncio.get_event_loop().run_until_complete(self._aget_schema_cache(session_id))
        except RuntimeError:
            return asyncio.run(self._aget_schema_cache(session_id))

    async def _aget_schema_cache(self, session_id: str) -> Optional[Dict[str, Any]]:
        r = self._get_redis()
        raw = await r.get(self._schema_key(session_id))
        if raw:
            return json.loads(raw)
        return None

    def set_schema_cache(self, session_id: str, schema_data: Dict[str, Any]) -> None:
        import asyncio
        try:
            asyncio.get_event_loop().run_until_complete(self._aset_schema_cache(session_id, schema_data))
        except RuntimeError:
            asyncio.run(self._aset_schema_cache(session_id, schema_data))

    async def _aset_schema_cache(self, session_id: str, schema_data: Dict[str, Any]) -> None:
        r = self._get_redis()
        key = self._schema_key(session_id)
        await r.set(key, json.dumps(schema_data), ex=self.ttl_seconds)

    def clear_schema_cache(self, session_id: str) -> None:
        import asyncio
        try:
            asyncio.get_event_loop().run_until_complete(self._aclear_schema_cache(session_id))
        except RuntimeError:
            asyncio.run(self._aclear_schema_cache(session_id))

    async def _aclear_schema_cache(self, session_id: str) -> None:
        r = self._get_redis()
        await r.delete(self._schema_key(session_id))
