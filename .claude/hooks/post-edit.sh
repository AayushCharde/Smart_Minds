#!/bin/bash
# HireMinds AI — Post-edit Hook
# Runs 4 checks after Claude Code edits files.
# Warns on violations but does not block.

set -e

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$(cd "$(dirname "$0")/../.." && pwd)")"
WARNINGS=0

echo "=== HireMinds Post-Edit Checks ==="

# ─── CHECK 1: Auto-format Python files ───────────────────────────────────────
echo -n "[1/4] Formatting Python files with black... "
if command -v black &>/dev/null; then
    PY_FILES=$(find "$REPO_ROOT/backend" -name "*.py" -not -path "*/venv/*" -not -path "*/__pycache__/*" 2>/dev/null)
    if [ -n "$PY_FILES" ]; then
        black --quiet --line-length 120 $PY_FILES 2>/dev/null && echo "OK (formatted)" || echo "SKIP (black error)"
    else
        echo "OK (no Python files)"
    fi
else
    echo "SKIP (black not installed — run: pip install black)"
fi

# ─── CHECK 2: Think-block stripping present ──────────────────────────────────
echo -n "[2/4] Verifying think-block stripping in llm_client.py... "
LLM_CLIENT="$REPO_ROOT/backend/services/llm_client.py"
if [ -f "$LLM_CLIENT" ]; then
    if grep -q '<think>.*</think>' "$LLM_CLIENT"; then
        echo "OK"
    else
        echo "WARNING — Missing <think> tag stripping regex in llm_client.py"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "SKIP (llm_client.py not found)"
fi

# ─── CHECK 3: user_id in rag_engine.py ───────────────────────────────────────
echo -n "[3/4] Verifying user_id filtering in rag_engine.py... "
RAG_ENGINE="$REPO_ROOT/backend/services/rag_engine.py"
if [ -f "$RAG_ENGINE" ]; then
    # Check both indexing (metadata) and querying (where filter)
    HAS_METADATA=$(grep -c '"user_id"' "$RAG_ENGINE" || true)
    HAS_WHERE=$(grep -c 'where.*user_id' "$RAG_ENGINE" || true)
    if [ "$HAS_METADATA" -ge 1 ] && [ "$HAS_WHERE" -ge 1 ]; then
        echo "OK (metadata: $HAS_METADATA refs, where-filter: $HAS_WHERE refs)"
    else
        echo "WARNING — Missing user_id isolation (metadata: $HAS_METADATA, where: $HAS_WHERE)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "SKIP (rag_engine.py not found)"
fi

# ─── CHECK 4: user_id in matcher.py ──────────────────────────────────────────
echo -n "[4/4] Verifying user_id filtering in matcher.py... "
MATCHER="$REPO_ROOT/backend/services/matcher.py"
if [ -f "$MATCHER" ]; then
    HAS_USERID=$(grep -c 'user_id' "$MATCHER" || true)
    if [ "$HAS_USERID" -ge 2 ]; then
        echo "OK ($HAS_USERID references)"
    else
        echo "WARNING — Insufficient user_id references in matcher.py ($HAS_USERID found, expected 2+)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "SKIP (matcher.py not found)"
fi

# ─── RESULT ───────────────────────────────────────────────────────────────────
echo ""
if [ $WARNINGS -gt 0 ]; then
    echo "POST-EDIT: $WARNINGS warning(s) found. Review before committing."
else
    echo "POST-EDIT: All checks passed."
fi

exit 0
