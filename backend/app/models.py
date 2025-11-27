# backend/app/models.py
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Text, TIMESTAMP,
    func, Float, UniqueConstraint, text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .db import Base
from sqlalchemy import Integer

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    assessments = relationship("Assessment", back_populates="vendor")

class SessionToken(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

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
    
class Candidate(Base):
    __tablename__ = "candidate"
    id = Column(Integer, primary_key=True, index=True)  # legacy serial id (keep for UI/backwards compat)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    # new UUID column - added during DB migration; default assigned by SQLAlchemy if DB default missing
    candidate_uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    phone = Column(String(30), nullable=True)
    resume_path = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    assessments = relationship("AssessmentCandidate", back_populates="candidate", cascade="all, delete-orphan")

class AssessmentCandidate(Base):
    __tablename__ = "assessment_candidate"

    assessment_candidate_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)

    # UUID FK -> assessment.assessment_id (keep as before)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessment.assessment_id", ondelete="CASCADE"), nullable=False)

    # use candidate_uuid as FK (this matches DB)
    candidate_uuid = Column(UUID(as_uuid=True), ForeignKey("candidate.candidate_uuid", ondelete="CASCADE"), nullable=False)

    status = Column(String(50), nullable=False, server_default="invited")
    score = Column(Float, nullable=True)
    submitted_at = Column(TIMESTAMP(timezone=True), nullable=True)
    is_feedback = Column(Text, nullable=True)
    invited_date = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    session_jti = Column(String(255), nullable=True)
    invite_token = Column(String(255), unique=True, nullable=True)
    invite_expiry = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("(now() + interval '10 days')"))

    candidate = relationship(
        "Candidate",
        back_populates="assessments",
        foreign_keys=[candidate_uuid]
    )
    assessment = relationship("Assessment", back_populates="candidates")
