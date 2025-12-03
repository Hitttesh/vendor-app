# backend/app/models/__init__.py
# Re-export model classes so `from app.models import User` keeps working exactly as before.
from .user import User
from .vendor import Vendor
from .sessiontoken import SessionToken
from .assessment import Assessment
from .candidate import Candidate
from .assessment_candidate import AssessmentCandidate

# expose a sensible __all__
__all__ = [
    "User",
    "Vendor",
    "SessionToken",
    "Assessment",
    "Candidate",
    "AssessmentCandidate",
]
