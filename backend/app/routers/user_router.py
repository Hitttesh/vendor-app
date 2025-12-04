# backend/app/routers/user_router.py
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from .. import db,  schemas, models
from app.services import decode_token
from app import repository as crud
from app import services as auth

router = APIRouter(prefix="/user", tags=["user"])

def get_current_user(request: Request, database: Session = Depends(db.get_db)):
    """
    Dependency: read access_token from cookie, verify JWT, ensure session exists in DB,
    ensure token belongs to a user (not a vendor).
    """
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    sub = payload.get("sub", "")
    if not sub.startswith("user:"):
        raise HTTPException(status_code=401, detail="Not a user token")
    try:
        user_id = int(sub.split(":")[1])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token subject")
    # verify token persisted in DB
    session = auth.get_session(database, token)
    if not session:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    user = database.query(models.User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/register", response_model=dict)
def user_register(payload: schemas.UserCreate, database: Session = Depends(db.get_db)):
    existing = database.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    user = crud.create_user(database, payload.email, payload.password)
    return {"ok": True, "user_id": user.id}

@router.post("/login", response_model=dict)
def user_login(payload: schemas.UserCreate, response: Response, database: Session = Depends(db.get_db)):
    user = crud.authenticate_user(database, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token, expire = auth.create_access_token({"sub": f"user:{user.id}"})
    auth.persist_token(database, token, user_id=user.id, expires_at=expire)
    # set cookie
    # In production add secure=True, domain, and proper SameSite settings
    response.set_cookie(key="access_token", value=token, httponly=True, samesite="lax")
    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "email": user.email}}

@router.post("/logout", response_model=dict)
def user_logout(request: Request, response: Response, database: Session = Depends(db.get_db)):
    token = request.cookies.get("access_token")
    if token:
        auth.remove_token(database, token)
        response.delete_cookie("access_token")
    return {"ok": True}

@router.get("/dashboard", response_model=dict)
def user_dashboard(current_user: models.User = Depends(get_current_user), database: Session = Depends(db.get_db)):
    # If you later connect users to candidates, you can query here. For now return basic info.
    return {
        "user": {"id": current_user.id, "email": current_user.email},
        "notes": "This is a simple user dashboard. Extend it to suit app needs."
    }
