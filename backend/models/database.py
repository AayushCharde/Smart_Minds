"""
Supabase database client — singleton with lazy initialization and error handling.
"""
import logging
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY

logger = logging.getLogger(__name__)

_supabase = None


def get_supabase():
    """Return a Supabase client singleton. Raises on connection failure."""
    global _supabase
    if _supabase is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_KEY must be set. "
                "Check your .env file."
            )
        try:
            _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            logger.info("Supabase client initialized")
        except Exception as e:
            logger.error(f"Failed to create Supabase client: {e}")
            raise
    return _supabase
