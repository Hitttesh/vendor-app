# backend/app/routers/auth_router.py

from datetime import timedelta

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    Request,
    status,
)
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from .. import schemas, db
from app import repository as crud
from app import services as auth

router = APIRouter(prefix="/auth", tags=["auth"])


# ────────────────────────────────────────────────────────────
# Schemas for login (separate from *Create* schemas)
# ────────────────────────────────────────────────────────────

class VendorLoginPayload(BaseModel):
    email: EmailStr
    password: str

# ────────────────────────────────────────────────────────────
# ✅ Vendor Register
# ────────────────────────────────────────────────────────────

@router.post("/vendor/register")
def vendor_register(
    payload: schemas.VendorCreate,
    database: Session = Depends(db.get_db),
):
    existing = (
        database.query(crud.models.Vendor)
        .filter(crud.models.Vendor.email == payload.email)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Vendor already exists")

    vendor = crud.create_vendor(
        database,
        payload.company_name,
        payload.email,
        payload.password,
    )
    return {"ok": True, "vendor_id": vendor.id}


# ────────────────────────────────────────────────────────────
# ✅ Vendor Login (matches frontend: vendorLogin(email, password))
# ────────────────────────────────────────────────────────────

@router.post("/vendor/login")
def vendor_login(
    payload: VendorLoginPayload,
    response: Response,
    database: Session = Depends(db.get_db),
):
    vendor = crud.authenticate_vendor(database, payload.email, payload.password)
    if not vendor:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # create token with vendor subject
    token, expire = auth.create_access_token({"sub": f"vendor:{vendor.id}"})
    auth.persist_token(database, token, vendor_id=vendor.id, expires_at=expire)

    # HttpOnly cookie so frontend doesn't need to manage token manually
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "vendor": {
            "id": vendor.id,
            "company_name": vendor.company_name,
            "email": vendor.email,
        },
    }

# ────────────────────────────────────────────────────────────
# ✅ Logout (used by frontend vendorLogout → /auth/logout)
# ────────────────────────────────────────────────────────────

@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    database: Session = Depends(db.get_db),
):
    token = request.cookies.get("access_token")

    # clear cookie in browser
    response.delete_cookie("access_token")

    # remove from DB session store if present
    if token:
        try:
            auth.remove_token(database, token)
        except Exception:
            # Don't fail logout if DB cleanup fails
            database.rollback()

    return {"ok": True, "detail": "Logged out successfully"}

