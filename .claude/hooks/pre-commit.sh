#!/bin/bash
# HireMinds AI — Pre-commit Hook
# Runs 5 checks before every git commit to enforce project rules.
# Exit code 1 = block commit, 0 = allow commit.

set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
ERRORS=0

echo "=== HireMinds Pre-Commit Checks ==="

# ─── CHECK 1: API Key Leak Detection ─────────────────────────────────────────
echo -n "[1/5] Checking for API key leaks... "
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)
if echo "$STAGED_FILES" | xargs grep -l -E '(sk-[a-zA-Z0-9]{20,}|pk_test_[a-zA-Z0-9]{20,}|sk_test_[a-zA-Z0-9]{20,})' 2>/dev/null | grep -v '.env.example' | grep -v '.md'; then
    echo "FAIL — Potential API key found in staged files!"
    ERRORS=$((ERRORS + 1))
else
    echo "OK"
fi

# ─── CHECK 2: Model Name Verification ────────────────────────────────────────
echo -n "[2/5] Checking for hardcoded model names... "
WRONG_MODELS=$(echo "$STAGED_FILES" | xargs grep -l -E 'qwen-?(2\.5|2|1\.5|7b|72b|turbo)|gpt-[34]|claude-' 2>/dev/null || true)
if [ -n "$WRONG_MODELS" ]; then
    echo "FAIL — Hardcoded model name found in: $WRONG_MODELS"
    echo "       Use config.LLM_MODEL (default: llama-3.3-70b-versatile via Groq)."
    ERRORS=$((ERRORS + 1))
else
    echo "OK"
fi

# ─── CHECK 3: Old Endpoint Reference Scan ────────────────────────────────────
echo -n "[3/5] Checking for old DashScope/aliyuncs references... "
OLD_REFS=$(echo "$STAGED_FILES" | xargs grep -l -i -E '(dashscope|aliyuncs|DASHSCOPE)' 2>/dev/null || true)
if [ -n "$OLD_REFS" ]; then
    echo "FAIL — Old endpoint references found in: $OLD_REFS"
    echo "       Use LLM_BASE_URL / LLM_API_KEY (Groq by default) instead."
    ERRORS=$((ERRORS + 1))
else
    echo "OK"
fi

# ─── CHECK 4: Auth Decorator Check ───────────────────────────────────────────
echo -n "[4/5] Checking API routes have @require_auth... "
if echo "$STAGED_FILES" | grep -q 'app.py'; then
    UNPROTECTED=$(grep -n '@app.route' "$REPO_ROOT/backend/app.py" | while read -r line; do
        LINE_NUM=$(echo "$line" | cut -d: -f1)
        NEXT_LINES=$(sed -n "$((LINE_NUM+1)),$((LINE_NUM+3))p" "$REPO_ROOT/backend/app.py")
        if ! echo "$NEXT_LINES" | grep -q '@require_auth'; then
            ROUTE=$(echo "$line" | grep -o '"/api/[^"]*"')
            if [ "$ROUTE" != '"/api/health"' ]; then
                echo "$ROUTE (line $LINE_NUM)"
            fi
        fi
    done)
    if [ -n "$UNPROTECTED" ]; then
        echo "FAIL — Routes missing @require_auth:"
        echo "       $UNPROTECTED"
        ERRORS=$((ERRORS + 1))
    else
        echo "OK"
    fi
else
    echo "OK (app.py not in staged files)"
fi

# ─── CHECK 5: Python Syntax Validation ───────────────────────────────────────
echo -n "[5/5] Checking Python syntax... "
PY_FILES=$(echo "$STAGED_FILES" | grep '\.py$' || true)
SYNTAX_ERRORS=""
if [ -n "$PY_FILES" ]; then
    for f in $PY_FILES; do
        if [ -f "$REPO_ROOT/$f" ]; then
            if ! python -c "import ast; ast.parse(open('$REPO_ROOT/$f').read())" 2>/dev/null; then
                SYNTAX_ERRORS="$SYNTAX_ERRORS $f"
            fi
        fi
    done
fi
if [ -n "$SYNTAX_ERRORS" ]; then
    echo "FAIL — Syntax errors in:$SYNTAX_ERRORS"
    ERRORS=$((ERRORS + 1))
else
    echo "OK"
fi

# ─── RESULT ───────────────────────────────────────────────────────────────────
echo ""
if [ $ERRORS -gt 0 ]; then
    echo "BLOCKED: $ERRORS check(s) failed. Fix issues before committing."
    exit 1
else
    echo "All checks passed. Commit allowed."
    exit 0
fi
