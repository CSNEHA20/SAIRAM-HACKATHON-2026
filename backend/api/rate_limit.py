"""Lightweight per-session rate limiter.

Reference: docs/architecture-repository/23_SecurityDesign.md
"""

import os
import time
from collections import deque
from typing import Dict

from fastapi import HTTPException, Request, status


class RateLimiter:
    """Simple in-memory sliding-window rate limiter keyed by session/client."""

    def __init__(self, max_requests: int = 60, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._windows: Dict[str, deque] = {}

    def is_allowed(self, key: str) -> bool:
        if self.max_requests <= 0:
            return True
        now = time.time()
        window = self._windows.get(key)
        if window is None:
            window = deque()
            self._windows[key] = window
        # Drop entries outside the window
        while window and window[0] < now - self.window_seconds:
            window.popleft()
        if len(window) >= self.max_requests:
            return False
        window.append(now)
        return True


def _load_rate_limit_config():
    rpm = int(os.getenv("RATE_LIMIT_RPM", "0"))  # 0 means disabled
    return {
        "enabled": rpm > 0,
        "max_requests": rpm,
        "window_seconds": 60,
    }


_rate_limiter = RateLimiter()


def check_rate_limit(request: Request):
    """Dependency that enforces per-session rate limiting when RATE_LIMIT_RPM > 0."""
    config = _load_rate_limit_config()
    if not config["enabled"]:
        return

    # Key by authenticated user if available, otherwise by session id or client IP
    key = "anonymous"
    user = getattr(request.state, "user", None)
    if user:
        key = f"user:{user.get('sub', 'anonymous')}"
    else:
        session_id = getattr(request, "path_params", {}).get("session_id")
        if session_id:
            key = f"session:{session_id}"
        else:
            key = f"ip:{request.client.host if request.client else 'unknown'}"

    _rate_limiter.max_requests = config["max_requests"]
    _rate_limiter.window_seconds = config["window_seconds"]
    if not _rate_limiter.is_allowed(key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "RATE_LIMIT_EXCEEDED",
                "message": f"Rate limit exceeded: {config['max_requests']} requests per minute allowed."
            }
        )
