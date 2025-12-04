from pydantic import BaseModel
from typing import Optional

class AssessmentCreate(BaseModel):
    title: str
    description: Optional[str] = None

class AssessmentOut(BaseModel):
    id: str  # UUID string
    title: str
    description: Optional[str]
    vendor_id: int
    required_candidates: int

    class Config:
        orm_mode = True
