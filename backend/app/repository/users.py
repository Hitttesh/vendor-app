from sqlalchemy.orm import Session
from .. import models
from app import services as auth

def create_user(db: Session, email: str, password: str):
    hashed = auth.get_password_hash(password)
    user = models.User(email=email, password_hash=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(models.User).filter(models.User.email == email).first()
    if user and auth.verify_password(password, user.password_hash):
        return user
    return None
