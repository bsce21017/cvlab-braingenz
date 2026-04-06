"""
CV Evaluation Models
Stores CV evaluation requests and ranked results
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON
from sqlalchemy.sql import func
from app.db.database import Base


class CVEvaluation(Base):
    """CV Evaluation request table"""
    __tablename__ = "cv_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    job_description = Column(Text, nullable=False)
    job_description_summary = Column(String(500), nullable=True)
    total_cvs = Column(Integer, nullable=False)
    status = Column(String(50), default="processing", nullable=False)  # processing, completed, failed
    error_message = Column(Text, nullable=True)

    # Token usage
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    model_used = Column(String(100), nullable=True)

    # Results stored as JSON
    ranked_results = Column(JSON, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<CVEvaluation(id={self.id}, total_cvs={self.total_cvs}, status={self.status})>"


class TokenUsage(Base):
    """Token usage tracking for all AI operations"""
    __tablename__ = "token_usage"

    id = Column(Integer, primary_key=True, index=True)
    feature = Column(String(50), nullable=False, index=True)  # 'cv_optimization' or 'cv_evaluation'
    reference_id = Column(Integer, nullable=True)  # resume_id or evaluation_id
    model = Column(String(100), nullable=True)
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    prompt_name = Column(String(100), nullable=True)  # 'analyst', 'gatherer', 'craftsman', 'evaluator'
    num_cvs = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<TokenUsage(id={self.id}, feature={self.feature}, total_tokens={self.total_tokens})>"
