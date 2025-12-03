# backend/app/models/assessment_candidate.py
import uuid
from sqlalchemy import Column, Float, String, TIMESTAMP, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db import Base

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
