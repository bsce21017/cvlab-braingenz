"""
CV Evaluation Endpoint — 2-Step Pipeline
Step 1: Batch extract structured candidate profiles from all CVs
Step 2: Rank structured profiles against job description
"""
import logging
import json
import re
import time
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.cv_evaluation import CVEvaluation, TokenUsage
from app.services.llm_handler import llm_handler
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Text extraction imports
import io
try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    from docx import Document as DocxDocument
except ImportError:
    DocxDocument = None


def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """Extract text from PDF or DOCX file bytes."""
    ext = filename.lower().rsplit('.', 1)[-1] if '.' in filename else ''

    if ext == 'pdf' and pdfplumber:
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                texts = []
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        texts.append(text)
                return '\n'.join(texts)
        except Exception as e:
            logger.error(f"PDF extraction failed for {filename}: {e}")
            return ''

    elif ext in ('doc', 'docx') and DocxDocument:
        try:
            doc = DocxDocument(io.BytesIO(file_bytes))
            return '\n'.join([p.text for p in doc.paragraphs if p.text.strip()])
        except Exception as e:
            logger.error(f"DOCX extraction failed for {filename}: {e}")
            return ''

    return ''


def parse_json_response(text: str) -> dict:
    """Robustly parse JSON from AI response."""
    text = text.strip()
    # Remove markdown code fences
    if text.startswith('```'):
        text = text.split('\n', 1)[1].rsplit('```', 1)[0].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON object in text
        match = re.search(r'\{[\s\S]*\}', text)
        if match:
            return json.loads(match.group())
        # Try to find JSON array
        match = re.search(r'\[[\s\S]*\]', text)
        if match:
            return json.loads(match.group())
        raise ValueError("No valid JSON found in AI response")


# ═══════════════════════════════════════════════════════════════
# STEP 1: Batch Skill & Profile Extraction Prompt
# ═══════════════════════════════════════════════════════════════

EXTRACTION_SYSTEM_PROMPT = """You are a precise CV data extraction engine. Your job is to read raw CV text and extract structured candidate profiles.

CRITICAL RULES:
- Extract ONLY information that is EXPLICITLY written in the CV text
- NEVER infer or assume skills based on job titles. Example: "Backend Developer" does NOT automatically mean Python or Node.js unless those words appear in the CV
- If information is missing or unclear, set it to null or empty array
- For skills, only list technologies/tools/frameworks that are explicitly named
- For experience years, calculate from the actual date ranges mentioned, not from assumptions
- Extract company names exactly as written
- For education, extract degree, field, institution, and year if available

OUTPUT FORMAT (Strict JSON array — no markdown, no text outside JSON):

[
  {
    "filename": "exact_filename.pdf",
    "name": "Candidate full name or null if not found",
    "experience_years": 5,
    "current_role": "Most recent job title or null",
    "skills": {
      "programming_languages": ["Python", "JavaScript"],
      "frameworks": ["Django", "React"],
      "databases": ["PostgreSQL", "Redis"],
      "cloud_devops": ["AWS", "Docker"],
      "tools": ["Git", "Jira"],
      "other": ["Agile", "REST APIs"]
    },
    "education": [
      {
        "degree": "BS Computer Science",
        "institution": "University Name",
        "year": "2018"
      }
    ],
    "certifications": ["AWS Certified Solutions Architect"],
    "companies": [
      {
        "name": "Company Name",
        "role": "Software Engineer",
        "duration": "2020-2023",
        "key_achievements": ["Built X that improved Y by Z%"]
      }
    ],
    "total_achievements_quantified": 3,
    "languages_spoken": ["English", "Urdu"],
    "location": "City, Country or null",
    "cv_quality_notes": "Brief note on CV formatting, completeness, any issues"
  }
]

Return one profile per CV. Maintain the exact filename for each."""


# ═══════════════════════════════════════════════════════════════
# STEP 2: Ranking & Evaluation Prompt
# ═══════════════════════════════════════════════════════════════

RANKING_SYSTEM_PROMPT = """You are a Senior Talent Acquisition Director with 20+ years of experience in technical hiring. You specialize in evidence-based candidate ranking and hiring decisions.

You are given:
1. A structured job description
2. Pre-extracted structured candidate profiles (skills, experience, education, achievements)

Your task: Rank the top 3 candidates using rigorous, weighted evaluation.

═══════════════════════════════════════
STEP A: PARSE THE JOB DESCRIPTION
═══════════════════════════════════════

Extract these fields mentally before scoring:
- Job title and seniority level
- Required skills (must-have — dealbreakers if missing)
- Preferred skills (nice-to-have — differentiators)
- Minimum years of experience
- Education requirements
- Industry/domain context
- Location requirements

═══════════════════════════════════════
STEP B: SEMANTIC SKILL MATCHING
═══════════════════════════════════════

When comparing candidate skills to JD requirements, recognize these equivalences:
- React = ReactJS = React.js
- Node = Node.js = NodeJS
- PostgreSQL = Postgres = PG
- MongoDB = Mongo
- Python = Python3
- JavaScript = JS = ECMAScript
- TypeScript = TS
- Docker = Containerization
- Kubernetes = K8s
- AWS = Amazon Web Services
- Azure = Microsoft Azure
- GCP = Google Cloud Platform
- CI/CD = Continuous Integration / Continuous Deployment
- REST = RESTful = REST APIs
- GraphQL = GQL
- TensorFlow = Deep Learning Framework
- PyTorch = Deep Learning Framework
- Machine Learning = ML
- Artificial Intelligence = AI
- Agile = Scrum = Kanban (related but not identical)

═══════════════════════════════════════
STEP C: SCORING FRAMEWORK (Weighted)
═══════════════════════════════════════

Score each candidate 0-100 on these 6 dimensions:

1. HARD SKILLS MATCH (Weight: 25%)
   - Map each required JD skill to candidate's extracted skills
   - Only count skills that are EXPLICITLY in the candidate profile
   - Missing must-have = heavy penalty
   - Missing nice-to-have = minor penalty
   - Extra relevant skills = bonus points

2. EXPERIENCE RELEVANCE & DEPTH (Weight: 25%)
   - Years match vs. JD requirement
   - Role relevance (same domain, similar responsibilities)
   - Career progression (promotions, increasing scope)
   - Quantified achievements (count from profile)
   - Red flags: gaps, job-hopping (<1 year/role)

3. EDUCATION & CERTIFICATIONS (Weight: 15%)
   - Degree relevance and level
   - Certifications that match JD requirements
   - Continuous learning signals

4. ATS KEYWORD MATCH (Weight: 15%)
   - Count exact + semantic keyword matches
   - Industry terminology alignment
   - Natural keyword placement

5. CV QUALITY & PRESENTATION (Weight: 10%)
   - Based on cv_quality_notes from extraction
   - Number of quantified achievements
   - Completeness of information

6. CULTURAL & ROLE FIT (Weight: 10%)
   - Location compatibility
   - Industry domain match
   - Company size/type alignment
   - Career trajectory fit

═══════════════════════════════════════
ANTI-HALLUCINATION RULES
═══════════════════════════════════════

- ONLY use data from the extracted candidate profiles. Do NOT invent skills or experience.
- If a required skill is NOT in the candidate's skill list, mark it as MISSING — do not assume it.
- A "Backend Developer" does NOT automatically know Python, Node.js, or any specific technology unless listed.
- A "Data Scientist" does NOT automatically know TensorFlow unless listed.
- If experience_years is null, do NOT guess — note it as "unknown."
- Every strength claim MUST reference specific data from the profile (company name, skill, achievement).

═══════════════════════════════════════
SCORING GUIDE
═══════════════════════════════════════

90-100: Exceptional. Exceeds all requirements. RARE — only truly outstanding candidates.
80-89:  Strong match. All must-haves met, most nice-to-haves.
70-79:  Good match. Most must-haves met. Interview-worthy.
60-69:  Moderate. Some gaps but transferable skills.
50-59:  Weak. Significant gaps.
Below 50: Poor match.

SCORE DISTRIBUTION RULE:
- Only exceptional candidates should receive scores above 90.
- Most strong candidates should fall between 75 and 88.
- Use the full scale realistically — do NOT cluster all top 3 above 85.
- A mediocre candidate should get 50-65, not 75+.
- There should be meaningful score gaps between ranked candidates (at least 5-8 points).

═══════════════════════════════════════
RELATIVE COMPARISON RULE
═══════════════════════════════════════

After scoring all candidates individually, perform a RELATIVE comparison across candidates.

For each pair of candidates:
- Compare skills depth (breadth vs. depth of relevant skills)
- Compare relevant experience (years, role similarity, industry match)
- Compare alignment with the job description (required vs. nice-to-have coverage)

If two candidates have scores within 5 points, perform deeper comparison and adjust ranking if necessary.

Use these tiebreakers IN ORDER:
1. Depth of relevant experience (years + role match)
2. Direct match with required skills (must-haves coverage)
3. Evidence of measurable achievements (quantified results)
4. Production system experience (real-world, at-scale work)
5. Education relevance (degree + certifications)

Ensure the final ranking reflects the strongest overall candidate RELATIVE to others,
not just the highest individual score. The ranking order matters more than absolute numbers.

═══════════════════════════════════════
OUTPUT FORMAT (Strict JSON)
═══════════════════════════════════════

{
  "job_summary": "One-line: [Title] requiring [top 3 skills], [X]+ years experience",
  "jd_parsed": {
    "required_skills": ["Python", "FastAPI", "PostgreSQL"],
    "preferred_skills": ["Docker", "AWS"],
    "min_experience_years": 3,
    "education_requirement": "BS in CS or equivalent"
  },
  "total_candidates_analyzed": 5,
  "ranked_candidates": [
    {
      "rank": 1,
      "filename": "exact_filename.pdf",
      "candidate_name": "Name from profile",
      "score": 87,
      "confidence": 92,
      "score_breakdown": {
        "hard_skills": 90,
        "experience": 85,
        "education": 80,
        "ats_keywords": 92,
        "presentation": 85,
        "cultural_fit": 82
      },
      "skills_matched": ["Python", "FastAPI", "PostgreSQL", "Docker"],
      "skills_missing": ["Kubernetes"],
      "reasoning": "3-5 sentences with SPECIFIC evidence from profile. Reference exact companies, skills, years, achievements.",
      "why_selected": [
        "5 years Python backend at Systems Limited — directly relevant",
        "Built microservices handling 1M+ requests — proves scalability skills",
        "PostgreSQL + Redis experience matches tech stack exactly",
        "AWS certified — covers cloud requirement"
      ],
      "why_not_others": [
        "Candidate 2 lacks FastAPI experience (only Django)",
        "Candidate 4 has only 1.5 years experience vs required 3"
      ],
      "strengths": [
        "Specific strength with evidence",
        "Another strength",
        "Third strength",
        "Fourth strength",
        "Fifth strength"
      ],
      "gaps": [
        "Specific gap or concern",
        "Another gap if applicable"
      ],
      "hire_recommendation": "Best Match"
    }
  ]
}

hire_recommendation MUST follow this rule based on rank position:
- Rank #1: "Best Match"
- Rank #2: "Recommended"
- Rank #3: "Worth Considering"
These are the ONLY allowed values. All top 3 candidates are worth interviewing since they are the best from the pool.
confidence is 0-100: how confident you are in this ranking (based on data completeness + skill clarity + JD alignment)

Return exactly 3 candidates. Rank best (#1) to third (#3). Every field required."""


@router.post("/evaluate")
async def evaluate_cvs(
    files: List[UploadFile] = File(...),
    job_description: str = Form(...),
    db: Session = Depends(get_db),
):
    """
    2-Step CV Evaluation Pipeline:
    Step 1: Extract structured profiles from all CVs (1 LLM call)
    Step 2: Rank profiles against JD (1 LLM call)
    """
    start_time = time.time()

    # Validate
    if len(files) < 3:
        raise HTTPException(status_code=400, detail="Please upload at least 3 CVs")
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 CVs allowed")
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required")

    logger.info(f"[EVAL] Starting 2-step evaluation: {len(files)} CVs")

    # Create evaluation record
    evaluation = CVEvaluation(
        job_description=job_description[:5000],
        total_cvs=len(files),
        status="processing",
    )
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)

    total_input_tokens = 0
    total_output_tokens = 0

    try:
        # ═══════════════════════════════════════
        # PHASE 1: Text Extraction (no AI)
        # ═══════════════════════════════════════
        cv_texts = []
        for f in files:
            content = await f.read()
            text = extract_text_from_file(content, f.filename or 'unknown.pdf')
            if text.strip():
                cv_texts.append({"filename": f.filename, "text": text[:6000]})
            else:
                cv_texts.append({"filename": f.filename, "text": f"[Could not extract text from {f.filename}]"})
            logger.info(f"[EVAL] Extracted {len(text)} chars from {f.filename}")

        # ═══════════════════════════════════════
        # PHASE 2: Batch Profile Extraction (1 LLM call)
        # ═══════════════════════════════════════
        cv_block = ""
        for i, cv in enumerate(cv_texts, 1):
            cv_block += f"\n{'='*60}\nCV {i}: {cv['filename']}\n{'='*60}\n{cv['text']}\n"

        extraction_prompt = f"""Extract structured candidate profiles from these {len(cv_texts)} CVs.
Return a JSON array with one profile per CV.

{cv_block}"""

        logger.info(f"[EVAL] Step 1: Extracting profiles ({len(extraction_prompt)} chars)")
        step1_result = llm_handler.generate_with_usage(
            prompt=extraction_prompt,
            system_prompt=EXTRACTION_SYSTEM_PROMPT,
            max_tokens=6000,
        )

        total_input_tokens += step1_result["input_tokens"]
        total_output_tokens += step1_result["output_tokens"]

        # Parse extracted profiles
        try:
            profiles = parse_json_response(step1_result["text"])
            if isinstance(profiles, dict) and "profiles" in profiles:
                profiles = profiles["profiles"]
            if not isinstance(profiles, list):
                profiles = [profiles]
        except Exception as e:
            logger.error(f"[EVAL] Profile extraction parse failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to extract candidate profiles")

        logger.info(f"[EVAL] Step 1 complete: extracted {len(profiles)} profiles, tokens: {step1_result['total_tokens']}")

        # Track Step 1 token usage
        db.add(TokenUsage(
            feature="cv_evaluation",
            reference_id=evaluation.id,
            model=step1_result["model"],
            input_tokens=step1_result["input_tokens"],
            output_tokens=step1_result["output_tokens"],
            total_tokens=step1_result["total_tokens"],
            prompt_name="profile_extraction",
            num_cvs=len(files),
        ))

        # ═══════════════════════════════════════
        # PHASE 3: Ranking (1 LLM call)
        # ═══════════════════════════════════════
        ranking_prompt = f"""JOB DESCRIPTION:
{job_description}

EXTRACTED CANDIDATE PROFILES ({len(profiles)} candidates):
{json.dumps(profiles, indent=2, ensure_ascii=False)}

Evaluate all {len(profiles)} candidates against the job description.
Rank the top 3. Return strict JSON only."""

        logger.info(f"[EVAL] Step 2: Ranking candidates ({len(ranking_prompt)} chars)")
        step2_result = llm_handler.generate_with_usage(
            prompt=ranking_prompt,
            system_prompt=RANKING_SYSTEM_PROMPT,
            max_tokens=8000,
        )

        total_input_tokens += step2_result["input_tokens"]
        total_output_tokens += step2_result["output_tokens"]

        # Parse ranking results
        try:
            parsed = parse_json_response(step2_result["text"])
        except Exception as e:
            logger.error(f"[EVAL] Ranking parse failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to parse ranking results")

        logger.info(f"[EVAL] Step 2 complete: ranked candidates, tokens: {step2_result['total_tokens']}")

        # Track Step 2 token usage
        db.add(TokenUsage(
            feature="cv_evaluation",
            reference_id=evaluation.id,
            model=step2_result["model"],
            input_tokens=step2_result["input_tokens"],
            output_tokens=step2_result["output_tokens"],
            total_tokens=step2_result["total_tokens"],
            prompt_name="ranking",
            num_cvs=len(files),
        ))

        # ═══════════════════════════════════════
        # Save Results
        # ═══════════════════════════════════════
        total_all = total_input_tokens + total_output_tokens

        evaluation.status = "completed"
        evaluation.job_description_summary = parsed.get("job_summary", "")[:500]
        evaluation.ranked_results = parsed.get("ranked_candidates", [])
        evaluation.input_tokens = total_input_tokens
        evaluation.output_tokens = total_output_tokens
        evaluation.total_tokens = total_all
        evaluation.model_used = step2_result["model"]
        evaluation.completed_at = datetime.now(timezone.utc)
        db.commit()

        elapsed = time.time() - start_time
        logger.info(f"[EVAL] ✅ Completed in {elapsed:.1f}s | Total tokens: {total_all} (input: {total_input_tokens}, output: {total_output_tokens})")

        return {
            "evaluation_id": evaluation.id,
            "job_description_summary": parsed.get("job_summary", ""),
            "jd_parsed": parsed.get("jd_parsed", {}),
            "total_cvs": len(files),
            "candidate_profiles": profiles,
            "ranked_candidates": parsed.get("ranked_candidates", []),
            "token_usage": {
                "input_tokens": total_input_tokens,
                "output_tokens": total_output_tokens,
                "total_tokens": total_all,
                "step1_tokens": step1_result["total_tokens"],
                "step2_tokens": step2_result["total_tokens"],
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[EVAL] Failed: {e}", exc_info=True)
        evaluation.status = "failed"
        evaluation.error_message = str(e)[:1000]
        db.commit()
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")
