# backend/app/repository/__init__.py

from .. import models  # so you can still do crud.models.Vendor etc.

from .users import (
    create_user,
    authenticate_user,
)
from .vendors import (
    create_vendor,
    authenticate_vendor,
    list_assessments_for_vendor,
)
from .candidates import (
    create_candidate,
    get_candidate_by_email,
)
from .assessments import (
    create_assessment,
    get_assessment_by_identifier,
    link_candidate_to_assessment,
    get_assessment_with_candidates,
)

__all__ = [
    "models",
    "create_user",
    "authenticate_user",
    "create_vendor",
    "authenticate_vendor",
    "list_assessments_for_vendor",
    "create_candidate",
    "get_candidate_by_email",
    "create_assessment",
    "get_assessment_by_identifier",
    "link_candidate_to_assessment",
    "get_assessment_with_candidates",
]
