"""
Master End-to-End Acceptance Test for PatientTriage.ai.
Tests the exact 28-step clinical journey across two isolated hospital tenants.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db, purge_all_data

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_clean_database():
    init_db()
    purge_all_data()
    yield
    purge_all_data()


def test_complete_master_application_flow():
    # -------------------------------------------------------------
    # STEP 1 & 2: Register ApexCare Medical Center (Code: AC) with Admin
    # -------------------------------------------------------------
    reg_payload = {
        "hospital_name": "ApexCare Medical Center",
        "hospital_type": "Hospital",
        "hospital_address": "100 Health Park Blvd",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "contact_email": "contact@apexcare.example",
        "contact_phone": "+91 98765 43210",
        "hospital_code": "AC",
        "admin_name": "Dr. Arjun Mehta",
        "admin_email": "arjun.mehta@apexcare.example",
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    r = client.post("/api/auth/register-hospital", json=reg_payload)
    assert r.status_code == 201, r.text
    admin_auth = r.json()
    admin_token = admin_auth["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    assert admin_auth["hospital"]["code"] == "AC"
    assert admin_auth["user"]["role"] == "HOSPITAL_ADMIN"

    # -------------------------------------------------------------
    # STEP 3: Admin Login Verification
    # -------------------------------------------------------------
    r = client.post("/api/auth/login", json={
        "hospital_code": "AC",
        "email": "arjun.mehta@apexcare.example",
        "password": "Password123!"
    })
    assert r.status_code == 200

    # -------------------------------------------------------------
    # STEP 4: Create Emergency Department (Setup Wizard)
    # -------------------------------------------------------------
    r = client.post("/api/hospital/departments", headers=admin_headers, json={
        "department_name": "Emergency Department"
    })
    assert r.status_code == 200

    # Mark Setup Complete
    r = client.post("/api/hospital/complete-setup", headers=admin_headers)
    assert r.status_code == 200

    # -------------------------------------------------------------
    # STEP 5: Invite Dr. Priya Sharma (Doctor)
    # -------------------------------------------------------------
    r = client.post("/api/auth/invite-staff", headers=admin_headers, json={
        "name": "Dr. Priya Sharma",
        "email": "priya.sharma@apexcare.example",
        "role": "DOCTOR",
        "department": "Emergency Medicine",
        "employee_id": "EMP-DOC-01"
    })
    assert r.status_code == 200
    doc_invitation = r.json()
    doc_token = doc_invitation["token"]

    # Doctor Redeems Invitation & Creates Account
    r = client.post("/api/auth/register-staff", json={
        "token": doc_token,
        "name": "Dr. Priya Sharma",
        "email": "priya.sharma@apexcare.example",
        "password": "DocPassword123!",
        "confirm_password": "DocPassword123!"
    })
    assert r.status_code == 201

    # -------------------------------------------------------------
    # STEP 6: Invite Nisha Reddy (Triage Nurse)
    # -------------------------------------------------------------
    r = client.post("/api/auth/invite-staff", headers=admin_headers, json={
        "name": "Nisha Reddy",
        "email": "nisha.reddy@apexcare.example",
        "role": "TRIAGE_NURSE",
        "department": "Emergency Department",
        "employee_id": "EMP-NUR-01"
    })
    assert r.status_code == 200
    nurse_invitation = r.json()
    nurse_token = nurse_invitation["token"]

    # Nurse Redeems Invitation
    r = client.post("/api/auth/register-staff", json={
        "token": nurse_token,
        "name": "Nisha Reddy",
        "email": "nisha.reddy@apexcare.example",
        "password": "NursePassword123!",
        "confirm_password": "NursePassword123!"
    })
    assert r.status_code == 201

    # -------------------------------------------------------------
    # STEP 7: Login as Nisha Reddy (Triage Nurse)
    # -------------------------------------------------------------
    r = client.post("/api/auth/login", json={
        "hospital_code": "AC",
        "email": "nisha.reddy@apexcare.example",
        "password": "NursePassword123!"
    })
    assert r.status_code == 200
    nurse_auth = r.json()
    assert nurse_auth["user"]["role"] == "TRIAGE_NURSE"
    nurse_headers = {"Authorization": f"Bearer {nurse_auth['access_token']}"}

    # -------------------------------------------------------------
    # STEP 8 & 9: Register Patient Rahul Verma (Auto-generated AC-2026-000001)
    # -------------------------------------------------------------
    patient_payload = {
        "name": "Rahul Verma",
        "dob": "1981-05-12",
        "age": 45,
        "sex": "Male",
        "phone": "+91 98111 22233",
        "email": "rahul.verma@example.com",
        "address": "42 Marine Drive, Mumbai",
        "emergency_contact": "Anita Verma (Spouse): +91 98111 22234",
        "blood_group": "B+",
        "allergies": ["Penicillin"],
        "existing_conditions": ["Hypertension"],
        "department": "Emergency Medicine"
    }
    r = client.post("/api/patients", headers=nurse_headers, json=patient_payload)
    assert r.status_code == 201
    reg_data = r.json()
    patient_id = reg_data["patient_id"]
    assert patient_id == "AC-2026-000001"

    # -------------------------------------------------------------
    # STEP 10: Open Patient Profile
    # -------------------------------------------------------------
    r = client.get(f"/api/patients/{patient_id}", headers=nurse_headers)
    assert r.status_code == 200
    profile = r.json()
    assert profile["patient"]["name"] == "Rahul Verma"

    # -------------------------------------------------------------
    # STEP 11, 12, 13, 14 & 15: Run Emergency Triage & Accept
    # -------------------------------------------------------------
    triage_intake = {
        "patient_id": patient_id,
        "age": 45,
        "sex": "Male",
        "arrival_method": "Walk-in",
        "chief_complaint": "Severe acute chest pain & shortness of breath",
        "symptoms": {
            "main_symptoms": ["Chest tightness", "Diaphoresis", "Shortness of breath"],
            "symptom_duration": "45 mins",
            "severity": 8,
            "onset": "Sudden",
            "consciousness_status": "Alert",
            "ability_to_speak": "Short phrases only",
            "ability_to_walk": "With assistance",
            "progression": "Worsening",
            "functional_status": "Severely impaired"
        },
        "red_flags": {
            "severe_dyspnea": "Yes",
            "severe_chest_pain": "Yes",
            "uncontrolled_bleeding": "No",
            "loss_of_consciousness": "No",
            "altered_mental_status": "No",
            "seizure": "No",
            "acute_weakness_facial_droop": "No",
            "acute_speech_difficulty": "No",
            "severe_allergic_reaction": "No",
            "major_trauma": "No",
            "severe_uncontrolled_pain": "Yes"
        },
        "vitals": {
            "heart_rate": 115,
            "respiratory_rate": 26,
            "spo2": 93.5,
            "systolic_bp": 155,
            "diastolic_bp": 95,
            "temperature": 37.2,
            "gcs": 15
        },
        "history": {
            "known_major_conditions": ["Hypertension"],
            "current_medications": ["Amlodipine 5mg"],
            "allergies": ["Penicillin"],
            "pregnancy_status": "Not applicable",
            "recent_trauma": False,
            "recent_surgery": False,
            "relevant_risk_factors": []
        }
    }
    r = client.post(
        f"/api/patients/{patient_id}/triage?decision_type=ACCEPTED",
        headers=nurse_headers,
        json=triage_intake
    )
    assert r.status_code == 200
    triage_result = r.json()
    assert triage_result["priority"] in ("RED", "ORANGE")
    assert len(triage_result["reasoning_bullets"]) > 0

    # -------------------------------------------------------------
    # STEP 16: Verify Patient Appears in Triage Queue
    # -------------------------------------------------------------
    r = client.get("/api/hospital/triage-queue", headers=nurse_headers)
    assert r.status_code == 200
    queue = r.json()
    assert any(q["patient_id"] == patient_id for q in queue)

    # -------------------------------------------------------------
    # STEP 17: Assign Dr. Priya Sharma
    # -------------------------------------------------------------
    r = client.post(
        f"/api/patients/{patient_id}/assign-doctor?doctor_name=Dr.+Priya+Sharma&department=Emergency+Medicine",
        headers=nurse_headers
    )
    assert r.status_code == 200

    # -------------------------------------------------------------
    # STEP 18: Login as Dr. Priya Sharma
    # -------------------------------------------------------------
    r = client.post("/api/auth/login", json={
        "hospital_code": "AC",
        "email": "priya.sharma@apexcare.example",
        "password": "DocPassword123!"
    })
    assert r.status_code == 200
    doc_auth = r.json()
    assert doc_auth["user"]["role"] == "DOCTOR"
    doc_headers = {"Authorization": f"Bearer {doc_auth['access_token']}"}

    # -------------------------------------------------------------
    # STEP 19: Doctor Opens Rahul's Record
    # -------------------------------------------------------------
    r = client.get(f"/api/patients/{patient_id}", headers=doc_headers)
    assert r.status_code == 200
    doc_profile = r.json()
    assert doc_profile["patient"]["primary_doctor_name"] == "Dr. Priya Sharma"
    assert doc_profile["latest_triage"] is not None

    # -------------------------------------------------------------
    # STEP 20, 21 & 22: Start Visit, Add Clinical Note & Complete Visit
    # -------------------------------------------------------------
    visit_payload = {
        "department": "Emergency Medicine",
        "doctor_name": "Dr. Priya Sharma",
        "reason_for_visit": "Acute coronary syndrome evaluation & emergency stabilization",
        "symptoms": ["Chest tightness", "Diaphoresis"],
        "vitals": {"heart_rate": 110, "spo2": 95, "bp": "140/90"},
        "triage_priority": "ORANGE",
        "assessment": "ECG shows ST depression in V4-V6. Administered sublingual nitroglycerin and aspirin.",
        "clinical_notes": "Patient reports pain reduction from 8/10 to 3/10. Serial cardiac enzymes ordered.",
        "outcome": "Transferred to Cardiac Monitored Bed. Stable.",
        "follow_up": "Cardiology specialist consultation in 7 days."
    }
    r = client.post(f"/api/patients/{patient_id}/visits", headers=doc_headers, json=visit_payload)
    assert r.status_code == 201
    visit_rec = r.json()
    assert visit_rec["visit_number"].startswith("AC-V-")

    # Append extra clinical note
    r = client.post(f"/api/patients/{patient_id}/notes", headers=doc_headers, json={
        "note_content": "Cardiology consult completed by Dr. Priya Sharma. Recommend repeat troponin."
    })
    assert r.status_code == 201

    # -------------------------------------------------------------
    # STEP 23: Schedule Follow-up Appointment
    # -------------------------------------------------------------
    appt_payload = {
        "appointment_date": "2026-08-25",
        "appointment_time": "10:30 AM",
        "doctor_name": "Dr. Priya Sharma",
        "department": "Cardiology",
        "appointment_type": "Emergency Follow-up",
        "notes": "Post-discharge cardiac review and stress test evaluation."
    }
    r = client.post(f"/api/patients/{patient_id}/appointments", headers=doc_headers, json=appt_payload)
    assert r.status_code == 201
    appt_rec = r.json()
    assert appt_rec["appointment_number"].startswith("AC-APT-")

    # -------------------------------------------------------------
    # STEP 24: Open Patient Timeline & Verify Events
    # -------------------------------------------------------------
    r = client.get(f"/api/patients/{patient_id}", headers=doc_headers)
    assert r.status_code == 200
    updated_profile = r.json()
    
    timeline = updated_profile["timeline"]
    event_types = [e["event_type"] for e in timeline]
    
    assert "PATIENT_REGISTERED" in event_types
    assert "TRIAGE_RECOMMENDED" in event_types
    assert "HUMAN_DECISION" in event_types
    assert "DOCTOR_ASSIGNED" in event_types
    assert "VISIT_COMPLETED" in event_types
    assert "CLINICAL_NOTE_ADDED" in event_types
    assert "APPOINTMENT_SCHEDULED" in event_types
    assert updated_profile["next_appointment"]["appointment_date"] == "2026-08-25"

    # -------------------------------------------------------------
    # STEP 25 & 26: Login again -> Verify Persistence
    # -------------------------------------------------------------
    r = client.post("/api/auth/login", json={
        "hospital_code": "AC",
        "email": "priya.sharma@apexcare.example",
        "password": "DocPassword123!"
    })
    assert r.status_code == 200
    r = client.get(f"/api/patients/{patient_id}", headers=doc_headers)
    assert r.status_code == 200
    assert r.json()["patient"]["patient_id"] == "AC-2026-000001"

    # -------------------------------------------------------------
    # STEP 27 & 28: Second Hospital (Kaveri Medical Center - KM) Isolation
    # -------------------------------------------------------------
    km_reg = {
        "hospital_name": "Kaveri Medical Center",
        "hospital_type": "Hospital",
        "hospital_address": "88 Riverside Road",
        "city": "Bengaluru",
        "state": "Karnataka",
        "country": "India",
        "contact_email": "admin@kaveri.example",
        "contact_phone": "+91 80 1234 5678",
        "hospital_code": "KM",
        "admin_name": "Dr. Suresh Kumar",
        "admin_email": "suresh.kumar@kaveri.example",
        "password": "KmPassword123!",
        "confirm_password": "KmPassword123!"
    }
    r = client.post("/api/auth/register-hospital", json=km_reg)
    assert r.status_code == 201
    km_auth = r.json()
    km_headers = {"Authorization": f"Bearer {km_auth['access_token']}"}

    # Register first patient in KM
    r = client.post("/api/patients", headers=km_headers, json={
        "name": "Sunita Rao",
        "dob": "1990-02-14",
        "age": 36,
        "sex": "Female",
        "blood_group": "O+",
        "department": "Emergency Medicine"
    })
    assert r.status_code == 201
    km_patient_id = r.json()["patient_id"]
    # Independent sequence starting at 1
    assert km_patient_id == "KM-2026-000001"

    # Cross-Hospital Isolation Check:
    # 1. KM user cannot see AC's patient
    r = client.get(f"/api/patients/{patient_id}", headers=km_headers)
    assert r.status_code == 404

    # 2. AC user cannot see KM's patient
    r = client.get(f"/api/patients/{km_patient_id}", headers=doc_headers)
    assert r.status_code == 404
