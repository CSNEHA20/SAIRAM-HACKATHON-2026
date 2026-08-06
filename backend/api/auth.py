"""Authentication layer for DataFlow AI.

Supports API-key Bearer tokens and optional HTTP Basic auth.
Auth can be enabled via the AUTH_ENABLED environment variable.
Reference: docs/architecture-repository/23_SecurityDesign.md
"""

import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials, HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext

# Security schemes
bearer_scheme = HTTPBearer(auto_error=False)
basic_scheme = HTTPBasic(auto_error=False)

# Password hashing (used for basic auth demo user)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Cache auto-generated token secret so token creation and validation use the same key.
_generated_token_secret: Optional[str] = None


def _load_auth_config():
    """Load auth configuration from environment."""
    global _generated_token_secret
    enabled = os.getenv("AUTH_ENABLED", "false").lower() in ("true", "1", "yes")
    api_key = os.getenv("API_KEY", "")
    demo_username = os.getenv("AUTH_DEMO_USERNAME", "dataflow")
    demo_password_hash = os.getenv("AUTH_DEMO_PASSWORD_HASH", "")
    demo_password_plain = os.getenv("AUTH_DEMO_PASSWORD", "dataflow")

    token_secret = os.getenv("AUTH_TOKEN_SECRET", "")
    if not token_secret:
        if api_key:
            token_secret = api_key
        else:
            if _generated_token_secret is None:
                _generated_token_secret = secrets.token_urlsafe(32)
            token_secret = _generated_token_secret

    token_expire_hours = int(os.getenv("AUTH_TOKEN_EXPIRE_HOURS", "24"))
    return {
        "enabled": enabled,
        "api_key": api_key,
        "demo_username": demo_username,
        "demo_password_hash": demo_password_hash,
        "demo_password_plain": demo_password_plain,
        "token_secret": token_secret,
        "token_expire_hours": token_expire_hours,
    }


def _is_bearer_api_key(credentials: HTTPAuthorizationCredentials, config: dict) -> bool:
    """Check if the Bearer token matches the configured API key."""
    if not config["api_key"]:
        return False
    return secrets.compare_digest(credentials.credentials, config["api_key"])


def _verify_basic_auth(credentials: HTTPBasicCredentials, config: dict) -> bool:
    """Verify HTTP Basic auth credentials against the demo user."""
    if credentials.username != config["demo_username"]:
        return False
    # If a bcrypt hash is configured, verify against it; otherwise use constant-time plain compare.
    if config["demo_password_hash"]:
        return pwd_context.verify(credentials.password, config["demo_password_hash"])
    return secrets.compare_digest(credentials.password, config["demo_password_plain"])


def create_access_token(username: str, config: Optional[dict] = None) -> str:
    """Create a simple signed JWT-style access token (using python-jose)."""
    config = config or _load_auth_config()
    try:
        from jose import jwt
    except ImportError as exc:
        raise RuntimeError(
            "python-jose is required for token auth. Install with: pip install python-jose[cryptography]"
        ) from exc
    now = datetime.now(timezone.utc)
    expire = now + timedelta(hours=config["token_expire_hours"])
    payload = {
        "sub": username,
        "iat": now,
        "exp": expire,
        "type": "access"
    }
    return jwt.encode(payload, config["token_secret"], algorithm="HS256")


def decode_access_token(token: str, config: Optional[dict] = None) -> Optional[dict]:
    """Decode and validate a JWT access token."""
    config = config or _load_auth_config()
    try:
        from jose import jwt, JWTError
        return jwt.decode(token, config["token_secret"], algorithms=["HS256"])
    except Exception:
        return None


async def require_auth(
    request: Request,
    bearer: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    basic: Optional[HTTPBasicCredentials] = Depends(basic_scheme),
):
    """
    FastAPI dependency that enforces authentication when AUTH_ENABLED=true.
    Supports:
      - Bearer <API_KEY>
      - Bearer <JWT access token>
      - Basic username:password
    When auth is disabled, this dependency always succeeds.
    """
    config = _load_auth_config()
    if not config["enabled"]:
        # Auth disabled: attach a dummy user and continue.
        request.state.user = {"sub": "anonymous", "role": "guest"}
        return request.state.user

    # 1. Try Bearer token
    if bearer:
        # API key
        if _is_bearer_api_key(bearer, config):
            request.state.user = {"sub": "api_key", "role": "service"}
            return request.state.user
        # JWT access token
        decoded = decode_access_token(bearer.credentials, config)
        if decoded:
            request.state.user = {"sub": decoded.get("sub"), "role": "user"}
            return request.state.user

    # 2. Try Basic auth
    if basic:
        if _verify_basic_auth(basic, config):
            request.state.user = {"sub": basic.username, "role": "user"}
            return request.state.user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"code": "UNAUTHORIZED", "message": "Valid authentication credentials are required."},
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(request: Request) -> dict:
    """Return the currently authenticated user from request state."""
    return getattr(request.state, "user", {"sub": "anonymous", "role": "guest"})
