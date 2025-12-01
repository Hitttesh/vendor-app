import uuid
from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.sql import func
from sqlalchemy import TIMESTAMP
from sqlalchemy.orm import relationship
from app.db import Base
from sqlalchemy.dialects.postgresql import UUID

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
