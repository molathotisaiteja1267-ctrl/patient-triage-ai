"""
Automated tests for Server-Side Atomic Patient ID Sequencing and Hospital Data Isolation.
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


def test_patient_id_sequence_generation():
    """Verify hospital-scoped sequential ID generation (e.g. AP-2026-000001, AP-2026-000002)."""
    # 1. Register Hospital AP
    res_ap = client.post("/api/auth/register-hospital", json={
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
    token_ap = res_ap.json()["access_token"]

    # Register 3 patients in AP
    p1 = client.post(
        "/api/patients",
        headers={"Authorization": f"Bearer {token_ap}"},
        json={"name": "John Doe", "dob": "1980-05-12", "sex": "Male", "phone": "555-0101"}
    ).json()
    assert p1["patient_id"] == "AP-2026-000001"

    p2 = client.post(
        "/api/patients",
        headers={"Authorization": f"Bearer {token_ap}"},
        json={"name": "Jane Smith", "dob": "1992-11-20", "sex": "Female", "phone": "555-0102"}
    ).json()
    assert p2["patient_id"] == "AP-2026-000002"

    p3 = client.post(
        "/api/patients",
        headers={"Authorization": f"Bearer {token_ap}"},
        json={"name": "Robert Taylor", "dob": "1965-03-08", "sex": "Male", "phone": "555-0103"}
    ).json()
    assert p3["patient_id"] == "AP-2026-000003"

    # 2. Register Hospital KI
    res_ki = client.post("/api/auth/register-hospital", json={
        "hospital_name": "KIMS Hospital",
        "hospital_type": "Hospital",
        "hospital_address": "456 Care Rd",
        "city": "Secunderabad",
        "state": "Telangana",
        "country": "India",
        "contact_email": "admin@kims.com",
        "contact_phone": "+91-40-87654321",
        "hospital_code": "KI",
        "admin_name": "Dr. Sunita Admin",
        "admin_email": "sunita@kims.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    token_ki = res_ki.json()["access_token"]

    # First patient in KI starts independently at sequence 1
    p_ki1 = client.post(
        "/api/patients",
        headers={"Authorization": f"Bearer {token_ki}"},
        json={"name": "Alice Brown", "dob": "1988-07-15", "sex": "Female", "phone": "555-0201"}
    ).json()
    assert p_ki1["patient_id"] == "KI-2026-000001"


def test_cross_hospital_data_isolation():
    """Verify that Hospital AP cannot access Hospital KI's patients or records."""
    # Register AP
    token_ap = client.post("/api/auth/register-hospital", json={
        "hospital_name": "Apollo Hospital", "hospital_type": "Hospital",
        "hospital_address": "123 Health Ave", "city": "Hyderabad", "state": "Telangana",
        "country": "India", "contact_email": "admin@apollo.com", "contact_phone": "123456",
        "hospital_code": "AP", "admin_name": "Admin AP", "admin_email": "admin@apollo.com",
        "password": "Password123!", "confirm_password": "Password123!"
    }).json()["access_token"]

    # Register KI
    token_ki = client.post("/api/auth/register-hospital", json={
        "hospital_name": "KIMS Hospital", "hospital_type": "Hospital",
        "hospital_address": "456 Care Rd", "city": "Secunderabad", "state": "Telangana",
        "country": "India", "contact_email": "admin@kims.com", "contact_phone": "654321",
        "hospital_code": "KI", "admin_name": "Admin KI", "admin_email": "admin@kims.com",
        "password": "Password123!", "confirm_password": "Password123!"
    }).json()["access_token"]

    # Register Patient in AP
    res_p_ap = client.post(
        "/api/patients",
        headers={"Authorization": f"Bearer {token_ap}"},
        json={"name": "Patient AP", "dob": "1975-01-01", "sex": "Male"}
    ).json()
    pid_ap = res_p_ap["patient_id"]

    # Register Patient in KI
    res_p_ki = client.post(
        "/api/patients",
        headers={"Authorization": f"Bearer {token_ki}"},
        json={"name": "Patient KI", "dob": "1990-06-06", "sex": "Female"}
    ).json()
    pid_ki = res_p_ki["patient_id"]

    # Hospital AP accessing its own patient -> OK
    get_own = client.get(f"/api/patients/{pid_ap}", headers={"Authorization": f"Bearer {token_ap}"})
    assert get_own.status_code == 200
    assert get_own.json()["patient"]["name"] == "Patient AP"

    # Hospital AP accessing Hospital KI patient -> FORBIDDEN / NOT FOUND
    get_other = client.get(f"/api/patients/{pid_ki}", headers={"Authorization": f"Bearer {token_ap}"})
    assert get_other.status_code == 404

    # Hospital KI accessing Hospital AP patient -> FORBIDDEN / NOT FOUND
    get_other_ki = client.get(f"/api/patients/{pid_ap}", headers={"Authorization": f"Bearer {token_ki}"})
    assert get_other_ki.status_code == 404

    # Search in AP should only return AP patients
    search_ap = client.get("/api/patients", headers={"Authorization": f"Bearer {token_ap}"}).json()
    assert len(search_ap) == 1
    assert search_ap[0]["patient_id"] == pid_ap
