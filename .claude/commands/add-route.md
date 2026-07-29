# /add-route — Scaffold a New Flask API Endpoint

When the user runs `/add-route`, generate a new Flask API route that follows all project conventions.

## Instructions

Ask the user for:
1. **Route path** (e.g., `/api/jobs`)
2. **HTTP method** (GET, POST, PUT, DELETE)
3. **Description** (what the endpoint does)

Then generate a route that follows these **mandatory conventions**:

### Route Template

```python
@app.route("/api/<path>", methods=["<METHOD>"])
@require_auth
def <function_name>():
    user_id = g.user_id
    db = get_db()

    # ... business logic here ...
    # ALL queries must include: WHERE user_id = ?

    db.close()

    return jsonify({
        "success": True,
        "data": result
    })
```

### Checklist (every route MUST have):
- [ ] `@require_auth` decorator (unless it's a health check)
- [ ] `user_id = g.user_id` at the top
- [ ] All SQL queries filter by `WHERE user_id = ?`
- [ ] Response uses `{"success": bool, "data": ..., "error": ...}` format
- [ ] Error responses include appropriate HTTP status codes (400, 404, 500)
- [ ] `db.close()` after database operations
- [ ] Input validation with descriptive error messages

### Where to add:
- Add the route to `backend/app.py` in the appropriate section
- If the route needs a new service function, add it to the relevant file in `backend/services/`
- Update the API Routes section in `CLAUDE.md`

### Example output for `/add-route` with path `/api/jobs`, method `GET`:

```python
@app.route("/api/jobs", methods=["GET"])
@require_auth
def list_jobs():
    user_id = g.user_id
    db = get_db()

    jobs = db.execute(
        "SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,)
    ).fetchall()
    db.close()

    result = []
    for j in jobs:
        job = dict(j)
        job["requirements"] = json.loads(job["requirements"]) if job["requirements"] else {}
        result.append(job)

    return jsonify({"success": True, "data": result})
```
