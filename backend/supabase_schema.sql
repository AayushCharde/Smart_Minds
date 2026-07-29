-- ============================================================================
-- HireMinds AI - Supabase Database Schema
-- Run this SQL in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================

-- Enable UUID extension (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CANDIDATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.candidates (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    name        TEXT NOT NULL DEFAULT 'Unknown',
    email       TEXT,
    phone       TEXT,
    skills      JSONB DEFAULT '[]'::jsonb,
    experience_years INTEGER DEFAULT 0,
    education   TEXT,
    certifications JSONB DEFAULT '[]'::jsonb,
    summary     TEXT,
    raw_text    TEXT,
    filename    TEXT,
    file_path   TEXT,
    language    TEXT DEFAULT 'en',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user-scoped queries
CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON public.candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON public.candidates(created_at DESC);

-- ============================================================================
-- 2. JOBS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.jobs (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    title       TEXT NOT NULL DEFAULT 'Untitled Job',
    description TEXT,
    requirements JSONB DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);

-- ============================================================================
-- 3. SCORES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.scores (
    id                  TEXT PRIMARY KEY,
    candidate_id        TEXT NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    job_id              TEXT NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    total_score         REAL DEFAULT 0,
    skills_score        REAL DEFAULT 0,
    experience_score    REAL DEFAULT 0,
    education_score     REAL DEFAULT 0,
    certification_score REAL DEFAULT 0,
    explanation         TEXT,
    badge               TEXT DEFAULT 'weak',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scores_job_id ON public.scores(job_id);
CREATE INDEX IF NOT EXISTS idx_scores_candidate_id ON public.scores(candidate_id);

-- ============================================================================
-- 4. CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    title       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);

-- ============================================================================
-- 5. MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role            TEXT NOT NULL,
    content         TEXT NOT NULL,
    sources         JSONB DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- ============================================================================
-- 6. RPC FUNCTIONS
-- ============================================================================

-- 6a. get_rankings: Join scores with candidates for a given job
CREATE OR REPLACE FUNCTION public.get_rankings(jid TEXT)
RETURNS TABLE (
    candidate_id TEXT,
    candidate_name TEXT,
    total_score REAL,
    skills_score REAL,
    experience_score REAL,
    education_score REAL,
    certification_score REAL,
    explanation TEXT,
    badge TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        s.candidate_id,
        c.name AS candidate_name,
        s.total_score,
        s.skills_score,
        s.experience_score,
        s.education_score,
        s.certification_score,
        s.explanation,
        s.badge
    FROM public.scores s
    JOIN public.candidates c ON c.id = s.candidate_id
    WHERE s.job_id = jid
    ORDER BY s.total_score DESC;
$$;

-- 6b. get_avg_match_score: Average score across all jobs for a user
CREATE OR REPLACE FUNCTION public.get_avg_match_score(uid TEXT)
RETURNS REAL
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COALESCE(AVG(s.total_score), 0)::REAL
    FROM public.scores s
    JOIN public.jobs j ON j.id = s.job_id
    WHERE j.user_id = uid;
$$;

-- 6c. get_total_qas: Total messages sent by user across all conversations
CREATE OR REPLACE FUNCTION public.get_total_qas(uid TEXT)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COALESCE(COUNT(*), 0)::INTEGER
    FROM public.messages m
    JOIN public.conversations c ON c.id = m.conversation_id
    WHERE c.user_id = uid AND m.role = 'user';
$$;

-- 6d. get_top_candidates: Top 5 candidates by average score for a user
CREATE OR REPLACE FUNCTION public.get_top_candidates(uid TEXT)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    skills JSONB,
    avg_score REAL
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        c.id,
        c.name,
        c.skills,
        COALESCE(AVG(s.total_score), 0)::REAL AS avg_score
    FROM public.candidates c
    LEFT JOIN public.scores s ON s.candidate_id = c.id
    WHERE c.user_id = uid
    GROUP BY c.id, c.name, c.skills
    ORDER BY avg_score DESC
    LIMIT 5;
$$;

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) - Optional but recommended
-- ============================================================================
-- Enable RLS on all tables (Supabase default)
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow the service_role key (used by backend) to bypass RLS
-- Since your Flask backend uses the anon/service key directly,
-- we create permissive policies for authenticated access via the API key
CREATE POLICY "Allow all for service" ON public.candidates
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service" ON public.jobs
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service" ON public.scores
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service" ON public.conversations
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service" ON public.messages
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- DONE! All 5 tables, 4 RPC functions, and indexes are created.
-- ============================================================================
