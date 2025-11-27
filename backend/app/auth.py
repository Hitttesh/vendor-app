# backend/app/auth.py
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
import os
from sqlalchemy.orm import Session
from . import models

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

# Use pbkdf2_sha256 (no bcrypt dependency) — good for dev and secure
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, expire

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# helper to persist token in DB
def persist_token(db: Session, token: str, user_id: int = None, vendor_id: int = None, expires_at = None):
    session = models.SessionToken(token=token, user_id=user_id, vendor_id=vendor_id, expires_at=expires_at)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

def remove_token(db: Session, token: str):
    db.query(models.SessionToken).filter(models.SessionToken.token==token).delete()
    db.commit()

def get_session(db: Session, token: str):
    return db.query(models.SessionToken).filter(models.SessionToken.token==token).first()