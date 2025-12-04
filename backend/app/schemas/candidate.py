from pydantic import BaseModel
from typing import Optional

class CandidateOut(BaseModel):
    id: int
    candidate_uuid: Optional[str] = None
    name: str
    email: str

    class Config:
        orm_mode = True
