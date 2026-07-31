# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HireMinds AI — a full-stack recruitment platform with resume parsing, candidate-job matching, and RAG-powered Q&A over resumes. Monorepo with a React frontend and Python Flask backend.

## Commands

### Frontend (from `frontend/`)
```bash
npm install              # install dependencies
npm run dev              # dev server on http://localhost:5173
npm run build            # production build via Vite
```

### Backend (from `backend/`)
```bash
pip install -r requirements.txt   # install dependencies
python app.py                     # start Flask server on http://localhost:8000
```

### Docker (full stack)
```bash
docker compose up --build        # build and start all services
docker compose up -d             # start in background
docker compose logs -f backend   # follow backend logs
docker compose down              # stop all services
```

### Environment Setup
Copy `.env` files in both `frontend/` and `backend/` and populate:
- **Frontend**: `VITE_CLERK_PUBLISHABLE_KEY`, optionally `VITE_API_BASE` (defaults to `http://localhost:8000`, use relative path in Docker/Nginx)
- **Backend**: `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, `CLERK_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`
- **Config validation**: Backend exits immediately if `SUPABASE_URL` or `SUPABASE_KEY` is missing. Other missing vars produce warnings.

## Critical Rules — NEVER Violate

1. **Model name is `llama-3.3-70b-versatile`** — set via `LLM_MODEL` in `config.py`. Always reference `config.LLM_MODEL`, never hardcode.
2. **LLM endpoint is `https://api.groq.com/openai/v1`** — Groq (free, OpenAI-compatible, open-source models). Set via `LLM_BASE_URL`. Any OpenAI-compatible provider works by overriding these env vars.
3. **Every API route (except `/api/health`) must use `@require_auth`** — no unprotected endpoints.
4. **All database queries must filter by `user_id`** — candidates, jobs, conversations, scores are user-scoped.
5. **API responses always use `{success, data, error}` format** — never raw data.
6. **Never commit `.env` files or API keys** — `.gitignore` excludes them.
7. **`useApi()` must skip Content-Type header for FormData** — let the browser set the multipart boundary.
8. **No references to old endpoints** — no `dashscope`, `aliyuncs`, or `DASHSCOPE_*` env vars in source code.
9. **`<think>` tags must be stripped** — `llm_client.py` strips any reasoning blocks via regex before returning responses (defensive; a no-op for non-reasoning models like Llama).

## Architecture

```
frontend/    → React 18 + Vite + TailwindCSS SPA          (port 5173)
backend/     → Flask REST API (Python)                     (port 8000)
data/        → uploaded resumes on disk
```

### Frontend (`frontend/src/`)
- **Auth**: Clerk SDK (`<ClerkProvider>` in `main.jsx`). `useApi()` hook in `api.js` attaches JWT Bearer tokens to all requests. API base controlled by `VITE_API_BASE` env var.
- **Routing**: React Router v6 in `App.jsx` — Dashboard (`/`), Upload (`/upload`), Matcher (`/match`), Chat (`/chat`). Auth pages at `/sign-in`, `/sign-up`.
- **State**: Two Context providers:
  - `ThemeContext` — 8 themes (3 light + 5 dark), persisted to localStorage, CSS custom properties on `<html>`.
  - `AppContext` — candidates, stats, conversations, matcher results. Deduplicates concurrent fetches via `useRef`. Cache invalidation after mutations (`invalidateStats`, `invalidateCandidates`, `invalidateAll`).
- **Styling**: All colors via inline theme tokens (not Tailwind color classes). 18 custom CSS animations in `globals.css`. Scrollbar/skeleton/selection colors set via CSS custom properties.
- **Components**: `components/Layout/` (Sidebar, TopBar), then per-feature dirs (Dashboard, Upload, Matcher, Chat, common).

### Backend (`backend/`)
- **Entry point**: `app.py` — Flask app with CORS (allows `localhost:5173`, `localhost:80`, `localhost`), all routes defined here. Includes request lifecycle hooks for logging and timing.
- **Auth middleware**: `middleware/auth.py` — `@require_auth` validates Clerk JWTs via JWKS (RS256). Caches JWKS 1 hour, auto-refreshes on key miss. Sets `g.user_id`.
- **Database**: `models/database.py` — Supabase client singleton via `get_supabase()`. Schema in `supabase_schema.sql` — 5 tables (`candidates`, `jobs`, `scores`, `conversations`, `messages`) + 4 RPC functions (`get_rankings`, `get_avg_match_score`, `get_total_qas`, `get_top_candidates`). Cascade deletes on FKs.
- **Services**:
  - `resume_parser.py` — PDF/DOCX/TXT text extraction (pypdf/python-docx) + **regex-based** structured parsing (no LLM). Extracts name, email, phone, skills (75 hardcoded tech terms), experience years, education, certs. Saves full `raw_text` for RAG.
  - `matcher.py` — LLM-powered job matching. Extracts JD requirements via LLM, then scores each candidate via LLM. 4-criteria scoring: skills (0-40), experience (0-25), education (0-20), certs (0-15). Retry logic (3 attempts) for JSON parsing.
  - `rag_engine.py` — **Lightweight keyword-based RAG** (no ChromaDB, no sentence-transformers, ~0 extra RAM). Extracts keywords from question, scores candidates by keyword relevance in `raw_text`, takes top 7, extracts relevant excerpts, sends to LLM with `rag_qa.txt` prompt. Prompt truncated at 16000 chars. Supports both non-streaming (`query_resumes`) and streaming (`query_resumes_stream` — yields `(chunk_type, data)` tuples for SSE).
  - `llm_client.py` — OpenAI-compatible wrapper (default provider: Groq; works with any OpenAI-compatible endpoint). Three call modes: `call_llm` (text), `call_llm_json` (parsed JSON), `call_llm_stream` (streaming tokens). Strips any `<think>` reasoning blocks from output (defensive no-op for non-reasoning models). Robust JSON extraction with brace-matching and truncation repair. The `think` flag is retained for backward compatibility but no longer alters the prompt. Streaming skips reasoning tokens and yields only answer content; it still checks `delta.reasoning_content` as a fallback for providers that use the split-stream format.
- **Prompts**: `prompts/` — 4 Jinja-style templates: `extract_resume.txt` (unused — regex parser instead), `extract_jd.txt`, `score_candidate.txt`, `rag_qa.txt`.
- **Config**: `config.py` — all LLM, auth, path, and RAG settings. Driven by env vars with defaults. Validates at import time and exits on missing critical vars.

### Data Flow
1. **Upload**: File → text extraction (pypdf/python-docx) → regex parsing → Supabase insert + file saved to disk
2. **Match**: JD text → LLM requirement extraction → per-candidate LLM scoring → batch insert scores to Supabase
3. **Chat (RAG)**: Question → keyword extraction → score all user's candidates by keyword relevance → top 7 excerpts → LLM synthesis with source citations
4. **Chat (Streaming)**: Same as above but uses SSE (`text/event-stream`) — frontend receives `sources`, `token`, and `done` events

## Claude Code Integration

### Slash Commands (`.claude/commands/`)
- `/add-route` — scaffold a new Flask API endpoint with all conventions (auth, user_id, response format)
- `/debug-rag` — systematically diagnose RAG retrieval issues (7-step checklist)
- `/add-prompt` — create a new LLM prompt template with service integration
- `/add-theme` — generate a complete visual theme with all 35+ color tokens

### Agents (`.claude/agents/`)
- `code-reviewer` — read-only security audit: checks auth on routes, user_id filtering, API key leaks, think-block stripping, model name, old endpoint references
- `rag-debugger` — traces the full RAG pipeline (collection → chunking → embedding → storage → retrieval → generation) to find failure points

### Hooks (`.claude/settings.json`)
- **PreToolUse** (`git commit`): Runs `scripts/pre-commit-check.sh` — blocks commits with API key leaks, wrong model names, old endpoint references, missing `@require_auth`, or Python syntax errors
- **Stop** (every task): Runs `scripts/post-task-validate.sh` — warns if think-block stripping is missing, user_id filtering is missing, or `.env` files are staged
- **Post-edit** (`.claude/hooks/post-edit.sh`): Auto-formats Python with `black --line-length 120`, checks think-block stripping and user_id filtering

## Non-Obvious Gotchas

1. **`PyJWT` must be installed with `[crypto]`** — RS256 verification silently fails without it.
2. **No vector DB or embeddings** — RAG uses lightweight keyword-based search over Supabase `raw_text`. Don't add ChromaDB, FAISS, or embedding model dependencies.
3. **`resume_parser.py` does NOT call the LLM** — it uses regex only. The `extract_resume.txt` prompt template exists but is unused.
4. **Supabase schema must be created first** — run `supabase_schema.sql` in the Supabase SQL Editor before first use. Includes RPC functions.
5. **LLM JSON responses need retry logic** — models sometimes produce malformed JSON. `call_llm_json()` handles markdown stripping, brace extraction, trailing comma removal, and single-to-double quote fixes.
6. **Backward-compat aliases** — `call_qwen`, `call_qwen_json`, `call_qwen_stream` in `llm_client.py` are aliases for `call_llm` / `call_llm_json` / `call_llm_stream`. Existing code may use either name.
7. **Conversation history limited to 10 messages** — RAG prompt only includes the last 10 messages to manage token budget.
8. **File limits** — 10MB per file, 50 files per batch, extensions: `.pdf`, `.docx`, `.txt`.
9. **`think` flag is now a no-op** — it used to prepend `/no_think` for Qwen3. Llama/gpt-oss models don't have a reasoning-toggle directive, so the flag is kept only for backward compatibility and no longer changes the prompt. Don't reintroduce `/no_think`.
10. **Streaming skips reasoning tokens** — the stream handler yields only `delta.content`, but still checks `delta.reasoning_content` (plus `model_extra` as SDK fallback) so reasoning models on split-stream providers don't leak reasoning into the answer.

## API Routes (all require `@require_auth` except `/api/health`)
- `GET /api/health` — health check (no auth)
- `POST /api/upload` — resume upload (multipart)
- `GET /api/candidates` — list candidates (supports `?sort=`, `?order=`, `?skill=`)
- `GET /api/candidates/:id` — single candidate (includes `raw_text`)
- `DELETE /api/candidates/:id` — delete candidate + file + scores
- `POST /api/match` — score candidates against a JD. Body: `{"description": "<JD text, min 20 chars>", "title": "<optional>"}`
- `GET /api/rankings/:job_id` — cached match rankings (uses RPC)
- `POST /api/ask` — RAG question (creates conversation if needed)
- `POST /api/ask-stream` — streaming RAG via SSE (events: `sources`, `token`, `done`, `error`)
- `GET /api/conversations` — list conversations
- `GET /api/conversations/:id` — conversation + messages
- `DELETE /api/conversations/:id` — delete conversation + messages
- `GET /api/stats` — dashboard analytics (uses RPC)
- `GET /api/llm-usage` — live LLM provider quota (requests/day, tokens/min) read from the provider's `x-ratelimit-*` headers via a 1-token probe
