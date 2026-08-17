"""
Hospital Management, Staff Operations & Department Settings API.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends, Query, status

from app.models import (
    HospitalResponse,
    HospitalUpdateRequest,
    StaffMember,
    Appointment,
    RoleEnum
)
from app.auth import get_current_user_payload, require_roles
from app.database import (
    get_hospital_by_id,
    update_hospital_settings,
    get_hospital_staff,
    set_user_active_status,
    get_hospital_departments,
    add_hospital_department,
    mark_hospital_setup_completed,
    get_db_connection,
    log_audit_event
)

router = APIRouter(prefix="/hospital", tags=["Hospital Management"])


class AddDepartmentRequest(BaseModel):
    department_name: str


@router.get("/settings", response_model=HospitalResponse)
def get_hospital_details(current_user: dict = Depends(get_current_user_payload)):
    """Retrieve hospital organization settings, contact info, and counts."""
    hospital = get_hospital_by_id(current_user["hospital_id"])
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found.")
    return HospitalResponse(**hospital)


@router.put("/settings", response_model=HospitalResponse)
def update_settings(
    payload: HospitalUpdateRequest,
    current_user: dict = Depends(require_roles("HOSPITAL_ADMIN"))
):
    """Update hospital metadata and contact details (Admin only). Hospital Code is protected."""
    hospital_id = current_user["hospital_id"]
    updated = update_hospital_settings(hospital_id, payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Hospital not found.")

    log_audit_event(
        hospital_id=hospital_id,
        user_id=current_user["sub"],
        user_name=current_user["name"],
        user_role=current_user["role"],
        action="HOSPITAL_SETTINGS_UPDATED",
        resource_type="Hospital",
        resource_id=hospital_id,
        details=payload.model_dump(exclude_unset=True)
    )

    return HospitalResponse(**updated)


@router.get("/setup-status")
def get_setup_status(current_user: dict = Depends(get_current_user_payload)):
    """Check whether first-time setup (departments + staff) is completed."""
    hospital = get_hospital_by_id(current_user["hospital_id"])
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found.")
    depts = get_hospital_departments(current_user["hospital_id"])
    staff = get_hospital_staff(current_user["hospital_id"])
    return {
        "is_setup_completed": hospital.get("is_setup_completed", False),
        "department_count": len(depts),
        "staff_count": len(staff),
        "hospital_name": hospital["name"],
        "hospital_code": hospital["code"]
    }


@router.post("/complete-setup")
def complete_setup(current_user: dict = Depends(require_roles("HOSPITAL_ADMIN"))):
    """Mark hospital setup wizard as completed."""
    mark_hospital_setup_completed(current_user["hospital_id"])
    return {"status": "success", "message": "Hospital setup completed successfully."}


@router.get("/departments", response_model=List[str])
def list_departments(current_user: dict = Depends(get_current_user_payload)):
    """Retrieve dynamic clinical departments within the facility."""
    return get_hospital_departments(current_user["hospital_id"])


@router.post("/departments")
def add_department(
    payload: AddDepartmentRequest,
    current_user: dict = Depends(require_roles("HOSPITAL_ADMIN"))
):
    """Add a new clinical department to the hospital organization."""
    try:
        dept = add_hospital_department(current_user["hospital_id"], payload.department_name)
        return {"status": "success", "department": dept}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/staff", response_model=List[StaffMember])
def list_staff(current_user: dict = Depends(get_current_user_payload)):
    """Retrieve all staff members associated with the authenticated hospital."""
    return get_hospital_staff(current_user["hospital_id"])


@router.put("/staff/{user_id}/status")
def toggle_staff_status(
    user_id: str,
    is_active: bool = Query(...),
    current_user: dict = Depends(require_roles("HOSPITAL_ADMIN"))
):
    """Activate or deactivate a staff member's login access (Admin only)."""
    hospital_id = current_user["hospital_id"]
    success = set_user_active_status(hospital_id=hospital_id, user_id=user_id, is_active=is_active)
    if not success:
        raise HTTPException(status_code=404, detail="Staff member not found in this hospital.")

    log_audit_event(
        hospital_id=hospital_id,
        user_id=current_user["sub"],
        user_name=current_user["name"],
        user_role=current_user["role"],
        action="STAFF_STATUS_UPDATED",
        resource_type="User",
        resource_id=user_id,
        details={"is_active": is_active}
    )

    return {"status": "success", "message": f"Staff status updated to {'Active' if is_active else 'Deactivated'}"}


@router.get("/doctors")
def list_hospital_doctors(current_user: dict = Depends(get_current_user_payload)):
    """Retrieve active physicians and specialists available for patient assignment."""
    hospital_id = current_user["hospital_id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, name, email, department, employee_id
    FROM users
    WHERE hospital_id = ? AND role = 'DOCTOR' AND is_active = 1
    ORDER BY name ASC
    """, (hospital_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.get("/appointments", response_model=List[Appointment])
def list_hospital_appointments(
    status: Optional[str] = Query(None),
    doctor_name: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user_payload)
):
    """Retrieve hospital-wide scheduled and completed appointments."""
    hospital_id = current_user["hospital_id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM appointments WHERE hospital_id = ?"
    params = [hospital_id]
    
    if status and status != "ALL":
        query += " AND status = ?"
        params.append(status)
    if doctor_name:
        query += " AND doctor_name = ?"
        params.append(doctor_name)
        
    query += " ORDER BY appointment_date ASC, appointment_time ASC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        data = dict(r)
        data["created_at"] = datetime.fromisoformat(data["created_at"])
        results.append(Appointment.model_validate(data))
    return results


@router.get("/triage-queue")
def get_hospital_triage_queue(current_user: dict = Depends(get_current_user_payload)):
    """Retrieve active patients in emergency triage queue sorted by clinical acuity."""
    hospital_id = current_user["hospital_id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT p.id, p.patient_id, p.name, p.age, p.sex, p.phone, p.status,
        p.department, p.primary_doctor_id, p.primary_doctor_name,
        p.created_at, p.registration_date,
        t.priority as triage_priority,
        t.recommended_route,
        t.confidence_score,
        t.human_decision,
        t.override_reason,
        t.triage_date,
        t.safety_eval_json
    FROM patients p
    LEFT JOIN (
        SELECT t1.*
        FROM triage_records t1
        JOIN (
            SELECT patient_id, MAX(triage_date) as max_date
            FROM triage_records
            WHERE hospital_id = ?
            GROUP BY patient_id
        ) t2 ON t1.patient_id = t2.patient_id AND t1.triage_date = t2.max_date
    ) t ON p.patient_id = t.patient_id
    WHERE p.hospital_id = ? AND p.status != 'DISCHARGED'
    ORDER BY
        CASE t.priority
            WHEN 'RED' THEN 1
            WHEN 'ORANGE' THEN 2
            WHEN 'YELLOW' THEN 3
            WHEN 'GREEN' THEN 4
            WHEN 'BLUE' THEN 5
            ELSE 6
        END ASC,
        p.created_at DESC
    """, (hospital_id, hospital_id))
    rows = cursor.fetchall()
    conn.close()
    
    import json
    results = []
    now = datetime.now(timezone.utc)
    
    for r in rows:
        data = dict(r)
        created_dt = datetime.fromisoformat(data["created_at"])
        if created_dt.tzinfo is None:
            created_dt = created_dt.replace(tzinfo=timezone.utc)
        waiting_minutes = int((now - created_dt).total_seconds() / 60)
        data["waiting_minutes"] = max(1, waiting_minutes)
        
        # Parse risk flags
        risk_flags = []
        if data.get("safety_eval_json"):
            try:
                safety = json.loads(data["safety_eval_json"])
                risk_flags = safety.get("risk_flags", [])
            except:
                pass
        data["risk_flags"] = risk_flags
        results.append(data)
        
    return results
