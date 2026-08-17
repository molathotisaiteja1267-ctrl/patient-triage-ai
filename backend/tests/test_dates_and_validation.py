import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db

client = TestClient(app)

def test_patient_registration_dates_and_validation():
    init_db()
    # 1. Register hospital
    hosp_res = client.post("/api/auth/register-hospital", json={
        "hospital_name": "Date Test General Hospital",
        "hospital_type": "Hospital",
        "hospital_address": "77 Health Way",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "contact_email": "info@datetesthospital.org",
        "contact_phone": "+91-22-99887766",
        "hospital_code": "DT",
        "admin_name": "Dr. Test Admin",
        "admin_email": "admin@datetesthospital.org",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    if hosp_res.status_code == 201:
        token = hosp_res.json()["access_token"]
    else:
        # If already exists, login
        login_res = client.post("/api/auth/login", json={
            "hospital_code": "DT",
            "email": "admin@datetesthospital.org",
            "password": "Password123!"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    # Test 1: Register patient with valid DOB (YYYY-MM-DD)
    res1 = client.post("/api/patients", json={
        "name": "Ananya Roy",
        "dob": "1995-04-12",
        "sex": "Female",
        "age": 31,
        "blood_group": "A+",
        "allergies": ["Penicillin"],
        "existing_conditions": ["Asthma"]
    }, headers=headers)
    assert res1.status_code == 201
    pdata = res1.json()
    pid = pdata["patient_id"]
    assert pid.startswith("DT-")

    # Test 2: Intake submission with ISO arrival_time
    intake_res = client.post(f"/api/patients/{pid}/triage?decision_type=ACCEPTED", json={
        "patient_id": pid,
        "age": 31,
        "sex": "Female",
        "arrival_time": "2026-08-18T02:00:00Z",
        "chief_complaint": "Acute wheezing and shortness of breath",
        "symptoms": {
            "main_symptoms": ["Wheezing", "Dyspnea"],
            "severity": 6
        },
        "red_flags": {
            "severe_dyspnea": "Yes"
        }
    }, headers=headers)
    assert intake_res.status_code == 200
    triage_data = intake_res.json()
    assert triage_data["priority"] in ["RED", "ORANGE", "YELLOW"]

    # Test 3: Intake submission with empty string arrival_time (should safely convert to None without 422 error)
    intake_res2 = client.post(f"/api/patients/{pid}/triage?decision_type=ACCEPTED", json={
        "patient_id": pid,
        "age": 31,
        "sex": "Female",
        "arrival_time": "",
        "chief_complaint": "Routine follow-up check",
        "symptoms": {
            "main_symptoms": ["Checkup"],
            "severity": 1
        }
    }, headers=headers)
    assert intake_res2.status_code == 200

    # Test 4: Direct triage calculation endpoint
    preview_res = client.post("/api/triage", json={
        "patient_id": pid,
        "age": 31,
        "sex": "Female",
        "arrival_time": "",
        "chief_complaint": "Mild headache",
        "symptoms": {
            "main_symptoms": ["Headache"],
            "severity": 3
        }
    }, headers=headers)
    assert preview_res.status_code == 200

    # Test 5: Schedule appointment with valid YYYY-MM-DD
    appt_res = client.post(f"/api/patients/{pid}/appointments", json={
        "appointment_date": "2026-09-15",
        "appointment_time": "11:00 AM",
        "doctor_name": "Dr. Priya Sharma",
        "department": "Pulmonology"
    }, headers=headers)
    assert appt_res.status_code == 201

    # Test 6: Add medical history with string year
    hist_res = client.post(f"/api/patients/{pid}/medical-history", json={
        "condition": "Mild Bronchospasm",
        "condition_type": "Chronic Condition",
        "date_or_year": "2020",
        "status": "Active"
    }, headers=headers)
    assert hist_res.status_code == 201

    # Test 7: Verify patient profile displays all date fields cleanly
    profile_res = client.get(f"/api/patients/{pid}", headers=headers)
    assert profile_res.status_code == 200
    prof = profile_res.json()
    assert prof["patient"]["dob"] == "1995-04-12"
    assert len(prof["appointments"]) >= 1
    assert prof["appointments"][0]["appointment_date"] == "2026-09-15"
    assert len(prof["triage_history"]) >= 1
