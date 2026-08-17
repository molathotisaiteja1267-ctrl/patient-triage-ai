export type RoleEnum =
  | 'PLATFORM_ADMIN'
  | 'HOSPITAL_ADMIN'
  | 'DOCTOR'
  | 'TRIAGE_NURSE'
  | 'NURSE'
  | 'RECEPTIONIST'
  | 'STAFF';

export type HospitalType =
  | 'Hospital'
  | 'Clinic'
  | 'Medical Center'
  | 'Emergency Care Center'
  | 'Nursing Home'
  | 'Other Healthcare Facility';

export type PriorityLevel = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'BLUE';

export type ArrivalMethod =
  | 'Walk-in'
  | 'Ambulance'
  | 'Police / Emergency Services'
  | 'Transfer from another facility'
  | 'Other';

export type ConsciousnessLevel = 'Alert' | 'Responds to Voice' | 'Responds to Pain' | 'Unresponsive';

export type SpeechAbility = 'Normal sentences' | 'Short phrases only' | 'Single words only' | 'Unable to speak';

export type MobilityStatus = 'Independent' | 'With assistance' | 'Unable / Stretcher / Wheelchair';

export type SymptomProgression = 'Improving' | 'Stable' | 'Worsening' | 'Unknown';

export type FunctionalStatus = 'Normal' | 'Reduced' | 'Severely impaired' | 'Unknown';

export type RedFlagChoice = 'Yes' | 'No' | 'Unknown';

export type PregnancyStatus = 'Pregnant' | 'Possibly pregnant' | 'Not pregnant' | 'Unknown' | 'Not applicable';

export type PatientStatus = 'WAITING' | 'UNDER_ASSESSMENT' | 'ACCEPTED' | 'OVERRIDDEN' | 'REASSESSMENT_REQUESTED' | 'IN_TREATMENT' | 'DISCHARGED' | 'Active';

export type UncertaintyLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled' | 'No-show';

export type AppointmentType = 'Consultation' | 'Follow-up' | 'Emergency Follow-up' | 'Diagnostic' | 'Procedure' | 'Other';

// =====================================================================
// Auth & Organization Interfaces
// =====================================================================

export interface HospitalSummary {
  id: string;
  name: string;
  code: string;
  hospital_type: string;
  city: string;
  state: string;
}

export interface HospitalResponse {
  id: string;
  name: string;
  code: string;
  hospital_type: string;
  address: string;
  city: string;
  state: string;
  country: string;
  contact_email: string;
  contact_phone: string;
  created_at: string;
  staff_count: number;
  patient_count: number;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: RoleEnum;
  department?: string | null;
  employee_id?: string | null;
  hospital_id: string;
  hospital_code: string;
  hospital_name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserSummary;
  hospital: HospitalSummary;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: RoleEnum;
  department?: string | null;
  employee_id?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StaffInviteResponse {
  id: string;
  token: string;
  name: string;
  email: string;
  role: RoleEnum;
  department?: string | null;
  employee_id?: string | null;
  expires_at: string;
  invitation_url: string;
}

// =====================================================================
// Patient & Clinical Interfaces
// =====================================================================

export interface PatientSummary {
  id: string;
  patient_id: string;
  hospital_id: string;
  name: string;
  dob: string;
  age: number;
  sex: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  blood_group?: string | null;
  status: string;
  primary_doctor_id?: string | null;
  primary_doctor_name?: string | null;
  department?: string | null;
  registration_date: string;
  created_at: string;
  last_visit_date?: string | null;
  next_appointment_date?: string | null;
  latest_triage_priority?: string | null;
}

export interface MedicalHistoryRecord {
  id: string;
  hospital_id: string;
  patient_id: string;
  condition: string;
  condition_type: string;
  date_or_year: string;
  status: string;
  notes?: string | null;
  recorded_by_name: string;
  recorded_by_role: string;
  created_at: string;
}

export interface PatientVisit {
  id: string;
  hospital_id: string;
  patient_id: string;
  visit_number: string;
  visit_date: string;
  department: string;
  doctor_id?: string | null;
  doctor_name: string;
  reason_for_visit: string;
  symptoms: string[];
  vitals?: Record<string, any> | null;
  triage_priority?: string | null;
  assessment: string;
  clinical_notes: string;
  outcome: string;
  follow_up?: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  hospital_id: string;
  patient_id: string;
  patient_name: string;
  appointment_number: string;
  appointment_date: string;
  appointment_time: string;
  doctor_id?: string | null;
  doctor_name: string;
  department: string;
  appointment_type: string;
  status: AppointmentStatus;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface ClinicalNote {
  id: string;
  hospital_id: string;
  patient_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  note_content: string;
  created_at: string;
}

export interface DoctorAssignment {
  doctor_id: string;
  doctor_name: string;
  department: string;
  is_primary: boolean;
  assigned_date: string;
}

export interface TriageRecordSummary {
  id: string;
  hospital_id: string;
  patient_id: string;
  triage_date: string;
  priority: PriorityLevel;
  recommended_route: string;
  confidence_score: number;
  reasoning_bullets: string[];
  risk_flags: string[];
  missing_information: string[];
  human_decision: string;
  override_reason?: string | null;
  staff_name: string;
  staff_role: string;
}

export interface TimelineEvent {
  id: string;
  event_type: string;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  metadata: Record<string, any>;
}

export interface PatientProfileResponse {
  patient: PatientSummary;
  latest_triage?: TriageAssessment | null;
  next_appointment?: Appointment | null;
  medical_history: MedicalHistoryRecord[];
  visits: PatientVisit[];
  appointments: Appointment[];
  triage_history: TriageRecordSummary[];
  doctors: DoctorAssignment[];
  medications: Array<Record<string, any>>;
  allergies: string[];
  clinical_notes: ClinicalNote[];
  timeline: TimelineEvent[];
}

// =====================================================================
// Triage Engine Interfaces
// =====================================================================

export interface RedFlagsAssessment {
  airway_obstruction?: RedFlagChoice;
  severe_dyspnea?: RedFlagChoice;
  shock_poor_perfusion?: RedFlagChoice;
  severe_chest_pain?: RedFlagChoice;
  loss_of_consciousness?: RedFlagChoice;
  altered_mental_status?: RedFlagChoice;
  seizure?: RedFlagChoice;
  sudden_neurological_deficit?: RedFlagChoice;
  uncontrolled_bleeding?: RedFlagChoice;
  severe_allergic_reaction?: RedFlagChoice;
  major_trauma?: RedFlagChoice;
  severe_uncontrolled_pain?: RedFlagChoice;

  // Conditional Context-Specific Screening
  pregnancy_warning_signs?: RedFlagChoice;
  pediatric_warning_signs?: RedFlagChoice;
  trauma_warning_details?: RedFlagChoice;
  stroke_warning_details?: RedFlagChoice;

  // Legacy compatibility fields
  acute_weakness_facial_droop?: RedFlagChoice;
  acute_speech_difficulty?: RedFlagChoice;
}

export interface VitalSigns {
  heart_rate?: number | null;
  respiratory_rate?: number | null;
  spo2?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  temperature?: number | null;
  gcs?: number | null;
}

export interface SymptomProfile {
  main_symptoms: string[];
  symptom_duration: string;
  severity: number;
  onset: string;
  consciousness_status: ConsciousnessLevel;
  ability_to_speak: SpeechAbility;
  ability_to_walk: MobilityStatus;
  progression: SymptomProgression;
  functional_status: FunctionalStatus;
}

export interface MedicalHistory {
  known_major_conditions: string[];
  current_medications: string[];
  allergies: string[];
  pregnancy_status: PregnancyStatus;
  recent_trauma: boolean;
  recent_surgery: boolean;
  relevant_risk_factors: string[];
}

export interface PatientIntake {
  patient_id?: string;
  age: number;
  sex: string;
  arrival_time?: string;
  arrival_method: ArrivalMethod;
  chief_complaint: string;
  symptoms: SymptomProfile;
  red_flags: RedFlagsAssessment;
  vitals: VitalSigns;
  history: MedicalHistory;
}

export interface SafetyEvaluation {
  safe_to_recommend: boolean;
  requires_human_review: boolean;
  risk_flags: string[];
  missing_information: string[];
  suspicious_values: string[];
  contradictions: string[];
  uncertainty_level: UncertaintyLevel;
  uncertainty_reason?: string | null;
}

export interface TriageAssessment {
  priority: PriorityLevel;
  priority_label: string;
  recommended_route: string;
  confidence_score: number;
  uncertainty_level?: UncertaintyLevel;
  uncertainty_description?: string;
  safety_eval: SafetyEvaluation;
  reasoning_bullets: string[];
  key_risk_factors: string[];
  reassessment_triggers?: string[];
  safety_caveat: string;
  generated_at: string;
  engine_mode: string;
}

export interface HumanDecision {
  decision_type: string;
  original_priority: PriorityLevel;
  final_priority: PriorityLevel;
  override_reason?: string | null;
  staff_id: string;
  staff_role: string;
  timestamp: string;
  notes?: string | null;
}

export interface OverrideRequest {
  new_priority: PriorityLevel;
  reason: string;
  staff_id: string;
  staff_role?: string;
  notes?: string;
}

export interface PatientRecord {
  patient_id: string;
  hospital_id?: string;
  name?: string;
  intake: PatientIntake;
  assessment: TriageAssessment;
  current_priority: PriorityLevel;
  status: PatientStatus;
  arrival_time: string;
  waiting_minutes: number;
  assigned_route: string;
  human_decisions: HumanDecision[];
  is_synthetic: boolean;
}

export interface AuditLogEntry {
  id: string;
  hospital_id?: string;
  timestamp: string;
  patient_id: string;
  chief_complaint: string;
  input_summary: Record<string, any>;
  initial_priority: PriorityLevel;
  final_priority: PriorityLevel;
  recommended_route: string;
  confidence_score: number;
  uncertainty_level: UncertaintyLevel;
  risk_flags: string[];
  missing_information: string[];
  human_decision: string;
  override_reason?: string | null;
  staff_id?: string | null;
  staff_role?: string | null;
  final_status: PatientStatus;
}

export interface AnalyticsSummary {
  total_arrivals: number;
  current_waiting_count: number;
  critical_patients_count: number;
  average_wait_minutes?: number | null;
  median_wait_minutes?: number | null;
  patients_by_priority: Record<string, number>;
  reassessment_needed_count: number;
  human_override_rate_pct?: number | null;
  missing_data_rate_pct?: number | null;
  patients_by_route: Record<string, number>;
  hourly_arrival_trend: Array<{ hour: string; count: number }>;
  wait_time_distribution: Record<string, number>;
  override_reasons_breakdown: Array<{
    patient_id: string;
    from: string;
    to: string;
    reason: string;
  }>;
  active_load_level: string;
  has_data: boolean;
}
