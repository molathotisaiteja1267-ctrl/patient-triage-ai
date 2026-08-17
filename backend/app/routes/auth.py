"""
Authentication & Multi-Hospital Registration Routes for PatientTriage.ai.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from app.models import (
    HospitalRegisterRequest,
    LoginRequest,
    TokenResponse,
    UserSummary,
    HospitalSummary,
    StaffInviteRequest,
    StaffInviteResponse,
    StaffRegisterRequest,
    RoleEnum
)
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user_payload,
    require_roles
)
from app.database import (
    create_hospital,
    get_hospital_by_id,
    get_hospital_by_code,
    create_user,
    get_user_by_id,
    get_user_by_hospital_and_email,
    create_staff_invitation,
    get_invitation_by_token,
    mark_invitation_used,
    log_audit_event
)

router = APIRouter(prefix="/auth", tags=["Authentication & Hospital Registration"])


@router.post("/register-hospital", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_hospital(payload: HospitalRegisterRequest):
    """
    Register a new hospital organization and provision the Hospital Admin account.
    Enforces unique hospital code (2-4 uppercase characters).
    """
    if payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match."
        )

    code_clean = payload.hospital_code.strip().upper()
    if len(code_clean) < 2 or len(code_clean) > 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hospital code must be 2 to 4 uppercase letters (e.g. AP, KI, EM)."
        )

    try:
        hospital = create_hospital(
            name=payload.hospital_name,
            code=code_clean,
            hospital_type=payload.hospital_type.value,
            address=payload.hospital_address,
            city=payload.city,
            state=payload.state,
            country=payload.country,
            contact_email=payload.contact_email,
            contact_phone=payload.contact_phone
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(ve)
        )

    # Provision Hospital Admin
    password_hash = hash_password(payload.password)
    user = create_user(
        hospital_id=hospital["id"],
        name=payload.admin_name,
        email=payload.admin_email,
        password_hash=password_hash,
        role=RoleEnum.HOSPITAL_ADMIN.value,
        department="Hospital Administration",
        employee_id="ADM-001"
    )

    # Log audit event
    log_audit_event(
        hospital_id=hospital["id"],
        user_id=user["id"],
        user_name=user["name"],
        user_role=user["role"],
        action="HOSPITAL_REGISTERED",
        resource_type="Hospital",
        resource_id=hospital["id"],
        details={"code": hospital["code"], "name": hospital["name"]}
    )

    # Generate JWT Token
    token_payload = {
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "name": user["name"],
        "hospital_id": hospital["id"],
        "hospital_code": hospital["code"],
        "hospital_name": hospital["name"]
    }
    access_token = create_access_token(token_payload)

    user_summary = UserSummary(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=RoleEnum(user["role"]),
        department=user["department"],
        employee_id=user["employee_id"],
        hospital_id=hospital["id"],
        hospital_code=hospital["code"],
        hospital_name=hospital["name"]
    )
    hospital_summary = HospitalSummary(
        id=hospital["id"],
        name=hospital["name"],
        code=hospital["code"],
        hospital_type=hospital["hospital_type"],
        city=hospital["city"],
        state=hospital["state"]
    )

    return TokenResponse(
        access_token=access_token,
        token_type="Bearer",
        user=user_summary,
        hospital=hospital_summary
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    """
    Authenticate staff into their registered hospital organization.
    Role is strictly determined server-side from stored credentials.
    """
    hospital_code = payload.hospital_code.strip().upper()
    hospital = get_hospital_by_code(hospital_code)
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid hospital code '{hospital_code}'. Please check and retry."
        )

    user = get_user_by_hospital_and_email(hospital["id"], payload.email)
    if not user:
        # Audit failed login
        log_audit_event(
            hospital_id=hospital["id"],
            user_id=None,
            user_name=None,
            user_role=None,
            action="LOGIN_FAILED",
            resource_type="User",
            resource_id=None,
            details={"email": payload.email, "reason": "User not found in hospital"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact your Hospital Administrator."
        )

    if not verify_password(payload.password, user["password_hash"]):
        log_audit_event(
            hospital_id=hospital["id"],
            user_id=user["id"],
            user_name=user["name"],
            user_role=user["role"],
            action="LOGIN_FAILED",
            resource_type="User",
            resource_id=user["id"],
            details={"email": payload.email, "reason": "Incorrect password"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Log successful login
    log_audit_event(
        hospital_id=hospital["id"],
        user_id=user["id"],
        user_name=user["name"],
        user_role=user["role"],
        action="LOGIN_SUCCESS",
        resource_type="User",
        resource_id=user["id"],
        details={"role": user["role"]}
    )

    token_payload = {
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "name": user["name"],
        "hospital_id": hospital["id"],
        "hospital_code": hospital["code"],
        "hospital_name": hospital["name"]
    }
    access_token = create_access_token(token_payload)

    user_summary = UserSummary(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=RoleEnum(user["role"]),
        department=user["department"],
        employee_id=user["employee_id"],
        hospital_id=hospital["id"],
        hospital_code=hospital["code"],
        hospital_name=hospital["name"]
    )
    hospital_summary = HospitalSummary(
        id=hospital["id"],
        name=hospital["name"],
        code=hospital["code"],
        hospital_type=hospital["hospital_type"],
        city=hospital["city"],
        state=hospital["state"]
    )

    return TokenResponse(
        access_token=access_token,
        token_type="Bearer",
        user=user_summary,
        hospital=hospital_summary
    )


@router.get("/me", response_model=TokenResponse)
def get_current_user_profile(user_payload: dict = Depends(get_current_user_payload)):
    """Retrieve authenticated user identity and hospital scope."""
    user = get_user_by_id(user_payload["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
    hospital = get_hospital_by_id(user["hospital_id"])
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found.")

    user_summary = UserSummary(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=RoleEnum(user["role"]),
        department=user["department"],
        employee_id=user["employee_id"],
        hospital_id=hospital["id"],
        hospital_code=hospital["code"],
        hospital_name=hospital["name"]
    )
    hospital_summary = HospitalSummary(
        id=hospital["id"],
        name=hospital["name"],
        code=hospital["code"],
        hospital_type=hospital["hospital_type"],
        city=hospital["city"],
        state=hospital["state"]
    )
    
    # Re-issue active token
    access_token = create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "name": user["name"],
        "hospital_id": hospital["id"],
        "hospital_code": hospital["code"],
        "hospital_name": hospital["name"]
    })

    return TokenResponse(
        access_token=access_token,
        token_type="Bearer",
        user=user_summary,
        hospital=hospital_summary
    )


@router.post("/invite-staff", response_model=StaffInviteResponse)
def invite_staff(
    payload: StaffInviteRequest,
    current_user: dict = Depends(require_roles("HOSPITAL_ADMIN"))
):
    """Hospital Admin invites new doctors, nurses, triage nurses, or receptionists."""
    hospital_id = current_user["hospital_id"]
    
    # Check if email is already registered in this hospital
    existing = get_user_by_hospital_and_email(hospital_id, payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Staff member with email '{payload.email}' already exists in this hospital."
        )

    invitation = create_staff_invitation(
        hospital_id=hospital_id,
        email=payload.email,
        name=payload.name,
        role=payload.role.value,
        department=payload.department,
        employee_id=payload.employee_id
    )

    log_audit_event(
        hospital_id=hospital_id,
        user_id=current_user["sub"],
        user_name=current_user["name"],
        user_role=current_user["role"],
        action="STAFF_INVITED",
        resource_type="StaffInvitation",
        resource_id=invitation["id"],
        details={"name": payload.name, "email": payload.email, "role": payload.role.value}
    )

    return StaffInviteResponse(
        id=invitation["id"],
        token=invitation["token"],
        name=invitation["name"],
        email=invitation["email"],
        role=RoleEnum(invitation["role"]),
        department=invitation["department"],
        employee_id=invitation["employee_id"],
        expires_at=invitation["expires_at"],
        invitation_url=invitation["invitation_url"]
    )


@router.get("/invitation/{token}")
def get_invitation_details(token: str):
    """Retrieve invitation metadata for invited staff signup."""
    inv = get_invitation_by_token(token)
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired staff invitation token."
        )
    return {
        "name": inv["name"],
        "email": inv["email"],
        "role": inv["role"],
        "department": inv["department"],
        "hospital_name": inv["hospital_name"],
        "hospital_code": inv["hospital_code"]
    }


@router.post("/register-staff", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_staff_via_invitation(payload: StaffRegisterRequest):
    """Complete staff onboarding using validated invitation token."""
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
        
    inv = get_invitation_by_token(payload.token)
    if not inv:
        raise HTTPException(status_code=404, detail="Invalid or expired invitation token.")

    hospital_id = inv["hospital_id"]
    password_hash = hash_password(payload.password)
    
    user = create_user(
        hospital_id=hospital_id,
        name=payload.name,
        email=payload.email,
        password_hash=password_hash,
        role=inv["role"],
        department=inv["department"],
        employee_id=inv["employee_id"]
    )
    
    mark_invitation_used(payload.token)
    
    log_audit_event(
        hospital_id=hospital_id,
        user_id=user["id"],
        user_name=user["name"],
        user_role=user["role"],
        action="STAFF_REGISTERED",
        resource_type="User",
        resource_id=user["id"],
        details={"role": user["role"], "department": user["department"]}
    )

    token_payload = {
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "name": user["name"],
        "hospital_id": hospital_id,
        "hospital_code": inv["hospital_code"],
        "hospital_name": inv["hospital_name"]
    }
    access_token = create_access_token(token_payload)

    user_summary = UserSummary(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=RoleEnum(user["role"]),
        department=user["department"],
        employee_id=user["employee_id"],
        hospital_id=hospital_id,
        hospital_code=inv["hospital_code"],
        hospital_name=inv["hospital_name"]
    )
    hospital_summary = HospitalSummary(
        id=hospital_id,
        name=inv["hospital_name"],
        code=inv["hospital_code"],
        hospital_type="Hospital",
        city="",
        state=""
    )

    return TokenResponse(
        access_token=access_token,
        token_type="Bearer",
        user=user_summary,
        hospital=hospital_summary
    )
