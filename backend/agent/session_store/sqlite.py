"""SQLite-backed persistent session backend."""

import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from agent.session_store import SessionBackend

DEFAULT_DB_PATH = Path(__file__).parent.parent.parent.parent / "database" / "sessions.sqlite"


def _get_db_path() -> str:
    env_path = os.getenv("SESSION_DB_PATH")
    if env_path:
        path = Path(env_path)
        if not path.is_absolute():
            path = (Path(__file__).parent.parent.parent.parent / env_path).resolve()
        return str(path)
    return str(DEFAULT_DB_PATH.resolve())


class SQLiteSessionBackend(SessionBackend):
    """Persistent session manager backed by SQLite with JSON message storage."""

    def __init__(self, db_path: Optional[str] = None, max_turns: int = 10):
        self.db_path = db_path or _get_db_path()
        self.max_turns = max_turns

    async def initialize(self) -> None:
        self._ensure_schema()
        self._prune_old_sessions()

    async def close(self) -> None:
        pass

    def _connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    def _ensure_schema(self) -> None:
        with self._connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    session_id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS session_messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    charts TEXT NOT NULL DEFAULT '[]',
                    sql_used TEXT NOT NULL DEFAULT '[]',
                    diagrams TEXT NOT NULL DEFAULT '[]',
                    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
                );
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS session_schema_cache (
                    session_id TEXT PRIMARY KEY,
                    schema_data TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
                );
                """
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_messages_session ON session_messages(session_id);"
            )
            # Idempotent column migration for databases created before the diagrams field existed.
            try:
                conn.execute("ALTER TABLE session_messages ADD COLUMN diagrams TEXT NOT NULL DEFAULT '[]';")
            except Exception:
                pass
            conn.commit()

    def _prune_old_sessions(self) -> None:
        """Remove sessions older than SESSION_TTL_DAYS (default 30) on startup."""
        ttl_days = int(os.getenv("SESSION_TTL_DAYS", "30"))
        if ttl_days <= 0:
            return
        with self._connection() as conn:
            conn.execute(
                "DELETE FROM sessions WHERE updated_at < datetime('now', ?);",
                (f"-{ttl_days} days",)
            )
            conn.commit()

    def get_messages(self, session_id: str) -> List[Dict[str, Any]]:
        with self._connection() as conn:
            rows = conn.execute(
                "SELECT role, content, timestamp, charts, sql_used, diagrams FROM session_messages "
                "WHERE session_id = ? ORDER BY id ASC;",
                (session_id,)
            ).fetchall()
            messages = [
                {
                    "role": row["role"],
                    "content": row["content"],
                    "timestamp": row["timestamp"],
                    "charts": json.loads(row["charts"]),
                    "sql_used": json.loads(row["sql_used"]),
                    "diagrams": json.loads(row["diagrams"]) if row["diagrams"] else []
                }
                for row in rows
            ]
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
        record = {
            "role": role,
            "content": content,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "charts": charts or [],
            "sql_used": sql_used or [],
            "diagrams": diagrams or []
        }
        with self._connection() as conn:
            now = record["timestamp"]
            conn.execute(
                """
                INSERT INTO sessions (session_id, created_at, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(session_id) DO UPDATE SET updated_at = excluded.updated_at;
                """,
                (session_id, now, now)
            )
            conn.execute(
                """
                INSERT INTO session_messages (session_id, role, content, timestamp, charts, sql_used, diagrams)
                VALUES (?, ?, ?, ?, ?, ?, ?);
                """,
                (
                    session_id,
                    record["role"],
                    record["content"],
                    record["timestamp"],
                    json.dumps(record["charts"]),
                    json.dumps(record["sql_used"]),
                    json.dumps(record["diagrams"])
                )
            )
            conn.commit()
        return record

    def clear_session(self, session_id: str) -> bool:
        with self._connection() as conn:
            conn.execute(
                "DELETE FROM session_messages WHERE session_id = ?;",
                (session_id,)
            )
            conn.execute(
                "DELETE FROM session_schema_cache WHERE session_id = ?;",
                (session_id,)
            )
            cursor = conn.execute(
                "DELETE FROM sessions WHERE session_id = ?;",
                (session_id,)
            )
            conn.commit()
            return cursor.rowcount > 0

    def get_schema_cache(self, session_id: str) -> Optional[Dict[str, Any]]:
        with self._connection() as conn:
            row = conn.execute(
                "SELECT schema_data FROM session_schema_cache WHERE session_id = ?;",
                (session_id,)
            ).fetchone()
            if row:
                return json.loads(row["schema_data"])
            return None

    def set_schema_cache(self, session_id: str, schema_data: Dict[str, Any]) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with self._connection() as conn:
            conn.execute(
                """
                INSERT INTO session_schema_cache (session_id, schema_data, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(session_id) DO UPDATE SET
                    schema_data = excluded.schema_data,
                    updated_at = excluded.updated_at;
                """,
                (session_id, json.dumps(schema_data), now)
            )
            conn.execute(
                """
                INSERT INTO sessions (session_id, created_at, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(session_id) DO UPDATE SET updated_at = excluded.updated_at;
                """,
                (session_id, now, now)
            )
            conn.commit()

    def clear_schema_cache(self, session_id: str) -> None:
        with self._connection() as conn:
            conn.execute(
                "DELETE FROM session_schema_cache WHERE session_id = ?;",
                (session_id,)
            )
            conn.commit()
