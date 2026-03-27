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
