"""
Job matching engine — LLM-powered candidate scoring with parallel execution.

Pipeline: JD text → LLM requirement extraction → per-candidate LLM scoring → rankings.
Uses ThreadPoolExecutor for parallel scoring (MAX_WORKERS configurable).
"""
import os
import json
import uuid
import time
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from services.llm_client import call_llm_json
from models.database import get_supabase

logger = logging.getLogger(__name__)

PROMPTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'prompts')

# Score up to 4 candidates in parallel for faster matching
MAX_WORKERS = int(os.getenv("MATCH_MAX_WORKERS", "4"))

# Cache prompt templates at module level (read once, reuse)
_prompt_cache = {}


def _get_prompt(name: str) -> str:
    """Load and cache prompt template from disk."""
    if name not in _prompt_cache:
        path = os.path.join(PROMPTS_DIR, name)
        with open(path, 'r') as f:
            _prompt_cache[name] = f.read()
    return _prompt_cache[name]


def _make_fallback_scores(reason: str) -> dict:
    """Create a zero-score result with error explanation."""
    return {
        "total_score": 0,
        "skills_score": 0,
        "experience_score": 0,
        "education_score": 0,
        "certification_score": 0,
        "explanation": str(reason),
        "badge": "weak"
    }


def extract_job_requirements(description: str) -> dict:
    """Extract structured requirements from a job description using LLM."""
    prompt_template = _get_prompt('extract_jd.txt')
    prompt = prompt_template.replace("{job_description}", description)

    last_error = None
    for attempt in range(3):
        try:
            system_prompt = (
                "You are a JSON API. Output ONLY raw JSON. No markdown, no explanation. "
                "Start your response with {"
            )
            if attempt > 0:
                system_prompt += " CRITICAL: Previous response was invalid. Output NOTHING except a valid JSON object."

            return call_llm_json(prompt, system_prompt=system_prompt, think=False, max_tokens=1024)
        except Exception as e:
            last_error = e
            logger.warning(f"JD extraction attempt {attempt+1}/3 failed: {e}")
            continue

    raise ValueError(f"Failed to extract JD requirements after 3 attempts: {last_error}")


def _to_int(val, default=0, max_val=100):
    """Safely convert a value to int, clamped to [0, max_val]."""
    if val is None:
        return default
    try:
        n = int(float(val))
        return max(0, min(n, max_val))
    except (ValueError, TypeError):
        return default


def _normalize_scores(result: dict) -> dict:
    """
    Normalize LLM scoring output to ensure all required keys exist.

    Maps 15+ known alternate key names to canonical names and guarantees
    every required key exists with a valid integer value.
    """
    skills = _to_int(
        result.get("skills_score")
        or result.get("skill_score")
        or result.get("skills_match")
        or result.get("skills_match_score")
        or result.get("skills"),
        max_val=40
    )
    experience = _to_int(
        result.get("experience_score")
        or result.get("experience_fit")
        or result.get("experience_fit_score")
        or result.get("experience"),
        max_val=25
    )
    education = _to_int(
        result.get("education_score")
        or result.get("education_relevance")
        or result.get("education_relevance_score")
        or result.get("education"),
        max_val=20
    )
    certification = _to_int(
        result.get("certification_score")
        or result.get("certifications_score")
        or result.get("certifications")
        or result.get("cert_score"),
        max_val=15
    )

    total = _to_int(
        result.get("total_score")
        or result.get("score")
        or result.get("overall_score")
        or result.get("total"),
        max_val=100
    )

    # If total is 0 but sub-scores exist, compute from sub-scores
    computed_total = skills + experience + education + certification
    if total == 0 and computed_total > 0:
        total = min(computed_total, 100)

    explanation = (
        result.get("explanation")
        or result.get("summary")
        or result.get("reasoning")
        or result.get("analysis")
        or "No explanation provided."
    )

    return {
        "total_score": total,
        "skills_score": skills,
        "experience_score": experience,
        "education_score": education,
        "certification_score": certification,
        "explanation": str(explanation),
    }


def score_candidate(candidate: dict, requirements: dict) -> dict:
    """Score a single candidate against job requirements. Retries up to 3 times."""
    prompt_template = _get_prompt('score_candidate.txt')

    candidate_profile = json.dumps({
        "name": candidate.get("name", "Unknown"),
        "skills": candidate.get("skills") or [],
        "experience_years": candidate.get("experience_years", 0),
        "education": candidate.get("education"),
        "certifications": candidate.get("certifications") or [],
        "summary": candidate.get("summary", "")
    }, indent=2)

    prompt = prompt_template.replace("{job_requirements}", json.dumps(requirements, indent=2))
    prompt = prompt.replace("{candidate_profile}", candidate_profile)

    candidate_name = candidate.get('name', 'Unknown')
    last_error = None

    for attempt in range(3):
        try:
            system_prompt = (
                "You are a JSON API. Output ONLY raw JSON with EXACTLY these keys: "
                "total_score, skills_score, experience_score, education_score, "
                "certification_score, explanation. All scores are integers."
            )
            if attempt > 0:
                system_prompt += (
                    " CRITICAL: Previous response was invalid. Output NOTHING except a valid JSON object."
                )

            raw_result = call_llm_json(prompt, system_prompt=system_prompt, think=False, max_tokens=1024)
            normalized = _normalize_scores(raw_result)

            logger.debug(f"Scored {candidate_name}: {normalized['total_score']}/100")

            # Assign badge based on score
            total = normalized["total_score"]
            if total >= 80:
                normalized["badge"] = "strong"
            elif total >= 50:
                normalized["badge"] = "good"
            else:
                normalized["badge"] = "weak"

            return normalized

        except Exception as e:
            last_error = e
            logger.warning(f"Scoring attempt {attempt+1}/3 failed for {candidate_name}: {e}")
            continue

    logger.error(f"All scoring attempts failed for {candidate_name}: {last_error}")
    return _make_fallback_scores(f"Scoring failed: {last_error}")


def match_candidates(user_id: str, title: str, description: str) -> dict:
    """Run full matching pipeline: extract JD → score all candidates → return rankings."""
    start_time = time.monotonic()

    # Step 1: Extract job requirements
    logger.info(f"Starting match for job '{title}'")
    requirements = extract_job_requirements(description)
    logger.info("JD requirements extracted successfully")

    sb = get_supabase()

    # Step 2: Save job to DB
    job_id = str(uuid.uuid4())
    sb.table("jobs").insert({
        "id": job_id,
        "user_id": user_id,
        "title": title,
        "description": description,
        "requirements": requirements
    }).execute()

    # Step 3: Get all candidates (exclude raw_text for scoring — not needed)
    candidates = (
        sb.table("candidates")
        .select("id, name, skills, experience_years, education, certifications, summary")
        .eq("user_id", user_id)
        .execute().data
    )

    if not candidates:
        logger.info("No candidates found for user")
        return {
            "job_id": job_id,
            "requirements": requirements,
            "rankings": []
        }

    logger.info(f"Scoring {len(candidates)} candidates (max {MAX_WORKERS} in parallel)...")

    # Step 4: Score candidates in parallel
    results_map = {}

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_candidate = {
            executor.submit(score_candidate, candidate, requirements): candidate
            for candidate in candidates
        }

        for future in as_completed(future_to_candidate):
            candidate = future_to_candidate[future]
            try:
                scores = future.result(timeout=300)  # 5-minute timeout per candidate
            except Exception as e:
                logger.error(f"Unexpected error scoring {candidate.get('name', '?')}: {e}")
                scores = _make_fallback_scores(f"Scoring failed: {e}")
            results_map[candidate["id"]] = (candidate, scores)

    # Step 5: Build rankings and score rows
    rankings = []
    score_rows = []

    for candidate in candidates:
        cand, scores = results_map[candidate["id"]]

        score_rows.append({
            "id": str(uuid.uuid4()),
            "candidate_id": candidate["id"],
            "job_id": job_id,
            "total_score": scores["total_score"],
            "skills_score": scores["skills_score"],
            "experience_score": scores["experience_score"],
            "education_score": scores["education_score"],
            "certification_score": scores["certification_score"],
            "explanation": scores["explanation"],
            "badge": scores["badge"]
        })

        rankings.append({
            "candidate_id": candidate["id"],
            "candidate_name": candidate["name"],
            "score": scores["total_score"],
            "skills_score": scores["skills_score"],
            "experience_score": scores["experience_score"],
            "education_score": scores["education_score"],
            "certification_score": scores["certification_score"],
            "explanation": scores["explanation"],
            "badge": scores["badge"]
        })

    # Step 6: Batch-insert all scores
    if score_rows:
        sb.table("scores").insert(score_rows).execute()

    # Sort by score descending
    rankings.sort(key=lambda x: x["score"], reverse=True)

    elapsed = time.monotonic() - start_time
    logger.info(
        f"Matched {len(rankings)} candidates against job '{title}' "
        f"(job_id={job_id}, {elapsed:.1f}s)"
    )

    return {
        "job_id": job_id,
        "requirements": requirements,
        "rankings": rankings
    }
