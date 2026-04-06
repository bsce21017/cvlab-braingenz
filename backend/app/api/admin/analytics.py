"""
Admin Analytics Endpoints
Provides monthly audience and geography-based analytics
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.db.database import get_db
from app.api.admin.middleware import get_admin_user
from app.auth.middleware import AuthUser
from app.models.resume import Resume
from app.models.cv_evaluation import TokenUsage, CVEvaluation

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/analytics")
async def get_analytics(
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user),
    months: int = Query(12, ge=1, le=24, description="Number of months to look back"),
):
    """
    Get analytics data: monthly uploads and geography breakdown.
    """
    logger.info(f"Admin {admin_user.id} fetching analytics (months={months})")

    now = datetime.now(timezone.utc)

    # Monthly uploads (last N months)
    monthly_data = (
        db.query(
            extract("year", Resume.created_at).label("year"),
            extract("month", Resume.created_at).label("month"),
            func.count(Resume.id).label("count"),
        )
        .filter(Resume.created_at >= now - timedelta(days=months * 31))
        .group_by("year", "month")
        .order_by("year", "month")
        .all()
    )

    monthly = [
        {
            "year": int(row.year),
            "month": int(row.month),
            "count": row.count,
        }
        for row in monthly_data
    ]

    # Geography breakdown (top locations)
    geo_data = (
        db.query(
            Resume.location,
            func.count(Resume.id).label("count"),
        )
        .filter(Resume.location.isnot(None), Resume.location != "")
        .group_by(Resume.location)
        .order_by(func.count(Resume.id).desc())
        .limit(20)
        .all()
    )

    geography = [
        {"location": row.location, "count": row.count}
        for row in geo_data
    ]

    # Total and unknown counts for context
    total_resumes = db.query(func.count(Resume.id)).scalar() or 0
    with_location = db.query(func.count(Resume.id)).filter(
        Resume.location.isnot(None), Resume.location != ""
    ).scalar() or 0

    return {
        "monthly": monthly,
        "geography": geography,
        "total_resumes": total_resumes,
        "with_location": with_location,
        "without_location": total_resumes - with_location,
    }


@router.get("/token-usage")
async def get_token_usage(
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user),
):
    """Get token usage statistics for dashboard."""
    logger.info(f"Admin {admin_user.id} fetching token usage")

    # Total tokens by feature
    feature_stats = (
        db.query(
            TokenUsage.feature,
            func.count(TokenUsage.id).label("requests"),
            func.sum(TokenUsage.input_tokens).label("input_tokens"),
            func.sum(TokenUsage.output_tokens).label("output_tokens"),
            func.sum(TokenUsage.total_tokens).label("total_tokens"),
            func.sum(TokenUsage.num_cvs).label("total_cvs"),
        )
        .group_by(TokenUsage.feature)
        .all()
    )

    by_feature = {}
    for row in feature_stats:
        by_feature[row.feature] = {
            "requests": row.requests,
            "input_tokens": int(row.input_tokens or 0),
            "output_tokens": int(row.output_tokens or 0),
            "total_tokens": int(row.total_tokens or 0),
            "total_cvs": int(row.total_cvs or 0),
        }

    # Recent usage (last 10 records)
    recent = (
        db.query(TokenUsage)
        .order_by(TokenUsage.created_at.desc())
        .limit(10)
        .all()
    )

    recent_usage = [
        {
            "id": r.id,
            "feature": r.feature,
            "model": r.model,
            "input_tokens": r.input_tokens,
            "output_tokens": r.output_tokens,
            "total_tokens": r.total_tokens,
            "num_cvs": r.num_cvs,
            "prompt_name": r.prompt_name,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in recent
    ]

    # Grand totals
    grand_total = db.query(func.sum(TokenUsage.total_tokens)).scalar() or 0
    total_requests = db.query(func.count(TokenUsage.id)).scalar() or 0

    # Evaluation stats
    total_evaluations = db.query(func.count(CVEvaluation.id)).scalar() or 0
    completed_evaluations = db.query(func.count(CVEvaluation.id)).filter(CVEvaluation.status == "completed").scalar() or 0

    return {
        "grand_total_tokens": int(grand_total),
        "total_requests": total_requests,
        "by_feature": by_feature,
        "recent_usage": recent_usage,
        "evaluations": {
            "total": total_evaluations,
            "completed": completed_evaluations,
        },
    }
