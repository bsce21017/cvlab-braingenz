"""
Optimization Celery Task
Handles background processing for Prompt 3 (The Craftsman)
"""
import logging
import os
import time
import uuid
from typing import Dict, Any
from sqlalchemy.orm import Session

from app.tasks.celery_app import celery_app
from app.db.database import SessionLocal
from app.models.resume import Resume, ResumeStatus
from app.models.analysis import Analysis
from app.models.question import Question
from app.models.answer import Answer
from app.models.optimized_resume import OptimizedResume
from app.agents.prompt3_craftsman import craftsman_agent
from app.services.file_service import file_service
from app.services.azure_blob_service import upload_content_to_s3
from app.services.notification_service import notification_service

logger = logging.getLogger(__name__)


def _log(msg: str):
    """Force-flush log to ensure visibility in Docker logs."""
    logger.info(msg)
    print(f"[OPTIMIZATION_TASK] {msg}", flush=True)


@celery_app.task(bind=True, name="tasks.optimize_resume")
def optimize_resume_task(self, resume_id: int) -> Dict[str, Any]:
    """
    Background task to optimize resume

    Steps:
    1. Load analysis, questions, and answers
    2. Run Prompt 3 (The Craftsman) - Optimize CV
    3. Save optimized resume

    Args:
        resume_id: Resume ID to optimize

    Returns:
        Dict with task results
    """
    task_start = time.time()
    _log(f"========== OPTIMIZATION TASK STARTED | resume_id={resume_id} | pid={os.getpid()} ==========")

    db: Session = SessionLocal()

    try:
        _log(f"[DB] Querying resume_id={resume_id}")
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            raise Exception(f"Resume not found: {resume_id}")

        _log(f"[DB] Resume status={resume.status}, filename={resume.original_filename}")

        if resume.status != ResumeStatus.QUESTIONS_GENERATED:
            raise Exception(f"Resume not ready for optimization. Current status: {resume.status}")

        analysis = db.query(Analysis).filter(Analysis.resume_id == resume_id).first()
        if not analysis:
            raise Exception(f"Analysis not found for resume_id={resume_id}")

        question = db.query(Question).filter(Question.resume_id == resume_id).first()
        if not question:
            raise Exception(f"Questions not found for resume_id={resume_id}")

        answer = db.query(Answer).filter(Answer.resume_id == resume_id).first()
        if not answer:
            raise Exception(f"Answers not found for resume_id={resume_id}")

        _log(f"[DB] Loaded: analysis_id={analysis.id}, question_id={question.id}, answer_id={answer.id}")

        resume.status = ResumeStatus.OPTIMIZING
        db.commit()
        _log("[DB] Status → OPTIMIZING committed")

        _log("STEP 1/1: Running Prompt 3 — The Craftsman")
        try:
            t0 = time.time()
            optimization_result = craftsman_agent.optimize_cv(
                cv_text=resume.extracted_text,
                analysis_report=analysis.report_json,
                questions=question.questions_json.get("questions", []),
                user_answers=answer.answers_json.get("answers", [])
            )
            _log(f"[CRAFTSMAN] Completed in {time.time()-t0:.1f}s")

            optimized_text = optimization_result.get("optimized_cv", "")
            _log(f"[CRAFTSMAN] Optimized text: {len(optimized_text)} chars")

            file_path = file_service.save_optimized_resume(
                content=optimized_text,
                original_filename=resume.original_filename,
                format="txt"
            )
            _log(f"[FILE] Saved locally: {file_path}")

            s3_key = None
            s3_url = None
            try:
                original_name = resume.original_filename.rsplit('.', 1)[0]
                s3_key = f"optimized/{uuid.uuid4()}_{original_name}_optimized.txt"
                _log(f"[AZURE] Uploading optimized resume: {s3_key}")
                s3_url = upload_content_to_s3(
                    content=optimized_text.encode('utf-8'),
                    blob_name=s3_key,
                    content_type='text/plain'
                )
                if s3_url:
                    _log(f"[AZURE] Upload SUCCESS: {s3_url}")
                else:
                    _log("[AZURE] Upload returned None, continuing without cloud URL")
                    s3_key = None
            except Exception as s3_error:
                _log(f"[AZURE] Upload failed (non-fatal): {s3_error}")
                s3_key = None
                s3_url = None

            optimized_resume = OptimizedResume(
                resume_id=resume_id,
                analysis_id=analysis.id,
                answer_id=answer.id,
                optimized_text=optimized_text,
                optimized_json=optimization_result,
                file_path=file_path,
                file_format="txt",
                s3_key=s3_key,
                s3_url=s3_url,
                changes_summary=optimization_result.get("changes_summary"),
                optimization_duration=optimization_result.get("duration")
            )
            db.add(optimized_resume)
            resume.status = ResumeStatus.OPTIMIZED
            db.commit()
            _log(f"[DB] Status → OPTIMIZED committed | optimized_resume_id={optimized_resume.id}")

            try:
                notification_service.create_resume_optimized_notification(
                    db=db,
                    resume_id=resume_id,
                    resume_filename=resume.original_filename
                )
            except Exception as e:
                _log(f"[NOTIFICATION] Failed (non-fatal): {e}")

            total_time = time.time() - task_start
            _log(f"========== OPTIMIZATION TASK COMPLETE | resume_id={resume_id} | total={total_time:.1f}s ==========")

            return {
                "status": "success",
                "resume_id": resume_id,
                "optimized_resume_id": optimized_resume.id,
                "file_path": file_path,
                "s3_url": s3_url,
            }

        except Exception as e:
            logger.error(f"Optimization (Prompt 3) failed: {e}", exc_info=True)
            _log(f"[ERROR] Prompt 3 failed: {e}")
            resume.status = ResumeStatus.FAILED
            resume.error_message = f"Optimization failed: {str(e)}"
            db.commit()
            raise

    except Exception as e:
        total_time = time.time() - task_start
        logger.error(f"Optimization task failed after {total_time:.1f}s: {e}", exc_info=True)
        _log(f"========== OPTIMIZATION TASK FAILED | resume_id={resume_id} | {total_time:.1f}s | {e} ==========")
        return {
            "status": "failed",
            "resume_id": resume_id,
            "error": str(e)
        }

    finally:
        db.close()
        _log(f"[DB] Session closed for resume_id={resume_id}")
