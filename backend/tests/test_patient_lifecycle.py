"""
Automated tests for Longitudinal Patient Profile Lifecycle & Timeline.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db, purge_all_data

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_clean_db():
    init_db()
    purge_all_data()
    yield
    purge_all_data()


def test_full_patient_lifecycle_and_timeline():
    """Verify registration, visits, appointments, medical history, triage, notes, and timeline."""
    # 1. Register Hospital
    reg_hosp = client.post("/api/auth/register-hospital", json={
        "hospital_name": "Metro General Hospital",
        "hospital_type": "Hospital",
        "hospital_address": "100 Metro Blvd",
        "city": "Chicago",
        "state": "IL",
        "country": "United States",
        "contact_email": "admin@metro.org",
        "contact_phone": "312-555-0199",
        "hospital_code": "MG",
        "admin_name": "Dr. Marcus Admin",
        "admin_email": "marcus@metro.org",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    token = reg_hosp.json()["access_token"]
    auth_header = {"Authorization": f"Bearer {token}"}

    # 2. Register Patient
    p_res = client.post("/api/patients", headers=auth_header, json={
        "name": "Sarah Connor",
        "dob": "1985-08-20",
        "sex": "Female",
        "phone": "312-555-0144",
        "email": "sarah.connor@example.com",
        "blood_group": "O+",
        "existing_conditions": ["Asthma"],
        "allergies": ["Penicillin"]
    })
    assert p_res.status_code == 201
    pid = p_res.json()["patient_id"]
    assert pid == "MG-2026-000001"

    # 3. Add Medical History
    med_res = client.post(f"/api/patients/{pid}/medical-history", headers=auth_header, json={
        "condition": "Appendectomy",
        "condition_type": "Surgery",
        "date_or_year": "2018",
        "status": "Resolved",
        "notes": "Laparoscopic appendectomy with no complications."
    })
    assert med_res.status_code == 201

    # 4. Log Patient Clinical Visit
    visit_res = client.post(f"/api/patients/{pid}/visits", headers=auth_header, json={
        "department": "Emergency Medicine",
        "doctor_name": "Dr. Ananya Rao",
        "reason_for_visit": "Acute wheezing and chest tightness",
        "symptoms": ["Dyspnea", "Wheezing"],
        "vitals": {"spo2": 93.0, "heart_rate": 105, "respiratory_rate": 24},
        "triage_priority": "ORANGE",
        "assessment": "Acute asthma exacerbation triggered by viral URI",
        "clinical_notes": "Administered nebulized albuterol with symptomatic improvement.",
        "outcome": "Stabilized in acute care",
        "follow_up": "Pulmonology follow-up in 1 week"
    })
    assert visit_res.status_code == 201
    assert visit_res.json()["visit_number"].startswith("MG-V-")

    # 5. Schedule Follow-up Appointment
    appt_res = client.post(f"/api/patients/{pid}/appointments", headers=auth_header, json={
        "appointment_date": "2026-08-25",
        "appointment_time": "10:30 AM",
        "doctor_name": "Dr. Ananya Rao",
        "department": "Pulmonology",
        "appointment_type": "Follow-up",
        "notes": "Post-discharge respiratory function assessment."
    })
    assert appt_res.status_code == 201
    appt_id = appt_res.json()["id"]

    # 6. Add Clinical Note
    note_res = client.post(f"/api/patients/{pid}/notes", headers=auth_header, json={
        "note_content": "Patient reports inhaler compliance. Peak flow measurement stable."
    })
    assert note_res.status_code == 201

    # 7. Run Triage on Patient
    triage_res = client.post(
        f"/api/patients/{pid}/triage?decision_type=ACCEPTED",
        headers=auth_header,
        json={
            "age": 41,
            "sex": "Female",
            "chief_complaint": "Acute wheezing and shortness of breath",
            "symptoms": {"severity": 7, "onset": "Sudden"},
            "red_flags": {"severe_dyspnea": "Yes"},
            "vitals": {"spo2": 92.0, "respiratory_rate": 24, "heart_rate": 108}
        }
    )
    assert triage_res.status_code == 200
    assert triage_res.json()["priority"] in ("RED", "ORANGE")

    # 8. Retrieve Complete 10-Tab Patient Profile
    profile_res = client.get(f"/api/patients/{pid}", headers=auth_header)
    assert profile_res.status_code == 200
    profile = profile_res.json()

    assert profile["patient"]["patient_id"] == "MG-2026-000001"
    assert len(profile["medical_history"]) >= 2  # Pre-existing Asthma/Penicillin + Appendectomy
    assert len(profile["visits"]) == 1
    assert len(profile["appointments"]) == 1
    assert len(profile["triage_history"]) == 1
    assert len(profile["clinical_notes"]) >= 1
    assert len(profile["timeline"]) >= 4  # Registration, Visit, Appointment, Note, Triage
    assert profile["next_appointment"]["appointment_date"] == "2026-08-25"

    # 9. Verify Audit Log
    audit_res = client.get("/api/audit", headers=auth_header)
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) >= 5
