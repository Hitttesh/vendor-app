# backend/app/repository/assessments.py
from sqlalchemy.orm import Session
from uuid import UUID as UUIDClass
from .. import models

def create_assessment(db: Session, title: str, description: str, vendor_id: int):
    assessment = models.Assessment(
        title=title,
        description=description,
        vendor_id=vendor_id
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment

# helper: find assessment by UUID string
def get_assessment_by_identifier(db: Session, assessment_identifier: str):
    try:
        aid = UUIDClass(assessment_identifier)
        return db.query(models.Assessment).filter(
            models.Assessment.assessment_id == aid
        ).first()
    except Exception:
        try:
            iid = int(assessment_identifier)
            return db.query(models.Assessment).filter(
                models.Assessment.legacy_id == iid
            ).first()
        except Exception:
            return None

def link_candidate_to_assessment(
    db: Session,
    assessment_identifier: str,
    candidate_id_int: int = None,
    candidate_uuid: str = None,
):
    # resolve assessment (UUID preferred)
    try:
        aid = UUIDClass(assessment_identifier)
        assessment = db.query(models.Assessment).filter(
            models.Assessment.assessment_id == aid
        ).first()
    except Exception:
        assessment = None

    if not assessment:
        return None

    # resolve candidate
    candidate = None
    if candidate_id_int is not None:
        candidate = db.query(models.Candidate).filter(
            models.Candidate.id == candidate_id_int
        ).first()
    elif candidate_uuid:
        try:
            cand_uuid = UUIDClass(candidate_uuid)
            candidate = db.query(models.Candidate).filter(
                models.Candidate.candidate_uuid == cand_uuid
            ).first()
        except Exception:
            candidate = None

    if not candidate:
        return None

    existing = db.query(models.AssessmentCandidate).filter(
        models.AssessmentCandidate.assessment_id == assessment.assessment_id,
        models.AssessmentCandidate.candidate_uuid == candidate.candidate_uuid,
    ).first()
    if existing:
        return existing

    ac = models.AssessmentCandidate(
        assessment_id=assessment.assessment_id,
        candidate_uuid=candidate.candidate_uuid,
        status="invited",
    )
    db.add(ac)
    db.commit()
    db.refresh(ac)
    return ac


def list_assessments_for_vendor(db: Session, vendor_id: int):
    return db.query(models.Assessment).filter(
        models.Assessment.vendor_id == vendor_id
    ).all()

def get_assessment_with_candidates(db: Session, vendor_id: int):
    """
    This matches your old crud.get_assessment_with_candidates:
    just returns assessments; router walks the .candidates relationship.
    """
    return list_assessments_for_vendor(db, vendor_id)
