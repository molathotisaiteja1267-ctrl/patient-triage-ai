import {
  TokenResponse,
  HospitalResponse,
  StaffMember,
  StaffInviteResponse,
  PatientSummary,
  PatientProfileResponse,
  MedicalHistoryRecord,
  PatientVisit,
  Appointment,
  ClinicalNote,
  TriageAssessment,
  AnalyticsSummary,
  PatientIntake
} from './types';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = 'API request failed';
    try {
      const err = await res.json();
      if (typeof err.detail === 'string') {
        errorDetail = err.detail;
      } else if (Array.isArray(err.detail)) {
        errorDetail = err.detail.map((d: any) => d.msg || d.loc?.join('.') || JSON.stringify(d)).join(', ');
      } else if (err.error) {
        errorDetail = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
      } else if (err.message) {
        errorDetail = typeof err.message === 'string' ? err.message : JSON.stringify(err.message);
      } else {
        errorDetail = JSON.stringify(err);
      }
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

async function safeFetch<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, options);
    return await handleResponse<T>(res);
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message?.toLowerCase().includes('fetch')) {
      throw new Error('Unable to connect to backend server. Please verify the backend service is running on port 8000.');
    }
    throw err;
  }
}

export const api = {
  // =================================================================
  // Authentication & Hospital Registration
  // =================================================================
  async registerHospital(payload: {
    hospital_name: string;
    hospital_type: string;
    hospital_address: string;
    city: string;
    state: string;
    country: string;
    contact_email: string;
    contact_phone: string;
    hospital_code: string;
    admin_name: string;
    admin_email: string;
    password: string;
    confirm_password: string;
  }): Promise<TokenResponse> {
    return safeFetch<TokenResponse>(`${API_BASE}/auth/register-hospital`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async login(payload: {
    hospital_code: string;
    email: string;
    password: string;
  }): Promise<TokenResponse> {
    return safeFetch<TokenResponse>(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async getMe(): Promise<TokenResponse> {
    return safeFetch<TokenResponse>(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
  },

  async inviteStaff(payload: {
    name: string;
    email: string;
    role: string;
    department?: string;
    employee_id?: string;
  }): Promise<StaffInviteResponse> {
    return safeFetch<StaffInviteResponse>(`${API_BASE}/auth/invite-staff`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  async getInvitation(token: string): Promise<any> {
    return safeFetch<any>(`${API_BASE}/auth/invitation/${encodeURIComponent(token)}`);
  },

  async registerStaff(payload: {
    token: string;
    name: string;
    email: string;
    password: string;
    confirm_password: string;
  }): Promise<TokenResponse> {
    return safeFetch<TokenResponse>(`${API_BASE}/auth/register-staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  // =================================================================
  // Patient Operations
  // =================================================================
  async getPatients(params?: {
    search?: string;
    status?: string;
    department?: string;
  }): Promise<PatientSummary[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.department) query.append('department', params.department);

    const url = `${API_BASE}/patients${query.toString() ? `?${query.toString()}` : ''}`;
    return safeFetch<PatientSummary[]>(url, { headers: getAuthHeaders() });
  },

  async registerPatient(payload: {
    name: string;
    dob: string;
    age?: number;
    sex: string;
    phone?: string;
    email?: string;
    address?: string;
    emergency_contact?: string;
    blood_group?: string;
    allergies?: string[];
    existing_conditions?: string[];
    primary_doctor_name?: string;
    department?: string;
  }): Promise<{ status: string; patient_id: string; message: string }> {
    return safeFetch<{ status: string; patient_id: string; message: string }>(`${API_BASE}/patients`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  async getPatientProfile(patientId: string): Promise<PatientProfileResponse> {
    return safeFetch<PatientProfileResponse>(`${API_BASE}/patients/${encodeURIComponent(patientId)}`, {
      headers: getAuthHeaders(),
    });
  },

  async addMedicalHistory(
    patientId: string,
    payload: {
      condition: string;
      condition_type: string;
      date_or_year: string;
      status: string;
      notes?: string;
    }
  ): Promise<MedicalHistoryRecord> {
    return safeFetch<MedicalHistoryRecord>(`${API_BASE}/patients/${encodeURIComponent(patientId)}/medical-history`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  async logVisit(
    patientId: string,
    payload: {
      department: string;
      doctor_name: string;
      reason_for_visit: string;
      symptoms: string[];
      vitals?: any;
      triage_priority?: string;
      assessment: string;
      clinical_notes: string;
      outcome: string;
      follow_up?: string;
    }
  ): Promise<PatientVisit> {
    return safeFetch<PatientVisit>(`${API_BASE}/patients/${encodeURIComponent(patientId)}/visits`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  async scheduleAppointment(
    patientId: string,
    payload: {
      appointment_date: string;
      appointment_time: string;
      doctor_name: string;
      department: string;
      appointment_type: string;
      notes?: string;
    }
  ): Promise<Appointment> {
    return safeFetch<Appointment>(`${API_BASE}/patients/${encodeURIComponent(patientId)}/appointments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  async updateAppointment(
    appointmentId: string,
    payload: {
      status?: string;
      appointment_date?: string;
      appointment_time?: string;
      notes?: string;
    }
  ): Promise<Appointment> {
    return safeFetch<Appointment>(`${API_BASE}/patients/appointments/${encodeURIComponent(appointmentId)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  async addClinicalNote(
    patientId: string,
    payload: { note_content: string }
  ): Promise<ClinicalNote> {
    return safeFetch<ClinicalNote>(`${API_BASE}/patients/${encodeURIComponent(patientId)}/notes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  async runPatientTriage(
    patientId: string,
    intake: PatientIntake,
    decisionType = 'ACCEPTED',
    overrideReason?: string
  ): Promise<TriageAssessment> {
    const query = new URLSearchParams({ decision_type: decisionType });
    if (overrideReason) query.append('override_reason', overrideReason);

    return safeFetch<TriageAssessment>(`${API_BASE}/patients/${encodeURIComponent(patientId)}/triage?${query.toString()}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(intake),
    });
  },

  async assignDoctor(
    patientId: string,
    doctorName: string,
    department: string
  ): Promise<any> {
    const query = new URLSearchParams({
      doctor_name: doctorName,
      department: department,
    });
    return safeFetch<any>(`${API_BASE}/patients/${encodeURIComponent(patientId)}/assign-doctor?${query.toString()}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  },

  async reassessPatient(patientId: string, reason: string): Promise<any> {
    const query = new URLSearchParams({ reason });
    return safeFetch<any>(`${API_BASE}/patients/${encodeURIComponent(patientId)}/reassess?${query.toString()}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  },

  // =================================================================
  // Hospital Settings & Administration
  // =================================================================
  async getHospitalSettings(): Promise<HospitalResponse> {
    return safeFetch<HospitalResponse>(`${API_BASE}/hospital/settings`, {
      headers: getAuthHeaders(),
    });
  },

  async updateHospitalSettings(payload: Partial<HospitalResponse>): Promise<HospitalResponse> {
    return safeFetch<HospitalResponse>(`${API_BASE}/hospital/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
  },

  async getHospitalStaff(): Promise<StaffMember[]> {
    return safeFetch<StaffMember[]>(`${API_BASE}/hospital/staff`, {
      headers: getAuthHeaders(),
    });
  },

  async toggleStaffStatus(userId: string, isActive: boolean): Promise<any> {
    return safeFetch<any>(`${API_BASE}/hospital/staff/${encodeURIComponent(userId)}/status?is_active=${isActive}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
  },

  async getHospitalDoctors(): Promise<Array<{ id: string; name: string; email: string; department?: string }>> {
    return safeFetch<any>(`${API_BASE}/hospital/doctors`, {
      headers: getAuthHeaders(),
    });
  },

  async getHospitalDepartments(): Promise<string[]> {
    return safeFetch<string[]>(`${API_BASE}/hospital/departments`, {
      headers: getAuthHeaders(),
    });
  },

  async addDepartment(departmentName: string): Promise<any> {
    return safeFetch<any>(`${API_BASE}/hospital/departments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ department_name: departmentName }),
    });
  },

  async getSetupStatus(): Promise<{
    is_setup_completed: boolean;
    department_count: number;
    staff_count: number;
    hospital_name: string;
    hospital_code: string;
  }> {
    return safeFetch<any>(`${API_BASE}/hospital/setup-status`, {
      headers: getAuthHeaders(),
    });
  },

  async completeSetup(): Promise<any> {
    return safeFetch<any>(`${API_BASE}/hospital/complete-setup`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  },

  async getHospitalAppointments(status?: string): Promise<Appointment[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return safeFetch<Appointment[]>(`${API_BASE}/hospital/appointments${query}`, {
      headers: getAuthHeaders(),
    });
  },

  async getHospitalTriageQueue(): Promise<any[]> {
    return safeFetch<any[]>(`${API_BASE}/hospital/triage-queue`, {
      headers: getAuthHeaders(),
    });
  },

  async getAnalytics(): Promise<AnalyticsSummary> {
    return safeFetch<AnalyticsSummary>(`${API_BASE}/analytics`, {
      headers: getAuthHeaders(),
    });
  },

  async getAuditLogs(limit = 100): Promise<any[]> {
    return safeFetch<any[]>(`${API_BASE}/audit?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
  },

  async previewTriage(intake: PatientIntake): Promise<TriageAssessment> {
    return safeFetch<TriageAssessment>(`${API_BASE}/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(intake),
    });
  },

  async checkHealth(): Promise<{ status: string; service: string }> {
    return safeFetch<{ status: string; service: string }>(`${API_BASE}/health`);
  }
};
