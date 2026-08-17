"""
Patient Registration, Longitudinal Profile & Clinical Sub-Resource API for PatientTriage.ai.
Strictly hospital-isolated and authorization-protected.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query, status

from app.models import (
    PatientRegisterRequest,
    PatientSummary,
    PatientProfileResponse,
    MedicalHistoryCreate,
    MedicalHistoryRecord,
    VisitCreate,
    PatientVisit,
    AppointmentCreate,
    AppointmentUpdate,
    Appointment,
    ClinicalNoteCreate,
    ClinicalNote,
    PatientIntake,
    TriageAssessment,
    HumanDecision,
    OverrideRequest,
    ReassessmentRequest
)
from app.auth import get_current_user_payload
from app.database import (
    get_db_connection,
    register_patient,
    get_hospital_patients,
    get_patient_profile,
    add_medical_history,
    add_patient_visit,
    create_appointment,
    update_appointment_status,
    add_clinical_note,
    save_triage_record,
    assign_patient_doctor,
    log_audit_event
)
from app.triage_engine import evaluate_triage

router = APIRouter(prefix="/patients", tags=["Patients & Profiles"])


@router.get("", response_model=List[PatientSummary])
def list_hospital_patients(
    search: Optional[str] = Query(None, description="Search by Patient ID, Name, Phone, or DOB"),
    status: Optional[str] = Query(None, description="Filter by status: Active, WAITING, ACCEPTED, etc."),
    department: Optional[str] = Query(None, description="Filter by department"),
    current_user: dict = Depends(get_current_user_payload)
):
    """Retrieve hospital-scoped patient directory with multi-field search and status filters."""
    hospital_id = current_user["hospital_id"]
    return get_hospital_patients(hospital_id=hospital_id, search=search, status=status, department=department)


@router.post("", status_code=status.HTTP_201_CREATED)
def register_new_patient(
    payload: PatientRegisterRequest,
    current_user: dict = Depends(get_current_user_payload)
):
    """
    Register a new patient into the authenticated hospital.
    Generates server-side deterministic sequence ID: {HOSPITAL_CODE}-{YEAR}-{SEQUENCE:06d}.
    """
    hospital_id = current_user["hospital_id"]
    
    # Calculate age if DOB provided
    age_calc = payload.age
    if age_calc is None and payload.dob:
        try:
            from datetime import date
            dob_obj = date.fromisoformat(payload.dob)
            today = date.today()
            age_calc = today.year - dob_obj.year - ((today.month, today.day) < (dob_obj.month, dob_obj.day))
        except Exception:
            age_calc = 30
            
    p_data = payload.model_dump()
    p_data["age"] = age_calc if age_calc is not None else 30

    patient_id = register_patient(hospital_id=hospital_id, patient_data=p_data)

    log_audit_event(
        hospital_id=hospital_id,
        user_id=current_user["sub"],
        user_name=current_user["name"],
        user_role=current_user["role"],
        action="PATIENT_REGISTERED",
        resource_type="Patient",
        resource_id=patient_id,
        details={"patient_id": patient_id, "name": payload.name}
    )

    return {
        "status": "success",
        "message": f"Patient successfully registered with ID {patient_id}",
        "patient_id": patient_id
    }


@router.get("/{patient_id}", response_model=PatientProfileResponse)
def get_patient_full_profile(
    patient_id: str,
    current_user: dict = Depends(get_current_user_payload)
):
    """
    Retrieve comprehensive 10-tab longitudinal patient profile.
    Enforces strict hospital isolation: raises 404 if patient belongs to another organization.
    """
    hospital_id = current_user["hospital_id"]
    profile = get_patient_profile(hospital_id=hospital_id, patient_id=patient_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' not found in your hospital organization."
        )

    # Log record lookup in audit trail
    log_audit_event(
        hospital_id=hospital_id,
        user_id=current_user["sub"],
        user_name=current_user["name"],
        user_role=current_user["role"],
        action="PATIENT_RECORD_ACCESSED",
        resource_type="Patient",
        resource_id=patient_id,
        details={"patient_name": profile["patient"].name}
    )

    return PatientProfileResponse(
        patient=profile["patient"],
        latest_triage=profile["latest_triage"],
        next_appointment=profile["next_appointment"],
        medical_history=profile["medical_history"],
        visits=profile["visits"],
        appointments=profile["appointments"],
        triage_history=profile["triage_history"],
        doctors=profile["doctors"],
        medications=profile["medications"],
        allergies=profile["allergies"],
        clinical_notes=profile["clinical_notes"],
        timeline=profile["timeline"]
    )


@router.post("/{patient_id}/medical-history", response_model=MedicalHistoryRecord, status_code=status.HTTP_201_CREATED)
def add_patient_medical_history(
    patient_id: str,
    payload: MedicalHistoryCreate,
    current_user: dict = Depends(get_current_user_payload)
):
    """Add longitudinal condition, past surgery, hospitalization, or allergy to patient record."""
    hospital_id = current_user["hospital_id"]
    profile = get_patient_profile(hospital_id=hospital_id, patient_id=patient_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Patient not found in this hospital.")

    user_info = {
        "id": current_user["sub"],
        "name": current_user["name"],
        "role": current_user["role"]
    }
    
    rec = add_medical_history(
        hospital_id=hospital_id,
        patient_id=patient_id,
        condition=payload.condition,
        condition_type=payload.condition_type,
        date_or_year=payload.date_or_year,
        status=payload.status,
        notes=payload.notes,
        user=user_info
    )

    log_audit_event(
        hospital_id=hospital_id,
        user_id=current_user["sub"],
        user_name=current_user["name"],
        user_role=current_user["role"],
        action="MEDICAL_HISTORY_ADDED",
        resource_type="MedicalHistory",
        resource_id=rec.id,
        details={"patient_id": patient_id, "condition": payload.condition}
    )

    return rec


@router.post("/{patient_id}/visits", response_model=PatientVisit, status_code=status.HTTP_201_CREATED)
def log_patient_visit(
    patient_id: str,
    payload: VisitCreate,
    current_user: dict = Depends(get_current_user_payload)
):
    """Log a clinical encounter/visit with assessment, vitals, outcome, and follow-up."""
    hospital_id = current_user["hospital_id"]
    profile = get_patient_profile(hospital_id=hospital_id, patient_id=patient_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Patient not found in this hospital.")

    visit = add_patient_visit(
        hospital_id=hospital_id,
        patient_id=patient_id,
        visit_data=payload.model_dump()
    )

    log_audit_event(
        hospital_id=hospital_id,
        user_id=current_user["sub"],
        user_name=current_user["name"],
        user_role=current_user["role"],
        action="VISIT_RECORDED",
        resource_type="PatientVisit",
        resource_id=visit.id,
        details={"patient_id": patient_id, "doctor_name": payload.doctor_name, "visit_number": visit.visit_number}
    )

    return visit


@router.post("/{patient_id}/appointments", response_model=Appointment, status_code=status.HTTP_201_CREATED)
def schedule_appointment(
    patient_id: str,
    payload: AppointmentCreate,
    current_user: dict = Depends(get_current_user_payload)
):
    """Schedule a consultation or follow-up appointment for a patient."""
    hospital_id = current_user["hospital_id"]
    profile = get_patient_profile(hospital_id=hospital_id, patient_id=patient_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Patient not found in this hospital.")

    user_info = {"id": current_user["sub"], "name": current_user["name"]}
    appt = create_appointment(
        hospital_id=hospital_id,
        patient_id=patient_id,
        appt_data=payload.model_dump(),
        user=user_info
    )

    log_audit_event(
        hospital_id=hospital_id,
        user_id=current_user["sub"],
        user_name=current_user["name"],
        user_role=current_user["role"],
        action="APPOINTMENT_SCHEDULED",
        resource_type="Appointment",
        resource_id=appt.id,
        details={"patient_id": patient_id, "date": payload.appointment_date, "doctor_name": payload.doctor_name}
    )

    return appt


@router.put("/appointments/{appointment_id}", response_model=Appointment)
def update_appointment(
    appointment_id: str,
    payload: AppointmentUpdate,
    current_user: dict = Depends(get_current_user_payload)
):
    """Update appointment status (Completed, Cancelled, Rescheduled, No-show)."""
    hospital_id = current_user["hospital_id"]
    appt = update_appointment_status(
        hospital_id=hospital_id,
        appt_id=appointment_id,
        updates=payload.model_dump(exclude_unset=True)
    )
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found in your hospital.")

    log_audit_event(
        hospital_id=hospital_id,
        user_id=current_user["sub"],
        user_name=current_user["name"],
        user_role=current_user["role"],
        action="APPOINTMENT_UPDATED",
        resource_type="Appointment",
        resource_id=appointment_id,
        details=payload.model_dump(exclude_unset=True)
    )

    return appt


@router.post("/{patient_id}/notes", response_model=ClinicalNote, status_code=status.HTTP_201_CREATED)
def add_patient_clinical_note(
    patient_id: str,
    payload: ClinicalNoteCreate,
    current_user: dict = Depends(get_current_user_payload)
):
    """Append a clinical or operational observation note to the patient file."""
    hospital_id = current_user["hospital_id"]
    profile = get_patient_profile(hospital_id=hospital_id, patient_id=patient_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Patient not found in this hospital.")

    user_info = {
        "id": current_user["sub"],
        "name": current_user["name"],
        "role": current_user["role"]
    }
    
    note = add_clinical_note(
        hospital_id=hospital_id,
        patient_id=patient_id,
        content=payload.note_content,
        user=user_info
    )

    log_audit_event(
        hospital_id=hospital_id,
        user_id=current_user["sub"],
        user_name=current_user["name"],
        user_role=current_user["role"],
        action="CLINICAL_NOTE_ADDED",
        resource_type="ClinicalNote",
        resource_id=note.id,
        details={"patient_id": patient_id}
    )

    return note


@router.post("/{patient_id}/triage", response_model=TriageAssessment)
def run_patient_triage(
    patient_id: str,
    intake: PatientIntake,
    decision_type: str = Query("ACCEPTED", description="ACCEPTED or OVERRIDDEN"),
    override_reason: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user_payload)
):
    """
    Run the Worst-Case-First AI triage decision support engine on an arrival presentation.
    Persists evaluation, safety warnings, and clinician sign-off into patient history.
    """
    hospital_id = current_user["hospital_id"]
    profile = get_patient_profile(hospital_id=hospital_id, patient_id=patient_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Patient not found in this hospital.")

    intake.patient_id = patient_id
    assessment = evaluate_triage(intake)

    user_info = {
        "id": current_user["sub"],
        "name": current_user["name"],
        "role": current_user["role"]
    }

    save_triage_record(
        hospital_id=hospital_id,
        patient_id=patient_id,
        intake_data=intake.model_dump(),
        assessment=assessment,
        human_decision=decision_type,
        override_reason=override_reason,
        user=user_info
    )

    log_audit_event(
        hospital_id=hospital_id,
        user_id=current_user["sub"],
        user_name=current_user["name"],
        user_role=current_user["role"],
        action="TRIAGE_EVALUATED",
        resource_type="TriageRecord",
        resource_id=patient_id,
        details={
            "priority": assessment.priority.value,
            "route": assessment.recommended_route,
            "decision": decision_type,
            "override_reason": override_reason
        }
    )

    return assessment


@router.post("/{patient_id}/assign-doctor")
def assign_doctor(
    patient_id: str,
    doctor_name: str = Query(..., min_length=2),
    department: str = Query("General Medicine"),
    doctor_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user_payload)
):
    """Assign primary physician and department to a patient."""
    hospital_id = current_user["hospital_id"]
    profile = get_patient_profile(hospital_id=hospital_id, patient_id=patient_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Patient not found in this hospital.")

    assign_patient_doctor(
        hospital_id=hospital_id,
        patient_id=patient_id,
        doctor_id=doctor_id or f"DOC-{current_user['sub'][-4:]}",
        doctor_name=doctor_name,
        department=department
    )

    log_audit_event(
        hospital_id=hospital_id,
        user_id=current_user["sub"],
        user_name=current_user["name"],
        user_role=current_user["role"],
        action="DOCTOR_ASSIGNED",
        resource_type="Patient",
        resource_id=patient_id,
        details={"doctor_name": doctor_name, "department": department}
    )

    return {"status": "success", "message": f"Assigned {doctor_name} to patient {patient_id}"}


@router.post("/{patient_id}/reassess")
def request_patient_reassessment(
    patient_id: str,
    reason: str = Query(..., min_length=2),
    current_user: dict = Depends(get_current_user_payload)
):
    """Flag patient for priority reassessment in triage queue."""
    hospital_id = current_user["hospital_id"]
    profile = get_patient_profile(hospital_id=hospital_id, patient_id=patient_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Patient not found in this hospital.")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE patients SET status = 'REASSESSMENT_REQUESTED' WHERE hospital_id = ? AND patient_id = ?
    """, (hospital_id, patient_id))
    conn.commit()
    conn.close()

    log_audit_event(
        hospital_id=hospital_id,
        user_id=current_user["sub"],
        user_name=current_user["name"],
        user_role=current_user["role"],
        action="TRIAGE_REASSESSMENT_REQUESTED",
        resource_type="Patient",
        resource_id=patient_id,
        details={"reason": reason, "requested_by": current_user["name"]}
    )

    return {"status": "success", "message": f"Reassessment flagged for patient {patient_id}"}
