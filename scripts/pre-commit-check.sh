#!/bin/bash
# ═══════════════════════════════════════════════════════════
# HireMinds AI — Pre-Commit Check (Claude Code Hook)
# ═══════════════════════════════════════════════════════════
# Trigger: PreToolUse hook on Bash(git commit*)
# Purpose: Block commits that violate project rules
# Exit 0 = allow, Exit 2 = BLOCK the tool call
# ═══════════════════════════════════════════════════════════

set -e

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
ERRORS=0

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║   HireMinds AI — Pre-Commit Validation    ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || echo "")
if [ -z "$STAGED_FILES" ]; then
    echo "No staged files detected. Allowing commit."
    exit 0
fi

# ─── CHECK 1: API Key Leak Detection ─────────────────────────────────────────
echo -n "  [1/5] API key leak scan.............. "
LEAKED=$(echo "$STAGED_FILES" | while read -r f; do
    [ -f "$REPO_ROOT/$f" ] || continue
    echo "$f" | grep -qE '\.(example|md)$' && continue
    grep -nE '(sk-[a-zA-Z0-9]{20,}|pk_test_[a-zA-Z0-9]{20,}|sk_test_[a-zA-Z0-9]{20,})' "$REPO_ROOT/$f" 2>/dev/null | head -3
done)
if [ -n "$LEAKED" ]; then
    echo "BLOCKED"
    echo "    → Potential API key found in staged files!"
    echo "    → $LEAKED"
    ERRORS=$((ERRORS + 1))
else
    echo "PASS"
fi

# ─── CHECK 2: Model Name Verification ────────────────────────────────────────
echo -n "  [2/5] Model name verification........ "
WRONG_MODELS=""
echo "$STAGED_FILES" | while read -r f; do
    [ -f "$REPO_ROOT/$f" ] || continue
    echo "$f" | grep -qE '\.(py|js|jsx|ts|tsx)$' || continue
    MATCHES=$(grep -nE 'qwen-?(2\.5|2|1\.5|7b|72b|turbo)|gpt-[34]|claude-' "$REPO_ROOT/$f" 2>/dev/null || true)
    if [ -n "$MATCHES" ]; then
        echo "$f: $MATCHES"
    fi
done > /tmp/hireminds_model_check 2>/dev/null
WRONG_MODELS=$(cat /tmp/hireminds_model_check 2>/dev/null || true)
if [ -n "$WRONG_MODELS" ]; then
    echo "BLOCKED"
    echo "    → Hardcoded model name found! Use config.LLM_MODEL"
    echo "    → (default: llama-3.3-70b-versatile via Groq). Never hardcode."
    echo "    → $WRONG_MODELS"
    ERRORS=$((ERRORS + 1))
else
    echo "PASS"
fi

# ─── CHECK 3: Old DashScope/aliyuncs References ──────────────────────────────
echo -n "  [3/5] Old endpoint reference scan..... "
OLD_REFS=""
echo "$STAGED_FILES" | while read -r f; do
    [ -f "$REPO_ROOT/$f" ] || continue
    # Skip documentation and hook files (they warn ABOUT these references)
    echo "$f" | grep -qE '\.(md|sh)$' && continue
    MATCHES=$(grep -niE '(dashscope|aliyuncs|DASHSCOPE_API_KEY|DASHSCOPE_BASE_URL)' "$REPO_ROOT/$f" 2>/dev/null || true)
    if [ -n "$MATCHES" ]; then
        echo "$f: $MATCHES"
    fi
done > /tmp/hireminds_endpoint_check 2>/dev/null
OLD_REFS=$(cat /tmp/hireminds_endpoint_check 2>/dev/null || true)
if [ -n "$OLD_REFS" ]; then
    echo "BLOCKED"
    echo "    → Old DashScope references found in source files!"
    echo "    → Use LLM_BASE_URL / LLM_API_KEY (Groq by default) instead."
    echo "    → $OLD_REFS"
    ERRORS=$((ERRORS + 1))
else
    echo "PASS"
fi

# ─── CHECK 4: Auth Decorator on Routes ───────────────────────────────────────
echo -n "  [4/5] @require_auth on routes........ "
APP_PY="$REPO_ROOT/backend/app.py"
if [ -f "$APP_PY" ]; then
    UNPROTECTED=""
    while IFS= read -r line; do
        LINE_NUM=$(echo "$line" | cut -d: -f1)
        ROUTE_PATH=$(echo "$line" | grep -oE '"/api/[^"]*"' || true)
        # Skip health check
        [ "$ROUTE_PATH" = '"/api/health"' ] && continue
        # Check if @require_auth appears within next 2 lines
        NEXT=$(sed -n "$((LINE_NUM+1)),$((LINE_NUM+2))p" "$APP_PY" 2>/dev/null || true)
        if ! echo "$NEXT" | grep -q '@require_auth'; then
            UNPROTECTED="$UNPROTECTED\n    → $ROUTE_PATH at line $LINE_NUM"
        fi
    done < <(grep -n '@app.route' "$APP_PY" 2>/dev/null || true)
    if [ -n "$UNPROTECTED" ]; then
        echo "BLOCKED"
        echo "    → Routes missing @require_auth:"
        echo -e "$UNPROTECTED"
        ERRORS=$((ERRORS + 1))
    else
        echo "PASS"
    fi
else
    echo "SKIP (app.py not found)"
fi

# ─── CHECK 5: Python Syntax Validation ────────────────────────────────────────
echo -n "  [5/5] Python syntax validation....... "
SYNTAX_ERRORS=""
echo "$STAGED_FILES" | grep '\.py$' | while read -r f; do
    [ -f "$REPO_ROOT/$f" ] || continue
    if ! python -c "import ast; ast.parse(open(r'$REPO_ROOT/$f').read())" 2>/dev/null; then
        echo "$f"
    fi
done > /tmp/hireminds_syntax_check 2>/dev/null
SYNTAX_ERRORS=$(cat /tmp/hireminds_syntax_check 2>/dev/null || true)
if [ -n "$SYNTAX_ERRORS" ]; then
    echo "BLOCKED"
    echo "    → Syntax errors in: $SYNTAX_ERRORS"
    ERRORS=$((ERRORS + 1))
else
    echo "PASS"
fi

# ─── RESULT ───────────────────────────────────────────────────────────────────
echo ""
if [ $ERRORS -gt 0 ]; then
    echo "══════════════════════════════════════════"
    echo "  COMMIT BLOCKED — $ERRORS check(s) failed"
    echo "  Fix the issues above and try again."
    echo "══════════════════════════════════════════"
    exit 2
else
    echo "══════════════════════════════════════════"
    echo "  ALL CHECKS PASSED — Commit allowed ✓"
    echo "══════════════════════════════════════════"
    exit 0
fi
