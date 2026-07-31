"""
Resume parser — regex-based extraction from PDF, DOCX, and TXT files.

No LLM dependency — instant results, zero external API calls.
Extracts: name, email, phone, skills (75+ tech terms), experience years,
education, certifications. Full raw_text is preserved for RAG search.
"""

import os
import re
import logging

logger = logging.getLogger(__name__)

# Pre-compiled regex patterns for extraction
_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
# Must start and end on a digit; up to 21 chars total so formatted numbers
# like "+1 (415) 555-0182" (17 chars) aren't truncated mid-number.
_PHONE_RE = re.compile(r"\+?\(?\d[\d\s\-\(\)]{5,19}\d")
_PHONE_ONLY_RE = re.compile(r"^[\+\d\s\-\(\)]+$")

_EXP_PATTERNS = [
    re.compile(r"(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)", re.IGNORECASE),
    re.compile(r"(?:experience|exp)\s*(?:of\s+)?(\d+)\+?\s*(?:years?|yrs?)", re.IGNORECASE),
    re.compile(r"(\d+)\+?\s*(?:years?|yrs?)\s+(?:in|of)", re.IGNORECASE),
]
_DATE_RANGE_RE = re.compile(r"20(\d{2})\s*[-\u2013\u2014to]+\s*(?:20(\d{2})|[Pp]resent|[Cc]urrent)")

_EDU_RE = re.compile(
    r"(\b(?:B\.?Tech|B\.?Sc|B\.?A|B\.?E|B\.?Com|B\.S|M\.?Tech|M\.?Sc|M\.?A|M\.?BA|M\.?Com|M\.S|Ph\.?D|MBA|Bachelor|Master|Doctor)\b[^\n]{0,100})",
    re.IGNORECASE,
)
_EDU_SECTION_RE = re.compile(r"education[:\s]*\n\s*([^\n]+)", re.IGNORECASE)

# Known skills list — lowercase versions pre-computed for O(1) matching
_KNOWN_SKILLS = [
    "Python",
    "Java",
    "JavaScript",
    "TypeScript",
    "C++",
    "C#",
    "Go",
    "Rust",
    "Ruby",
    "PHP",
    "Swift",
    "Kotlin",
    "React",
    "Angular",
    "Vue",
    "Next.js",
    "Node.js",
    "Express",
    "Django",
    "Flask",
    "Spring Boot",
    "FastAPI",
    "AWS",
    "Azure",
    "GCP",
    "Docker",
    "Kubernetes",
    "Terraform",
    "Jenkins",
    "CI/CD",
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Redis",
    "Elasticsearch",
    "SQL",
    "NoSQL",
    "Git",
    "Linux",
    "REST API",
    "GraphQL",
    "Microservices",
    "Agile",
    "Scrum",
    "Machine Learning",
    "Deep Learning",
    "TensorFlow",
    "PyTorch",
    "NLP",
    "HTML",
    "CSS",
    "TailwindCSS",
    "Bootstrap",
    "Power BI",
    "Tableau",
    "Excel",
    "Pandas",
    "NumPy",
    "Spark",
    ".NET",
    "Spring",
    "Hibernate",
    "Maven",
    "Gradle",
    "Redux",
    "Prisma",
    "Nginx",
    "Postman",
    "Cypress",
    "Jest",
    "Selenium",
    "Firebase",
    "Supabase",
    "Vercel",
    "Heroku",
]


def _compile_skill(skill: str) -> re.Pattern:
    """Word-bounded, case-insensitive pattern. Custom boundaries instead of \\b
    so skills containing +, #, . (C++, C#, .NET, Node.js) match correctly, and
    substrings don't false-positive (Java != JavaScript, Go != Django)."""
    return re.compile(r"(?<![a-z0-9+#])" + re.escape(skill.lower()) + r"(?![a-z0-9+#])", re.IGNORECASE)


# Skills that are common English words — require capitalization as written on
# resumes, so "willing to go", "swift delivery", "express interest" don't match.
_AMBIGUOUS_SKILL_PATTERNS = {
    "Go": re.compile(r"(?<![A-Za-z0-9+#])(?:Go|Golang)(?![a-z0-9+#])"),
    "Swift": re.compile(r"(?<![A-Za-z0-9+#])Swift(?![a-z0-9+#])"),
    "Express": re.compile(r"(?<![A-Za-z0-9+#])Express(?:\.js)?(?![a-z0-9+#])"),
    "Spring": re.compile(r"(?<![A-Za-z0-9+#])Spring(?![a-z0-9+#])"),
}

_SKILL_PATTERNS = [(skill, _AMBIGUOUS_SKILL_PATTERNS.get(skill) or _compile_skill(skill)) for skill in _KNOWN_SKILLS]

_CERT_KEYWORDS = frozenset(
    [
        "certified",
        "certification",
        "certificate",
        "aws ",
        "pmp",
        "scrum master",
        "cissp",
        "ccna",
        "oracle",
        "comptia",
        "itil",
    ]
)


def extract_text(file_path: str) -> str:
    """Extract raw text from PDF, DOCX, or TXT file."""
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        from pypdf import PdfReader

        try:
            reader = PdfReader(file_path)
            pages = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    pages.append(page_text)
            return "\n".join(pages).strip()
        except Exception as e:
            logger.error(f"PDF extraction failed for {file_path}: {e}")
            raise ValueError(f"Failed to read PDF: {e}") from e

    elif ext == ".docx":
        from docx import Document

        try:
            doc = Document(file_path)
            return "\n".join(para.text for para in doc.paragraphs).strip()
        except Exception as e:
            logger.error(f"DOCX extraction failed for {file_path}: {e}")
            raise ValueError(f"Failed to read DOCX: {e}") from e

    elif ext == ".txt":
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read().strip()
        except Exception as e:
            logger.error(f"TXT extraction failed for {file_path}: {e}")
            raise ValueError(f"Failed to read text file: {e}") from e

    else:
        raise ValueError(f"Unsupported file type: {ext}")


def _extract_email(text: str):
    """Extract first email address found in text."""
    match = _EMAIL_RE.search(text)
    return match.group(0) if match else None


def _extract_phone(text: str):
    """Extract first valid phone number (7+ digits)."""
    match = _PHONE_RE.search(text)
    if match:
        phone = match.group(0).strip()
        if sum(c.isdigit() for c in phone) >= 7:
            return phone
    return None


def _extract_name(text: str):
    """Extract candidate name from the first few lines of the resume."""
    lines = text.strip().split("\n")
    for line in lines[:5]:
        line = line.strip()
        if not line or "@" in line or "http" in line.lower():
            continue
        if _PHONE_ONLY_RE.match(line):
            continue
        words = line.split()
        if 1 <= len(words) <= 6:
            if words[0][0:1].isupper():
                return line
    return None


def _extract_skills(text: str):
    """Match known tech skills against resume text (word-bounded)."""
    return [skill for skill, pattern in _SKILL_PATTERNS if pattern.search(text)]


def _extract_experience_years(text: str):
    """Extract years of experience from explicit mentions or date ranges."""
    # Pattern: "5 years of experience"
    for pattern in _EXP_PATTERNS:
        match = pattern.search(text)
        if match:
            return int(match.group(1))

    # Count from date ranges: 2018-2023
    date_ranges = _DATE_RANGE_RE.findall(text)
    if date_ranges:
        total = 0
        for start, end in date_ranges:
            start_yr = int(start)
            end_yr = int(end) if end else 26  # Current year approximation
            total += max(0, end_yr - start_yr)
        return total

    return 0


def _extract_education(text: str):
    """Extract education information (degree + institution)."""
    match = _EDU_RE.search(text)
    if match:
        return match.group(1).strip()[:200]

    # Fallback: look for "Education:" section
    match = _EDU_SECTION_RE.search(text)
    if match:
        return match.group(1).strip()[:200]

    return None


_SECTION_HEADER_RE = re.compile(r"^[A-Z][A-Z\s&/]{2,40}:?$")  # e.g. CERTIFICATIONS, WORK EXPERIENCE
_CERT_HEADER_RE = re.compile(r"^certifications?\s*:?\s*$", re.IGNORECASE)


def _extract_certifications(text: str):
    """Extract certification lines from resume text.

    Prefers an explicit CERTIFICATIONS section (lines until the next section
    header); falls back to a keyword scan that skips header lines.
    """
    lines = text.split("\n")

    # Preferred: explicit CERTIFICATIONS section
    for i, line in enumerate(lines):
        if _CERT_HEADER_RE.match(line.strip()):
            certs = []
            for nxt in lines[i + 1 :]:
                stripped = nxt.strip()
                if not stripped:
                    if certs:
                        break  # blank line after content ends the section
                    continue
                if _SECTION_HEADER_RE.match(stripped):
                    break  # next section begins
                if 3 < len(stripped) < 150:
                    certs.append(stripped.lstrip("-•* ").strip())
                if len(certs) == 10:
                    break
            if certs:
                return certs

    # Fallback: keyword scan, skipping section-header lines
    certs = []
    for line in lines:
        stripped = line.strip()
        if _SECTION_HEADER_RE.match(stripped) or _CERT_HEADER_RE.match(stripped):
            continue
        line_lower = stripped.lower()
        if any(kw in line_lower for kw in _CERT_KEYWORDS):
            if 10 < len(stripped) < 150:
                certs.append(stripped.lstrip("-•* ").strip())
    return certs[:10]


def parse_resume(file_path: str) -> dict:
    """
    Extract text from file and parse with fast regex-based extraction.

    No LLM dependency — instant results, no memory issues.
    Full raw_text is saved for RAG search later.

    Raises ValueError if file cannot be parsed or contains too little text.
    """
    raw_text = extract_text(file_path)

    if not raw_text or len(raw_text.strip()) < 20:
        raise ValueError("Could not extract meaningful text from file")

    name = _extract_name(raw_text) or "Unknown Candidate"
    email = _extract_email(raw_text)
    phone = _extract_phone(raw_text)
    skills = _extract_skills(raw_text)
    experience_years = _extract_experience_years(raw_text)
    education = _extract_education(raw_text)
    certifications = _extract_certifications(raw_text)

    # Brief summary from first lines
    first_lines = " ".join(raw_text[:300].split("\n")[:3]).strip()
    summary = first_lines[:200] if first_lines else name

    logger.debug(f"Parsed resume: {name}, {len(skills)} skills, " f"{experience_years}yr exp, {len(raw_text)} chars")

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "skills": skills,
        "experience_years": experience_years,
        "education": education,
        "certifications": certifications,
        "summary": summary,
        "language": "en",
        "raw_text": raw_text,
    }
