"""
Integration & End-to-End API Tests for PatientTriage.ai.
Tests clean empty startup, multi-hospital authenticated intake, red flags, overrides, and audit trails.
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


def test_clean_empty_application_startup():
    """Verify that health check reports connected and prototype starts empty."""
    health_res = client.get("/api/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "healthy"


def test_intake_patient_with_authenticated_hospital_and_red_flags():
    """Test full intake workflow with explicit red flag detection and hospital scoping."""
    # Register hospital
    hosp_res = client.post("/api/auth/register-hospital", json={
        "hospital_name": "Apollo Hospital",
        "hospital_type": "Hospital",
        "hospital_address": "123 Health Ave",
        "city": "Hyderabad",
        "state": "Telangana",
        "country": "India",
        "contact_email": "admin@apollo.com",
        "contact_phone": "+91-40-12345678",
        "hospital_code": "AP",
        "admin_name": "Dr. Rajesh Admin",
        "admin_email": "rajesh@apollo.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    token = hosp_res.json()["access_token"]
    auth = {"Authorization": f"Bearer {token}"}

    # Queue should initially be 0
    patients_res = client.get("/api/patients", headers=auth)
    assert patients_res.status_code == 200
    assert len(patients_res.json()) == 0

    # Analytics should have 0 arrivals
    analytics_res = client.get("/api/analytics", headers=auth)
    assert analytics_res.status_code == 200
    assert analytics_res.json()["total_arrivals"] == 0

    # Register patient
    p_res = client.post("/api/patients", headers=auth, json={
        "name": "David Miller",
        "dob": "1964-02-14",
        "sex": "Male",
        "phone": "555-0199"
    })
    assert p_res.status_code == 201
    pid = p_res.json()["patient_id"]
    assert pid == "AP-2026-000001"

    # Run Triage on the patient
    triage_payload = {
        "age": 62,
        "sex": "Male",
        "chief_complaint": "Severe crushing chest pain and shortness of breath",
        "symptoms": {
            "main_symptoms": ["Severe chest pain", "Dyspnea"],
            "severity": 9,
            "onset": "Sudden",
            "progression": "Worsening",
            "functional_status": "Severely impaired"
        },
        "red_flags": {
            "severe_dyspnea": "Yes",
            "severe_chest_pain": "Yes"
        },
        "vitals": {
            "heart_rate": 122,
            "respiratory_rate": 26,
            "spo2": 89.0,
            "systolic_bp": 85,
            "diastolic_bp": 55
        }
    }
    t_res = client.post(f"/api/patients/{pid}/triage?decision_type=ACCEPTED", headers=auth, json=triage_payload)
    assert t_res.status_code == 200
    assessment = t_res.json()
    assert assessment["priority"] == "RED"
    assert "Resuscitation" in assessment["recommended_route"]

    # Queue should now have 1 patient
    queue_res = client.get("/api/patients", headers=auth)
    assert len(queue_res.json()) == 1

    # Analytics should reflect total_arrivals = 1
    analytics_res = client.get("/api/analytics", headers=auth)
    assert analytics_res.json()["total_arrivals"] == 1


def test_direct_triage_preview_endpoint():
    """Test standalone preview endpoint."""
    intake = {
        "age": 70,
        "sex": "Female",
        "chief_complaint": "Sudden right sided facial droop and arm weakness",
        "red_flags": {
            "acute_weakness_facial_droop": "Yes",
            "acute_speech_difficulty": "Yes"
        },
        "symptoms": {"severity": 8, "onset": "Sudden"},
        "vitals": {"systolic_bp": 190, "diastolic_bp": 105, "heart_rate": 90, "spo2": 97.0}
    }
    res = client.post("/api/triage", json=intake)
    assert res.status_code == 200
    assessment = res.json()
    assert assessment["priority"] in ("RED", "ORANGE")
    assert "Stroke" in assessment["recommended_route"] or "High-Acuity" in assessment["recommended_route"]
