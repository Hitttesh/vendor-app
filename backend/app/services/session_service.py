from sqlalchemy.orm import Session
from .. import models  # app.models


def persist_token(
    db: Session,
    token: str,
    user_id: int | None = None,
    vendor_id: int | None = None,
    expires_at=None,
):
    session = models.SessionToken(
        token=token,
        user_id=user_id,
        vendor_id=vendor_id,
        expires_at=expires_at,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def remove_token(db: Session, token: str):
    db.query(models.SessionToken).filter(
        models.SessionToken.token == token
    ).delete()
    db.commit()


def get_session(db: Session, token: str):
    return (
        db.query(models.SessionToken)
        .filter(models.SessionToken.token == token)
        .first()
    )
