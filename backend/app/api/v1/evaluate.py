"""
CV Evaluation Endpoint
Upload multiple CVs + job description, AI ranks top 3
"""
import logging
import json
import time
from typing import List
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


EVALUATION_SYSTEM_PROMPT = """You are a Senior Talent Acquisition Director with 20+ years of experience in technical hiring across Fortune 500 companies. You specialize in CV screening, candidate ranking, and evidence-based hiring decisions.

YOUR TASK: Evaluate multiple candidate CVs against a specific job description. Produce a rigorous, data-driven ranking of the top 3 candidates.

═══════════════════════════════════════
EVALUATION FRAMEWORK (Weighted Scoring)
═══════════════════════════════════════

Score each candidate on these 6 dimensions. The final score is the weighted average.

1. HARD SKILLS MATCH (Weight: 25%)
   - Map each required skill from the JD to evidence in the CV
   - Distinguish between: explicitly listed, demonstrated through projects, implied through experience, or absent
   - Penalize missing "must-have" skills heavily; "nice-to-have" gaps are minor
   - Award bonus points for skills beyond the JD that add value to the role

2. EXPERIENCE RELEVANCE & DEPTH (Weight: 25%)
   - Years of relevant experience vs. JD requirement (exact match = 100%, ±2 years = partial credit)
   - Quality of experience: relevant industry, company tier, role responsibilities
   - Progression trajectory: promotions, increasing scope, leadership growth
   - Quantified achievements (revenue impact, team size, system scale, percentages)
   - Penalize: career gaps >1 year without explanation, frequent job-hopping (<1 year per role)

3. EDUCATION & CERTIFICATIONS (Weight: 15%)
   - Degree relevance and level vs. JD requirement
   - Institution reputation (tier-1, tier-2, other)
   - Relevant certifications (current vs. expired)
   - Continuous learning signals (recent courses, bootcamps, conferences)

4. ATS KEYWORD OPTIMIZATION (Weight: 15%)
   - Count exact keyword matches between JD and CV
   - Identify semantic matches (synonyms, related terms)
   - Check for industry-standard terminology
   - Evaluate keyword density and natural placement (not keyword-stuffed)

5. CV PRESENTATION & COMMUNICATION (Weight: 10%)
   - Clarity and structure of the CV
   - Use of action verbs and quantified results
   - Appropriate length and formatting
   - Grammar, spelling, and professional tone
   - Tailoring signals (CV appears customized vs. generic)

6. CULTURAL & ROLE FIT INDICATORS (Weight: 10%)
   - Alignment with company type/size mentioned in JD
   - Location/timezone compatibility
   - Industry domain experience
   - Soft skills evidence (leadership, collaboration, communication)
   - Career trajectory alignment with the role's growth path

═══════════════════════════════════════
RANKING METHODOLOGY
═══════════════════════════════════════

Step 1: Parse the job description and extract:
  - Job title, seniority level, department
  - Must-have requirements (hard dealbreakers)
  - Nice-to-have requirements (differentiators)
  - Key responsibilities
  - Industry/domain context

Step 2: For EACH candidate CV:
  - Extract all relevant data points
  - Score each of the 6 dimensions (0-100)
  - Calculate weighted final score
  - Identify top 3-5 strengths with SPECIFIC evidence from the CV
  - Identify top 2-3 gaps or concerns
  - Note any red flags (fabrication signals, inconsistencies, unexplained gaps)

Step 3: Compare candidates HEAD-TO-HEAD:
  - For close scores (within 5 points), do pairwise comparison
  - Consider overall risk profile (high-potential-high-risk vs. safe-but-average)
  - Break ties using: experience depth > skills breadth > education > presentation

Step 4: Produce final ranking with confidence level

═══════════════════════════════════════
SCORING GUIDE
═══════════════════════════════════════

90-100: Exceptional match. Exceeds requirements. Strong hire recommendation.
80-89:  Strong match. Meets all must-haves, most nice-to-haves. Recommended.
70-79:  Good match. Meets most must-haves. Worth interviewing.
60-69:  Moderate match. Some gaps but transferable skills present.
50-59:  Weak match. Significant gaps in key areas.
Below 50: Poor match. Does not meet minimum requirements.

═══════════════════════════════════════
CRITICAL RULES
═══════════════════════════════════════

- NEVER fabricate or assume information not present in the CV
- If a CV has unreadable/missing text, note it and score based on available data only
- Be objective — do not favor based on name, gender, ethnicity, or age signals
- Provide SPECIFIC evidence from the CV for every claim (quote bullet points, mention exact skills)
- If two candidates are genuinely equal, say so and explain the tiebreaker
- Scores must reflect reality — do not inflate. A mediocre CV should score 50-65, not 75+

═══════════════════════════════════════
OUTPUT FORMAT (Strict JSON — no markdown, no text outside JSON)
═══════════════════════════════════════

{
  "job_summary": "One-line summary: [Title] at [seniority] level requiring [top 3 skills]",
  "total_candidates_analyzed": 5,
  "ranked_candidates": [
    {
      "rank": 1,
      "filename": "exact_filename.pdf",
      "score": 87,
      "score_breakdown": {
        "hard_skills": 90,
        "experience": 85,
        "education": 80,
        "ats_keywords": 92,
        "presentation": 85,
        "cultural_fit": 82
      },
      "reasoning": "Detailed 3-5 sentence explanation of why this candidate is ranked #1. Reference SPECIFIC items from their CV — job titles, companies, skills, achievements, years. Explain what makes them the strongest match compared to other candidates.",
      "strengths": [
        "Specific strength with evidence from CV",
        "Another strength with evidence",
        "Third strength with evidence",
        "Fourth strength with evidence",
        "Fifth strength with evidence"
      ],
      "gaps": [
        "Specific gap or concern",
        "Another gap if applicable"
      ],
      "hire_recommendation": "Strong Hire / Hire / Lean Hire / No Hire"
    }
  ]
}

Return exactly 3 candidates. Rank from best (#1) to third-best (#3). Every field is required."""


@router.post("/evaluate")
async def evaluate_cvs(
    files: List[UploadFile] = File(...),
    job_description: str = Form(...),
    db: Session = Depends(get_db),
):
    """
    Evaluate multiple CVs against a job description.
    Returns top 3 ranked candidates with reasoning.
    """
    start_time = time.time()

    # Validate
    if len(files) < 3:
        raise HTTPException(status_code=400, detail="Please upload at least 3 CVs")
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 CVs allowed")
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required")

    logger.info(f"[EVAL] Starting evaluation: {len(files)} CVs")

    # Create evaluation record
    evaluation = CVEvaluation(
        job_description=job_description[:5000],
        total_cvs=len(files),
        status="processing",
    )
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)

    try:
        # Extract text from all CVs
        cv_texts = []
        for f in files:
            content = await f.read()
            text = extract_text_from_file(content, f.filename or 'unknown.pdf')
            if text.strip():
                cv_texts.append({"filename": f.filename, "text": text[:8000]})  # Limit per CV
            else:
                cv_texts.append({"filename": f.filename, "text": f"[Could not extract text from {f.filename}]"})
            logger.info(f"[EVAL] Extracted {len(text)} chars from {f.filename}")

        # Build the evaluation prompt
        cv_section = ""
        for i, cv in enumerate(cv_texts, 1):
            cv_section += f"\n--- CV {i}: {cv['filename']} ---\n{cv['text']}\n"

        prompt = f"""Job Description:
{job_description}

{len(cv_texts)} Candidate CVs:
{cv_section}

Analyze all {len(cv_texts)} CVs against the job description. Rank the top 3 best matches. Return valid JSON only."""

        # Call AI with token tracking
        logger.info(f"[EVAL] Calling AI for evaluation (prompt ~{len(prompt)} chars)")
        result = llm_handler.generate_with_usage(
            prompt=prompt,
            system_prompt=EVALUATION_SYSTEM_PROMPT,
            max_tokens=8000,
        )

        response_text = result["text"]
        input_tokens = result["input_tokens"]
        output_tokens = result["output_tokens"]
        total_tokens = result["total_tokens"]
        model_used = result["model"]

        logger.info(f"[EVAL] AI response: {len(response_text)} chars, tokens: {total_tokens}")

        # Parse JSON response
        try:
            # Try to extract JSON from response
            json_str = response_text.strip()
            if json_str.startswith('```'):
                json_str = json_str.split('\n', 1)[1].rsplit('```', 1)[0]
            parsed = json.loads(json_str)
        except json.JSONDecodeError:
            # Try to find JSON in the response
            import re
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                parsed = json.loads(json_match.group())
            else:
                raise HTTPException(status_code=500, detail="AI returned invalid response format")

        # Update evaluation record
        evaluation.status = "completed"
        evaluation.job_description_summary = parsed.get("job_summary", "")[:500]
        evaluation.ranked_results = parsed.get("ranked_candidates", [])
        evaluation.input_tokens = input_tokens
        evaluation.output_tokens = output_tokens
        evaluation.total_tokens = total_tokens
        evaluation.model_used = model_used
        from datetime import datetime, timezone
        evaluation.completed_at = datetime.now(timezone.utc)
        db.commit()

        # Track token usage
        token_record = TokenUsage(
            feature="cv_evaluation",
            reference_id=evaluation.id,
            model=model_used,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
            prompt_name="evaluator",
            num_cvs=len(files),
        )
        db.add(token_record)
        db.commit()

        elapsed = time.time() - start_time
        logger.info(f"[EVAL] Completed in {elapsed:.1f}s | tokens: {total_tokens}")

        return {
            "evaluation_id": evaluation.id,
            "job_description_summary": parsed.get("job_summary", ""),
            "total_cvs": len(files),
            "ranked_candidates": parsed.get("ranked_candidates", []),
            "token_usage": {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": total_tokens,
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
