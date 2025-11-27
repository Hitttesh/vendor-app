# backend\app\schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class VendorCreate(BaseModel):
    company_name: str
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class AssessmentCreate(BaseModel):
    title: str
    description: Optional[str] = None

class AssessmentOut(BaseModel):
    id: str     # UUID string (was int before)
    title: str
    description: Optional[str]
    vendor_id: int
    required_candidates: int
    class Config:
        orm_mode = True

class CandidateOut(BaseModel):
    id: int
    candidate_uuid: Optional[str] = None
    name: str
    email: str
    class Config:
        orm_mode = True