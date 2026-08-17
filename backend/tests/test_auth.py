"""
Automated tests for Multi-Hospital Registration, JWT Auth & Staff Invitations.
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


def test_hospital_registration_and_code_uniqueness():
    """Verify hospital registration and enforce unique hospital codes."""
    payload_a = {
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
        "admin_email": "rajesh.admin@apollo.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    res_a = client.post("/api/auth/register-hospital", json=payload_a)
    assert res_a.status_code == 201
    data_a = res_a.json()
    assert "access_token" in data_a
    assert data_a["hospital"]["code"] == "AP"
    assert data_a["user"]["role"] == "HOSPITAL_ADMIN"

    # Duplicate hospital code 'AP' must be rejected
    payload_dup = payload_a.copy()
    payload_dup["hospital_name"] = "Apollo Secondary"
    res_dup = client.post("/api/auth/register-hospital", json=payload_dup)
    assert res_dup.status_code == 409
    assert "already exists" in res_dup.json()["detail"]


def test_login_and_role_resolution():
    """Verify authentication with hospital code, email, and password."""
    # Register hospital
    client.post("/api/auth/register-hospital", json={
        "hospital_name": "KIMS Hospital",
        "hospital_type": "Hospital",
        "hospital_address": "456 Care Road",
        "city": "Secunderabad",
        "state": "Telangana",
        "country": "India",
        "contact_email": "info@kims.com",
        "contact_phone": "+91-40-87654321",
        "hospital_code": "KI",
        "admin_name": "Dr. Sunita Admin",
        "admin_email": "sunita@kims.com",
        "password": "SecurePassword1!",
        "confirm_password": "SecurePassword1!"
    })

    # Test invalid password
    res_bad_pw = client.post("/api/auth/login", json={
        "hospital_code": "KI",
        "email": "sunita@kims.com",
        "password": "WrongPassword"
    })
    assert res_bad_pw.status_code == 401

    # Test invalid hospital code
    res_bad_code = client.post("/api/auth/login", json={
        "hospital_code": "XX",
        "email": "sunita@kims.com",
        "password": "SecurePassword1!"
    })
    assert res_bad_code.status_code == 401

    # Test valid login
    res_ok = client.post("/api/auth/login", json={
        "hospital_code": "KI",
        "email": "sunita@kims.com",
        "password": "SecurePassword1!"
    })
    assert res_ok.status_code == 200
    token = res_ok.json()["access_token"]

    # Verify /me endpoint
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["user"]["email"] == "sunita@kims.com"
    assert me_res.json()["hospital"]["code"] == "KI"


def test_staff_invitation_and_registration():
    """Verify hospital admin inviting a doctor and doctor completing registration."""
    # 1. Register hospital
    hosp_res = client.post("/api/auth/register-hospital", json={
        "hospital_name": "Example Medical Center",
        "hospital_type": "Medical Center",
        "hospital_address": "789 Pine St",
        "city": "Boston",
        "state": "MA",
        "country": "United States",
        "contact_email": "admin@emc.org",
        "contact_phone": "617-555-0100",
        "hospital_code": "EM",
        "admin_name": "Dr. Edward Admin",
        "admin_email": "edward@emc.org",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    admin_token = hosp_res.json()["access_token"]

    # 2. Invite Doctor
    invite_res = client.post(
        "/api/auth/invite-staff",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "name": "Dr. Ananya Rao",
            "email": "ananya.rao@emc.org",
            "role": "DOCTOR",
            "department": "Cardiology",
            "employee_id": "DOC-77"
        }
    )
    assert invite_res.status_code == 200
    invitation = invite_res.json()
    token = invitation["token"]

    # 3. Doctor completes registration via token
    reg_res = client.post("/api/auth/register-staff", json={
        "token": token,
        "name": "Dr. Ananya Rao",
        "email": "ananya.rao@emc.org",
        "password": "DoctorPassword123!",
        "confirm_password": "DoctorPassword123!"
    })
    assert reg_res.status_code == 201
    doc_data = reg_res.json()
    assert doc_data["user"]["role"] == "DOCTOR"
    assert doc_data["user"]["department"] == "Cardiology"
    assert doc_data["hospital"]["code"] == "EM"
