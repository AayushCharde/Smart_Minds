# /add-prompt — Create a New LLM Prompt Template

When the user runs `/add-prompt`, create a new prompt template for use with the configured LLM (default: Llama 3.3 70B via Groq).

## Instructions

Ask the user for:
1. **Prompt name** (e.g., "summarize_candidate")
2. **Purpose** (what should the LLM do)
3. **Input variables** (what placeholders are needed, e.g., `{candidate_profile}`)
4. **Output format** (free text, JSON, or structured)

### Prompt Template Rules

1. **File location**: `backend/prompts/<name>.txt`
2. **Placeholders** use `{variable_name}` syntax (Jinja-style)
3. **JSON output prompts** must end with: `Respond ONLY with valid JSON. No markdown, no explanation.`
4. **Free text prompts** should include citation rules if pulling from resume data
5. **Always specify** what the LLM should do if information is missing

### Template Structure

```text
You are a [role description].
[Task description with specific instructions.]

Rules:
1. [Rule about handling missing data]
2. [Rule about output format]
3. [Rule about specificity]
4. [Additional constraints]

[Input section with placeholders]:
{variable_1}

{variable_2}
```

### Service Integration

After creating the prompt template, also create or update the service function that uses it:

```python
import os
from services.llm_client import call_llm, call_llm_json

PROMPTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'prompts')

def new_function(input_data):
    with open(os.path.join(PROMPTS_DIR, '<name>.txt'), 'r') as f:
        prompt_template = f.read()

    prompt = prompt_template.replace("{variable_1}", input_data)

    # Use call_llm_json for JSON output, call_llm for text
    # (call_qwen* aliases still work for backward compatibility)
    result = call_llm_json(prompt, system_prompt="...")
    return result
```

### Function Selection Guide

| Use Case | Function |
|---|---|
| Data extraction (resume, JD) | `call_llm_json(...)` |
| Scoring / evaluation | `call_llm_json(...)` |
| Free text generation | `call_llm(...)` |
| Simple classification | `call_llm(...)` |

### Existing Prompts (for reference):
- `extract_resume.txt` — parse resume text into structured JSON
- `extract_jd.txt` — parse job description into requirements JSON
- `score_candidate.txt` — score candidate against job (4 criteria, out of 100)
- `rag_qa.txt` — RAG Q&A with source citations
