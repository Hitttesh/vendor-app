import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, TIMESTAMP, Integer, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy import text
from app.db import Base

from sqlalchemy.dialects.postgresql import UUID

class Assessment(Base):
    __tablename__ = "assessment"
    # UUID primary key (matches your DB)
    assessment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    user_id = Column(String(10), nullable=True)

    # NOTE: removed job_role and job_description from model mapping
    # If you later add these columns to DB, re-add them here.

    # NEW: skills column (comma-separated or free text)
    skills = Column(Text, nullable=True)

    # duration (minutes) - keep server_default to 0 for backward compatibility
    duration = Column(Integer, nullable=False, server_default="0")

    # experience stored here
    work_experience = Column(String, nullable=True)

    status = Column(String, nullable=False, server_default='draft')
    updated_at = Column(TIMESTAMP(timezone=True), onupdate=func.now())

    vendor = relationship("Vendor", back_populates="assessments")
    # relationship to AssessmentCandidate (child rows)
    candidates = relationship("AssessmentCandidate", back_populates="assessment", cascade="all, delete-orphan")

    required_candidates = Column(Integer, nullable=False, default=1)
