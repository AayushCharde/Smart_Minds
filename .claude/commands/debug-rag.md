# /debug-rag — Diagnose RAG Retrieval Issues

When the user runs `/debug-rag`, systematically diagnose why the RAG chat might not be returning good results.

## Diagnostic Steps

Run through these checks in order. Report findings after each step.

### Step 1: Check Keyword Extraction

Read `backend/services/rag_engine.py` and verify:
- [ ] `_extract_keywords()` correctly tokenizes and filters words
- [ ] Stop words list (`_STOP_WORDS`) covers common filler words
- [ ] Keywords are lowercased for case-insensitive matching
- [ ] Minimum keyword length is 2 characters

### Step 2: Verify User Isolation

Check that user_id filtering is correct in candidate queries:
- [ ] `_build_rag_prompt()` filters candidates by `user_id` via Supabase `.eq("user_id", user_id)`
- [ ] `raw_text` is included in the candidate select query
- [ ] `delete_candidate_chunks()` is a safe no-op (no vector DB to clean)

### Step 3: Check Candidate Scoring

Read `_score_candidate_relevance()` and verify:
- [ ] Scores are based on keyword frequency in `raw_text`
- [ ] Per-keyword count is capped at 5 (prevents bias)
- [ ] Candidates with zero matches are included if no keywords were extracted
- [ ] Top `RAG_TOP_K` (7) candidates are selected

### Step 4: Check Excerpt Extraction

Read `_get_relevant_excerpt()` and verify:
- [ ] Lines are scored by keyword presence
- [ ] Top 20 lines are selected, re-sorted by original position
- [ ] Excerpt length is capped at 2000 chars per candidate
- [ ] Empty lines are filtered out

### Step 5: Check RAG Prompt Template

Read `backend/prompts/rag_qa.txt` and verify:
- [ ] Has `{retrieved_chunks}` placeholder
- [ ] Has `{chat_history}` placeholder
- [ ] Has `{user_question}` placeholder
- [ ] Instructs LLM to cite sources with `[Source: candidate_name]`
- [ ] Instructs LLM to say "I don't have enough information" when context is insufficient
- [ ] Total prompt is truncated at `RAG_MAX_PROMPT_CHARS` to avoid token overflow

### Step 6: Check LLM Call Configuration

Verify RAG calls the LLM correctly:
- [ ] Non-streaming uses `call_llm()` with `think=False`
- [ ] Streaming uses `call_llm_stream()` with configurable `think` param
- [ ] System prompt sets the role as recruitment assistant
- [ ] Chat history is limited (last 10 messages)

### Step 7: Check for Common Failure Modes

- [ ] No resumes uploaded: Does it return a helpful message?
- [ ] No keyword matches: Does it fall back to first N candidates?
- [ ] Very long resumes: Are excerpts properly truncated?
- [ ] Prompt too long: Is truncation working correctly?

## Report Format

After running all checks, report:
```
RAG Diagnostic Report
=====================
Keyword Extraction: OK / ISSUE: [description]
User Isolation: OK / ISSUE: [description]
Candidate Scoring: OK / ISSUE: [description]
Excerpt Extraction: OK / ISSUE: [description]
Prompt Template: OK / ISSUE: [description]
LLM Config: OK / ISSUE: [description]
Edge Cases: OK / ISSUE: [description]

Recommendation: [what to fix first]
```
