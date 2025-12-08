# backend/app/repository/assessments.py
from uuid import UUID as UUIDClass
from sqlalchemy.orm import Session

from .. import models


def create_assessment(db: Session, title: str, description: str, vendor_id: int):
  """
  (Currently not used by your new /vendor/create-assessment route,
  but safe to keep as a basic helper.)
  """
  assessment = models.Assessment(
      title=title,
      description=description,
      vendor_id=vendor_id,
  )
  db.add(assessment)
  db.commit()
  db.refresh(assessment)
  return assessment


def get_assessment_by_identifier(db: Session, assessment_identifier: str):
  """
  Resolve an Assessment by its UUID string (assessment_id).
  Legacy numeric IDs removed to keep things clean.
  """
  try:
      aid = UUIDClass(assessment_identifier)
  except ValueError:
      return None

  return (
      db.query(models.Assessment)
      .filter(models.Assessment.assessment_id == aid)
      .first()
  )


def link_candidate_to_assessment(
  db: Session,
  assessment_identifier: str,
  candidate_uuid: str,
):
  """
  Link an existing Candidate (by candidate_uuid) to an Assessment (by assessment_id UUID).
  If link already exists, it is returned unchanged.
  """

  # Resolve assessment
  try:
      aid = UUIDClass(assessment_identifier)
  except ValueError:
      return None

  assessment = (
      db.query(models.Assessment)
      .filter(models.Assessment.assessment_id == aid)
      .first()
  )
  if not assessment:
      return None

  # Resolve candidate
  try:
      cand_uuid = UUIDClass(candidate_uuid)
  except ValueError:
      return None

  candidate = (
      db.query(models.Candidate)
      .filter(models.Candidate.candidate_uuid == cand_uuid)
      .first()
  )
  if not candidate:
      return None

  # Check if link already exists
  existing = (
      db.query(models.AssessmentCandidate)
      .filter(
          models.AssessmentCandidate.assessment_id == assessment.assessment_id,
          models.AssessmentCandidate.candidate_uuid == candidate.candidate_uuid,
      )
      .first()
  )
  if existing:
      return existing

  # Create new link
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
  return (
      db.query(models.Assessment)
      .filter(models.Assessment.vendor_id == vendor_id)
      .all()
  )


def get_assessment_with_candidates(db: Session, vendor_id: int):
  """
  Used by /vendor/dashboard to fetch all assessments for a vendor.
  The router walks a.candidates relationship to build JSON.
  """
  return list_assessments_for_vendor(db, vendor_id)
