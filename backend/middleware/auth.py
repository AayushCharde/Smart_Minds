"""
Clerk authentication middleware for Flask.

How it works:
1. Frontend gets JWT from Clerk via useAuth().getToken()
2. Frontend sends JWT as Bearer token in Authorization header
3. This middleware intercepts the request, validates the JWT
4. If valid, attaches user_id to request context
5. If invalid/missing, returns 401 Unauthorized

JWKS Flow:
- Clerk exposes JWKS at <your-instance>.clerk.accounts.dev/.well-known/jwks.json
- This is a PUBLIC endpoint — no auth header needed
- We fetch with `requests`, cache in memory for 1 hour
- Auto-refresh if key lookup fails (handles Clerk key rotation)
- Thread-safe via threading.Lock
"""

import time
import logging
import threading
import requests as http_requests
from functools import wraps
from flask import request, jsonify, g
import jwt as pyjwt
from jwt import PyJWK
from config import CLERK_JWKS_URL

logger = logging.getLogger(__name__)

# Thread-safe JWKS cache
_jwks_lock = threading.Lock()
_jwks_cache = {
    "keys": None,
    "fetched_at": 0,
}
CACHE_TTL = 3600  # Refresh JWKS every 1 hour
JWKS_FETCH_TIMEOUT = 10  # seconds


def _fetch_jwks():
    """
    Fetch JWKS from Clerk's public Frontend API endpoint.

    Uses the public .well-known/jwks.json URL which does NOT require
    a secret key. Thread-safe: caller must hold _jwks_lock.
    """
    logger.info(f"Fetching JWKS from {CLERK_JWKS_URL}")

    try:
        response = http_requests.get(CLERK_JWKS_URL, timeout=JWKS_FETCH_TIMEOUT)
        response.raise_for_status()
    except http_requests.RequestException as e:
        logger.error(f"JWKS fetch failed: {e}")
        # Return stale keys if available, otherwise raise
        if _jwks_cache["keys"] is not None:
            logger.warning("Using stale JWKS cache after fetch failure")
            return _jwks_cache["keys"]
        raise ConnectionError(f"Cannot fetch JWKS from {CLERK_JWKS_URL}: {e}") from e

    data = response.json()
    keys = data.get("keys", [])

    if not keys:
        logger.warning("JWKS response contained no keys")
        if _jwks_cache["keys"] is not None:
            return _jwks_cache["keys"]

    _jwks_cache["keys"] = keys
    _jwks_cache["fetched_at"] = time.time()
    logger.info(f"JWKS cached: {len(keys)} key(s)")
    return keys


def _get_signing_key(token):
    """Find the correct signing key from JWKS for the given JWT token."""
    # Decode token header to get 'kid'
    header = pyjwt.get_unverified_header(token)
    kid = header.get("kid")

    if not kid:
        raise ValueError("JWT token missing 'kid' in header")

    # Thread-safe JWKS fetch
    with _jwks_lock:
        keys = _jwks_cache["keys"]
        if keys is None or (time.time() - _jwks_cache["fetched_at"]) > CACHE_TTL:
            keys = _fetch_jwks()

    # Find matching key by kid
    for key_data in keys:
        if key_data.get("kid") == kid:
            return PyJWK(key_data).key

    # Key not found — maybe Clerk rotated keys. Force refresh once.
    with _jwks_lock:
        keys = _fetch_jwks()

    for key_data in keys:
        if key_data.get("kid") == kid:
            return PyJWK(key_data).key

    raise ValueError(f"No matching signing key found for kid: {kid}")


def require_auth(f):
    """Decorator to protect Flask routes with Clerk JWT verification."""

    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({"success": False, "error": "Missing or invalid Authorization header"}), 401

        token = auth_header.split(" ", 1)[1]

        if not token or len(token) < 10:
            return jsonify({"success": False, "error": "Invalid token format"}), 401

        try:
            signing_key = _get_signing_key(token)
            payload = pyjwt.decode(
                token,
                signing_key,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )

            user_id = payload.get("sub")
            if not user_id:
                return jsonify({"success": False, "error": "Token missing user identifier"}), 401

            g.user_id = user_id
            g.session_id = payload.get("sid")

        except pyjwt.ExpiredSignatureError:
            return jsonify({"success": False, "error": "Token has expired. Please sign in again."}), 401
        except pyjwt.InvalidTokenError as e:
            logger.warning(f"Invalid JWT: {e}")
            return jsonify({"success": False, "error": "Invalid authentication token"}), 401
        except Exception as e:
            logger.error(f"Auth error: {e}", exc_info=True)
            return jsonify({"success": False, "error": "Authentication failed"}), 401

        return f(*args, **kwargs)

    return decorated
