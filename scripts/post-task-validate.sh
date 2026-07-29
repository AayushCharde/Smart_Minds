#!/bin/bash
# ═══════════════════════════════════════════════════════════
# HireMinds AI — Post-Task Validation (Claude Code Hook)
# ═══════════════════════════════════════════════════════════
# Trigger: Stop hook — runs AFTER Claude Code finishes a task
# Purpose: Validate that critical invariants weren't broken
# This is advisory only — it warns but does not block.
# ═══════════════════════════════════════════════════════════

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
WARNINGS=0

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║   HireMinds AI — Post-Task Validation     ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# ─── CHECK 1: Think-block stripping in llm_client.py ─────────────────────────
echo -n "  [1/3] Think-block stripping.......... "
LLM_CLIENT="$REPO_ROOT/backend/services/llm_client.py"
if [ -f "$LLM_CLIENT" ]; then
    # Look for the regex that strips <think>...</think> tags
    if grep -qE 're\.sub.*<think>.*</think>' "$LLM_CLIENT" 2>/dev/null; then
        echo "OK"
    elif grep -q '<think>' "$LLM_CLIENT" 2>/dev/null; then
        echo "OK (reference found)"
    else
        echo "WARNING — No <think> tag stripping found in llm_client.py"
        echo "    → LLM responses may contain raw reasoning blocks"
        echo "    → Expected: re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "SKIP (file not found)"
fi

# ─── CHECK 2: user_id filtering in rag_engine.py and matcher.py ──────────────
echo -n "  [2/3] User isolation (rag+matcher)... "
RAG="$REPO_ROOT/backend/services/rag_engine.py"
MATCHER="$REPO_ROOT/backend/services/matcher.py"
RAG_OK=true
MATCHER_OK=true

if [ -f "$RAG" ]; then
    # Must have user_id in metadata (indexing) AND where filter (querying)
    META_COUNT=$(grep -c '"user_id"' "$RAG" 2>/dev/null || echo "0")
    WHERE_COUNT=$(grep -c 'where.*user_id' "$RAG" 2>/dev/null || echo "0")
    if [ "$META_COUNT" -lt 1 ] || [ "$WHERE_COUNT" -lt 1 ]; then
        RAG_OK=false
    fi
else
    RAG_OK=false
fi

if [ -f "$MATCHER" ]; then
    USERID_COUNT=$(grep -c 'user_id' "$MATCHER" 2>/dev/null || echo "0")
    if [ "$USERID_COUNT" -lt 2 ]; then
        MATCHER_OK=false
    fi
else
    MATCHER_OK=false
fi

if $RAG_OK && $MATCHER_OK; then
    echo "OK"
else
    echo "WARNING"
    if ! $RAG_OK; then
        echo "    → rag_engine.py: missing user_id in metadata or where-filter"
    fi
    if ! $MATCHER_OK; then
        echo "    → matcher.py: insufficient user_id references (need 2+)"
    fi
    WARNINGS=$((WARNINGS + 1))
fi

# ─── CHECK 3: No .env files staged for commit ────────────────────────────────
echo -n "  [3/3] No .env files staged........... "
STAGED_ENV=$(git diff --cached --name-only 2>/dev/null | grep -E '^\.env$|/\.env$' || true)
if [ -n "$STAGED_ENV" ]; then
    echo "WARNING — .env file is staged for commit!"
    echo "    → $STAGED_ENV"
    echo "    → Run: git reset HEAD $STAGED_ENV"
    WARNINGS=$((WARNINGS + 1))
else
    echo "OK"
fi

# ─── RESULT ───────────────────────────────────────────────────────────────────
echo ""
if [ $WARNINGS -gt 0 ]; then
    echo "══════════════════════════════════════════"
    echo "  POST-TASK: $WARNINGS warning(s) found"
    echo "  Review before committing your changes."
    echo "══════════════════════════════════════════"
else
    echo "══════════════════════════════════════════"
    echo "  POST-TASK: All validations passed ✓"
    echo "══════════════════════════════════════════"
fi

exit 0
