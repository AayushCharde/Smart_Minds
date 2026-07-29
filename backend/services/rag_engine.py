"""
Lightweight RAG engine — keyword-based search over Supabase raw_text.

Uses ~0 extra RAM. No vector DB or embedding models required.
Pipeline: question → keyword extraction → candidate scoring → excerpt extraction → LLM synthesis.
"""
import os
import re
import logging
from config import RAG_TOP_K, RAG_MAX_PROMPT_CHARS

logger = logging.getLogger(__name__)

PROMPTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'prompts')

RAG_SYSTEM_PROMPT = (
    "You are a helpful recruitment assistant. "
    "Be direct, specific, and cite candidate names as sources. "
    "Keep answers concise — 2-4 sentences unless more detail is needed."
)

# Cache prompt template
_rag_prompt_cache = None

# Pre-compiled regex for keyword extraction
_KEYWORD_RE = re.compile(r'[a-zA-Z0-9+#.]+')

# Stop words for keyword extraction (frozen set for O(1) lookup)
_STOP_WORDS = frozenset({
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'must', 'need',
    'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it',
    'they', 'them', 'their', 'this', 'that', 'these', 'those',
    'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'some', 'any',
    'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'if', 'then',
    'for', 'of', 'in', 'on', 'at', 'to', 'from', 'by', 'with', 'about',
    'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further',
    'there', 'here', 'no', 'yes', 'just', 'also', 'very', 'too',
    'tell', 'show', 'find', 'get', 'give', 'list', 'many', 'much',
    'candidates', 'candidate', 'resume', 'resumes', 'person', 'people',
    'anyone', 'someone', 'everybody', 'please', 'thanks',
})


def delete_candidate_chunks(candidate_id: str):
    """No-op — no vector store to clean. Kept for API compatibility."""
    pass


def _extract_keywords(text: str) -> list:
    """Extract meaningful keywords from a question for search."""
    words = _KEYWORD_RE.findall(text.lower())
    return [w for w in words if w not in _STOP_WORDS and len(w) >= 2]


def _score_candidate_relevance(raw_text: str, keywords: list) -> int:
    """Score how relevant a candidate's resume is to the search keywords."""
    if not raw_text or not keywords:
        return 0
    text_lower = raw_text.lower()
    score = 0
    for kw in keywords:
        count = text_lower.count(kw)
        if count > 0:
            score += min(count, 5)  # Cap per-keyword to avoid bias
    return score


def _get_relevant_excerpt(raw_text: str, keywords: list, max_chars: int = 2000) -> str:
    """Extract the most relevant portion of the resume text for the given keywords."""
    if not raw_text or not keywords:
        return raw_text[:max_chars] if raw_text else ""

    lines = raw_text.split('\n')
    scored_lines = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped:
            continue
        line_lower = stripped.lower()
        line_score = sum(1 for kw in keywords if kw in line_lower)
        scored_lines.append((line_score, i, stripped))

    # Sort by relevance (highest first), then by position
    scored_lines.sort(key=lambda x: (-x[0], x[1]))

    # Take top 20 lines, re-sort by original position for coherent reading
    top_lines = scored_lines[:20]
    top_lines.sort(key=lambda x: x[1])

    excerpt = '\n'.join(line for _, _, line in top_lines)

    if len(excerpt) > max_chars:
        excerpt = excerpt[:max_chars] + '...'

    return excerpt or raw_text[:max_chars]


def _get_rag_template() -> str:
    """Load and cache the RAG QA prompt template."""
    global _rag_prompt_cache
    if _rag_prompt_cache is None:
        with open(os.path.join(PROMPTS_DIR, 'rag_qa.txt'), 'r') as f:
            _rag_prompt_cache = f.read()
    return _rag_prompt_cache


def _build_rag_prompt(user_id: str, question: str, conversation_history: list = None):
    """
    Build the RAG prompt and return (prompt, sources).
    Shared by streaming and non-streaming paths.

    All database queries filter by user_id for data isolation.
    """
    from models.database import get_supabase

    sb = get_supabase()

    # Fetch candidates with raw_text (needed for keyword search)
    candidates = (
        sb.table("candidates")
        .select("id, name, filename, raw_text")
        .eq("user_id", user_id)
        .execute().data
    )

    if not candidates:
        return None, []

    keywords = _extract_keywords(question)

    # Score and rank candidates by keyword relevance
    scored = []
    for c in candidates:
        raw_text = c.get("raw_text") or ""
        score = _score_candidate_relevance(raw_text, keywords)
        if score > 0 or not keywords:
            scored.append((score, c))

    scored.sort(key=lambda x: -x[0])
    top_candidates = scored[:RAG_TOP_K]

    # Fallback: if no keywords matched, take first N candidates
    if not top_candidates:
        top_candidates = [(0, c) for c in candidates[:RAG_TOP_K]]

    # Build context chunks and source list
    retrieved_chunks = ""
    sources = []
    for score, c in top_candidates:
        name = c.get("name", "Unknown")
        filename = c.get("filename", "unknown")
        raw_text = c.get("raw_text") or ""
        excerpt = _get_relevant_excerpt(raw_text, keywords, max_chars=2000)
        retrieved_chunks += f"\n--- Excerpt from {name} ({filename}) ---\n{excerpt}\n"
        sources.append({"candidate_name": name, "filename": filename})

    # Build conversation history (limited to last 10 messages for token budget)
    chat_history = ""
    if conversation_history:
        for msg in conversation_history[-10:]:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            chat_history += f"{role}: {content}\n"

    # Assemble prompt from template
    prompt_template = _get_rag_template()
    prompt = prompt_template.replace("{retrieved_chunks}", retrieved_chunks)
    prompt = prompt.replace("{chat_history}", chat_history or "None")
    prompt = prompt.replace("{user_question}", question)

    # Truncate if too long (preserve the question at the end)
    if len(prompt) > RAG_MAX_PROMPT_CHARS:
        prompt = (
            prompt[:RAG_MAX_PROMPT_CHARS]
            + "\n\n[Context truncated]\n\nUser's question: "
            + question
        )

    return prompt, sources


def query_resumes(user_id: str, question: str, conversation_history: list = None) -> dict:
    """Non-streaming RAG — returns full answer at once."""
    from services.llm_client import call_llm

    prompt, sources = _build_rag_prompt(user_id, question, conversation_history)

    if prompt is None:
        return {
            "answer": "No resumes have been uploaded yet. Upload some resumes first, then ask me anything about your candidates!",
            "sources": []
        }

    answer = call_llm(
        prompt,
        system_prompt=RAG_SYSTEM_PROMPT,
        think=False,
        max_tokens=1024
    )

    return {
        "answer": answer,
        "sources": sources
    }


def query_resumes_stream(user_id: str, question: str, conversation_history: list = None, think: bool = True):
    """
    Streaming RAG — yields (chunk_type, data) tuples:
      ("sources", sources_list)   — emitted once at start
      ("token", text_chunk)       — emitted per token
      ("done", None)              — emitted at end

    think param controls whether model reasons before responding.
    """
    from services.llm_client import call_llm_stream

    prompt, sources = _build_rag_prompt(user_id, question, conversation_history)

    if prompt is None:
        yield ("sources", [])
        yield ("token", "No resumes have been uploaded yet. Upload some resumes first, then ask me anything about your candidates!")
        yield ("done", None)
        return

    # Emit sources first so frontend can show them immediately
    yield ("sources", sources)

    # Stream tokens from LLM
    for chunk in call_llm_stream(
        prompt,
        system_prompt=RAG_SYSTEM_PROMPT,
        think=think,
        max_tokens=1024
    ):
        yield ("token", chunk)

    yield ("done", None)
