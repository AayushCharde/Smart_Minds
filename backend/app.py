"""
HireMinds AI — Flask API Application.

All routes follow the {success, data, error} response format.
Every route except /api/health is protected by @require_auth.
"""

import os
import uuid
import logging
import time
from datetime import datetime

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

from flask import Flask, request, jsonify, g, Response
from flask_cors import CORS
import json as json_lib

from config import UPLOAD_FOLDER, ALLOWED_EXTENSIONS, MAX_FILE_SIZE, MAX_BATCH_FILES
from models.database import get_supabase
from middleware.auth import require_auth
from services.resume_parser import parse_resume
from services.matcher import match_candidates
from services.rag_engine import delete_candidate_chunks, query_resumes, query_resumes_stream

logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(
    app,
    origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:80",  # Docker Nginx
        "http://localhost",  # Docker Nginx (no port)
    ],
    supports_credentials=True,
)

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ─── Request Lifecycle Hooks ────────────────────────────────────────────────


@app.before_request
def _before_request():
    """Log incoming requests and set timing context."""
    g.request_start = time.monotonic()
    g.request_id = uuid.uuid4().hex[:8]


@app.after_request
def _after_request(response):
    """Log request completion with timing."""
    if hasattr(g, "request_start"):
        duration_ms = (time.monotonic() - g.request_start) * 1000
        # Only log API routes, skip static/health noise
        if request.path.startswith("/api") and request.path != "/api/health":
            logger.info(
                f"[{g.get('request_id', '?')}] "
                f"{request.method} {request.path} → {response.status_code} "
                f"({duration_ms:.0f}ms)"
            )
    return response


# ─── Global Error Handlers ──────────────────────────────────────────────────


@app.errorhandler(400)
def bad_request(e):
    return jsonify({"success": False, "error": str(e.description)}), 400


@app.errorhandler(404)
def not_found(e):
    return jsonify({"success": False, "error": "Resource not found"}), 404


@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"success": False, "error": "Method not allowed"}), 405


@app.errorhandler(500)
def internal_error(e):
    logger.error(f"Unhandled error: {e}", exc_info=True)
    return jsonify({"success": False, "error": "Internal server error"}), 500


# ─── Helpers ────────────────────────────────────────────────────────────────


def _allowed_file(filename):
    """Check if file extension is in the whitelist."""
    return os.path.splitext(filename)[1].lower() in ALLOWED_EXTENSIONS


# ─── HEALTH CHECK ────────────────────────────────────────────────────────────


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"success": True, "data": {"status": "healthy", "service": "HireMinds AI"}})


# ─── UPLOAD RESUMES ──────────────────────────────────────────────────────────


@app.route("/api/upload", methods=["POST"])
@require_auth
def upload_resume():
    user_id = g.user_id

    if "files" not in request.files:
        return jsonify({"success": False, "error": "No files provided"}), 400

    files = request.files.getlist("files")
    if not files:
        return jsonify({"success": False, "error": "No files selected"}), 400

    if len(files) > MAX_BATCH_FILES:
        return jsonify({"success": False, "error": f"Maximum {MAX_BATCH_FILES} files per upload"}), 400

    results = []
    errors = []
    sb = get_supabase()

    for file in files:
        if not file.filename:
            continue

        if not _allowed_file(file.filename):
            errors.append({"filename": file.filename, "error": "Unsupported file type. Use PDF, DOCX, or TXT."})
            continue

        # Check file size
        file.seek(0, 2)
        size = file.tell()
        file.seek(0)
        if size > MAX_FILE_SIZE:
            errors.append({"filename": file.filename, "error": f"File exceeds {MAX_FILE_SIZE // (1024*1024)}MB limit"})
            continue

        file_path = None
        try:
            # Save file with UUID prefix to prevent collisions
            file_id = str(uuid.uuid4())
            safe_filename = f"{file_id}_{file.filename}"
            file_path = os.path.join(UPLOAD_FOLDER, safe_filename)
            file.save(file_path)

            # Parse resume (regex-based, no LLM)
            parsed = parse_resume(file_path)

            # Save to Supabase
            candidate_id = str(uuid.uuid4())
            sb.table("candidates").insert(
                {
                    "id": candidate_id,
                    "user_id": user_id,
                    "name": parsed.get("name", "Unknown"),
                    "email": parsed.get("email"),
                    "phone": parsed.get("phone"),
                    "skills": parsed.get("skills", []),
                    "experience_years": parsed.get("experience_years", 0),
                    "education": parsed.get("education"),
                    "certifications": parsed.get("certifications", []),
                    "summary": parsed.get("summary"),
                    "raw_text": parsed.get("raw_text"),
                    "filename": file.filename,
                    "file_path": file_path,
                    "language": parsed.get("language", "en"),
                }
            ).execute()

            results.append(
                {
                    "candidate_id": candidate_id,
                    "name": parsed.get("name"),
                    "email": parsed.get("email"),
                    "skills": parsed.get("skills", []),
                    "experience_years": parsed.get("experience_years", 0),
                    "education": parsed.get("education"),
                    "certifications": parsed.get("certifications", []),
                    "summary": parsed.get("summary"),
                    "filename": file.filename,
                }
            )

        except Exception as e:
            logger.error(f"Failed to process {file.filename}: {e}", exc_info=True)
            errors.append({"filename": file.filename, "error": str(e)})
            # Clean up saved file on failure
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except OSError:
                    pass

    return jsonify(
        {
            "success": True,
            "data": {"processed": results, "errors": errors, "total": len(results), "failed": len(errors)},
        }
    )


# ─── CANDIDATES ──────────────────────────────────────────────────────────────


@app.route("/api/candidates", methods=["GET"])
@require_auth
def list_candidates():
    user_id = g.user_id
    sb = get_supabase()

    sort = request.args.get("sort", "created_at")
    order = request.args.get("order", "desc")
    skill_filter = request.args.get("skill")

    # Whitelist sort columns to prevent injection
    allowed_sorts = {"name", "experience_years", "created_at", "email"}
    if sort not in allowed_sorts:
        sort = "created_at"
    descending = order.lower() == "desc"

    # Exclude raw_text from list view for performance
    query = (
        sb.table("candidates")
        .select(
            "id, user_id, name, email, phone, skills, experience_years, education, certifications, summary, filename, file_path, language, created_at"
        )
        .eq("user_id", user_id)
        .order(sort, desc=descending)
    )
    candidates = query.execute().data

    result = []
    for candidate in candidates:
        # Filter by skill if specified (case-insensitive)
        if skill_filter:
            skills = candidate.get("skills") or []
            skill_lower = skill_filter.lower()
            if not any(skill_lower in s.lower() for s in skills):
                continue
        result.append(candidate)

    return jsonify({"success": True, "data": result})


@app.route("/api/candidates/<candidate_id>", methods=["GET"])
@require_auth
def get_candidate(candidate_id):
    user_id = g.user_id
    sb = get_supabase()

    candidate = (
        sb.table("candidates").select("*").eq("id", candidate_id).eq("user_id", user_id).maybe_single().execute().data
    )

    if not candidate:
        return jsonify({"success": False, "error": "Candidate not found"}), 404

    return jsonify({"success": True, "data": candidate})


@app.route("/api/candidates/<candidate_id>", methods=["DELETE"])
@require_auth
def delete_candidate(candidate_id):
    user_id = g.user_id
    sb = get_supabase()

    candidate = (
        sb.table("candidates")
        .select("id, file_path")
        .eq("id", candidate_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
        .data
    )

    if not candidate:
        return jsonify({"success": False, "error": "Candidate not found"}), 404

    # Delete from any search index (no-op currently)
    delete_candidate_chunks(candidate_id)

    # Delete file from disk
    file_path = candidate.get("file_path")
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except OSError as e:
            logger.warning(f"Could not delete file {file_path}: {e}")

    # Delete candidate (scores cascade automatically via FK)
    sb.table("candidates").delete().eq("id", candidate_id).execute()

    return jsonify({"success": True, "data": {"message": "Candidate deleted"}})


# ─── JOB MATCHING ────────────────────────────────────────────────────────────


@app.route("/api/match", methods=["POST"])
@require_auth
def match_job():
    user_id = g.user_id
    data = request.get_json()

    if not data or not data.get("description"):
        return jsonify({"success": False, "error": "Job description is required"}), 400

    title = data.get("title", "Untitled Job")
    description = data["description"]

    # Sanity check — description shouldn't be too short
    if len(description.strip()) < 20:
        return jsonify({"success": False, "error": "Job description is too short. Please provide more detail."}), 400

    try:
        result = match_candidates(user_id, title, description)
        return jsonify({"success": True, "data": result})
    except Exception as e:
        logger.error(f"Matching failed for job '{title}': {e}", exc_info=True)
        return jsonify({"success": False, "error": f"Matching failed: {str(e)}"}), 500


@app.route("/api/rankings/<job_id>", methods=["GET"])
@require_auth
def get_rankings(job_id):
    user_id = g.user_id
    sb = get_supabase()

    # Verify job belongs to user
    job = sb.table("jobs").select("*").eq("id", job_id).eq("user_id", user_id).maybe_single().execute().data
    if not job:
        return jsonify({"success": False, "error": "Job not found"}), 404

    # Use RPC for efficient JOIN query
    rankings = sb.rpc("get_rankings", {"jid": job_id}).execute().data

    formatted = [
        {
            "candidate_id": s["candidate_id"],
            "candidate_name": s["candidate_name"],
            "score": s["total_score"],
            "skills_score": s["skills_score"],
            "experience_score": s["experience_score"],
            "education_score": s["education_score"],
            "certification_score": s["certification_score"],
            "explanation": s["explanation"],
            "badge": s["badge"],
        }
        for s in rankings
    ]

    return jsonify(
        {
            "success": True,
            "data": {
                "job_id": job_id,
                "title": job["title"],
                "requirements": job.get("requirements") or {},
                "rankings": formatted,
            },
        }
    )


# ─── RAG CHAT ────────────────────────────────────────────────────────────────


@app.route("/api/ask", methods=["POST"])
@require_auth
def ask_question():
    user_id = g.user_id
    data = request.get_json()

    if not data or not data.get("question"):
        return jsonify({"success": False, "error": "Question is required"}), 400

    question = data["question"].strip()
    if len(question) < 2:
        return jsonify({"success": False, "error": "Question is too short"}), 400

    conversation_id = data.get("conversation_id")
    sb = get_supabase()

    # Create or validate conversation
    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        title = question[:50] + "..." if len(question) > 50 else question
        sb.table("conversations").insert({"id": conversation_id, "user_id": user_id, "title": title}).execute()
    else:
        conv = (
            sb.table("conversations")
            .select("id")
            .eq("id", conversation_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
            .data
        )
        if not conv:
            return jsonify({"success": False, "error": "Conversation not found"}), 404

    # Get conversation history
    history_rows = (
        sb.table("messages")
        .select("role, content")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .execute()
        .data
    )
    conversation_history = [{"role": h["role"], "content": h["content"]} for h in history_rows]

    # Save user message
    sb.table("messages").insert(
        {"id": str(uuid.uuid4()), "conversation_id": conversation_id, "role": "user", "content": question}
    ).execute()

    try:
        result = query_resumes(user_id, question, conversation_history)

        # Save assistant message
        sb.table("messages").insert(
            {
                "id": str(uuid.uuid4()),
                "conversation_id": conversation_id,
                "role": "assistant",
                "content": result["answer"],
                "sources": result["sources"],
            }
        ).execute()

        # Touch conversation updated_at
        sb.table("conversations").update({"updated_at": datetime.utcnow().isoformat()}).eq(
            "id", conversation_id
        ).execute()

        return jsonify(
            {
                "success": True,
                "data": {"answer": result["answer"], "sources": result["sources"], "conversation_id": conversation_id},
            }
        )

    except Exception as e:
        logger.error(f"RAG query failed: {e}", exc_info=True)
        return jsonify({"success": False, "error": f"Failed to process question: {str(e)}"}), 500


@app.route("/api/ask-stream", methods=["POST"])
@require_auth
def ask_question_stream():
    """Streaming RAG endpoint — returns Server-Sent Events for real-time token display."""
    user_id = g.user_id
    data = request.get_json()

    if not data or not data.get("question"):
        return jsonify({"success": False, "error": "Question is required"}), 400

    question = data["question"].strip()
    if len(question) < 2:
        return jsonify({"success": False, "error": "Question is too short"}), 400

    conversation_id = data.get("conversation_id")
    think = data.get("think", True)  # Default: thinking ON for quality

    sb = get_supabase()

    # Create or validate conversation
    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        title = question[:50] + "..." if len(question) > 50 else question
        sb.table("conversations").insert({"id": conversation_id, "user_id": user_id, "title": title}).execute()
    else:
        conv = (
            sb.table("conversations")
            .select("id")
            .eq("id", conversation_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
            .data
        )
        if not conv:
            return jsonify({"success": False, "error": "Conversation not found"}), 404

    # Get conversation history
    history_rows = (
        sb.table("messages")
        .select("role, content")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .execute()
        .data
    )
    conversation_history = [{"role": h["role"], "content": h["content"]} for h in history_rows]

    # Save user message
    sb.table("messages").insert(
        {"id": str(uuid.uuid4()), "conversation_id": conversation_id, "role": "user", "content": question}
    ).execute()

    def generate():
        full_answer = ""
        sources = []

        try:
            for chunk_type, chunk_data in query_resumes_stream(user_id, question, conversation_history, think=think):
                if chunk_type == "sources":
                    sources = chunk_data
                    yield f"data: {json_lib.dumps({'type': 'sources', 'sources': chunk_data, 'conversation_id': conversation_id})}\n\n"

                elif chunk_type == "token":
                    full_answer += chunk_data
                    yield f"data: {json_lib.dumps({'type': 'token', 'token': chunk_data})}\n\n"

                elif chunk_type == "done":
                    # Save complete assistant message
                    sb.table("messages").insert(
                        {
                            "id": str(uuid.uuid4()),
                            "conversation_id": conversation_id,
                            "role": "assistant",
                            "content": full_answer,
                            "sources": sources,
                        }
                    ).execute()
                    sb.table("conversations").update({"updated_at": datetime.utcnow().isoformat()}).eq(
                        "id", conversation_id
                    ).execute()

                    yield f"data: {json_lib.dumps({'type': 'done', 'conversation_id': conversation_id})}\n\n"

        except Exception as e:
            logger.error(f"Stream error: {e}", exc_info=True)
            yield f"data: {json_lib.dumps({'type': 'error', 'error': str(e)})}\n\n"

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.route("/api/conversations", methods=["GET"])
@require_auth
def list_conversations():
    user_id = g.user_id
    sb = get_supabase()
    conversations = (
        sb.table("conversations").select("*").eq("user_id", user_id).order("updated_at", desc=True).execute().data
    )
    return jsonify({"success": True, "data": conversations})


@app.route("/api/conversations/<conversation_id>", methods=["GET"])
@require_auth
def get_conversation(conversation_id):
    user_id = g.user_id
    sb = get_supabase()

    conv = (
        sb.table("conversations")
        .select("*")
        .eq("id", conversation_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
        .data
    )
    if not conv:
        return jsonify({"success": False, "error": "Conversation not found"}), 404

    messages = (
        sb.table("messages").select("*").eq("conversation_id", conversation_id).order("created_at").execute().data
    )

    for msg in messages:
        if msg.get("sources") is None:
            msg["sources"] = []

    return jsonify({"success": True, "data": {"conversation": conv, "messages": messages}})


@app.route("/api/conversations/<conversation_id>", methods=["DELETE"])
@require_auth
def delete_conversation(conversation_id):
    user_id = g.user_id
    sb = get_supabase()

    conv = (
        sb.table("conversations")
        .select("id")
        .eq("id", conversation_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
        .data
    )
    if not conv:
        return jsonify({"success": False, "error": "Conversation not found"}), 404

    # Delete conversation (messages cascade automatically via FK)
    sb.table("conversations").delete().eq("id", conversation_id).execute()

    return jsonify({"success": True, "data": {"message": "Conversation deleted"}})


# ─── DASHBOARD STATS ─────────────────────────────────────────────────────────


@app.route("/api/stats", methods=["GET"])
@require_auth
def get_stats():
    """
    Dashboard analytics — aggregates multiple metrics.

    Uses Supabase RPC functions for expensive aggregations and minimizes
    the number of sequential queries where possible.
    """
    user_id = g.user_id
    sb = get_supabase()

    try:
        # Core counts
        candidates_resp = sb.table("candidates").select("id", count="exact").eq("user_id", user_id).execute()
        total_resumes = len(candidates_resp.data)

        jobs_resp = sb.table("jobs").select("id", count="exact").eq("user_id", user_id).execute()
        jobs_matched = len(jobs_resp.data)

        # Score aggregations (single query for strong_matches + scored_candidates)
        scores_resp = sb.table("scores").select("id, candidate_id, total_score").execute()
        all_scores = scores_resp.data or []
        strong_matches = sum(1 for s in all_scores if s.get("total_score", 0) >= 80)
        scored_candidates = len(set(s["candidate_id"] for s in all_scores)) if all_scores else 0

        # RPC aggregations
        avg_score_result = sb.rpc("get_avg_match_score", {"uid": user_id}).execute().data
        avg_score = avg_score_result if isinstance(avg_score_result, (int, float)) else 0

        total_qas_result = sb.rpc("get_total_qas", {"uid": user_id}).execute().data
        total_qas = total_qas_result if isinstance(total_qas_result, (int, float)) else 0

        # Recent activity
        recent_candidates = (
            sb.table("candidates")
            .select("id, name, filename, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(5)
            .execute()
            .data
        )

        recent_jobs = (
            sb.table("jobs")
            .select("id, title, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(5)
            .execute()
            .data
        )

        # Top candidates via RPC
        top_candidates_raw = sb.rpc("get_top_candidates", {"uid": user_id}).execute().data

        # Build activity feed
        activity = []
        for c in recent_candidates:
            activity.append(
                {"type": "upload", "description": f"Uploaded resume: {c['name']}", "timestamp": c["created_at"]}
            )
        for j in recent_jobs:
            activity.append({"type": "match", "description": f"Job match: {j['title']}", "timestamp": j["created_at"]})
        activity.sort(key=lambda x: x["timestamp"] or "", reverse=True)

        top = [
            {
                "id": tc["id"],
                "name": tc["name"],
                "skills": tc.get("skills") or [],
                "avg_score": round(tc["avg_score"], 1) if tc.get("avg_score") else 0,
            }
            for tc in top_candidates_raw
        ]

        return jsonify(
            {
                "success": True,
                "data": {
                    "total_resumes": total_resumes,
                    "jobs_matched": jobs_matched,
                    "strong_matches": strong_matches,
                    "scored_candidates": scored_candidates,
                    "avg_match_score": round(avg_score, 1) if avg_score else 0,
                    "total_qas": total_qas,
                    "recent_activity": activity[:10],
                    "top_candidates": top,
                },
            }
        )

    except Exception as e:
        logger.error(f"Failed to load stats: {e}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to load dashboard stats"}), 500


# ─── MAIN ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    logger.info("Starting HireMinds AI backend on port 8000")
    app.run(host="0.0.0.0", port=8000, debug=True, use_reloader=False, threaded=True)
