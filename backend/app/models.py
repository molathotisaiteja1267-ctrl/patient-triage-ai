from datetime import datetime, date, timezone
from enum import Enum
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, EmailStr, field_validator


# =====================================================================
# Role & Hospital Enumerations
# =====================================================================

class RoleEnum(str, Enum):
    PLATFORM_ADMIN = "PLATFORM_ADMIN"
    HOSPITAL_ADMIN = "HOSPITAL_ADMIN"
    DOCTOR = "DOCTOR"
    TRIAGE_NURSE = "TRIAGE_NURSE"
    NURSE = "NURSE"
    RECEPTIONIST = "RECEPTIONIST"
    STAFF = "STAFF"


class HospitalType(str, Enum):
    HOSPITAL = "Hospital"
    CLINIC = "Clinic"
    MEDICAL_CENTER = "Medical Center"
    EMERGENCY_CARE = "Emergency Care Center"
    NURSING_HOME = "Nursing Home"
    OTHER = "Other Healthcare Facility"


class PriorityLevel(str, Enum):
    RED = "RED"          # Immediate - Life threatening
    ORANGE = "ORANGE"    # Very Urgent - Potentially serious, rapid assessment
    YELLOW = "YELLOW"    # Urgent - Timely assessment needed
    GREEN = "GREEN"      # Less Urgent - Stable presentation
    BLUE = "BLUE"        # Non-Emergency - Alternative pathway


class ArrivalMethod(str, Enum):
    WALK_IN = "Walk-in"
    AMBULANCE = "Ambulance"
    POLICE_EMERGENCY = "Police / Emergency Services"
    TRANSFER = "Transfer from another facility"
    OTHER = "Other"


class ConsciousnessLevel(str, Enum):
    ALERT = "Alert"
    RESPONDS_TO_VOICE = "Responds to Voice"
    RESPONDS_TO_PAIN = "Responds to Pain"
    UNRESPONSIVE = "Unresponsive"


class SpeechAbility(str, Enum):
    NORMAL = "Normal sentences"
    SHORT_PHRASES = "Short phrases only"
    SINGLE_WORDS = "Single words only"
    UNABLE = "Unable to speak"


class MobilityStatus(str, Enum):
    INDEPENDENT = "Independent"
    WITH_ASSISTANCE = "With assistance"
    UNABLE_STRETCHER = "Unable / Stretcher / Wheelchair"


class SymptomProgression(str, Enum):
    IMPROVING = "Improving"
    STABLE = "Stable"
    WORSENING = "Worsening"
    UNKNOWN = "Unknown"


class FunctionalStatus(str, Enum):
    NORMAL = "Normal"
    REDUCED = "Reduced"
    SEVERELY_IMPAIRED = "Severely impaired"
    UNKNOWN = "Unknown"


class RedFlagChoice(str, Enum):
    YES = "Yes"
    NO = "No"
    UNKNOWN = "Unknown"


class PregnancyStatus(str, Enum):
    PREGNANT = "Pregnant"
    POSSIBLY_PREGNANT = "Possibly pregnant"
    NOT_PREGNANT = "Not pregnant"
    UNKNOWN = "Unknown"
    NOT_APPLICABLE = "Not applicable"


class PatientStatus(str, Enum):
    WAITING = "WAITING"
    UNDER_ASSESSMENT = "UNDER_ASSESSMENT"
    ACCEPTED = "ACCEPTED"
    OVERRIDDEN = "OVERRIDDEN"
    REASSESSMENT_REQUESTED = "REASSESSMENT_REQUESTED"
    IN_TREATMENT = "IN_TREATMENT"
    DISCHARGED = "DISCHARGED"


class UncertaintyLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AppointmentStatus(str, Enum):
    SCHEDULED = "Scheduled"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
    RESCHEDULED = "Rescheduled"
    NO_SHOW = "No-show"


class AppointmentType(str, Enum):
    CONSULTATION = "Consultation"
    FOLLOW_UP = "Follow-up"
    EMERGENCY_FOLLOW_UP = "Emergency Follow-up"
    DIAGNOSTIC = "Diagnostic"
    PROCEDURE = "Procedure"
    OTHER = "Other"


# =====================================================================
# Auth & Hospital Registration Models
# =====================================================================

class HospitalRegisterRequest(BaseModel):
    hospital_name: str = Field(..., min_length=2, description="Full hospital name")
    hospital_type: HospitalType = HospitalType.HOSPITAL
    hospital_address: str = Field(..., min_length=3)
    city: str = Field(..., min_length=2)
    state: str = Field(..., min_length=2)
    country: str = Field("United States", min_length=2)
    contact_email: str = Field(..., min_length=5)
    contact_phone: str = Field(..., min_length=5)
    hospital_code: str = Field(..., min_length=2, max_length=4, description="Unique uppercase code (e.g. AP, KI, EM)")
    admin_name: str = Field(..., min_length=2)
    admin_email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)


class HospitalResponse(BaseModel):
    id: str
    name: str
    code: str
    hospital_type: str
    address: str
    city: str
    state: str
    country: str
    contact_email: str
    contact_phone: str
    created_at: datetime
    staff_count: int = 0
    patient_count: int = 0


class HospitalUpdateRequest(BaseModel):
    name: Optional[str] = None
    hospital_type: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None


class LoginRequest(BaseModel):
    hospital_code: str = Field(..., min_length=2, max_length=10)
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)


class UserSummary(BaseModel):
    id: str
    name: str
    email: str
    role: RoleEnum
    department: Optional[str] = None
    employee_id: Optional[str] = None
    hospital_id: str
    hospital_code: str
    hospital_name: str


class HospitalSummary(BaseModel):
    id: str
    name: str
    code: str
    hospital_type: str
    city: str
    state: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    user: UserSummary
    hospital: HospitalSummary


class StaffInviteRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: str = Field(..., min_length=5)
    role: RoleEnum
    department: Optional[str] = "Emergency Medicine"
    employee_id: Optional[str] = None


class StaffInviteResponse(BaseModel):
    id: str
    token: str
    name: str
    email: str
    role: RoleEnum
    department: Optional[str] = None
    employee_id: Optional[str] = None
    expires_at: datetime
    invitation_url: str


class StaffRegisterRequest(BaseModel):
    token: str
    name: str = Field(..., min_length=2)
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)


class StaffMember(BaseModel):
    id: str
    name: str
    email: str
    role: RoleEnum
    department: Optional[str] = None
    employee_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime


# =====================================================================
# Clinical & Triage Models
# =====================================================================

class RedFlagsAssessment(BaseModel):
    # Core 12 Safety Screening Items
    airway_obstruction: RedFlagChoice = Field(RedFlagChoice.UNKNOWN)
    severe_dyspnea: RedFlagChoice = Field(RedFlagChoice.UNKNOWN)
    shock_poor_perfusion: RedFlagChoice = Field(RedFlagChoice.UNKNOWN)
    severe_chest_pain: RedFlagChoice = Field(RedFlagChoice.UNKNOWN)
    loss_of_consciousness: RedFlagChoice = Field(RedFlagChoice.UNKNOWN)
    altered_mental_status: RedFlagChoice = Field(RedFlagChoice.UNKNOWN)
    seizure: RedFlagChoice = Field(RedFlagChoice.UNKNOWN)
    sudden_neurological_deficit: RedFlagChoice = Field(RedFlagChoice.UNKNOWN)
    uncontrolled_bleeding: RedFlagChoice = Field(RedFlagChoice.UNKNOWN)
    severe_allergic_reaction: RedFlagChoice = Field(RedFlagChoice.UNKNOWN)
    major_trauma: RedFlagChoice = Field(RedFlagChoice.UNKNOWN)
    severe_uncontrolled_pain: RedFlagChoice = Field(RedFlagChoice.UNKNOWN)

    # Conditional Context-Specific Screening
    pregnancy_warning_signs: Optional[RedFlagChoice] = None
    pediatric_warning_signs: Optional[RedFlagChoice] = None
    trauma_warning_details: Optional[RedFlagChoice] = None
    stroke_warning_details: Optional[RedFlagChoice] = None

    # Legacy Backward Compatibility Fields
    acute_weakness_facial_droop: Optional[RedFlagChoice] = None
    acute_speech_difficulty: Optional[RedFlagChoice] = None


class VitalSigns(BaseModel):
    heart_rate: Optional[int] = None
    respiratory_rate: Optional[int] = None
    spo2: Optional[float] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    temperature: Optional[float] = None
    gcs: Optional[int] = None


class SymptomProfile(BaseModel):
    main_symptoms: List[str] = Field(default_factory=list)
    symptom_duration: str = "Unknown"
    severity: int = Field(5, ge=1, le=10)
    onset: str = "Unknown"
    consciousness_status: ConsciousnessLevel = ConsciousnessLevel.ALERT
    ability_to_speak: SpeechAbility = SpeechAbility.NORMAL
    ability_to_walk: MobilityStatus = MobilityStatus.INDEPENDENT
    progression: SymptomProgression = SymptomProgression.UNKNOWN
    functional_status: FunctionalStatus = FunctionalStatus.UNKNOWN


class MedicalHistory(BaseModel):
    known_major_conditions: List[str] = Field(default_factory=list)
    current_medications: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    pregnancy_status: PregnancyStatus = PregnancyStatus.NOT_APPLICABLE
    recent_trauma: bool = False
    recent_surgery: bool = False
    relevant_risk_factors: List[str] = Field(default_factory=list)


class PatientIntake(BaseModel):
    patient_id: Optional[str] = None
    age: int = Field(..., ge=0, le=125)
    sex: str = "Unknown"
    arrival_time: Optional[str] = None
    arrival_method: ArrivalMethod = ArrivalMethod.WALK_IN
    chief_complaint: str = Field(..., min_length=3)
    symptoms: SymptomProfile = Field(default_factory=SymptomProfile)
    red_flags: RedFlagsAssessment = Field(default_factory=RedFlagsAssessment)
    vitals: VitalSigns = Field(default_factory=VitalSigns)
    history: MedicalHistory = Field(default_factory=MedicalHistory)

    @field_validator("arrival_time", mode="before")
    @classmethod
    def validate_arrival_time(cls, v):
        if v is None:
            return None
        if isinstance(v, datetime):
            return v.isoformat()
        if isinstance(v, str):
            val_clean = v.strip()
            if not val_clean:
                return None
            return val_clean
        return str(v)


class SafetyEvaluation(BaseModel):
    safe_to_recommend: bool = True
    requires_human_review: bool = False
    risk_flags: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    suspicious_values: List[str] = Field(default_factory=list)
    contradictions: List[str] = Field(default_factory=list)
    uncertainty_level: UncertaintyLevel = UncertaintyLevel.LOW
    uncertainty_reason: Optional[str] = None


class TriageAssessment(BaseModel):
    priority: PriorityLevel
    priority_label: str
    recommended_route: str
    confidence_score: float = Field(0.85, ge=0.0, le=1.0)
    uncertainty_level: UncertaintyLevel = UncertaintyLevel.LOW
    uncertainty_description: str = "Low uncertainty: Critical parameters documented."
    safety_eval: SafetyEvaluation
    reasoning_bullets: List[str] = Field(default_factory=list)
    key_risk_factors: List[str] = Field(default_factory=list)
    reassessment_triggers: List[str] = Field(default_factory=list)
    safety_caveat: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    engine_mode: str = "Deterministic Decision Support Rule Engine"


class HumanDecision(BaseModel):
    decision_type: str
    original_priority: PriorityLevel
    final_priority: PriorityLevel
    override_reason: Optional[str] = None
    staff_id: str
    staff_role: str = "Triage Nurse"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None


class OverrideRequest(BaseModel):
    new_priority: PriorityLevel
    reason: str = Field(..., min_length=5)
    staff_id: str = Field(..., min_length=2)
    staff_role: str = "Triage Registered Nurse"
    notes: Optional[str] = None


class ReassessmentRequest(BaseModel):
    staff_id: str
    reason: str = Field(..., min_length=3)
    updated_vitals: Optional[VitalSigns] = None


# =====================================================================
# Patient Registration & Longitudinal Records
# =====================================================================

class PatientRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, description="Patient full name (Synthetic)")
    dob: str = Field(..., description="Date of birth YYYY-MM-DD")
    age: Optional[int] = None
    sex: str = Field("Male", description="Male / Female / Other / Unknown")
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    blood_group: Optional[str] = "Unknown"
    allergies: List[str] = Field(default_factory=list)
    existing_conditions: List[str] = Field(default_factory=list)
    primary_doctor_id: Optional[str] = None
    primary_doctor_name: Optional[str] = None
    department: Optional[str] = "Emergency Medicine"
    registration_date: Optional[str] = None

    @field_validator("dob", mode="before")
    @classmethod
    def validate_dob(cls, v):
        if not v or not str(v).strip():
            raise ValueError("Date of birth is required (YYYY-MM-DD).")
        v_str = str(v).strip().split("T")[0]
        try:
            date.fromisoformat(v_str)
        except Exception:
            raise ValueError("Invalid date of birth format. Expected YYYY-MM-DD.")
        return v_str

    @field_validator("registration_date", mode="before")
    @classmethod
    def validate_registration_date(cls, v):
        if not v or not str(v).strip():
            return None
        if isinstance(v, datetime):
            return v.isoformat()
        return str(v).strip()


class PatientSummary(BaseModel):
    id: str
    patient_id: str
    hospital_id: str
    name: str
    dob: str
    age: int
    sex: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    blood_group: Optional[str] = None
    status: str = "Active"
    primary_doctor_id: Optional[str] = None
    primary_doctor_name: Optional[str] = None
    department: Optional[str] = None
    registration_date: datetime
    created_at: datetime
    last_visit_date: Optional[datetime] = None
    next_appointment_date: Optional[str] = None
    latest_triage_priority: Optional[str] = None


class MedicalHistoryCreate(BaseModel):
    condition: str = Field(..., min_length=2)
    condition_type: str = Field("Chronic Condition", description="Past Condition, Surgery, Hospitalization, Chronic Condition, Allergy, Family History")
    date_or_year: str = Field("2024")
    status: str = Field("Active", description="Active, Resolved, Managed, Inactive")
    notes: Optional[str] = None

    @field_validator("date_or_year", mode="before")
    @classmethod
    def validate_date_or_year(cls, v):
        if not v or not str(v).strip():
            return "Not recorded"
        return str(v).strip()


class MedicalHistoryRecord(BaseModel):
    id: str
    hospital_id: str
    patient_id: str
    condition: str
    condition_type: str
    date_or_year: str
    status: str
    notes: Optional[str] = None
    recorded_by_name: str
    recorded_by_role: str
    created_at: datetime


class VisitCreate(BaseModel):
    department: str = "Emergency Department"
    doctor_id: Optional[str] = None
    doctor_name: str = Field(..., min_length=2)
    reason_for_visit: str = Field(..., min_length=3)
    symptoms: List[str] = Field(default_factory=list)
    vitals: Optional[Dict[str, Any]] = None
    triage_priority: Optional[str] = None
    assessment: str = Field(..., min_length=3)
    clinical_notes: str = Field(..., min_length=3)
    outcome: str = "Clinical assessment completed"
    follow_up: Optional[str] = None


class PatientVisit(BaseModel):
    id: str
    hospital_id: str
    patient_id: str
    visit_number: str
    visit_date: datetime
    department: str
    doctor_id: Optional[str] = None
    doctor_name: str
    reason_for_visit: str
    symptoms: List[str] = Field(default_factory=list)
    vitals: Optional[Dict[str, Any]] = None
    triage_priority: Optional[str] = None
    assessment: str
    clinical_notes: str
    outcome: str
    follow_up: Optional[str] = None
    created_at: datetime


class AppointmentCreate(BaseModel):
    appointment_date: str = Field(..., description="YYYY-MM-DD")
    appointment_time: str = Field(..., description="HH:MM (e.g. 10:30 AM)")
    doctor_id: Optional[str] = None
    doctor_name: str = Field(..., min_length=2)
    department: str = "Cardiology"
    appointment_type: str = "Follow-up"
    notes: Optional[str] = None

    @field_validator("appointment_date", mode="before")
    @classmethod
    def validate_appt_date(cls, v):
        if not v or not str(v).strip():
            raise ValueError("Appointment date is required (YYYY-MM-DD).")
        v_str = str(v).strip().split("T")[0]
        try:
            date.fromisoformat(v_str)
        except Exception:
            raise ValueError("Invalid appointment date format. Expected YYYY-MM-DD.")
        return v_str

    @field_validator("appointment_time", mode="before")
    @classmethod
    def validate_appt_time(cls, v):
        if not v or not str(v).strip():
            raise ValueError("Appointment time is required.")
        return str(v).strip()

    @field_validator("appointment_type", mode="before")
    @classmethod
    def validate_appt_type(cls, v):
        if not v or not str(v).strip():
            return "Follow-up"
        if hasattr(v, "value"):
            return str(v.value)
        return str(v).strip()


class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("status", mode="before")
    @classmethod
    def validate_opt_status(cls, v):
        if not v or not str(v).strip():
            return None
        if hasattr(v, "value"):
            return str(v.value)
        return str(v).strip()

    @field_validator("appointment_date", mode="before")
    @classmethod
    def validate_opt_appt_date(cls, v):
        if not v or not str(v).strip():
            return None
        v_str = str(v).strip().split("T")[0]
        try:
            date.fromisoformat(v_str)
            return v_str
        except Exception:
            return v_str

    @field_validator("appointment_time", mode="before")
    @classmethod
    def validate_opt_appt_time(cls, v):
        if not v or not str(v).strip():
            return None
        return str(v).strip()


class Appointment(BaseModel):
    id: str
    hospital_id: str
    patient_id: str
    patient_name: str
    appointment_number: str
    appointment_date: str
    appointment_time: str
    doctor_id: Optional[str] = None
    doctor_name: str
    department: str
    appointment_type: str
    status: str
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime


class ClinicalNoteCreate(BaseModel):
    note_content: str = Field(..., min_length=3)


class ClinicalNote(BaseModel):
    id: str
    hospital_id: str
    patient_id: str
    author_id: str
    author_name: str
    author_role: str
    note_content: str
    created_at: datetime


class DoctorAssignment(BaseModel):
    doctor_id: str
    doctor_name: str
    department: str
    is_primary: bool = True
    assigned_date: datetime = Field(default_factory=datetime.utcnow)


class TriageRecordSummary(BaseModel):
    id: str
    hospital_id: str
    patient_id: str
    triage_date: datetime
    priority: PriorityLevel
    recommended_route: str
    confidence_score: float
    reasoning_bullets: List[str]
    risk_flags: List[str]
    missing_information: List[str]
    human_decision: str
    override_reason: Optional[str] = None
    staff_name: str
    staff_role: str


class TimelineEvent(BaseModel):
    id: str
    event_type: str
    title: str
    description: str
    timestamp: datetime
    actor: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PatientProfileResponse(BaseModel):
    patient: PatientSummary
    latest_triage: Optional[TriageAssessment] = None
    next_appointment: Optional[Appointment] = None
    medical_history: List[MedicalHistoryRecord] = Field(default_factory=list)
    visits: List[PatientVisit] = Field(default_factory=list)
    appointments: List[Appointment] = Field(default_factory=list)
    triage_history: List[TriageRecordSummary] = Field(default_factory=list)
    doctors: List[DoctorAssignment] = Field(default_factory=list)
    medications: List[Dict[str, Any]] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    clinical_notes: List[ClinicalNote] = Field(default_factory=list)
    timeline: List[TimelineEvent] = Field(default_factory=list)


# Legacy & Queue Models
class PatientRecord(BaseModel):
    patient_id: str
    hospital_id: Optional[str] = None
    name: Optional[str] = None
    intake: PatientIntake
    assessment: TriageAssessment
    current_priority: PriorityLevel
    status: PatientStatus = PatientStatus.WAITING
    arrival_time: datetime
    waiting_minutes: int = 0
    assigned_route: str
    human_decisions: List[HumanDecision] = Field(default_factory=list)
    is_synthetic: bool = True


class AuditLogEntry(BaseModel):
    id: str
    hospital_id: Optional[str] = None
    timestamp: datetime
    patient_id: str
    chief_complaint: str
    input_summary: Dict[str, Any]
    initial_priority: PriorityLevel
    final_priority: PriorityLevel
    recommended_route: str
    confidence_score: float
    uncertainty_level: UncertaintyLevel
    risk_flags: List[str]
    missing_information: List[str]
    human_decision: str
    override_reason: Optional[str] = None
    staff_id: Optional[str] = None
    staff_role: Optional[str] = None
    final_status: PatientStatus


class AnalyticsSummary(BaseModel):
    total_arrivals: int
    current_waiting_count: int
    critical_patients_count: int
    average_wait_minutes: Optional[float] = None
    median_wait_minutes: Optional[float] = None
    patients_by_priority: Dict[str, int]
    reassessment_needed_count: int
    human_override_rate_pct: Optional[float] = None
    missing_data_rate_pct: Optional[float] = None
    patients_by_route: Dict[str, int]
    hourly_arrival_trend: List[Dict[str, Any]]
    wait_time_distribution: Dict[str, int]
    override_reasons_breakdown: List[Dict[str, Any]]
    active_load_level: str = "Normal"
    has_data: bool = False
