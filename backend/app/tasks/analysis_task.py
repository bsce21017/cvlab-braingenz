"""
Analysis Celery Task
Handles background processing for Prompt 1 (Analysis) + Prompt 2 (Questions)
"""
import logging
import os
import sys
import tempfile
import time
from typing import Dict, Any
from sqlalchemy.orm import Session

from app.tasks.celery_app import celery_app
from app.db.database import SessionLocal
from app.models.resume import Resume, ResumeStatus
from app.models.analysis import Analysis
from app.models.question import Question
from app.services.ocr_service import ocr_service
from app.services.azure_blob_service import download_file_from_s3
from app.agents.prompt1_analyst import analyst_agent
from app.agents.prompt2_gatherer import gatherer_agent

logger = logging.getLogger(__name__)


def _log(msg: str):
    """Force-flush log to ensure visibility in Docker logs."""
    logger.info(msg)
    print(f"[ANALYSIS_TASK] {msg}", flush=True)


@celery_app.task(bind=True, name="tasks.analyze_resume")
def analyze_resume_task(self, resume_id: int) -> Dict[str, Any]:
    """
    Background task to analyze resume

    Steps:
    1. Extract text from uploaded file (OCR)
    2. Run Prompt 1 (The Analyst) - CV analysis
    3. Run Prompt 2 (The Gatherer) - Generate questions

    Args:
        resume_id: Resume ID to analyze

    Returns:
        Dict with task results
    """
    task_start = time.time()
    _log(f"========== ANALYSIS TASK STARTED | resume_id={resume_id} | pid={os.getpid()} ==========")

    db: Session = SessionLocal()

    try:
        # Get resume
        _log(f"[DB] Querying resume_id={resume_id}")
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            raise Exception(f"Resume not found: {resume_id}")

        _log(f"[DB] Found resume: filename={resume.original_filename}, type={resume.file_type}, "
             f"size={resume.file_size}, s3_key={resume.s3_key}, file_path={resume.file_path}")

        # ── Step 1: Extract text (OCR) ──────────────────────────────────────────
        _log("STEP 1/3: Starting OCR text extraction")
        resume.status = ResumeStatus.EXTRACTING
        db.commit()
        _log("[DB] Status → EXTRACTING committed")

        try:
            file_path = resume.file_path
            temp_file = None

            if resume.s3_key and (not os.path.exists(file_path)):
                _log(f"[AZURE] Local file missing, downloading from Azure: {resume.s3_key}")
                temp_dir = tempfile.mkdtemp()
                file_ext = os.path.splitext(resume.original_filename)[1]
                temp_file = os.path.join(temp_dir, f"resume{file_ext}")

                t0 = time.time()
                success = download_file_from_s3(resume.s3_key, temp_file)
                _log(f"[AZURE] Download {'SUCCESS' if success else 'FAILED'} in {time.time()-t0:.1f}s → {temp_file}")
                if not success:
                    raise Exception(f"Failed to download file from Azure: {resume.s3_key}")

                file_path = temp_file
            else:
                _log(f"[OCR] Using local file: {file_path} (exists={os.path.exists(file_path)})")

            _log(f"[OCR] Calling extract_text: file_type={resume.file_type}, path={file_path}")
            t0 = time.time()
            extracted_text = ocr_service.extract_text(file_path, resume.file_type)
            _log(f"[OCR] Extraction done in {time.time()-t0:.1f}s — {len(extracted_text)} chars extracted")

            resume.extracted_text = extracted_text
            resume.status = ResumeStatus.EXTRACTED
            db.commit()
            _log("[DB] Status → EXTRACTED committed")

        except Exception as e:
            logger.error(f"OCR failed: {e}", exc_info=True)
            _log(f"[ERROR] OCR failed: {e}")
            resume.status = ResumeStatus.FAILED
            resume.error_message = f"Text extraction failed: {str(e)}"
            db.commit()
            raise

        # ── Step 2: Run Prompt 1 (The Analyst) ─────────────────────────────────
        _log("STEP 2/3: Running Prompt 1 — The Analyst")
        resume.status = ResumeStatus.ANALYZING
        db.commit()
        _log("[DB] Status → ANALYZING committed")

        try:
            t0 = time.time()
            analysis_result = analyst_agent.analyze_cv(extracted_text)
            _log(f"[ANALYST] Completed in {time.time()-t0:.1f}s — "
                 f"total_issues={analysis_result.get('total_issues', 'N/A')}")

            analysis = Analysis(
                resume_id=resume_id,
                report_json=analysis_result,
                total_issues=analysis_result.get("total_issues", 0),
                confidence_level=analysis_result.get("metadata", {}).get("confidence_level", "MEDIUM"),
                analysis_duration=analysis_result.get("duration")
            )
            db.add(analysis)
            resume.status = ResumeStatus.ANALYZED
            db.commit()
            _log(f"[DB] Status → ANALYZED committed | analysis_id={analysis.id}")

        except Exception as e:
            logger.error(f"Analysis (Prompt 1) failed: {e}", exc_info=True)
            _log(f"[ERROR] Prompt 1 failed: {e}")
            resume.status = ResumeStatus.FAILED
            resume.error_message = f"Analysis failed: {str(e)}"
            db.commit()
            raise

        # ── Step 3: Run Prompt 2 (The Gatherer) ────────────────────────────────
        _log("STEP 3/3: Running Prompt 2 — The Gatherer")

        try:
            t0 = time.time()
            questions_result = gatherer_agent.generate_questions(extracted_text, analysis_result)
            _log(f"[GATHERER] Completed in {time.time()-t0:.1f}s — "
                 f"total_questions={questions_result.get('total_questions', 'N/A')}")

            question = Question(
                resume_id=resume_id,
                analysis_id=analysis.id,
                questions_json=questions_result,
                total_questions=questions_result.get("total_questions", 0),
                generation_duration=questions_result.get("duration")
            )
            db.add(question)
            resume.status = ResumeStatus.QUESTIONS_GENERATED
            db.commit()
            _log(f"[DB] Status → QUESTIONS_GENERATED committed | question_id={question.id}")

        except Exception as e:
            logger.error(f"Question generation (Prompt 2) failed: {e}", exc_info=True)
            _log(f"[ERROR] Prompt 2 failed: {e}")
            resume.status = ResumeStatus.FAILED
            resume.error_message = f"Question generation failed: {str(e)}"
            db.commit()
            raise

        total_time = time.time() - task_start
        _log(f"========== ANALYSIS TASK COMPLETE | resume_id={resume_id} | total={total_time:.1f}s ==========")

        return {
            "status": "success",
            "resume_id": resume_id,
            "analysis_id": analysis.id,
            "question_id": question.id,
            "total_issues": analysis.total_issues,
            "total_questions": question.total_questions
        }

    except Exception as e:
        total_time = time.time() - task_start
        logger.error(f"Analysis task failed after {total_time:.1f}s: {e}", exc_info=True)
        _log(f"========== ANALYSIS TASK FAILED | resume_id={resume_id} | {total_time:.1f}s | {e} ==========")
        return {
            "status": "failed",
            "resume_id": resume_id,
            "error": str(e)
        }

    finally:
        db.close()
        _log(f"[DB] Session closed for resume_id={resume_id}")
