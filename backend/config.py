"""
HireMinds AI — Application Configuration.

All settings are driven by environment variables with sensible defaults.
Validates required config at import time so the app fails fast on misconfiguration.
"""

import os
import sys
import logging

# ─── Logging Setup ──────────────────────────────────────────────────────────
# Structured logging with correlation-friendly format for production debugging.
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_FORMAT = os.getenv("LOG_FORMAT", "%(asctime)s | %(levelname)-8s | %(name)-20s | %(message)s")

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format=LOG_FORMAT,
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stdout,
)

# Quiet noisy third-party loggers
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("openai").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)

_logger = logging.getLogger("config")


# ─── LLM Configuration ──────────────────────────────────────────────────────
# Uses Groq (free, OpenAI-compatible API serving open-source models).
# Get a free API key at https://console.groq.com. Any OpenAI-compatible
# provider works — just override LLM_BASE_URL / LLM_MODEL / LLM_API_KEY.
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")

# Performance tuning
MAX_RESUME_CHARS = int(os.getenv("MAX_RESUME_CHARS", "6000"))
LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "4096"))
LLM_TIMEOUT = float(os.getenv("LLM_TIMEOUT", "180.0"))

# ─── Clerk Authentication ────────────────────────────────────────────────────
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL", "https://robust-collie-48.clerk.accounts.dev/.well-known/jwks.json")

# ─── Paths ───────────────────────────────────────────────────────────────────
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "..", "data", "resumes")

# ─── Supabase ────────────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# ─── RAG Configuration ──────────────────────────────────────────────────────
RAG_TOP_K = int(os.getenv("RAG_TOP_K", "7"))
RAG_MAX_PROMPT_CHARS = int(os.getenv("RAG_MAX_PROMPT_CHARS", "16000"))

# ─── Upload Limits ──────────────────────────────────────────────────────────
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", str(10 * 1024 * 1024)))  # 10MB
MAX_BATCH_FILES = int(os.getenv("MAX_BATCH_FILES", "50"))
ALLOWED_EXTENSIONS = frozenset({".pdf", ".docx", ".txt"})


# ─── Startup Validation ────────────────────────────────────────────────────
def _validate_config():
    """Validate required configuration at startup. Fail fast on misconfiguration."""
    errors = []
    warnings = []

    # Critical — app cannot function without these
    if not SUPABASE_URL:
        errors.append("SUPABASE_URL is not set")
    if not SUPABASE_KEY:
        errors.append("SUPABASE_KEY is not set")

    # Important — features will be broken without these
    if not LLM_API_KEY:
        warnings.append("LLM_API_KEY is not set — LLM calls will fail")
    if not CLERK_SECRET_KEY:
        warnings.append("CLERK_SECRET_KEY is not set — JWT verification may fail")

    # Sanity checks
    if LLM_MAX_TOKENS < 256:
        warnings.append(f"LLM_MAX_TOKENS={LLM_MAX_TOKENS} is very low, recommend >= 1024")
    if LLM_TIMEOUT < 30:
        warnings.append(f"LLM_TIMEOUT={LLM_TIMEOUT}s is very low for remote API calls")

    for w in warnings:
        _logger.warning(f"⚠ {w}")

    if errors:
        for e in errors:
            _logger.error(f"✗ {e}")
        _logger.error("Missing required environment variables. " "Copy .env.example to .env and fill in your values.")
        sys.exit(1)

    _logger.info(f"✓ Config loaded — model={LLM_MODEL}, endpoint={LLM_BASE_URL}")


_validate_config()
