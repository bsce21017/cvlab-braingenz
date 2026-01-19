"""
CV Info Store Model
Stores optimized CV information with S3 file paths and metadata extraction status
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class MetadataStatus(str, enum.Enum):
    """Metadata extraction status"""
    PENDING = "PENDING"
    DONE = "DONE"
    ERROR = "ERROR"


class CVInfoStore(Base):
    """CV Info Store table for optimized CV storage and metadata tracking"""
    __tablename__ = "cv_info_store"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # S3 file paths for optimized CV
    text_s3_file_path = Column(String(1000), nullable=True)  # S3 path for text version
    pdf_s3_file_path = Column(String(1000), nullable=True)   # S3 path for PDF version

    # Timestamp when record was added
    date_added = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Metadata extraction fields (managed by other developer)
    metadata_status = Column(
        Enum(MetadataStatus),
        default=MetadataStatus.PENDING,
        nullable=False
    )
    metadata_extracted_at = Column(DateTime(timezone=True), nullable=True)
    extracted_metadata = Column(JSONB, nullable=True)  # Extracted metadata as JSON
    metadata_model = Column(String(100), nullable=True)  # e.g., gpt-4o
    metadata_error = Column(Text, nullable=True)  # Error message if extraction failed

    def __repr__(self):
        return f"<CVInfoStore(id={self.id}, status={self.metadata_status})>"
