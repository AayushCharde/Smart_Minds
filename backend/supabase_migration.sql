-- ============================================================================
-- HireMinds AI — Supabase Migration
-- Run this SQL in your Supabase SQL Editor BEFORE starting the backend.
-- ============================================================================

-- 1. TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    skills JSONB DEFAULT '[]'::jsonb,
    experience_years REAL,
    education JSONB,
    certifications JSONB DEFAULT '[]'::jsonb,
    summary TEXT,
    raw_text TEXT,
    filename TEXT,
    file_path TEXT,
    language TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON candidates(user_id);

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT,
    description TEXT,
    requirements JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);

CREATE TABLE IF NOT EXISTS scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    total_score REAL,
    skills_score REAL,
    experience_score REAL,
    education_score REAL,
    certification_score REAL,
    explanation TEXT,
    badge TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scores_job_id ON scores(job_id);
CREATE INDEX IF NOT EXISTS idx_scores_candidate_id ON scores(candidate_id);

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT,
    content TEXT,
    sources JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);


-- 2. AUTO-UPDATE updated_at TRIGGER ON conversations
-- ============================================================================

CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON conversations;
CREATE TRIGGER trg_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversations_updated_at();


-- 3. RPC FUNCTIONS (for queries that need JOINs / aggregates)
-- ============================================================================

-- get_avg_match_score(uid TEXT) → REAL
CREATE OR REPLACE FUNCTION get_avg_match_score(uid TEXT)
RETURNS REAL AS $$
    SELECT COALESCE(AVG(s.total_score), 0)::REAL
    FROM scores s
    JOIN jobs j ON s.job_id = j.id
    WHERE j.user_id = uid;
$$ LANGUAGE sql STABLE;

-- get_total_qas(uid TEXT) → BIGINT
CREATE OR REPLACE FUNCTION get_total_qas(uid TEXT)
RETURNS BIGINT AS $$
    SELECT COUNT(*)
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE c.user_id = uid AND m.role = 'user';
$$ LANGUAGE sql STABLE;

-- get_top_candidates(uid TEXT) → TABLE
CREATE OR REPLACE FUNCTION get_top_candidates(uid TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    skills JSONB,
    avg_score REAL
) AS $$
    SELECT c.id, c.name, c.skills, AVG(s.total_score)::REAL AS avg_score
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.user_id = uid
    GROUP BY c.id, c.name, c.skills
    ORDER BY avg_score DESC
    LIMIT 5;
$$ LANGUAGE sql STABLE;

-- get_rankings(jid UUID) → TABLE
CREATE OR REPLACE FUNCTION get_rankings(jid UUID)
RETURNS TABLE (
    candidate_id UUID,
    candidate_name TEXT,
    total_score REAL,
    skills_score REAL,
    experience_score REAL,
    education_score REAL,
    certification_score REAL,
    explanation TEXT,
    badge TEXT
) AS $$
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
    FROM scores s
    JOIN candidates c ON s.candidate_id = c.id
    WHERE s.job_id = jid
    ORDER BY s.total_score DESC;
$$ LANGUAGE sql STABLE;
