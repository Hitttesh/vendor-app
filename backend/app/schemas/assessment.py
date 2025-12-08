# backend/app/schemas/assessment.py
from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class AssessmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    skills: Optional[str] = None
    duration: int = 0
    work_experience: Optional[str] = None
    required_candidates: int = 0

class AssessmentOut(BaseModel):
    assessment_id: UUID          # ✅ matches DB + frontend
    title: str
    description: Optional[str] = None
    vendor_id: int
    skills: Optional[str] = None
    duration: int
    work_experience: Optional[str] = None   # ✅ final name
    required_candidates: int
    candidates_count: Optional[int] = None  # for the detail view

    class Config:
        orm_mode = True
