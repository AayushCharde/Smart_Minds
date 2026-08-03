<p align="center">
  <a href="https://github.com/AayushCharde/Smart_Minds/actions/workflows/ci.yml"><img src="https://github.com/AayushCharde/Smart_Minds/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/Flask-3.1-000000?logo=flask&logoColor=white" alt="Flask" />
  <img src="https://img.shields.io/badge/Llama_3.3-70B-7C3AED?logo=meta&logoColor=white" alt="Llama 3.3 70B" />
  <img src="https://img.shields.io/badge/Groq-Free_API-F55036?logo=groq&logoColor=white" alt="Groq" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Clerk-Auth-6C47FF?logo=clerk&logoColor=white" alt="Clerk" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/License-GPLv3-22C55E" alt="GPLv3 License" />
</p>

# HireMinds AI

**AI-Powered Recruitment Platform** — Automate resume screening, match candidates to jobs with LLM-driven scoring, and query your talent pool through a RAG-powered chatbot.

HireMinds AI is a full-stack monorepo application built with React and Flask that leverages the Llama 3.3 70B large language model (via Groq's free, OpenAI-compatible API) to transform recruitment workflows. Upload resumes, get structured candidate profiles, score them against job descriptions across 4 weighted criteria, and ask natural language questions about your candidates — all with complete multi-tenant data isolation.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Setup](#environment-setup)
  - [Local Development](#local-development)
  - [Docker Deployment](#docker-deployment)
- [Database Setup](#database-setup)
- [API Reference](#api-reference)
- [Theme System](#theme-system)
- [Data Flow](#data-flow)
- [Configuration Reference](#configuration-reference)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Resume Upload & Parsing
- Drag-and-drop upload supporting **PDF, DOCX, and TXT** formats
- Batch upload up to **50 files** at once (10MB per file)
- **Regex-based** structured extraction — no LLM needed for parsing, keeping it fast and reliable
- Extracts name, email, phone, skills (75 tech terms), experience years, education, and certifications
- Full raw text preserved for RAG search

### AI Job Matching
- Paste a job description and score **all candidates** automatically
- **4-criteria weighted scoring** (100 points total):

  | Criterion | Weight | What It Measures |
  |-----------|--------|-----------------|
  | Skills Match | 40 pts | Required and preferred skills coverage |
  | Experience Fit | 25 pts | Years of experience vs. requirements |
  | Education | 20 pts | Education level alignment |
  | Certifications | 15 pts | Relevant professional certifications |

- LLM-generated explanations for each score
- Match badges: **Strong** (80+), **Good** (50-79), **Weak** (<50)
- Animated score breakdowns with detailed criteria visualization

### RAG Chat (Q&A Over Resumes)
- Ask natural language questions about your candidate pool
- **Lightweight keyword-based RAG** — no vector database, no embeddings, ~0 extra RAM
- Extracts keywords from questions, scores candidates by relevance, builds context from top 7 matches
- Source citations linking answers back to specific candidates
- Multi-turn conversations with history (last 10 messages)
- **Real-time streaming** via Server-Sent Events (SSE)

### Multi-Tenant Authentication
- **Clerk** JWT-based authentication with JWKS verification
- Complete user data isolation — every database query is scoped by `user_id`
- Secure sign-in/sign-up flows with custom themed UI

### Theme System
- **8 visual themes** (3 light + 5 dark) with 40+ color tokens each
- Persisted to localStorage, applied via CSS custom properties
- Smooth 200ms theme transitions
- WCAG AA contrast ratios

---

## Architecture

```
Browser (React SPA, port 5173)
    |
    |-- Clerk Auth (JWT tokens)
    |-- API calls (fetch + Bearer token)
    v
Flask Backend (port 8000)
    |-- @require_auth middleware (JWKS verification)
    |-- g.user_id set from JWT 'sub' claim
    |
    |-- Services Layer:
    |   |-- llm_client.py    --> LLM API client (Groq / Llama 3.3 70B)
    |   |-- resume_parser.py --> PDF/DOCX/TXT regex extraction
    |   |-- matcher.py       --> JD extraction + candidate scoring
    |   |-- rag_engine.py    --> Keyword-based RAG + LLM Q&A
    |
    |-- Data Layer:
        |-- Supabase (PostgreSQL) -- 5 tables + 4 RPC functions
        |-- File Storage (data/resumes/) -- uploaded files
```

### Data Flow

**Resume Upload:**
```
File Drop --> FormData --> POST /api/upload --> extract_text() --> parse_resume() (regex)
  --> INSERT INTO candidates (user_id scoped) --> Return structured candidate data
```

**Job Matching:**
```
Job Description --> POST /api/match --> LLM extracts requirements --> Per-candidate LLM scoring
  --> INSERT INTO scores --> Return sorted rankings with badges
```

**RAG Chat:**
```
Question --> POST /api/ask-stream --> Extract keywords --> Score candidates by relevance
  --> Top 7 excerpts --> LLM synthesis --> SSE stream with source citations
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, TailwindCSS, React Router v6, Lucide Icons |
| **Auth** | Clerk (JWT + JWKS RS256 verification) |
| **Backend** | Python Flask 3.1, Flask-CORS, Gunicorn |
| **LLM** | Llama 3.3 70B via [Groq](https://console.groq.com) (free, OpenAI-compatible API) |
| **Database** | Supabase (PostgreSQL) with RPC functions |
| **RAG** | Lightweight keyword-based search (~0 extra RAM) |
| **File Parsing** | pypdf, python-docx |
| **Containerization** | Docker + Docker Compose, Nginx reverse proxy |

---

## Project Structure

```
hireminds-ai/
|
|-- backend/
|   |-- app.py                     # Flask entry point, 13 API routes
|   |-- config.py                  # Central configuration with startup validation
|   |-- requirements.txt           # Python dependencies
|   |-- Dockerfile                 # Gunicorn production image
|   |-- .env.example               # Environment variable template
|   |-- middleware/
|   |   |-- auth.py                # Clerk JWT verification (thread-safe JWKS cache)
|   |-- models/
|   |   |-- database.py            # Supabase client singleton
|   |-- services/
|   |   |-- llm_client.py          # OpenAI-compatible LLM wrapper (text/JSON/stream)
|   |   |-- resume_parser.py       # Regex-based resume extraction (no LLM)
|   |   |-- matcher.py             # LLM-powered 4-criteria job matching
|   |   |-- rag_engine.py          # Keyword-based RAG pipeline
|   |-- prompts/                   # Jinja-style LLM prompt templates
|       |-- extract_jd.txt         # Job description requirement extraction
|       |-- score_candidate.txt    # Candidate scoring prompt
|       |-- rag_qa.txt             # RAG Q&A with source citations
|
|-- frontend/
|   |-- package.json
|   |-- vite.config.js
|   |-- Dockerfile                 # Multi-stage build (Node + Nginx)
|   |-- nginx.conf                 # SPA routing + API proxy + SSE support
|   |-- .env.example               # Frontend environment template
|   |-- src/
|       |-- main.jsx               # ClerkProvider entry point
|       |-- App.jsx                # React Router + lazy-loaded pages
|       |-- api.js                 # useApi() hook with AbortController support
|       |-- styles/
|       |   |-- globals.css        # 18 custom animations, CSS custom properties
|       |-- themes/
|       |   |-- themes.js          # 8 theme definitions (40+ tokens each)
|       |-- context/
|       |   |-- ThemeContext.jsx    # Theme state management
|       |   |-- AppContext.jsx     # App-wide state (candidates, stats, conversations)
|       |-- components/
|           |-- Layout/            # Sidebar, TopBar, Layout wrapper
|           |-- Dashboard/         # StatCards, SkillsCloud, PipelineOverview
|           |-- Upload/            # DropZone, CandidateTable, CandidateDetail
|           |-- Matcher/           # JDInput, ScoreCard, ranked results
|           |-- Chat/              # ChatPage, ChatSidebar, MessageBubble
|           |-- common/            # ErrorBoundary, SkillTag, Toast, LoadingSpinner
|
|-- data/                          # Auto-created at runtime
|   |-- resumes/                   # Uploaded resume files
|
|-- docker-compose.yml             # Full-stack orchestration
|-- supabase_schema.sql            # Database schema + RPC functions
|-- CLAUDE.md                      # AI assistant project context
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **Python** >= 3.10
- **Supabase** project ([supabase.com](https://supabase.com))
- **Clerk** account ([clerk.com](https://clerk.com))
- **LLM API access** (free [Groq](https://console.groq.com) key, or any OpenAI-compatible endpoint)
- **Docker & Docker Compose** (optional, for containerized deployment)

### Environment Setup

#### Backend (`backend/.env`)

```bash
cp backend/.env.example backend/.env
```

```env
# LLM Configuration
LLM_API_KEY=your_llm_api_key_here
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.3-70b-versatile

# Authentication
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key_here
```

#### Frontend (`frontend/.env`)

```bash
cp frontend/.env.example frontend/.env
```

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here
```

> **Note:** The backend exits immediately on startup if `SUPABASE_URL` or `SUPABASE_KEY` is missing. Other missing variables produce warnings.

### Local Development

**Backend:**

```bash
cd backend
pip install -r requirements.txt
python app.py
# Server starts on http://localhost:8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
# Dev server starts on http://localhost:5173
```

### Docker Deployment

```bash
# Build and start all services
docker compose up --build

# Start in background
docker compose up -d

# Follow backend logs
docker compose logs -f backend

# Stop all services
docker compose down
```

The Docker setup includes:
- **Backend:** Python 3.11-slim + Gunicorn (4 workers, gthread)
- **Frontend:** Multi-stage build (Node 20 builder + Nginx Alpine)
- **Nginx:** SPA routing, API reverse proxy, SSE support, gzip, static asset caching
- **Health checks** on both services
- **Persistent volume** for uploaded resumes

> **Important:** Set `VITE_CLERK_PUBLISHABLE_KEY` as an environment variable before building — it's injected at build time via Docker build args.

---

## Database Setup

Before first use, run the schema in the **Supabase SQL Editor**:

```bash
# Copy the contents of supabase_schema.sql and execute in:
# Supabase Dashboard > SQL Editor > New Query
```

The schema creates:

| Table | Purpose |
|-------|---------|
| `candidates` | Parsed resume data (name, skills, experience, raw_text, etc.) |
| `jobs` | Job postings with extracted requirements |
| `scores` | Match scores linking candidates to jobs (4 criteria + explanation) |
| `conversations` | RAG chat conversations |
| `messages` | Individual chat messages with source citations |

Plus **4 RPC functions** for dashboard analytics:
- `get_rankings(jid)` — Join scores with candidate data
- `get_avg_match_score(uid)` — Average match score across all jobs
- `get_total_qas(uid)` — Total Q&A messages count
- `get_top_candidates(uid)` — Top 5 candidates by average score

All tables include `user_id` columns with indexes for multi-tenant data isolation. Foreign keys use `CASCADE` deletes.

---

## API Reference

All endpoints return a consistent response format:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Every endpoint (except health check) requires a `Authorization: Bearer <jwt>` header.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | No | Health check |
| `POST` | `/api/upload` | Yes | Upload resumes (multipart FormData, max 50 files) |
| `GET` | `/api/candidates` | Yes | List candidates (`?sort=`, `?order=`, `?skill=`) |
| `GET` | `/api/candidates/:id` | Yes | Get single candidate (includes `raw_text`) |
| `DELETE` | `/api/candidates/:id` | Yes | Delete candidate + file + related scores |
| `POST` | `/api/match` | Yes | Score candidates against a JD — body `{"description": "<JD text, min 20 chars>", "title": "<optional>"}` |
| `GET` | `/api/rankings/:job_id` | Yes | Get cached match rankings (via RPC) |
| `POST` | `/api/ask` | Yes | RAG Q&A question (creates conversation if needed) |
| `POST` | `/api/ask-stream` | Yes | Streaming RAG via SSE (`sources`, `token`, `done` events) |
| `GET` | `/api/conversations` | Yes | List all conversations |
| `GET` | `/api/conversations/:id` | Yes | Get conversation + messages |
| `DELETE` | `/api/conversations/:id` | Yes | Delete conversation + messages |
| `GET` | `/api/stats` | Yes | Dashboard analytics (via RPC) |
| `GET` | `/api/llm-usage` | Yes | Live LLM free-tier quota (requests/day, tokens/min + reset timers) |

---

## Theme System

HireMinds includes 8 built-in visual themes, each with 40+ color tokens:

### Light Themes
| Theme | Accent | Mood |
|-------|--------|------|
| **Aurora** | `#2563EB` (Blue) | Clean, professional SaaS |
| **Sunset Warm** | `#EA580C` (Orange) | Warm, human-centered |
| **Rose Gold** | `#E11D48` (Rose) | Elegant, modern |

### Dark Themes
| Theme | Accent | Mood |
|-------|--------|------|
| **Midnight Cosmos** | `#06B6D4` (Cyan) | Deep, sophisticated |
| **Forest Night** | `#34D399` (Emerald) | Organic, nature-inspired |
| **Obsidian Purple** | `#8B5CF6` (Violet) | Bold, AI-forward |
| **Ocean Deep** | `#3B82F6` (Blue) | Calm, focused |
| **Charcoal** | `#F97316` (Orange) | Minimal, neutral |

Themes are applied via CSS custom properties on `<html>` and persisted to `localStorage`. All components use inline theme tokens (not Tailwind color classes), enabling instant 200ms transitions.

---

## Configuration Reference

All settings are driven by environment variables with sensible defaults. Configured in `backend/config.py`.

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_API_KEY` | — | API key for the LLM endpoint |
| `LLM_BASE_URL` | `https://api.groq.com/openai/v1` | OpenAI-compatible LLM API base URL |
| `LLM_MODEL` | `llama-3.3-70b-versatile` | Model identifier |
| `LLM_MAX_TOKENS` | `4096` | Maximum tokens per LLM response |
| `LLM_TIMEOUT` | `180.0` | LLM request timeout in seconds |
| `CLERK_SECRET_KEY` | — | Clerk secret key for JWT verification |
| `CLERK_JWKS_URL` | Auto-detected | Clerk JWKS endpoint URL |
| `SUPABASE_URL` | — | **Required.** Supabase project URL |
| `SUPABASE_KEY` | — | **Required.** Supabase anon/service key |
| `RAG_TOP_K` | `7` | Number of candidates to include in RAG context |
| `RAG_MAX_PROMPT_CHARS` | `16000` | Maximum prompt length before truncation |
| `MAX_FILE_SIZE` | `10485760` | Max upload file size in bytes (10MB) |
| `MAX_BATCH_FILES` | `50` | Max files per upload batch |
| `MAX_RESUME_CHARS` | `6000` | Max resume characters sent to LLM |
| `LOG_LEVEL` | `INFO` | Python logging level |

---

## Contributing

### Development Guidelines

1. **Every API route** (except `/api/health`) must use the `@require_auth` decorator
2. **All database queries** must filter by `user_id` — no cross-tenant data leakage
3. **API responses** always use the `{success, data, error}` format
4. **Model name** is `llama-3.3-70b-versatile` — always reference `config.LLM_MODEL`, never hardcode
5. **`<think>` tags** must be stripped — `llm_client.py` handles this via regex (defensive; a no-op for non-reasoning models)
6. **FormData requests** must skip the `Content-Type` header — let the browser set the multipart boundary
7. **Never commit** `.env` files or API keys

### Key Gotchas

- `PyJWT` must be installed with `[crypto]` extras — RS256 verification silently fails without it
- RAG uses keyword search, not vector embeddings — do **not** add ChromaDB, FAISS, or sentence-transformers
- `resume_parser.py` uses regex only — the `extract_resume.txt` prompt template exists but is unused
- Supabase schema must be created manually before first use (run `supabase_schema.sql`)
- LLM JSON responses use retry logic — models occasionally produce malformed JSON
- Streaming skips reasoning tokens — yields `delta.content`, with `delta.reasoning_content` checked as a fallback for split-stream reasoning models

### Setup Validation

The backend validates configuration at startup and will:
- **Exit immediately** if `SUPABASE_URL` or `SUPABASE_KEY` is missing
- **Warn** if `LLM_API_KEY` or `CLERK_SECRET_KEY` is missing
- **Log** the active model and endpoint on successful startup

---

## License

This project is licensed under the [GNU GPLv3 License](LICENSE).

---

<p align="center">
  Built with Llama 3.3 70B on <a href="https://console.groq.com">Groq</a> · Maintained by <a href="https://github.com/AayushCharde">Aayush Charde</a>
</p>
