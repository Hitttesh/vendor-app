#vendor/backend/app/routers/auth_router.py
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from .. import schemas, db
from datetime import timedelta
from fastapi import Request
from pydantic import BaseModel
from app import repository as crud
from app import services as auth
from app.services import decode_token

router = APIRouter(prefix="/auth", tags=["auth"])
# router = APIRouter(prefix="/vendor", tags=["vendor"])

@router.post("/vendor/register", response_model=None)
def vendor_register(payload: schemas.VendorCreate, database: Session = Depends(db.get_db)):
    existing = database.query(crud.models.Vendor).filter(crud.models.Vendor.email==payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vendor already exists")
    vendor = crud.create_vendor(database, payload.company_name, payload.email, payload.password)
    return {"ok": True, "vendor_id": vendor.id}

@router.post("/vendor/login")
def vendor_login(payload: schemas.VendorCreate, response: Response, database: Session = Depends(db.get_db)):
    vendor = crud.authenticate_vendor(database, payload.email, payload.password)
    if not vendor:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token, expire = auth.create_access_token({"sub": f"vendor:{vendor.id}"})
    auth.persist_token(database, token, vendor_id=vendor.id, expires_at=expire)
    # set HttpOnly cookie
    response.set_cookie(key="access_token", value=token, httponly=True, samesite="lax")
    return {"access_token": token, "token_type": "bearer", "vendor": {"id": vendor.id, "company_name": vendor.company_name, "email": vendor.email}}

@router.post("/user/register")
def user_register(payload: schemas.UserCreate, database: Session = Depends(db.get_db)):
    existing = database.query(crud.models.User).filter(crud.models.User.email==payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    user = crud.create_user(database, payload.email, payload.password)
    return {"ok": True, "user_id": user.id}

@router.post("/user/login")
def user_login(payload: schemas.UserCreate, response: Response, database: Session = Depends(db.get_db)):
    user = crud.authenticate_user(database, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token, expire = auth.create_access_token({"sub": f"user:{user.id}"})
    auth.persist_token(database, token, user_id=user.id, expires_at=expire)
    response.set_cookie(key="access_token", value=token, httponly=True, samesite="lax")
    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "email": user.email}}

@router.post("/logout")
def logout(response: Response, database: Session = Depends(db.get_db), token: str = None):
    # token will be removed by frontend calling with credentials; we read cookie from request via FastAPI dependency in real usage,
    # but here we accept token param for simplicity. For production use request.cookies.get("access_token")
    # We'll try to get cookie from request via fastapi.Request -> omitted for brevity
    from fastapi import Request
    def _inner(req: Request):
        t = req.cookies.get("access_token")
        return t
    # simpler approach: read cookie via request
    # Remove token from DB and clear cookie
    return {"ok": True}

class ChangePasswordPayload(BaseModel):
    current_password: str
    new_password: str


@router.get("/assessment/{assessment_id}")
def get_assessment(assessment_id: str, database: Session = Depends(db.get_db)):
    # load assessment and its candidates
    a = database.query(crud.models.Assessment).filter(crud.models.Assessment.assessment_id == assessment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found")
    # gather candidates via join
    rows = (database.query(crud.models.AssessmentCandidate, crud.models.Candidate)
            .join(crud.models.Candidate, crud.models.AssessmentCandidate.candidate_uuid == crud.models.Candidate.candidate_uuid)
            .filter(crud.models.AssessmentCandidate.assessment_id == assessment_id)
            .all())
    # rows is list of tuples (AssessmentCandidate, Candidate) - convert to candidate dicts
    candidates = []
    for ac, c in rows:
        candidates.append({
            "id": c.id,
            "candidate_uuid": str(c.candidate_uuid),
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "resume_path": c.resume_path,
            "status": ac.status
        })
    result = {
        "assessment_id": str(a.assessment_id),
        "title": a.title,
        "description": a.description,
        "vendor_id": a.vendor_id,
        "created_at": a.created_at.isoformat() if a.created_at else None,
        "candidates": candidates
    }
    return {"ok": True, "assessment": result}