"""
Admin Analytics Endpoints
Provides monthly audience and geography-based analytics
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, desc
import math

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


@router.get("/token-history")
async def get_token_history(
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    feature: Optional[str] = Query(None, description="Filter: cv_optimization or cv_evaluation"),
):
    """Get grouped token usage history. Groups by (feature, reference_id, created_at window)."""
    logger.info(f"Admin {admin_user.id} fetching token history (page={page}, feature={feature})")

    query = db.query(TokenUsage)
    if feature and feature != "all":
        query = query.filter(TokenUsage.feature == feature)

    all_records = query.order_by(desc(TokenUsage.created_at)).all()

    # Group records by request: same feature + reference_id, or within 60 seconds of each other
    groups = []
    used_ids = set()

    for record in all_records:
        if record.id in used_ids:
            continue

        # Find related records (same feature + reference_id, or close timestamp)
        group_records = [record]
        used_ids.add(record.id)

        for other in all_records:
            if other.id in used_ids:
                continue
            # Same feature and reference_id
            if (record.reference_id is not None and
                other.feature == record.feature and
                other.reference_id == record.reference_id):
                group_records.append(other)
                used_ids.add(other.id)
            # Same feature, no reference_id, within 60 seconds
            elif (record.reference_id is None and
                  other.feature == record.feature and
                  other.reference_id is None and
                  record.created_at and other.created_at and
                  abs((record.created_at - other.created_at).total_seconds()) < 60):
                group_records.append(other)
                used_ids.add(other.id)

        total_input = sum(r.input_tokens or 0 for r in group_records)
        total_output = sum(r.output_tokens or 0 for r in group_records)
        total_tokens = sum(r.total_tokens or 0 for r in group_records)
        num_cvs = max(r.num_cvs or 1 for r in group_records)
        model = group_records[0].model
        created_at = group_records[0].created_at

        steps = [
            {
                "id": r.id,
                "prompt_name": r.prompt_name,
                "input_tokens": r.input_tokens,
                "output_tokens": r.output_tokens,
                "total_tokens": r.total_tokens,
            }
            for r in sorted(group_records, key=lambda x: x.created_at or datetime.min)
        ]

        groups.append({
            "ids": [r.id for r in group_records],
            "feature": record.feature,
            "model": model,
            "input_tokens": total_input,
            "output_tokens": total_output,
            "total_tokens": total_tokens,
            "num_cvs": num_cvs,
            "steps": steps,
            "step_count": len(group_records),
            "created_at": created_at.isoformat() if created_at else None,
        })

    total = len(groups)
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    offset = (page - 1) * page_size
    paginated = groups[offset:offset + page_size]

    return {
        "items": paginated,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.delete("/token-history/{record_id}")
async def delete_token_record(
    record_id: int,
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user),
):
    """Delete a single token usage record."""
    record = db.query(TokenUsage).filter(TokenUsage.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    db.delete(record)
    db.commit()
    logger.info(f"Admin {admin_user.id} deleted token record {record_id}")
    return {"message": "Record deleted"}


@router.delete("/token-history")
async def delete_all_token_history(
    db: Session = Depends(get_db),
    admin_user: AuthUser = Depends(get_admin_user),
    feature: Optional[str] = Query(None, description="Delete only specific feature history"),
):
    """Delete all token usage history (or by feature)."""
    query = db.query(TokenUsage)
    if feature and feature != "all":
        query = query.filter(TokenUsage.feature == feature)

    count = query.count()
    query.delete()
    db.commit()
    logger.info(f"Admin {admin_user.id} deleted {count} token records (feature={feature})")
    return {"message": f"Deleted {count} records"}
