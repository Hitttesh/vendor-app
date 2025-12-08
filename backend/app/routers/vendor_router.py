# vendor/backend/app/routers/vendor_router.py

import os
import shutil
import uuid
from datetime import datetime
from typing import List
from uuid import UUID as UUIDClass

from fastapi import (
    APIRouter, Depends, HTTPException, Request, Response, status, Body,
    UploadFile, File, Form, Response
)
from pydantic import BaseModel
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from .. import db, schemas, models
from app.services import decode_token
from app import repository as crud
from app import services as auth

router = APIRouter(prefix="/vendor", tags=["vendor"])


# ────────────────────────────────────────────────────────────
# ✅ AUTH DEPENDENCY: Get Current Vendor from Cookie Token
# ────────────────────────────────────────────────────────────

def get_current_vendor(
    request: Request,
    database: Session = Depends(db.get_db)
) -> models.Vendor:

    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    sub = payload.get("sub", "")

    if not sub.startswith("vendor:"):
        raise HTTPException(status_code=401, detail="Not a vendor token")

    try:
        vendor_id = int(sub.split(":")[1])
    except ValueError:
        raise HTTPException(status_code=401, detail="Malformed vendor token")

    # Verify active session in DB
    session = auth.get_session(database, token)
    if not session:
        raise HTTPException(status_code=401, detail="Session expired or invalid")

    vendor = database.query(models.Vendor).get(vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    return vendor


# ────────────────────────────────────────────────────────────
# ✅ GET Dashboard: Vendor Info + Assessments + Candidate Count
# ────────────────────────────────────────────────────────────

@router.get("/dashboard")
def vendor_dashboard(
    current_vendor: models.Vendor = Depends(get_current_vendor),
    database: Session = Depends(db.get_db)
):
    """
    Get vendor profile and all assessments with linked candidates count.
    """

    assessments = crud.get_assessment_with_candidates(database, current_vendor.id)
    out = []

    for a in assessments or []:
        candidates = []
        for ac_rel in a.candidates or []:
            cand = getattr(ac_rel, "candidate", None)
            if not cand:
                continue

            candidates.append({
                "id": cand.id,
                "candidate_uuid": str(cand.candidate_uuid) if cand.candidate_uuid else None,
                "name": cand.name,
                "email": cand.email,
                "phone": cand.phone,
                "resume_path": cand.resume_path,
                "status": ac_rel.status
            })

        out.append({
            "id": str(a.assessment_id),
            "assessment_id": str(a.assessment_id),
            "title": a.title,
            "description": a.description,
            "skills": a.skills,
            "duration": a.duration,
            "work_experience": a.work_experience,
            "vendor_id": a.vendor_id,
            "status": a.status,
            "required_candidates": int(a.required_candidates or 0),
            "candidates_count": len(candidates),
            "candidates": candidates
        })

    return {
        "vendor": {
            "id": current_vendor.id,
            "company_name": current_vendor.company_name,
            "email": current_vendor.email
        },
        "assessments": out
    }


# ────────────────────────────────────────────────────────────
# ✅ Create New Assessment with Safe Skill & Duration Parsing
# ────────────────────────────────────────────────────────────

@router.post("/create-assessment")
def create_assessment(
    payload: dict = Body(...),
    current_vendor: models.Vendor = Depends(get_current_vendor),
    database: Session = Depends(db.get_db)
):
    """
    Create a new assessment for authenticated vendor.
    """

    title = payload.get("title")
    if not title:
        raise HTTPException(status_code=400, detail="Title is required")

    description = payload.get("description", "")
    skills = payload.get("skills", None)
    experience = payload.get("experience") or payload.get("work_experience")

    # ✅ Parse duration safely
    duration_raw = payload.get("duration", None)
    duration_val = 0
    if duration_raw and str(duration_raw).strip():
        try:
            duration_val = max(0, int(float(duration_raw)))
        except ValueError:
            duration_val = 0

    # ✅ Parse required candidates safely
    required_candidates = payload.get("required_candidates", None)
    if required_candidates is not None:
        try:
            required_candidates = max(0, int(required_candidates))
        except ValueError:
            required_candidates = None

    assessment = models.Assessment(
        title=title,
        description=description,
        vendor_id=current_vendor.id,
        skills=skills,
        work_experience=experience,
        duration=duration_val
    )

    if required_candidates is not None:
        assessment.required_candidates = required_candidates

    database.add(assessment)
    database.commit()
    database.refresh(assessment)

    return {
        "ok": True,
        "assessment": {
            "id": str(assessment.assessment_id),
            "assessment_id": str(assessment.assessment_id),
            "title": assessment.title,
            "description": assessment.description,
            "skills": assessment.skills,
            "duration": assessment.duration,
            "experience": assessment.work_experience,
            "vendor_id": assessment.vendor_id,
            "required_candidates": int(assessment.required_candidates or 0),
            "candidates": []
        }
    }


# ────────────────────────────────────────────────────────────
# ✅ Logout Vendor and Remove Session Token
# ────────────────────────────────────────────────────────────

@router.post("/logout")
def logout_vendor(
    request: Request,
    response: Response,
    database: Session = Depends(db.get_db)
):
    """
    Logout and clear vendor session + cookie.
    """

    token = request.cookies.get("access_token")

    response.delete_cookie("access_token")

    if token:
        try:
            session_row = database.query(models.SessionToken).filter_by(token=token).first()
            if session_row:
                database.delete(session_row)
                database.commit()
        except Exception as e:
            print("❌ Logout Error:", e)
            database.rollback()

    return {"ok": True, "detail": "Logged out successfully"}


# ────────────────────────────────────────────────────────────
# ✅ Add or Link Candidate to Vendor Assessment
# ────────────────────────────────────────────────────────────

@router.post("/assessment/{assessment_id}/add-candidate")
def add_candidate_to_assessment(
    assessment_id: str,
    payload: dict = Body(...),
    current_vendor: models.Vendor = Depends(get_current_vendor),
    database: Session = Depends(db.get_db)
):
    """
    Add or reuse a candidate and link to vendor's assessment.
    """

    name = payload.get("name")
    email = payload.get("email")
    phone = payload.get("phone")
    resume_url = payload.get("resume_url")

    if not name or not email:
        raise HTTPException(status_code=400, detail="Name and email are required")

    # Validate UUID format
    try:
        aid = UUIDClass(assessment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid assessment ID format")

    # Verify vendor owns assessment
    assessment = database.query(models.Assessment).filter_by(
        assessment_id=aid,
        vendor_id=current_vendor.id
    ).first()

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found or unauthorized")

    # ✅ Create or update candidate
    candidate = crud.get_candidate_by_email(database, email)

    if not candidate:
        candidate = crud.create_candidate(database, name, email, phone=phone, resume_path=resume_url)
    else:
        if phone:
            candidate.phone = phone
        if resume_url:
            candidate.resume_path = resume_url

        database.add(candidate)
        database.commit()
        database.refresh(candidate)

    # ✅ Link candidate
    crud.link_candidate_to_assessment(
        database,
        str(assessment.assessment_id),
        candidate_uuid=str(candidate.candidate_uuid)
    )

    return {
        "ok": True,
        "candidate": {
            "id": candidate.id,
            "candidate_uuid": str(candidate.candidate_uuid),
            "name": candidate.name,
            "email": candidate.email,
            "phone": candidate.phone,
            "resume_path": candidate.resume_path
        }
    }


# ────────────────────────────────────────────────────────────
# ✅ Get a Single Assessment with Candidates
# ────────────────────────────────────────────────────────────

@router.get("/assessment/{assessment_id}")
def get_assessment(
    assessment_id: str,
    database: Session = Depends(db.get_db)
):
    """
    Get one assessment and its linked candidates.
    """

    assessment = None
    try:
        aid = UUIDClass(assessment_id)
        assessment = database.query(models.Assessment).filter_by(assessment_id=aid).first()
    except ValueError:
        assessment = database.query(models.Assessment).filter_by(assessment_id=assessment_id).first()

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    candidates = []

    for ac_rel in assessment.candidates or []:
        cand = getattr(ac_rel, "candidate", None)
        if not cand:
            continue

        candidates.append({
            "id": cand.id,
            "candidate_uuid": str(cand.candidate_uuid),
            "name": cand.name,
            "email": cand.email,
            "phone": cand.phone,
            "resume_path": cand.resume_path,
            "status": ac_rel.status
        })

    return {
        "ok": True,
        "assessment": {
            "assessment_id": str(assessment.assessment_id),
            "title": assessment.title,
            "description": assessment.description,
            "skills": assessment.skills,
            "duration": assessment.duration,
            "work_experience": assessment.work_experience,
            "vendor_id": assessment.vendor_id,
            "required_candidates": assessment.required_candidates,
            "candidates_count": len(candidates)
        },
        "candidates": candidates
    }


# ────────────────────────────────────────────────────────────
# ✅ Update Candidate Status
# ────────────────────────────────────────────────────────────

@router.post("/assessment/{assessment_id}/candidate/{candidate_uuid}/status")
def update_candidate_status(
    assessment_id: str,
    candidate_uuid: str,
    payload: dict = Body(...),
    current_vendor: models.Vendor = Depends(get_current_vendor),
    database: Session = Depends(db.get_db)
):
    """
    Update status of a candidate linked to vendor assessment.
    """

    allowed = {"invited", "interviewed", "shortlisted", "rejected"}
    raw = (payload.get("status") or "").strip().lower()

    new_status = "interviewed" if raw == "interview" else raw

    if new_status not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed values: {sorted(allowed)}")

    ac_row = database.query(models.AssessmentCandidate).filter_by(
        assessment_id=assessment_id,
        candidate_uuid=candidate_uuid
    ).first()

    if not ac_row:
        raise HTTPException(status_code=404, detail="Candidate not linked to this assessment")

    if ac_row.assessment.vendor_id != current_vendor.id:
        raise HTTPException(status_code=403, detail="Not permitted")

    ac_row.status = new_status
    database.add(ac_row)
    database.commit()
    database.refresh(ac_row)

    return {"ok": True, "status": new_status}


# ────────────────────────────────────────────────────────────
# ✅ Vendor Change Password
# ────────────────────────────────────────────────────────────

class ChangePasswordPayload(BaseModel):
    old_password: str
    new_password: str


@router.post("/change-password")
def change_password(
    payload: ChangePasswordPayload,
    current_vendor: models.Vendor = Depends(get_current_vendor),
    database: Session = Depends(db.get_db)
):
    """
    Change authenticated vendor password securely.
    """

    # ✅ use the already imported auth services module
    _auth = auth

    vendor = current_vendor

    # Find password verification function on app.services
    verify_fn = next(
        (getattr(_auth, fn) for fn in ["verify_password", "check_password", "verify_pw"] if hasattr(_auth, fn)),
        None
    )

    if not verify_fn:
        raise HTTPException(
            status_code=500,
            detail="Password verification function missing in auth/services module",
        )

    if not verify_fn(payload.old_password, vendor.password_hash):
        raise HTTPException(status_code=400, detail="Current password incorrect")

    # Find password hashing function on app.services
    hash_fn = next(
        (getattr(_auth, fn) for fn in ["hash_password", "get_password_hash", "generate_password_hash", "create_password_hash"] if hasattr(_auth, fn)),
        None
    )

    if not hash_fn:
        raise HTTPException(
            status_code=500,
            detail="Password hashing function missing in auth/services module",
        )

    vendor.password_hash = hash_fn(payload.new_password)
    database.add(vendor)
    database.commit()
    database.refresh(vendor)

    return {"ok": True, "detail": "Password updated successfully"}
