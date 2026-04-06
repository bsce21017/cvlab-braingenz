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


EVALUATION_SYSTEM_PROMPT = """You are an expert HR recruiter and CV analyst. Your job is to evaluate multiple CVs against a specific job description and rank the top 3 candidates.

You MUST respond in valid JSON format only. No markdown, no explanation outside the JSON.

Evaluate each CV based on:
1. Skills match with job requirements
2. Relevant experience and years
3. Education and certifications relevance
4. Keywords and ATS compatibility
5. Overall presentation quality

Response format:
{
  "job_summary": "Brief 1-line summary of the job",
  "ranked_candidates": [
    {
      "rank": 1,
      "filename": "exact filename",
      "score": 85,
      "reasoning": "2-3 sentences explaining why this candidate is ranked here",
      "strengths": ["strength1", "strength2", "strength3", "strength4"]
    }
  ]
}

Return exactly 3 candidates ranked from best to worst match. Score is 0-100."""


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
            max_tokens=4000,
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
