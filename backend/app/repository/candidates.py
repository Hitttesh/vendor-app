from sqlalchemy.orm import Session
from .. import models

def create_candidate(db: Session, name: str, email: str, phone: str = None, resume_path: str = None):
    candidate = models.Candidate(
        name=name,
        email=email,
        phone=phone,
        resume_path=resume_path
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate

def get_candidate_by_email(db: Session, email: str):
    return db.query(models.Candidate).filter(models.Candidate.email == email).first()
