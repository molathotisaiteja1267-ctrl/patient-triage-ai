"""
Audit Trail API for PatientTriage.ai.
Retrieves immutable event logs scoped to the authenticated hospital.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from app.auth import get_current_user_payload
from app.database import get_hospital_audit_logs

router = APIRouter(prefix="/audit", tags=["Audit Trail"])


@router.get("")
def list_hospital_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    current_user: dict = Depends(get_current_user_payload)
) -> List[Dict[str, Any]]:
    """Retrieve immutable audit trail entries for the user's hospital organization."""
    return get_hospital_audit_logs(hospital_id=current_user["hospital_id"], limit=limit)
