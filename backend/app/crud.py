#backend\app\ crud.py
from sqlalchemy.orm import Session
from . import models, schemas, auth
from datetime import datetime
from uuid import UUID as UUIDClass

def create_user(db: Session, email: str, password: str):
    hashed = auth.get_password_hash(password)
    user = models.User(email=email, password_hash=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def create_vendor(db: Session, company_name: str, email: str, password: str):
    hashed = auth.get_password_hash(password)
    vendor = models.Vendor(company_name=company_name, email=email, password_hash=hashed)
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor

def create_assessment(db: Session, title: str, description: str, vendor_id: int):
    assessment = models.Assessment(title=title, description=description, vendor_id=vendor_id)
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment

def authenticate_vendor(db: Session, email: str, password: str):
    vendor = db.query(models.Vendor).filter(models.Vendor.email==email).first()
    if vendor and auth.verify_password(password, vendor.password_hash):
        return vendor
    return None

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(models.User).filter(models.User.email==email).first()
    if user and auth.verify_password(password, user.password_hash):
        return user
    return None

# crud.py (append)
def create_candidate(db: Session, name: str, email: str, phone: str = None, resume_path: str = None):
    # create a candidate record
    candidate = models.Candidate(name=name, email=email, phone=phone, resume_path=resume_path)
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate

def get_candidate_by_email(db: Session, email: str):
    return db.query(models.Candidate).filter(models.Candidate.email == email).first()

# helper: find assessment by UUID string
def get_assessment_by_identifier(db: Session, assessment_identifier: str):
    # try parse UUID first (preferred)
    try:
        aid = UUIDClass(assessment_identifier)
        return db.query(models.Assessment).filter(models.Assessment.assessment_id == aid).first()
    except Exception:
        # if not UUID, try legacy integer id (if your DB had it)
        try:
            iid = int(assessment_identifier)
            # if you kept legacy id column in assessment you could search by it
            return db.query(models.Assessment).filter(models.Assessment.legacy_id == iid).first()
        except Exception:
            return None

def link_candidate_to_assessment(db: Session, assessment_identifier: str, candidate_id_int: int = None, candidate_uuid: str = None):
    # resolve assessment (UUID preferred)
    try:
        aid = UUIDClass(assessment_identifier)
        assessment = db.query(models.Assessment).filter(models.Assessment.assessment_id == aid).first()
    except Exception:
        assessment = None

    if not assessment:
        return None

    # resolve candidate
    candidate = None
    if candidate_id_int is not None:
        # legacy path: find candidate by integer id (if your DB still had id)
        candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id_int).first()
    elif candidate_uuid:
        try:
            cand_uuid = UUIDClass(candidate_uuid)
            candidate = db.query(models.Candidate).filter(models.Candidate.candidate_uuid == cand_uuid).first()
        except Exception:
            candidate = None

    if not candidate:
        return None

    # Check existence by assessment_id + candidate_uuid (DB uses candidate_uuid)
    existing = db.query(models.AssessmentCandidate).filter(
        models.AssessmentCandidate.assessment_id == assessment.assessment_id,
        models.AssessmentCandidate.candidate_uuid == candidate.candidate_uuid
    ).first()
    if existing:
        return existing

    # Create link — use candidate_uuid only (database requires candidate_uuid NOT NULL)
    ac = models.AssessmentCandidate(
        assessment_id=assessment.assessment_id,
        candidate_uuid=candidate.candidate_uuid,
        status="invited"
    )
    db.add(ac)
    db.commit()
    db.refresh(ac)
    return ac


def list_assessments_for_vendor(db: Session, vendor_id: int):
    return db.query(models.Assessment).filter(models.Assessment.vendor_id==vendor_id).all()

def get_assessment_with_candidates(db: Session, vendor_id: int):
    # returns assessments with their candidates for a vendor
    assessments = list_assessments_for_vendor(db, vendor_id)
    return assessments
