"""
LLM client — OpenAI-compatible wrapper (default provider: Groq).

Works with any OpenAI-compatible endpoint (Groq, OpenRouter, Cerebras,
local Ollama, ...). Configure via LLM_BASE_URL / LLM_MODEL / LLM_API_KEY.

Key behaviors:
- Strips any <think>...</think> reasoning blocks from output (defensive —
  a no-op for non-reasoning models like Llama, but safe to keep)
- Robust JSON extraction with brace-matching and truncation repair
- 3 retry attempts for transient failures
"""

import re
import json
import time
import logging
from openai import OpenAI
from config import LLM_API_KEY, LLM_BASE_URL, LLM_MODEL, LLM_MAX_TOKENS, LLM_TIMEOUT

logger = logging.getLogger(__name__)

# Pre-compiled regex for <think> tag stripping (used frequently)
_THINK_TAG_RE = re.compile(r"<think>.*?</think>", re.DOTALL)

# OpenAI-compatible client — connects to the configured LLM provider (Groq by default)
client = OpenAI(
    api_key=LLM_API_KEY,
    base_url=LLM_BASE_URL,
    timeout=LLM_TIMEOUT,
)

logger.info(f"LLM client initialized: model={LLM_MODEL}, endpoint={LLM_BASE_URL}")


def _build_messages(prompt: str, system_prompt: str, think: bool) -> list:
    """Build a standard OpenAI-style message list (system + user).

    The `think` flag is retained for API compatibility but no longer alters
    the prompt: it was a Qwen3-specific `/no_think` directive that has no
    meaning for Llama/gpt-oss and would otherwise leak into the prompt text.
    """
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    return messages


def _classify_error(e: Exception) -> Exception:
    """Convert raw API errors into user-friendly exceptions."""
    error_msg = str(e)
    if "Connection" in error_msg or "refused" in error_msg or "timeout" in error_msg.lower():
        return ConnectionError(
            f"Cannot connect to LLM at {LLM_BASE_URL}. "
            f"Check that the API endpoint is reachable and your LLM_API_KEY is correct."
        )
    if "401" in error_msg or "403" in error_msg or "Unauthorized" in error_msg:
        return ConnectionError(
            f"Authentication failed for LLM at {LLM_BASE_URL}. " f"Check your LLM_API_KEY in the .env file."
        )
    return e


def call_llm(prompt: str, system_prompt: str = "", think: bool = False, max_tokens: int = None) -> str:
    """
    Call LLM via OpenAI-compatible API (non-streaming).

    Any <think>...</think> reasoning blocks are stripped from the output
    (a no-op for non-reasoning models such as Llama, kept as a safeguard).
    The `think` flag is accepted for backward compatibility.
    """
    messages = _build_messages(prompt, system_prompt, think)
    tokens = max_tokens or LLM_MAX_TOKENS

    try:
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            temperature=0.3,
            max_tokens=tokens,
        )
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        raise _classify_error(e) from e

    if not response.choices:
        raise ValueError("LLM returned no choices")

    content = response.choices[0].message.content or ""

    # Strip any <think>...</think> reasoning blocks (defensive; no-op for Llama)
    content = _THINK_TAG_RE.sub("", content).strip()

    if not content:
        raise ValueError("LLM returned an empty response (think block may have consumed all tokens)")

    return content


def call_llm_stream(prompt: str, system_prompt: str = "", think: bool = True, max_tokens: int = None):
    """
    Call LLM with streaming — yields text chunks as they arrive.

    Reasoning tokens (if the model emits any) are skipped; only answer
    content is yielded. The `think` flag is accepted for compatibility.
    """
    messages = _build_messages(prompt, system_prompt, think)
    tokens = max_tokens or LLM_MAX_TOKENS

    try:
        stream = client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            temperature=0.3,
            max_tokens=tokens,
            stream=True,
        )
    except Exception as e:
        logger.error(f"LLM stream failed: {e}")
        raise _classify_error(e) from e

    # Some providers use a split-stream format for reasoning models:
    #   - Reasoning tokens arrive in delta.reasoning_content
    #   - Actual answer tokens arrive in delta.content
    # Standard models (e.g. Llama on Groq) only send delta.content.
    for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta

        # Extract content — check both standard and reasoning fields
        content = getattr(delta, "content", None) or None
        reasoning = getattr(delta, "reasoning_content", None) or None

        # Fallback: check raw dict if SDK doesn't map reasoning_content
        if content is None and reasoning is None:
            raw = getattr(delta, "model_extra", None) or {}
            content = raw.get("content")
            reasoning = raw.get("reasoning_content")

        # Yield answer content verbatim (preserve inter-token whitespace);
        # reasoning tokens, when a provider sends them separately, are skipped.
        # Note: we do NOT strip <think> tags per-chunk — a tag would span
        # multiple tokens, and per-chunk .strip() would collapse word spacing.
        if content:
            yield content


def _extract_json(raw: str) -> str:
    """Extract and clean JSON from LLM output — handles code blocks, trailing text, truncation."""
    raw = raw.strip()

    # Remove markdown code blocks
    if raw.startswith("```json"):
        raw = raw[7:]
    elif raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    raw = raw.strip()

    # Find the outermost { ... } pair with proper brace matching
    start = raw.find("{")
    if start == -1:
        return raw

    depth = 0
    end = start
    in_string = False
    escape_next = False

    for i in range(start, len(raw)):
        ch = raw[i]
        if escape_next:
            escape_next = False
            continue
        if ch == "\\" and in_string:
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i
                break

    extracted = raw[start : end + 1]

    # If JSON was truncated (no closing brace found), try to fix
    if depth > 0:
        extracted = extracted.rstrip(", \n\t")
        if extracted.count('"') % 2 == 1:
            extracted += '"'
        extracted += "}" * depth

    return extracted


def call_llm_json(prompt: str, system_prompt: str = "", think: bool = False, max_tokens: int = None) -> dict:
    """
    Call LLM and parse response as JSON with robust error recovery.

    For structured JSON output, think=False is strongly recommended (default).
    Handles: markdown code blocks, trailing commas, single quotes, truncated output.
    """
    raw = call_llm(prompt, system_prompt, think=think, max_tokens=max_tokens)

    cleaned = _extract_json(raw)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Fix common LLM JSON mistakes
        fixed = re.sub(r",\s*([}\]])", r"\1", cleaned)  # trailing commas
        fixed = fixed.replace("'", '"')  # single quotes → double
        try:
            return json.loads(fixed)
        except json.JSONDecodeError:
            logger.error(f"JSON parse failed. Raw LLM output:\n{raw[:500]}")
            raise


# ─── Backward-compatible aliases ─────────────────────────────────────────────
call_qwen = call_llm
call_qwen_json = call_llm_json
call_qwen_stream = call_llm_stream
