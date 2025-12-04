from sqlalchemy.orm import Session
from .. import models
from app import services as auth

def create_vendor(db: Session, company_name: str, email: str, password: str):
    hashed = auth.get_password_hash(password)
    vendor = models.Vendor(company_name=company_name, email=email, password_hash=hashed)
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor

def authenticate_vendor(db: Session, email: str, password: str):
    vendor = db.query(models.Vendor).filter(models.Vendor.email == email).first()
    if vendor and auth.verify_password(password, vendor.password_hash):
        return vendor
    return None

def list_assessments_for_vendor(db: Session, vendor_id: int):
    return db.query(models.Assessment).filter(models.Assessment.vendor_id == vendor_id).all()
