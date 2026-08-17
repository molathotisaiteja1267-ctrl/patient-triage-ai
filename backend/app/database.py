"""
Database Engine & Repository Layer for PatientTriage.ai.
Supports multi-hospital data isolation, server-side atomic patient ID sequencing,
longitudinal patient profile persistence, and hospital setup management.
"""

import json
import sqlite3
import uuid
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from app.config import settings
from app.models import (
    HospitalResponse,
    UserSummary,
    StaffMember,
    PatientSummary,
    MedicalHistoryRecord,
    PatientVisit,
    Appointment,
    ClinicalNote,
    DoctorAssignment,
    TriageRecordSummary,
    TimelineEvent,
    RoleEnum,
    PriorityLevel,
    PatientStatus
)


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.DATABASE_PATH, timeout=20.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """Create normalized multi-hospital schema."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Hospitals Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hospitals (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        hospital_type TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        country TEXT NOT NULL,
        contact_email TEXT NOT NULL,
        contact_phone TEXT NOT NULL,
        is_setup_completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
    )
    """)
    
    # Check if is_setup_completed column exists, if not alter table
    cursor.execute("PRAGMA table_info(hospitals)")
    cols = [col[1] for col in cursor.fetchall()]
    if "is_setup_completed" not in cols:
        cursor.execute("ALTER TABLE hospitals ADD COLUMN is_setup_completed INTEGER NOT NULL DEFAULT 0")
    
    # 2. Hospital Departments Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hospital_departments (
        id TEXT PRIMARY KEY,
        hospital_id TEXT NOT NULL,
        department_name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (hospital_id) REFERENCES hospitals (id) ON DELETE CASCADE,
        UNIQUE (hospital_id, department_name)
    )
    """)

    # 3. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        hospital_id TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        department TEXT,
        employee_id TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (hospital_id) REFERENCES hospitals (id) ON DELETE CASCADE,
        UNIQUE (hospital_id, email)
    )
    """)

    # 4. Staff Invitations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS staff_invitations (
        id TEXT PRIMARY KEY,
        hospital_id TEXT NOT NULL,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        department TEXT,
        employee_id TEXT,
        token TEXT NOT NULL UNIQUE,
        is_used INTEGER NOT NULL DEFAULT 0,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (hospital_id) REFERENCES hospitals (id) ON DELETE CASCADE
    )
    """)

    # 5. Patient ID Sequence Tracker per Hospital & Year
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patient_sequences (
        hospital_code TEXT NOT NULL,
        year INTEGER NOT NULL,
        last_sequence INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (hospital_code, year)
    )
    """)

    # 6. Patients Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        hospital_id TEXT NOT NULL,
        patient_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        dob TEXT NOT NULL,
        age INTEGER NOT NULL,
        sex TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        emergency_contact TEXT,
        blood_group TEXT,
        primary_doctor_id TEXT,
        primary_doctor_name TEXT,
        doctor_assigned_at TEXT,
        department TEXT,
        status TEXT NOT NULL DEFAULT 'Active',
        registration_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        data_json TEXT NOT NULL,
        FOREIGN KEY (hospital_id) REFERENCES hospitals (id) ON DELETE CASCADE
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_patients_hospital ON patients (hospital_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_patients_pid ON patients (patient_id)")

    # Check if doctor_assigned_at column exists in patients
    cursor.execute("PRAGMA table_info(patients)")
    p_cols = [col[1] for col in cursor.fetchall()]
    if "doctor_assigned_at" not in p_cols:
        cursor.execute("ALTER TABLE patients ADD COLUMN doctor_assigned_at TEXT")

    # 7. Medical Histories
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS medical_histories (
        id TEXT PRIMARY KEY,
        hospital_id TEXT NOT NULL,
        patient_id TEXT NOT NULL,
        condition TEXT NOT NULL,
        condition_type TEXT NOT NULL,
        date_or_year TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Active',
        notes TEXT,
        recorded_by_user_id TEXT,
        recorded_by_name TEXT NOT NULL,
        recorded_by_role TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (hospital_id) REFERENCES hospitals (id) ON DELETE CASCADE
    )
    """)

    # 8. Patient Visits
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patient_visits (
        id TEXT PRIMARY KEY,
        hospital_id TEXT NOT NULL,
        patient_id TEXT NOT NULL,
        visit_number TEXT NOT NULL,
        visit_date TEXT NOT NULL,
        department TEXT NOT NULL,
        doctor_id TEXT,
        doctor_name TEXT NOT NULL,
        reason_for_visit TEXT NOT NULL,
        symptoms_json TEXT NOT NULL,
        vitals_json TEXT,
        triage_priority TEXT,
        assessment TEXT NOT NULL,
        clinical_notes TEXT NOT NULL,
        outcome TEXT NOT NULL,
        follow_up TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (hospital_id) REFERENCES hospitals (id) ON DELETE CASCADE
    )
    """)

    # 9. Appointments
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        hospital_id TEXT NOT NULL,
        patient_id TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        appointment_number TEXT NOT NULL,
        appointment_date TEXT NOT NULL,
        appointment_time TEXT NOT NULL,
        doctor_id TEXT,
        doctor_name TEXT NOT NULL,
        department TEXT NOT NULL,
        appointment_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Scheduled',
        notes TEXT,
        created_by TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (hospital_id) REFERENCES hospitals (id) ON DELETE CASCADE
    )
    """)

    # Check if appointment_number column exists in appointments
    cursor.execute("PRAGMA table_info(appointments)")
    a_cols = [col[1] for col in cursor.fetchall()]
    if "appointment_number" not in a_cols:
        cursor.execute("ALTER TABLE appointments ADD COLUMN appointment_number TEXT NOT NULL DEFAULT 'APT-000001'")

    # 10. Triage Records
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS triage_records (
        id TEXT PRIMARY KEY,
        hospital_id TEXT NOT NULL,
        patient_id TEXT NOT NULL,
        triage_date TEXT NOT NULL,
        intake_json TEXT NOT NULL,
        priority TEXT NOT NULL,
        recommended_route TEXT NOT NULL,
        confidence_score REAL NOT NULL,
        safety_eval_json TEXT NOT NULL,
        reasoning_json TEXT NOT NULL,
        human_decision TEXT NOT NULL,
        override_reason TEXT,
        staff_id TEXT NOT NULL,
        staff_name TEXT NOT NULL,
        staff_role TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (hospital_id) REFERENCES hospitals (id) ON DELETE CASCADE
    )
    """)

    # 11. Clinical Notes
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS clinical_notes (
        id TEXT PRIMARY KEY,
        hospital_id TEXT NOT NULL,
        patient_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        author_role TEXT NOT NULL,
        note_content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (hospital_id) REFERENCES hospitals (id) ON DELETE CASCADE
    )
    """)

    # 12. Audit Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        hospital_id TEXT NOT NULL,
        user_id TEXT,
        user_name TEXT,
        user_role TEXT,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        details_json TEXT NOT NULL,
        timestamp TEXT NOT NULL
    )
    """)

    # 13. System State
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_state (
        hospital_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        PRIMARY KEY (hospital_id, key)
    )
    """)
    
    conn.commit()
    conn.close()


def purge_all_data():
    """Wipe all tables to restore 100% clean starting state."""
    conn = get_db_connection()
    cursor = conn.cursor()
    tables = [
        "hospital_departments", "clinical_notes", "triage_records", "appointments",
        "patient_visits", "medical_histories", "patients", "patient_sequences",
        "staff_invitations", "users", "hospitals", "audit_logs", "system_state"
    ]
    for tbl in tables:
        cursor.execute(f"DELETE FROM {tbl}")
    conn.commit()
    conn.close()


# =====================================================================
# Hospital & Department Operations
# =====================================================================

def create_hospital(
    name: str,
    code: str,
    hospital_type: str,
    address: str,
    city: str,
    state: str,
    country: str,
    contact_email: str,
    contact_phone: str
) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    code_upper = code.strip().upper()
    cursor.execute("SELECT id FROM hospitals WHERE code = ?", (code_upper,))
    if cursor.fetchone():
        conn.close()
        raise ValueError(f"Hospital code '{code_upper}' already exists. Please choose another code.")
    
    hospital_id = f"HOSP-{uuid.uuid4().hex[:8].upper()}"
    now_str = datetime.now(timezone.utc).isoformat()
    
    cursor.execute("""
    INSERT INTO hospitals (
        id, name, code, hospital_type, address, city, state, country,
        contact_email, contact_phone, is_setup_completed, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    """, (
        hospital_id, name.strip(), code_upper, hospital_type,
        address.strip(), city.strip(), state.strip(), country.strip(),
        contact_email.strip(), contact_phone.strip(), now_str
    ))
    
    # Initialize default department for hospital
    default_depts = [
        "Emergency Department",
        "Cardiology",
        "General Medicine",
        "Orthopedics",
        "Radiology"
    ]
    for dept in default_depts:
        dept_id = f"DEP-{uuid.uuid4().hex[:8].upper()}"
        cursor.execute("""
        INSERT INTO hospital_departments (id, hospital_id, department_name, created_at)
        VALUES (?, ?, ?, ?)
        """, (dept_id, hospital_id, dept, now_str))

    conn.commit()
    conn.close()
    return get_hospital_by_id(hospital_id)


def get_hospital_by_id(hospital_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM hospitals WHERE id = ?", (hospital_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
        
    cursor.execute("SELECT COUNT(*) as c FROM users WHERE hospital_id = ?", (hospital_id,))
    staff_count = cursor.fetchone()["c"]
    cursor.execute("SELECT COUNT(*) as c FROM patients WHERE hospital_id = ?", (hospital_id,))
    patient_count = cursor.fetchone()["c"]
    conn.close()
    
    data = dict(row)
    data["created_at"] = datetime.fromisoformat(data["created_at"])
    data["staff_count"] = staff_count
    data["patient_count"] = patient_count
    data["is_setup_completed"] = bool(data.get("is_setup_completed", 0))
    return data


def get_hospital_by_code(code: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM hospitals WHERE code = ?", (code.strip().upper(),))
    row = cursor.fetchone()
    conn.close()
    if row:
        data = dict(row)
        data["created_at"] = datetime.fromisoformat(data["created_at"])
        data["is_setup_completed"] = bool(data.get("is_setup_completed", 0))
        return data
    return None


def get_hospital_departments(hospital_id: str) -> List[str]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT department_name FROM hospital_departments WHERE hospital_id = ? ORDER BY department_name ASC", (hospital_id,))
    rows = cursor.fetchall()
    conn.close()
    return [r["department_name"] for r in rows]


def add_hospital_department(hospital_id: str, department_name: str) -> str:
    name_clean = department_name.strip()
    if not name_clean:
        raise ValueError("Department name cannot be empty.")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    dept_id = f"DEP-{uuid.uuid4().hex[:8].upper()}"
    now_str = datetime.now(timezone.utc).isoformat()
    
    try:
        cursor.execute("""
        INSERT INTO hospital_departments (id, hospital_id, department_name, created_at)
        VALUES (?, ?, ?, ?)
        """, (dept_id, hospital_id, name_clean, now_str))
        conn.commit()
    except sqlite3.IntegrityError:
        pass  # already exists
    finally:
        conn.close()
    return name_clean


def mark_hospital_setup_completed(hospital_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE hospitals SET is_setup_completed = 1 WHERE id = ?", (hospital_id,))
    updated = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return updated


def update_hospital_settings(hospital_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    fields = []
    params = []
    for k, v in updates.items():
        if k in ("name", "hospital_type", "address", "city", "state", "country", "contact_email", "contact_phone") and v is not None:
            fields.append(f"{k} = ?")
            params.append(v)
            
    if not fields:
        conn.close()
        return get_hospital_by_id(hospital_id)
        
    params.append(hospital_id)
    query = f"UPDATE hospitals SET {', '.join(fields)} WHERE id = ?"
    cursor.execute(query, params)
    conn.commit()
    conn.close()
    return get_hospital_by_id(hospital_id)


# =====================================================================
# User & Staff Operations
# =====================================================================

def create_user(
    hospital_id: str,
    name: str,
    email: str,
    password_hash: str,
    role: str,
    department: Optional[str] = None,
    employee_id: Optional[str] = None
) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
    now_str = datetime.now(timezone.utc).isoformat()
    
    cursor.execute("""
    INSERT INTO users (
        id, hospital_id, name, email, password_hash, role,
        department, employee_id, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    """, (
        user_id, hospital_id, name.strip(), email.strip().lower(),
        password_hash, role, department, employee_id, now_str
    ))
    
    conn.commit()
    conn.close()
    return get_user_by_id(user_id)


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT u.*, h.name as hospital_name, h.code as hospital_code, h.is_setup_completed
    FROM users u
    JOIN hospitals h ON u.hospital_id = h.id
    WHERE u.id = ?
    """, (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        data = dict(row)
        data["created_at"] = datetime.fromisoformat(data["created_at"])
        data["is_setup_completed"] = bool(data.get("is_setup_completed", 0))
        return data
    return None


def get_user_by_hospital_and_email(hospital_id: str, email: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT u.*, h.name as hospital_name, h.code as hospital_code, h.is_setup_completed
    FROM users u
    JOIN hospitals h ON u.hospital_id = h.id
    WHERE u.hospital_id = ? AND LOWER(u.email) = LOWER(?)
    """, (hospital_id, email.strip()))
    row = cursor.fetchone()
    conn.close()
    if row:
        data = dict(row)
        data["created_at"] = datetime.fromisoformat(data["created_at"])
        data["is_setup_completed"] = bool(data.get("is_setup_completed", 0))
        return data
    return None


def get_hospital_staff(hospital_id: str) -> List[StaffMember]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, name, email, role, department, employee_id, is_active, created_at
    FROM users
    WHERE hospital_id = ?
    ORDER BY created_at DESC
    """, (hospital_id,))
    rows = cursor.fetchall()
    conn.close()
    
    staff = []
    for r in rows:
        staff.append(StaffMember(
            id=r["id"],
            name=r["name"],
            email=r["email"],
            role=RoleEnum(r["role"]),
            department=r["department"],
            employee_id=r["employee_id"],
            is_active=bool(r["is_active"]),
            created_at=datetime.fromisoformat(r["created_at"])
        ))
    return staff


def set_user_active_status(hospital_id: str, user_id: str, is_active: bool) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE users SET is_active = ? WHERE id = ? AND hospital_id = ?
    """, (1 if is_active else 0, user_id, hospital_id))
    updated = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return updated


# =====================================================================
# Staff Invitations
# =====================================================================

def create_staff_invitation(
    hospital_id: str,
    email: str,
    name: str,
    role: str,
    department: Optional[str],
    employee_id: Optional[str]
) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    inv_id = f"INV-{uuid.uuid4().hex[:8].upper()}"
    token = f"inv_{secrets.token_urlsafe(24)}"
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=7)
    
    cursor.execute("""
    INSERT INTO staff_invitations (
        id, hospital_id, email, name, role, department,
        employee_id, token, is_used, expires_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    """, (
        inv_id, hospital_id, email.strip().lower(), name.strip(), role,
        department, employee_id, token, expires_at.isoformat(), now.isoformat()
    ))
    conn.commit()
    conn.close()
    
    return {
        "id": inv_id,
        "token": token,
        "name": name,
        "email": email,
        "role": role,
        "department": department,
        "employee_id": employee_id,
        "expires_at": expires_at,
        "invitation_url": f"/register-staff?token={token}"
    }


def get_invitation_by_token(token: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT i.*, h.name as hospital_name, h.code as hospital_code
    FROM staff_invitations i
    JOIN hospitals h ON i.hospital_id = h.id
    WHERE i.token = ? AND i.is_used = 0
    """, (token.strip(),))
    row = cursor.fetchone()
    conn.close()
    if row:
        data = dict(row)
        data["expires_at"] = datetime.fromisoformat(data["expires_at"])
        data["created_at"] = datetime.fromisoformat(data["created_at"])
        return data
    return None


def mark_invitation_used(token: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE staff_invitations SET is_used = 1 WHERE token = ?", (token.strip(),))
    conn.commit()
    conn.close()


# =====================================================================
# Server-Side Patient ID Sequencing (Atomic & Hospital Scoped)
# =====================================================================

def generate_next_patient_id(hospital_id: str) -> str:
    """
    Generate next sequence patient ID server-side: {HOSPITAL_CODE}-{YEAR}-{SEQUENCE:06d}.
    Thread-safe / transaction-safe execution in SQLite.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT code FROM hospitals WHERE id = ?", (hospital_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise ValueError(f"Invalid hospital ID '{hospital_id}'")
    hospital_code = row["code"]
    
    year = datetime.now(timezone.utc).year
    
    cursor.execute("""
    INSERT INTO patient_sequences (hospital_code, year, last_sequence)
    VALUES (?, ?, 1)
    ON CONFLICT(hospital_code, year) DO UPDATE SET last_sequence = patient_sequences.last_sequence + 1
    """, (hospital_code, year))
    
    cursor.execute("""
    SELECT last_sequence FROM patient_sequences WHERE hospital_code = ? AND year = ?
    """, (hospital_code, year))
    seq = cursor.fetchone()["last_sequence"]
    
    conn.commit()
    conn.close()
    
    return f"{hospital_code}-{year}-{seq:06d}"


# =====================================================================
# Patient Registration & Longitudinal Records
# =====================================================================

def register_patient(hospital_id: str, patient_data: Dict[str, Any]) -> str:
    """Register a new patient and generate atomic ID."""
    patient_id = generate_next_patient_id(hospital_id)
    raw_id = f"PAT-{uuid.uuid4().hex[:8].upper()}"
    now_str = datetime.now(timezone.utc).isoformat()
    reg_date_str = patient_data.get("registration_date") or now_str
    if isinstance(reg_date_str, datetime):
        reg_date_str = reg_date_str.isoformat()
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    INSERT INTO patients (
        id, hospital_id, patient_id, name, dob, age, sex, phone, email,
        address, emergency_contact, blood_group, primary_doctor_id,
        primary_doctor_name, doctor_assigned_at, department, status,
        registration_date, created_at, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?)
    """, (
        raw_id,
        hospital_id,
        patient_id,
        patient_data["name"].strip(),
        patient_data["dob"],
        patient_data["age"],
        patient_data["sex"],
        patient_data.get("phone"),
        patient_data.get("email"),
        patient_data.get("address"),
        patient_data.get("emergency_contact"),
        patient_data.get("blood_group", "Unknown"),
        patient_data.get("primary_doctor_id"),
        patient_data.get("primary_doctor_name"),
        now_str if patient_data.get("primary_doctor_name") else None,
        patient_data.get("department", "Emergency Medicine"),
        reg_date_str,
        now_str,
        json.dumps(patient_data)
    ))
    
    for cond in patient_data.get("existing_conditions", []):
        if cond.strip():
            cursor.execute("""
            INSERT INTO medical_histories (
                id, hospital_id, patient_id, condition, condition_type,
                date_or_year, status, notes, recorded_by_user_id,
                recorded_by_name, recorded_by_role, created_at
            ) VALUES (?, ?, ?, ?, 'Chronic Condition', 'Pre-existing', 'Active', 'Recorded at intake', NULL, 'Intake Registration', 'System', ?)
            """, (f"MED-{uuid.uuid4().hex[:8].upper()}", hospital_id, patient_id, cond.strip(), now_str))
            
    for allg in patient_data.get("allergies", []):
        if allg.strip():
            cursor.execute("""
            INSERT INTO medical_histories (
                id, hospital_id, patient_id, condition, condition_type,
                date_or_year, status, notes, recorded_by_user_id,
                recorded_by_name, recorded_by_role, created_at
            ) VALUES (?, ?, ?, ?, 'Allergy', 'Documented', 'Active', 'Documented at registration', NULL, 'Intake Registration', 'System', ?)
            """, (f"MED-{uuid.uuid4().hex[:8].upper()}", hospital_id, patient_id, allg.strip(), now_str))

    conn.commit()
    conn.close()
    return patient_id


def get_hospital_patients(
    hospital_id: str,
    search: Optional[str] = None,
    status: Optional[str] = None,
    department: Optional[str] = None
) -> List[PatientSummary]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT p.*,
        (SELECT visit_date FROM patient_visits WHERE patient_id = p.patient_id AND hospital_id = p.hospital_id ORDER BY visit_date DESC LIMIT 1) as last_visit,
        (SELECT appointment_date FROM appointments WHERE patient_id = p.patient_id AND hospital_id = p.hospital_id AND status = 'Scheduled' ORDER BY appointment_date ASC LIMIT 1) as next_appt,
        (SELECT priority FROM triage_records WHERE patient_id = p.patient_id AND hospital_id = p.hospital_id ORDER BY triage_date DESC LIMIT 1) as latest_triage
    FROM patients p
    WHERE p.hospital_id = ?
    """
    params = [hospital_id]
    
    if search and search.strip():
        term = f"%{search.strip()}%"
        query += " AND (p.patient_id LIKE ? OR p.name LIKE ? OR p.phone LIKE ? OR p.dob LIKE ?)"
        params.extend([term, term, term, term])
        
    if status and status != "ALL":
        query += " AND p.status = ?"
        params.append(status)
        
    if department and department != "ALL":
        query += " AND p.department = ?"
        params.append(department)
        
    query += " ORDER BY p.created_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        results.append(PatientSummary(
            id=r["id"],
            patient_id=r["patient_id"],
            hospital_id=r["hospital_id"],
            name=r["name"],
            dob=r["dob"],
            age=r["age"],
            sex=r["sex"],
            phone=r["phone"],
            email=r["email"],
            address=r["address"],
            emergency_contact=r["emergency_contact"],
            blood_group=r["blood_group"],
            status=r["status"],
            primary_doctor_id=r["primary_doctor_id"],
            primary_doctor_name=r["primary_doctor_name"],
            department=r["department"],
            registration_date=datetime.fromisoformat(r["registration_date"]),
            created_at=datetime.fromisoformat(r["created_at"]),
            last_visit_date=datetime.fromisoformat(r["last_visit"]) if r["last_visit"] else None,
            next_appointment_date=r["next_appt"],
            latest_triage_priority=r["latest_triage"]
        ))
    return results


def get_patient_profile(hospital_id: str, patient_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve full longitudinal patient profile with real timeline compilation and hospital isolation check."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    SELECT p.*,
        (SELECT visit_date FROM patient_visits WHERE patient_id = p.patient_id AND hospital_id = p.hospital_id ORDER BY visit_date DESC LIMIT 1) as last_visit,
        (SELECT appointment_date FROM appointments WHERE patient_id = p.patient_id AND hospital_id = p.hospital_id AND status = 'Scheduled' ORDER BY appointment_date ASC LIMIT 1) as next_appt,
        (SELECT priority FROM triage_records WHERE patient_id = p.patient_id AND hospital_id = p.hospital_id ORDER BY triage_date DESC LIMIT 1) as latest_triage
    FROM patients p
    WHERE p.hospital_id = ? AND (p.patient_id = ? OR p.id = ?)
    """, (hospital_id, patient_id, patient_id))
    p_row = cursor.fetchone()
    if not p_row:
        conn.close()
        return None
        
    actual_pid = p_row["patient_id"]
    
    cursor.execute("SELECT * FROM medical_histories WHERE hospital_id = ? AND patient_id = ? ORDER BY created_at DESC", (hospital_id, actual_pid))
    med_rows = cursor.fetchall()
    
    cursor.execute("SELECT * FROM patient_visits WHERE hospital_id = ? AND patient_id = ? ORDER BY visit_date DESC", (hospital_id, actual_pid))
    visit_rows = cursor.fetchall()
    
    cursor.execute("SELECT * FROM appointments WHERE hospital_id = ? AND patient_id = ? ORDER BY appointment_date DESC, appointment_time DESC", (hospital_id, actual_pid))
    appt_rows = cursor.fetchall()
    
    cursor.execute("SELECT * FROM triage_records WHERE hospital_id = ? AND patient_id = ? ORDER BY triage_date DESC", (hospital_id, actual_pid))
    triage_rows = cursor.fetchall()
    
    cursor.execute("SELECT * FROM clinical_notes WHERE hospital_id = ? AND patient_id = ? ORDER BY created_at DESC", (hospital_id, actual_pid))
    note_rows = cursor.fetchall()
    
    conn.close()
    
    timeline: List[TimelineEvent] = []
    
    # 1. Registration Event
    timeline.append(TimelineEvent(
        id=f"TL-REG-{actual_pid}",
        event_type="PATIENT_REGISTERED",
        title="Patient Registered",
        description=f"Patient {p_row['name']} registered with ID {actual_pid} ({p_row['department'] or 'General'}).",
        timestamp=datetime.fromisoformat(p_row["registration_date"]),
        actor="Registration Staff",
        metadata={"patient_id": actual_pid}
    ))
    
    # 2. Doctor Assignment Event (if recorded)
    if p_row["primary_doctor_name"] and p_row["doctor_assigned_at"]:
        timeline.append(TimelineEvent(
            id=f"TL-DOC-{actual_pid}",
            event_type="DOCTOR_ASSIGNED",
            title=f"{p_row['primary_doctor_name']} Assigned",
            description=f"Assigned as primary attending physician in {p_row['department'] or 'General Medicine'}.",
            timestamp=datetime.fromisoformat(p_row["doctor_assigned_at"]),
            actor="Hospital Triage & Coordination",
            metadata={"doctor_name": p_row["primary_doctor_name"]}
        ))

    # 3. Visits
    visits = []
    for v in visit_rows:
        syms = json.loads(v["symptoms_json"]) if v["symptoms_json"] else []
        vitals = json.loads(v["vitals_json"]) if v["vitals_json"] else None
        v_obj = PatientVisit(
            id=v["id"],
            hospital_id=v["hospital_id"],
            patient_id=v["patient_id"],
            visit_number=v["visit_number"],
            visit_date=datetime.fromisoformat(v["visit_date"]),
            department=v["department"],
            doctor_id=v["doctor_id"],
            doctor_name=v["doctor_name"],
            reason_for_visit=v["reason_for_visit"],
            symptoms=syms,
            vitals=vitals,
            triage_priority=v["triage_priority"],
            assessment=v["assessment"],
            clinical_notes=v["clinical_notes"],
            outcome=v["outcome"],
            follow_up=v["follow_up"],
            created_at=datetime.fromisoformat(v["created_at"])
        )
        visits.append(v_obj)
        timeline.append(TimelineEvent(
            id=f"TL-VIS-{v['id']}",
            event_type="VISIT_COMPLETED",
            title=f"Clinical Consultation Completed ({v['department']})",
            description=f"Consultation with {v['doctor_name']}: {v['reason_for_visit']} • Assessment: {v['assessment']}",
            timestamp=v_obj.visit_date,
            actor=v["doctor_name"],
            metadata={"visit_number": v["visit_number"], "outcome": v["outcome"]}
        ))
        
    # 4. Appointments
    appointments = []
    next_appt_obj = None
    for a in appt_rows:
        a_obj = Appointment(
            id=a["id"],
            hospital_id=a["hospital_id"],
            patient_id=a["patient_id"],
            patient_name=a["patient_name"],
            appointment_number=a["appointment_number"],
            appointment_date=a["appointment_date"],
            appointment_time=a["appointment_time"],
            doctor_id=a["doctor_id"],
            doctor_name=a["doctor_name"],
            department=a["department"],
            appointment_type=a["appointment_type"],
            status=a["status"],
            notes=a["notes"],
            created_by=a["created_by"],
            created_at=datetime.fromisoformat(a["created_at"])
        )
        appointments.append(a_obj)
        if a_obj.status == "Scheduled" and next_appt_obj is None:
            next_appt_obj = a_obj
            
        timeline.append(TimelineEvent(
            id=f"TL-APT-{a['id']}",
            event_type="APPOINTMENT_SCHEDULED",
            title=f"Follow-up Scheduled ({a['appointment_type']})",
            description=f"Scheduled with {a['doctor_name']} on {a['appointment_date']} at {a['appointment_time']}",
            timestamp=a_obj.created_at,
            actor=a["created_by"] or "Staff",
            metadata={"appointment_number": a["appointment_number"], "status": a["status"]}
        ))

    # 5. Triage Records
    triage_history = []
    latest_triage_assessment = None
    for t in triage_rows:
        safety_eval = json.loads(t["safety_eval_json"])
        reasoning = json.loads(t["reasoning_json"])
        t_date = datetime.fromisoformat(t["triage_date"])
        
        t_summary = TriageRecordSummary(
            id=t["id"],
            hospital_id=t["hospital_id"],
            patient_id=t["patient_id"],
            triage_date=t_date,
            priority=PriorityLevel(t["priority"]),
            recommended_route=t["recommended_route"],
            confidence_score=t["confidence_score"],
            reasoning_bullets=reasoning,
            risk_flags=safety_eval.get("risk_flags", []),
            missing_information=safety_eval.get("missing_information", []),
            human_decision=t["human_decision"],
            override_reason=t["override_reason"],
            staff_name=t["staff_name"],
            staff_role=t["staff_role"]
        )
        triage_history.append(t_summary)
        
        if latest_triage_assessment is None:
            from app.models import TriageAssessment, SafetyEvaluation
            latest_triage_assessment = TriageAssessment(
                priority=PriorityLevel(t["priority"]),
                priority_label=t["priority"],
                recommended_route=t["recommended_route"],
                confidence_score=t["confidence_score"],
                safety_eval=SafetyEvaluation.model_validate(safety_eval),
                reasoning_bullets=reasoning,
                key_risk_factors=safety_eval.get("risk_flags", []),
                safety_caveat="Prototype decision support only.",
                generated_at=t_date
            )
            
        # Add Triage Recommendation Event
        timeline.append(TimelineEvent(
            id=f"TL-TRG-REC-{t['id']}",
            event_type="TRIAGE_RECOMMENDED",
            title=f"Triage Recommendation: {t['priority']}",
            description=f"Recommended Route: {t['recommended_route']} ({int(t['confidence_score']*100)}% confidence)",
            timestamp=t_date - timedelta(seconds=30),
            actor="Deterministic Rule-Engine + AI",
            metadata={"priority": t["priority"]}
        ))

        # Add Human Decision Event
        timeline.append(TimelineEvent(
            id=f"TL-TRG-DEC-{t['id']}",
            event_type="HUMAN_DECISION",
            title=f"Human Decision: {t['human_decision']}",
            description=f"Signed off by {t['staff_name']} ({t['staff_role']})" + (f" • Override: {t['override_reason']}" if t["override_reason"] else ""),
            timestamp=t_date,
            actor=f"{t['staff_name']} ({t['staff_role']})",
            metadata={"decision": t["human_decision"], "priority": t["priority"]}
        ))

    # 6. Medical History
    med_history = []
    allergies = []
    for m in med_rows:
        m_rec = MedicalHistoryRecord(
            id=m["id"],
            hospital_id=m["hospital_id"],
            patient_id=m["patient_id"],
            condition=m["condition"],
            condition_type=m["condition_type"],
            date_or_year=m["date_or_year"],
            status=m["status"],
            notes=m["notes"],
            recorded_by_name=m["recorded_by_name"],
            recorded_by_role=m["recorded_by_role"],
            created_at=datetime.fromisoformat(m["created_at"])
        )
        med_history.append(m_rec)
        if m["condition_type"] == "Allergy":
            allergies.append(m["condition"])

    # 7. Clinical Notes
    clinical_notes = []
    for n in note_rows:
        c_note = ClinicalNote(
            id=n["id"],
            hospital_id=n["hospital_id"],
            patient_id=n["patient_id"],
            author_id=n["author_id"],
            author_name=n["author_name"],
            author_role=n["author_role"],
            note_content=n["note_content"],
            created_at=datetime.fromisoformat(n["created_at"])
        )
        clinical_notes.append(c_note)
        timeline.append(TimelineEvent(
            id=f"TL-NOT-{n['id']}",
            event_type="CLINICAL_NOTE_ADDED",
            title=f"Clinical Note by {n['author_name']}",
            description=n["note_content"],
            timestamp=c_note.created_at,
            actor=f"{n['author_name']} ({n['author_role']})",
            metadata={"role": n["author_role"]}
        ))

    # Doctors list
    doctors = []
    if p_row["primary_doctor_name"]:
        doctors.append(DoctorAssignment(
            doctor_id=p_row["primary_doctor_id"] or "DOC-001",
            doctor_name=p_row["primary_doctor_name"],
            department=p_row["department"] or "General Medicine",
            is_primary=True,
            assigned_date=datetime.fromisoformat(p_row["doctor_assigned_at"] or p_row["registration_date"])
        ))
        
    for v in visits:
        if v.doctor_name and not any(d.doctor_name == v.doctor_name for d in doctors):
            doctors.append(DoctorAssignment(
                doctor_id=v.doctor_id or f"DOC-{uuid.uuid4().hex[:4]}",
                doctor_name=v.doctor_name,
                department=v.department,
                is_primary=False,
                assigned_date=v.visit_date
            ))

    # Sort timeline in chronological descending order (most recent first)
    timeline.sort(key=lambda e: e.timestamp, reverse=True)

    summary = PatientSummary(
        id=p_row["id"],
        patient_id=p_row["patient_id"],
        hospital_id=p_row["hospital_id"],
        name=p_row["name"],
        dob=p_row["dob"],
        age=p_row["age"],
        sex=p_row["sex"],
        phone=p_row["phone"],
        email=p_row["email"],
        address=p_row["address"],
        emergency_contact=p_row["emergency_contact"],
        blood_group=p_row["blood_group"],
        status=p_row["status"],
        primary_doctor_id=p_row["primary_doctor_id"],
        primary_doctor_name=p_row["primary_doctor_name"],
        department=p_row["department"],
        registration_date=datetime.fromisoformat(p_row["registration_date"]),
        created_at=datetime.fromisoformat(p_row["created_at"]),
        last_visit_date=datetime.fromisoformat(p_row["last_visit"]) if p_row["last_visit"] else None,
        next_appointment_date=p_row["next_appt"],
        latest_triage_priority=p_row["latest_triage"]
    )

    return {
        "patient": summary,
        "latest_triage": latest_triage_assessment,
        "next_appointment": next_appt_obj,
        "medical_history": med_history,
        "visits": visits,
        "appointments": appointments,
        "triage_history": triage_history,
        "doctors": doctors,
        "medications": [],
        "allergies": allergies,
        "clinical_notes": clinical_notes,
        "timeline": timeline
    }


# =====================================================================
# Sub-Resources: Medical History, Visits, Appointments, Notes
# =====================================================================

def add_medical_history(
    hospital_id: str,
    patient_id: str,
    condition: str,
    condition_type: str,
    date_or_year: str,
    status: str,
    notes: Optional[str],
    user: Dict[str, Any]
) -> MedicalHistoryRecord:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    med_id = f"MED-{uuid.uuid4().hex[:8].upper()}"
    now_str = datetime.now(timezone.utc).isoformat()
    
    cursor.execute("""
    INSERT INTO medical_histories (
        id, hospital_id, patient_id, condition, condition_type,
        date_or_year, status, notes, recorded_by_user_id,
        recorded_by_name, recorded_by_role, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        med_id, hospital_id, patient_id, condition.strip(), condition_type,
        date_or_year, status, notes, user["id"], user["name"], user["role"], now_str
    ))
    conn.commit()
    conn.close()
    
    return MedicalHistoryRecord(
        id=med_id,
        hospital_id=hospital_id,
        patient_id=patient_id,
        condition=condition.strip(),
        condition_type=condition_type,
        date_or_year=date_or_year,
        status=status,
        notes=notes,
        recorded_by_name=user["name"],
        recorded_by_role=user["role"],
        created_at=datetime.fromisoformat(now_str)
    )


def add_patient_visit(
    hospital_id: str,
    patient_id: str,
    visit_data: Dict[str, Any]
) -> PatientVisit:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    visit_id = f"VIS-{uuid.uuid4().hex[:8].upper()}"
    cursor.execute("SELECT COUNT(*) as c FROM patient_visits WHERE hospital_id = ?", (hospital_id,))
    v_seq = cursor.fetchone()["c"] + 1
    cursor.execute("SELECT code FROM hospitals WHERE id = ?", (hospital_id,))
    h_code = cursor.fetchone()["code"]
    year = datetime.now(timezone.utc).year
    visit_number = f"{h_code}-V-{year}-{v_seq:06d}"
    
    now_str = datetime.now(timezone.utc).isoformat()
    sym_json = json.dumps(visit_data.get("symptoms", []))
    vit_json = json.dumps(visit_data.get("vitals")) if visit_data.get("vitals") else None
    
    cursor.execute("""
    INSERT INTO patient_visits (
        id, hospital_id, patient_id, visit_number, visit_date, department,
        doctor_id, doctor_name, reason_for_visit, symptoms_json, vitals_json,
        triage_priority, assessment, clinical_notes, outcome, follow_up, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        visit_id, hospital_id, patient_id, visit_number, now_str,
        visit_data["department"], visit_data.get("doctor_id"),
        visit_data["doctor_name"], visit_data["reason_for_visit"],
        sym_json, vit_json, visit_data.get("triage_priority"),
        visit_data["assessment"], visit_data["clinical_notes"],
        visit_data["outcome"], visit_data.get("follow_up"), now_str
    ))
    
    # If clinical notes are provided during visit, also append into clinical_notes table
    if visit_data.get("clinical_notes"):
        note_id = f"NOT-{uuid.uuid4().hex[:8].upper()}"
        cursor.execute("""
        INSERT INTO clinical_notes (
            id, hospital_id, patient_id, author_id, author_name,
            author_role, note_content, created_at
        ) VALUES (?, ?, ?, ?, ?, 'DOCTOR', ?, ?)
        """, (
            note_id, hospital_id, patient_id,
            visit_data.get("doctor_id") or "DOC",
            visit_data["doctor_name"],
            f"Visit Note ({visit_data['reason_for_visit']}): {visit_data['clinical_notes']}",
            now_str
        ))

    conn.commit()
    conn.close()
    
    return PatientVisit(
        id=visit_id,
        hospital_id=hospital_id,
        patient_id=patient_id,
        visit_number=visit_number,
        visit_date=datetime.fromisoformat(now_str),
        department=visit_data["department"],
        doctor_id=visit_data.get("doctor_id"),
        doctor_name=visit_data["doctor_name"],
        reason_for_visit=visit_data["reason_for_visit"],
        symptoms=visit_data.get("symptoms", []),
        vitals=visit_data.get("vitals"),
        triage_priority=visit_data.get("triage_priority"),
        assessment=visit_data["assessment"],
        clinical_notes=visit_data["clinical_notes"],
        outcome=visit_data["outcome"],
        follow_up=visit_data.get("follow_up"),
        created_at=datetime.fromisoformat(now_str)
    )


def create_appointment(
    hospital_id: str,
    patient_id: str,
    appt_data: Dict[str, Any],
    user: Dict[str, Any]
) -> Appointment:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM patients WHERE hospital_id = ? AND patient_id = ?", (hospital_id, patient_id))
    p_row = cursor.fetchone()
    patient_name = p_row["name"] if p_row else "Patient"
    
    cursor.execute("SELECT COUNT(*) as c FROM appointments WHERE hospital_id = ?", (hospital_id,))
    a_seq = cursor.fetchone()["c"] + 1
    cursor.execute("SELECT code FROM hospitals WHERE id = ?", (hospital_id,))
    h_code = cursor.fetchone()["code"]
    year = datetime.now(timezone.utc).year
    appt_number = f"{h_code}-APT-{year}-{a_seq:06d}"
    
    appt_id = f"APT-{uuid.uuid4().hex[:8].upper()}"
    now_str = datetime.now(timezone.utc).isoformat()
    
    cursor.execute("""
    INSERT INTO appointments (
        id, hospital_id, patient_id, patient_name, appointment_number,
        appointment_date, appointment_time, doctor_id, doctor_name,
        department, appointment_type, status, notes, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled', ?, ?, ?)
    """, (
        appt_id, hospital_id, patient_id, patient_name, appt_number,
        appt_data["appointment_date"], appt_data["appointment_time"],
        appt_data.get("doctor_id"), appt_data["doctor_name"],
        appt_data["department"], appt_data["appointment_type"],
        appt_data.get("notes"), user["name"], now_str
    ))
    conn.commit()
    conn.close()
    
    return Appointment(
        id=appt_id,
        hospital_id=hospital_id,
        patient_id=patient_id,
        patient_name=patient_name,
        appointment_number=appt_number,
        appointment_date=appt_data["appointment_date"],
        appointment_time=appt_data["appointment_time"],
        doctor_id=appt_data.get("doctor_id"),
        doctor_name=appt_data["doctor_name"],
        department=appt_data["department"],
        appointment_type=appt_data["appointment_type"],
        status="Scheduled",
        notes=appt_data.get("notes"),
        created_by=user["name"],
        created_at=datetime.fromisoformat(now_str)
    )


def update_appointment_status(hospital_id: str, appt_id: str, updates: Dict[str, Any]) -> Optional[Appointment]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    fields = []
    params = []
    for k, v in updates.items():
        if k in ("status", "appointment_date", "appointment_time", "notes") and v is not None:
            fields.append(f"{k} = ?")
            params.append(v)
            
    if not fields:
        cursor.execute("SELECT * FROM appointments WHERE id = ? AND hospital_id = ?", (appt_id, hospital_id))
        row = cursor.fetchone()
        conn.close()
        return Appointment.model_validate(dict(row)) if row else None
        
    params.extend([appt_id, hospital_id])
    cursor.execute(f"UPDATE appointments SET {', '.join(fields)} WHERE id = ? AND hospital_id = ?", params)
    conn.commit()
    
    cursor.execute("SELECT * FROM appointments WHERE id = ? AND hospital_id = ?", (appt_id, hospital_id))
    row = cursor.fetchone()
    conn.close()
    if row:
        data = dict(row)
        data["created_at"] = datetime.fromisoformat(data["created_at"])
        return Appointment.model_validate(data)
    return None


def add_clinical_note(
    hospital_id: str,
    patient_id: str,
    content: str,
    user: Dict[str, Any]
) -> ClinicalNote:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    note_id = f"NOT-{uuid.uuid4().hex[:8].upper()}"
    now_str = datetime.now(timezone.utc).isoformat()
    
    cursor.execute("""
    INSERT INTO clinical_notes (
        id, hospital_id, patient_id, author_id, author_name,
        author_role, note_content, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        note_id, hospital_id, patient_id, user["id"], user["name"],
        user["role"], content.strip(), now_str
    ))
    conn.commit()
    conn.close()
    
    return ClinicalNote(
        id=note_id,
        hospital_id=hospital_id,
        patient_id=patient_id,
        author_id=user["id"],
        author_name=user["name"],
        author_role=user["role"],
        note_content=content.strip(),
        created_at=datetime.fromisoformat(now_str)
    )


def save_triage_record(
    hospital_id: str,
    patient_id: str,
    intake_data: Dict[str, Any],
    assessment: Any,
    human_decision: str,
    override_reason: Optional[str],
    user: Dict[str, Any]
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    triage_id = f"TRG-{uuid.uuid4().hex[:8].upper()}"
    now_str = datetime.now(timezone.utc).isoformat()
    
    cursor.execute("""
    INSERT INTO triage_records (
        id, hospital_id, patient_id, triage_date, intake_json,
        priority, recommended_route, confidence_score, safety_eval_json,
        reasoning_json, human_decision, override_reason, staff_id,
        staff_name, staff_role, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        triage_id, hospital_id, patient_id, now_str,
        json.dumps(intake_data), assessment.priority.value,
        assessment.recommended_route, assessment.confidence_score,
        assessment.safety_eval.model_dump_json(),
        json.dumps(assessment.reasoning_bullets),
        human_decision, override_reason, user.get("id", "SYS"),
        user.get("name", "Triage Staff"), user.get("role", "TRIAGE_NURSE"),
        now_str
    ))
    
    # Update patient status
    patient_status = "WAITING" if human_decision == "ACCEPTED" else ("OVERRIDDEN" if human_decision == "OVERRIDDEN" else human_decision)
    cursor.execute("""
    UPDATE patients SET status = ?, department = 'Emergency Medicine' WHERE hospital_id = ? AND patient_id = ?
    """, (patient_status, hospital_id, patient_id))
    
    conn.commit()
    conn.close()


def assign_patient_doctor(hospital_id: str, patient_id: str, doctor_id: str, doctor_name: str, department: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now(timezone.utc).isoformat()
    
    cursor.execute("""
    UPDATE patients
    SET primary_doctor_id = ?, primary_doctor_name = ?, department = ?, doctor_assigned_at = ?
    WHERE hospital_id = ? AND patient_id = ?
    """, (doctor_id, doctor_name, department, now_str, hospital_id, patient_id))
    
    conn.commit()
    conn.close()


# =====================================================================
# Audit Log & Analytics (Hospital Scoped)
# =====================================================================

def log_audit_event(
    hospital_id: str,
    user_id: Optional[str],
    user_name: Optional[str],
    user_role: Optional[str],
    action: str,
    resource_type: str,
    resource_id: Optional[str],
    details: Dict[str, Any]
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    log_id = f"AUD-{uuid.uuid4().hex[:8].upper()}"
    now_str = datetime.now(timezone.utc).isoformat()
    
    cursor.execute("""
    INSERT INTO audit_logs (
        id, hospital_id, user_id, user_name, user_role,
        action, resource_type, resource_id, details_json, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        log_id, hospital_id, user_id, user_name, user_role,
        action, resource_type, resource_id, json.dumps(details), now_str
    ))
    conn.commit()
    conn.close()


def get_hospital_audit_logs(hospital_id: str, limit: int = 100) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM audit_logs WHERE hospital_id = ? ORDER BY timestamp DESC LIMIT ?
    """, (hospital_id, limit))
    rows = cursor.fetchall()
    conn.close()
    
    logs = []
    for r in rows:
        item = dict(r)
        item["timestamp"] = datetime.fromisoformat(item["timestamp"])
        item["details"] = json.loads(item["details_json"])
        logs.append(item)
    return logs
