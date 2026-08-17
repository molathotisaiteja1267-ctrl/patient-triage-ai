import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import {
  PatientProfileResponse,
  PatientSummary,
  MedicalHistoryRecord,
  PatientVisit,
  Appointment,
  ClinicalNote,
  TriageAssessment,
  TimelineEvent,
  PriorityLevel
} from '../services/types';
import { useToast } from '../context/ToastContext';
import {
  formatDateForDisplay,
  formatDateTimeForDisplay,
  formatTimeForDisplay,
  formatDateForAPI,
  getTodayDateString,
  isValidDateString
} from '../utils/dateUtils';
import {
  User,
  Activity,
  Calendar,
  Clock,
  FileText,
  Stethoscope,
  History,
  AlertTriangle,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Heart,
  ChevronRight,
  UserCheck,
  Building2,
  CalendarDays,
  Pill,
  X,
  ShieldAlert
} from 'lucide-react';
import { ClinicalTabs } from './ClinicalTabs';
import { ClinicalSection } from './ClinicalSection';

interface PatientProfileProps {
  patientId: string;
  onBack: () => void;
  onRunTriageForPatient: (patient: PatientSummary) => void;
}

export const PatientProfile: React.FC<PatientProfileProps> = ({
  patientId,
  onBack,
  onRunTriageForPatient,
}) => {
  const toast = useToast();
  const [profile, setProfile] = useState<PatientProfileResponse | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal States
  const [showAddMedHistoryModal, setShowAddMedHistoryModal] = useState(false);
  const [showLogVisitModal, setShowLogVisitModal] = useState(false);
  const [showScheduleApptModal, setShowScheduleApptModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showAssignDoctorModal, setShowAssignDoctorModal] = useState(false);

  // Modal-specific inline error states
  const [modalError, setModalError] = useState<string | null>(null);

  // Form states
  const [medCondition, setMedCondition] = useState('');
  const [medType, setMedType] = useState('Chronic Condition');
  const [medDate, setMedDate] = useState('2024');
  const [medStatus, setMedStatus] = useState('Active');
  const [medNotes, setMedNotes] = useState('');

  const [visitDept, setVisitDept] = useState('Emergency Medicine');
  const [visitDoctor, setVisitDoctor] = useState('');
  const [visitReason, setVisitReason] = useState('');
  const [visitAssessment, setVisitAssessment] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [visitOutcome, setVisitOutcome] = useState('Stabilized and managed');
  const [visitFollowUp, setVisitFollowUp] = useState('');

  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('10:00 AM');
  const [apptDoctor, setApptDoctor] = useState('');
  const [apptDept, setApptDept] = useState('Cardiology');
  const [apptType, setApptType] = useState('Follow-up');
  const [apptNotes, setApptNotes] = useState('');

  const [newNoteContent, setNewNoteContent] = useState('');

  const [assignDocName, setAssignDocName] = useState('');
  const [assignDocDept, setAssignDocDept] = useState('General Medicine');

  const [hospitalDoctors, setHospitalDoctors] = useState<any[]>([]);
  const [hospitalDepts, setHospitalDepts] = useState<string[]>([]);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getPatientProfile(patientId);
      setProfile(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load patient record.');
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadProfile();
    api.getHospitalDoctors().then(setHospitalDoctors).catch(console.warn);
    api.getHospitalDepartments().then(setHospitalDepts).catch(console.warn);
  }, [loadProfile]);

  const handleAddMedHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medCondition.trim()) {
      setModalError('Condition name is required.');
      return;
    }
    setModalError(null);
    try {
      await api.addMedicalHistory(patientId, {
        condition: medCondition.trim(),
        condition_type: medType,
        date_or_year: medDate.trim() || 'Not recorded',
        status: medStatus,
        notes: medNotes.trim() || undefined,
      });
      toast.success('Condition record added to patient history.', 'Medical History Updated');
      setShowAddMedHistoryModal(false);
      setMedCondition('');
      setMedNotes('');
      await loadProfile();
    } catch (err: any) {
      const msg = err.message || 'Failed to add condition record.';
      setModalError(msg);
      toast.error(msg, 'Condition Error');
    }
  };

  const handleLogVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitDoctor.trim() || !visitReason.trim()) {
      setModalError('Physician and reason for visit are required.');
      return;
    }
    setModalError(null);
    try {
      await api.logVisit(patientId, {
        department: visitDept,
        doctor_name: visitDoctor.trim(),
        reason_for_visit: visitReason.trim(),
        symptoms: [visitReason.trim()],
        assessment: visitAssessment.trim() || 'Clinical evaluation completed.',
        clinical_notes: visitNotes.trim() || 'Patient examined and provided care plan.',
        outcome: visitOutcome.trim(),
        follow_up: visitFollowUp.trim() || undefined,
      });
      toast.success('Clinical encounter saved to patient EHR.', 'Encounter Logged');
      setShowLogVisitModal(false);
      setVisitReason('');
      setVisitAssessment('');
      setVisitNotes('');
      await loadProfile();
    } catch (err: any) {
      const msg = err.message || 'Failed to log clinical visit.';
      setModalError(msg);
      toast.error(msg, 'Encounter Error');
    }
  };

  const handleScheduleAppt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptDate || !isValidDateString(apptDate)) {
      setModalError('Please select a valid appointment date (YYYY-MM-DD).');
      return;
    }
    if (!apptDoctor.trim()) {
      setModalError('Please select or assign a physician for the appointment.');
      return;
    }

    const formattedDate = formatDateForAPI(apptDate);
    if (!formattedDate) {
      setModalError('Invalid appointment date format. Please select a valid date.');
      return;
    }

    setModalError(null);
    try {
      await api.scheduleAppointment(patientId, {
        appointment_date: formattedDate,
        appointment_time: apptTime.trim() || '10:00 AM',
        doctor_name: apptDoctor.trim(),
        department: apptDept,
        appointment_type: apptType,
        notes: apptNotes.trim() || undefined,
      });
      toast.success(`Appointment scheduled for ${formatDateForDisplay(formattedDate)} at ${apptTime}.`, 'Appointment Confirmed');
      setShowScheduleApptModal(false);
      setApptDate('');
      setApptNotes('');
      await loadProfile();
    } catch (err: any) {
      const msg = err.message || 'Failed to schedule appointment.';
      setModalError(msg);
      toast.error(msg, 'Appointment Error');
    }
  };

  const handleUpdateApptStatus = async (apptId: string, status: string) => {
    try {
      await api.updateAppointment(apptId, { status });
      toast.success(`Appointment marked as ${status}.`, 'Appointment Updated');
      await loadProfile();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update appointment status.', 'Update Error');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) {
      setModalError('Clinical note content cannot be empty.');
      return;
    }
    setModalError(null);
    try {
      await api.addClinicalNote(patientId, { note_content: newNoteContent.trim() });
      toast.success('Clinical note appended to patient record.', 'Note Saved');
      setShowAddNoteModal(false);
      setNewNoteContent('');
      await loadProfile();
    } catch (err: any) {
      const msg = err.message || 'Failed to add clinical note.';
      setModalError(msg);
      toast.error(msg, 'Note Error');
    }
  };

  const handleAssignDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignDocName.trim()) {
      setModalError('Please specify physician name.');
      return;
    }
    setModalError(null);
    try {
      await api.assignDoctor(patientId, assignDocName.trim(), assignDocDept);
      toast.success(`Assigned Dr. ${assignDocName.trim()} to patient.`, 'Physician Assigned');
      setShowAssignDoctorModal(false);
      await loadProfile();
    } catch (err: any) {
      const msg = err.message || 'Failed to assign physician.';
      setModalError(msg);
      toast.error(msg, 'Assignment Error');
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-[#64748B] flex flex-col items-center justify-center gap-2 font-sans text-xs">
        <Activity className="w-6 h-6 animate-spin text-[#2563EB]" />
        <p className="font-semibold text-[#172033]">Loading longitudinal EHR patient records...</p>
      </div>
    );
  }

  if (errorMsg || !profile) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-3 font-sans text-xs">
        <div className="p-4 bg-[#FDECEC] border border-[#F3A6A6] rounded-lg text-[#DC2626] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0" />
          <div>
            <h3 className="font-bold text-sm">Patient Record Not Accessible</h3>
            <p className="mt-0.5 text-xs text-[#172033]">{errorMsg || 'Unable to access patient record.'}</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="clinical-btn-secondary flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Patient Directory</span>
        </button>
      </div>
    );
  }

  const { patient, latest_triage, next_appointment, medical_history, visits, appointments, triage_history, doctors, clinical_notes, timeline } = profile;

  const profileTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'visits', label: `Visits (${visits.length})` },
    { id: 'conditions', label: `Conditions (${medical_history.filter(m => m.condition_type !== 'Allergy').length})` },
    { id: 'medications', label: 'Medications' },
    { id: 'allergies', label: `Allergies (${profile.allergies.length})` },
    { id: 'appointments', label: `Appointments (${appointments.length})` },
    { id: 'triage', label: `Triage History (${triage_history.length})` },
    { id: 'notes', label: `Clinical Notes (${clinical_notes.length})` },
  ];

  const getPriorityBadgeClass = (priority?: string) => {
    switch (priority) {
      case 'RED':
        return 'badge-priority-red';
      case 'ORANGE':
        return 'badge-priority-orange';
      case 'YELLOW':
        return 'badge-priority-yellow';
      case 'GREEN':
      case 'BLUE':
        return 'badge-priority-green';
      default:
        return 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]';
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16 font-sans text-xs">
      {/* Patient Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#64748B] rounded-md transition-colors"
              title="Return to patient directory"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                PATIENT PROFILE
              </div>
              <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
                <h1 className="text-xl font-bold text-[#172033] tracking-tight">{patient.name}</h1>
                <span className="font-mono font-bold text-xs text-[#2563EB] bg-[#EAF2FF] px-2.5 py-0.5 rounded border border-[#C9DBF8]">
                  {patient.patient_id}
                </span>
                <span className="text-xs text-[#64748B] font-semibold">
                  {patient.age} yrs • {patient.sex}
                </span>
                <span className="px-2 py-0.5 bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] text-[10px] font-semibold rounded">
                  {patient.status}
                </span>
              </div>
              <div className="text-xs text-[#64748B] mt-1 flex flex-wrap items-center gap-x-4">
                <span>DOB: <strong className="text-[#172033]">{formatDateForDisplay(patient.dob)}</strong></span>
                <span>Blood: <strong className="text-[#172033]">{patient.blood_group || 'Unknown'}</strong></span>
                <span>Dept: <strong className="text-[#172033]">{patient.department || 'General Medicine'}</strong></span>
                <span>Primary Doctor: <strong className="text-[#2563EB]">{patient.primary_doctor_name || 'Unassigned'}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onRunTriageForPatient(patient)}
              className="clinical-btn-primary bg-[#DC2626] hover:bg-[#B91C1C] h-8 text-xs flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Run Emergency Triage</span>
            </button>

            <button
              onClick={() => {
                setModalError(null);
                setShowScheduleApptModal(true);
              }}
              className="clinical-btn-primary h-8 text-xs flex items-center gap-1.5"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Schedule Appt</span>
            </button>

            <button
              onClick={() => {
                setModalError(null);
                setShowLogVisitModal(true);
              }}
              className="clinical-btn-secondary h-8 text-xs flex items-center gap-1.5"
            >
              <Stethoscope className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Log Visit</span>
            </button>

            <button
              onClick={() => {
                setModalError(null);
                setShowAddNoteModal(true);
              }}
              className="clinical-btn-secondary h-8 text-xs flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Add Note</span>
            </button>
          </div>
        </div>

        {/* Clinical Tabs */}
        <ClinicalTabs
          tabs={profileTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Next Appointment */}
            {next_appointment ? (
              <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#EAF2FF] text-[#2563EB] rounded-lg border border-[#C9DBF8]">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                      Next Scheduled Appointment
                    </div>
                    <div className="font-bold text-[#172033] text-sm mt-0.5">
                      {formatDateForDisplay(next_appointment.appointment_date)} at {formatTimeForDisplay(next_appointment.appointment_time)}
                    </div>
                    <div className="text-xs text-[#64748B]">
                      Dr. {next_appointment.doctor_name} ({next_appointment.department}) • {next_appointment.appointment_type}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('appointments')}
                  className="clinical-btn-secondary h-8 text-xs"
                >
                  Manage
                </button>
              </div>
            ) : (
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-lg flex items-center justify-between text-[#64748B]">
                <span>No upcoming appointments scheduled.</span>
                <button
                  onClick={() => {
                    setModalError(null);
                    setShowScheduleApptModal(true);
                  }}
                  className="text-[#2563EB] font-semibold hover:underline"
                >
                  Schedule Appointment
                </button>
              </div>
            )}

            {/* Latest Triage Assessment */}
            {latest_triage ? (
              <div className="p-5 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-3">
                <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#2563EB]" />
                    <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wide">
                      Latest Emergency Triage Assessment
                    </h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${getPriorityBadgeClass(latest_triage.priority)}`}>
                    Priority {latest_triage.priority}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
                    <span className="text-[#64748B] font-medium">Care Pathway:</span>
                    <div className="font-bold text-[#172033] mt-0.5">{latest_triage.recommended_route}</div>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
                    <span className="text-[#64748B] font-medium">Safety Evaluation:</span>
                    <div className="font-bold text-[#172033] mt-0.5">
                      {latest_triage.safety_eval?.safe_to_recommend ? 'Safe to recommend' : 'Clinical review required'}
                    </div>
                  </div>
                </div>

                {latest_triage.reasoning_bullets && latest_triage.reasoning_bullets.length > 0 && (
                  <div className="space-y-1 text-xs pt-1">
                    <div className="font-semibold text-[#172033]">Clinical Reasoning:</div>
                    <ul className="space-y-0.5 text-[#172033] pl-4 list-disc">
                      {latest_triage.reasoning_bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 bg-white border border-[#E2E8F0] rounded-lg text-center space-y-2">
                <Activity className="w-6 h-6 text-[#94A3B8] mx-auto" />
                <div className="font-bold text-[#172033]">No Triage Assessment Recorded</div>
                <button
                  onClick={() => onRunTriageForPatient(patient)}
                  className="clinical-btn-primary bg-[#DC2626] hover:bg-[#B91C1C] h-8 text-xs"
                >
                  Run Arrival Triage
                </button>
              </div>
            )}

            {/* Recent Encounters */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-[#16A34A]" />
                  <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wide">
                    Recent Encounters
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('visits')}
                  className="text-[#2563EB] font-semibold hover:underline text-xs"
                >
                  View All ({visits.length})
                </button>
              </div>

              {visits.length === 0 ? (
                <div className="text-[#94A3B8] py-4 text-center">No clinical visits logged yet.</div>
              ) : (
                <div className="space-y-2">
                  {visits.slice(0, 3).map((v) => (
                    <div key={v.id} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md space-y-1">
                      <div className="flex justify-between font-bold text-[#172033]">
                        <span>{v.reason_for_visit}</span>
                        <span className="font-mono text-[#64748B] text-[11px]">{v.visit_number}</span>
                      </div>
                      <div className="text-[#64748B] text-[11px]">
                        Dr. {v.doctor_name} ({v.department}) • {formatDateForDisplay(v.visit_date)}
                      </div>
                      <div className="text-[#172033] text-xs">{v.assessment}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Demographics & Allergies */}
          <div className="space-y-4">
            {/* Demographics Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 space-y-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
              <div className="font-bold text-[#172033] border-b border-[#F1F5F9] pb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-[#2563EB]" />
                <span className="text-xs uppercase tracking-wide">Patient Demographics</span>
              </div>
              <div className="space-y-2 text-xs text-[#64748B]">
                <div className="flex justify-between">
                  <span>Phone:</span>
                  <span className="font-medium text-[#172033]">{patient.phone || 'Not recorded'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="font-medium text-[#172033]">{patient.email || 'Not recorded'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Address:</span>
                  <span className="font-medium text-[#172033]">{patient.address || 'Not recorded'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Emergency:</span>
                  <span className="font-medium text-[#172033]">{patient.emergency_contact || 'Not recorded'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Registered:</span>
                  <span className="font-medium text-[#172033]">{formatDateForDisplay(patient.registration_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Visit:</span>
                  <span className="font-medium text-[#172033]">{formatDateForDisplay(patient.last_visit_date)}</span>
                </div>
              </div>
            </div>

            {/* Allergies & Conditions */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 space-y-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
              <div className="flex justify-between items-center border-b border-[#F1F5F9] pb-2">
                <div className="flex items-center gap-2 font-bold text-[#172033]">
                  <Heart className="w-4 h-4 text-[#DC2626]" />
                  <span className="text-xs uppercase tracking-wide">Allergies & Conditions</span>
                </div>
                <button
                  onClick={() => setActiveTab('conditions')}
                  className="text-[#2563EB] font-semibold hover:underline text-xs"
                >
                  + Add
                </button>
              </div>

              <div>
                <div className="text-[10px] font-bold text-[#64748B] uppercase mb-1.5">Known Allergies:</div>
                {profile.allergies.length === 0 ? (
                  <div className="text-[#94A3B8] text-xs">No known drug allergies.</div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {profile.allergies.map((allg, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-[#FDECEC] border border-[#F3A6A6] text-[#DC2626] font-semibold rounded text-[11px]"
                      >
                        {allg}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#F1F5F9]">
                <div className="text-[10px] font-bold text-[#64748B] uppercase mb-1.5">Active Conditions:</div>
                {medical_history.filter(m => m.condition_type !== 'Allergy').length === 0 ? (
                  <div className="text-[#94A3B8] text-xs">No active conditions recorded.</div>
                ) : (
                  <div className="space-y-1">
                    {medical_history.filter(m => m.condition_type !== 'Allergy').slice(0, 4).map((m) => (
                      <div
                        key={m.id}
                        className="flex justify-between p-2 bg-[#F8FAFC] rounded border border-[#E2E8F0] text-xs"
                      >
                        <span className="font-medium text-[#172033]">{m.condition}</span>
                        <span className="text-[#64748B] font-mono">{m.date_or_year}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VISITS */}
      {activeTab === 'visits' && (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#172033]">Clinical Encounters & Consultations</h2>
              <p className="text-xs text-[#64748B]">Historical emergency, inpatient, and outpatient encounters</p>
            </div>
            <button
              onClick={() => {
                setModalError(null);
                setShowLogVisitModal(true);
              }}
              className="clinical-btn-primary h-8 text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Encounter</span>
            </button>
          </div>

          {visits.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8]">No clinical encounters recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {visits.map((v) => (
                <div key={v.id} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2">
                  <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono px-2 py-0.5 bg-[#EAF2FF] text-[#2563EB] font-bold text-xs rounded border border-[#C9DBF8]">
                        {v.visit_number}
                      </span>
                      <h3 className="font-bold text-[#172033] text-xs">{v.reason_for_visit}</h3>
                    </div>
                    <div className="text-[#64748B] text-xs">
                      {formatDateTimeForDisplay(v.visit_date)} • <strong>Dr. {v.doctor_name}</strong> ({v.department})
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><strong className="text-[#64748B]">Assessment: </strong>{v.assessment}</div>
                    <div><strong className="text-[#64748B]">Outcome: </strong>{v.outcome}</div>
                  </div>
                  <div className="text-xs text-[#172033] bg-white p-2.5 border border-[#E2E8F0] rounded">
                    <strong className="text-[#64748B]">Clinical Notes: </strong>{v.clinical_notes}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONDITIONS */}
      {activeTab === 'conditions' && (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#172033]">Documented Conditions & Surgeries</h2>
              <p className="text-xs text-[#64748B]">Chronological record of chronic conditions and surgical history</p>
            </div>
            <button
              onClick={() => {
                setModalError(null);
                setShowAddMedHistoryModal(true);
              }}
              className="clinical-btn-primary h-8 text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Condition / Surgery</span>
            </button>
          </div>

          {medical_history.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8]">No medical history records on file.</div>
          ) : (
            <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase text-[11px]">
                    <th className="py-2.5 px-4">Condition / Diagnosis</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Onset Year</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Recorded By</th>
                    <th className="py-2.5 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {medical_history.map((m) => (
                    <tr key={m.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-2.5 px-4 font-bold text-[#172033]">{m.condition}</td>
                      <td className="py-2.5 px-4 text-[#64748B]">{m.condition_type}</td>
                      <td className="py-2.5 px-4 font-mono text-[#172033]">{m.date_or_year}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.status === 'Active' ? 'bg-[#FFF7E6] text-[#D97706] border border-[#F5C451]' : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[#64748B]">
                        {m.recorded_by_name} <span className="text-[10px]">({m.recorded_by_role})</span>
                      </td>
                      <td className="py-2.5 px-4 text-[#64748B] max-w-xs truncate">{m.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MEDICATIONS */}
      {activeTab === 'medications' && (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#172033]">Current Prescriptions & Medications</h2>
              <p className="text-xs text-[#64748B]">Documented outpatient and inpatient drug regimens</p>
            </div>
          </div>
          <div className="p-8 text-center text-[#64748B] space-y-2">
            <Pill className="w-8 h-8 text-[#94A3B8] mx-auto" />
            <p>No active prescription interactions flagged. Document medications during arrival intake or clinical visits.</p>
          </div>
        </div>
      )}

      {/* TAB 5: ALLERGIES */}
      {activeTab === 'allergies' && (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#172033]">Documented Drug & Environmental Allergies</h2>
              <p className="text-xs text-[#64748B]">Critical safety warnings for pharmacological prescriptions</p>
            </div>
          </div>

          {profile.allergies.length === 0 ? (
            <div className="p-8 text-center text-[#94A3B8]">No allergies documented for this patient.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.allergies.map((allg, idx) => (
                <div key={idx} className="p-3.5 bg-[#FDECEC] border border-[#F3A6A6] rounded-lg flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
                  <div>
                    <div className="font-bold text-[#DC2626] text-sm">{allg}</div>
                    <div className="text-[11px] text-[#172033]">Severe reaction documented</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#172033]">Scheduled Appointments & Follow-ups</h2>
              <p className="text-xs text-[#64748B]">Specialist consultations and follow-up calendar</p>
            </div>
            <button
              onClick={() => {
                setModalError(null);
                setShowScheduleApptModal(true);
              }}
              className="clinical-btn-primary h-8 text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Appointment</span>
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8]">No appointments scheduled for this patient.</div>
          ) : (
            <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase text-[11px]">
                    <th className="py-2.5 px-4">Appointment #</th>
                    <th className="py-2.5 px-4">Date & Time</th>
                    <th className="py-2.5 px-4">Physician</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-2.5 px-4 font-mono font-bold text-[#2563EB]">{a.appointment_number}</td>
                      <td className="py-2.5 px-4 text-[#172033] font-medium">
                        {formatDateForDisplay(a.appointment_date)} at {formatTimeForDisplay(a.appointment_time)}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-[#172033]">{a.doctor_name}</td>
                      <td className="py-2.5 px-4 text-[#64748B]">{a.department}</td>
                      <td className="py-2.5 px-4 text-[#64748B]">{a.appointment_type}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.status === 'Scheduled' ? 'bg-[#EAF2FF] text-[#2563EB] border border-[#C9DBF8]' :
                          a.status === 'Completed' ? 'bg-[#EAF8EF] text-[#16A34A] border border-[#B7E4C7]' :
                          'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right space-x-1">
                        {a.status === 'Scheduled' && (
                          <>
                            <button
                              onClick={() => handleUpdateApptStatus(a.id, 'Completed')}
                              className="px-2 py-0.5 bg-[#EAF8EF] text-[#16A34A] border border-[#B7E4C7] rounded hover:bg-[#DCFCE7] text-[10px] font-semibold"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleUpdateApptStatus(a.id, 'Cancelled')}
                              className="px-2 py-0.5 bg-[#FDECEC] text-[#DC2626] border border-[#F3A6A6] rounded hover:bg-[#FEE2E2] text-[10px] font-semibold"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: TRIAGE HISTORY */}
      {activeTab === 'triage' && (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#172033]">Emergency AI Triage Records</h2>
              <p className="text-xs text-[#64748B]">Audited prioritization decisions and care routes</p>
            </div>
            <button
              onClick={() => onRunTriageForPatient(patient)}
              className="clinical-btn-primary bg-[#DC2626] hover:bg-[#B91C1C] h-8 text-xs flex items-center gap-1"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Run Triage</span>
            </button>
          </div>

          {triage_history.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8]">No emergency triage evaluations recorded.</div>
          ) : (
            <div className="space-y-3">
              {triage_history.map((t) => (
                <div key={t.id} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2">
                  <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${getPriorityBadgeClass(t.priority)}`}>
                        Priority {t.priority}
                      </span>
                      <span className="font-bold text-[#172033] text-xs">{t.recommended_route}</span>
                    </div>
                    <div className="text-[#64748B] text-xs">
                      {formatDateTimeForDisplay(t.triage_date)}
                    </div>
                  </div>
                  <div className="text-xs text-[#172033]">
                    <div><strong>Clinician Decision: </strong>{t.human_decision} by {t.staff_name} ({t.staff_role})</div>
                    {t.override_reason && (
                      <div className="text-[#D97706] mt-0.5"><strong>Override Reason: </strong>{t.override_reason}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 8: CLINICAL NOTES */}
      {activeTab === 'notes' && (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#172033]">Clinical & Nursing Notes</h2>
              <p className="text-xs text-[#64748B]">Physician and nurse bedside observation trail</p>
            </div>
            <button
              onClick={() => {
                setModalError(null);
                setShowAddNoteModal(true);
              }}
              className="clinical-btn-primary h-8 text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Note</span>
            </button>
          </div>

          {clinical_notes.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8]">No clinical notes documented yet.</div>
          ) : (
            <div className="space-y-2">
              {clinical_notes.map((n) => (
                <div key={n.id} className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
                  <div className="flex justify-between text-xs text-[#64748B]">
                    <span className="font-bold text-[#172033]">{n.author_name} ({n.author_role})</span>
                    <span>{formatDateTimeForDisplay(n.created_at)}</span>
                  </div>
                  <p className="text-[#172033] text-xs leading-relaxed whitespace-pre-wrap">{n.note_content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showAddMedHistoryModal && (
        <div className="fixed inset-0 z-50 bg-[#172033]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-[#CBD5E1] rounded-lg shadow-modal p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#172033]">Add Medical Condition / Surgery</h3>
            {modalError && (
              <div className="p-2.5 bg-[#FDECEC] border border-[#F3A6A6] rounded text-[#B91C1C] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span className="font-semibold">{modalError}</span>
              </div>
            )}
            <form onSubmit={handleAddMedHistory} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#172033] mb-1 font-semibold">Condition Name *</label>
                <input
                  type="text"
                  value={medCondition}
                  onChange={(e) => setMedCondition(e.target.value)}
                  placeholder="e.g. Hypertension"
                  className="clinical-input w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172033] mb-1 font-semibold">Type</label>
                  <select
                    value={medType}
                    onChange={(e) => setMedType(e.target.value)}
                    className="clinical-select w-full"
                  >
                    <option value="Chronic Condition">Chronic Condition</option>
                    <option value="Past Condition">Past Condition</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Allergy">Allergy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#172033] mb-1 font-semibold">Onset Year</label>
                  <input
                    type="text"
                    value={medDate}
                    onChange={(e) => setMedDate(e.target.value)}
                    placeholder="e.g. 2024"
                    className="clinical-input w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowAddMedHistoryModal(false)}
                  className="clinical-btn-secondary h-8 text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="clinical-btn-primary h-8 text-xs font-bold">
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLogVisitModal && (
        <div className="fixed inset-0 z-50 bg-[#172033]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-[#CBD5E1] rounded-lg shadow-modal p-5 space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-[#172033]">Log Clinical Encounter</h3>
            {modalError && (
              <div className="p-2.5 bg-[#FDECEC] border border-[#F3A6A6] rounded text-[#B91C1C] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span className="font-semibold">{modalError}</span>
              </div>
            )}
            <form onSubmit={handleLogVisit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172033] mb-1 font-semibold">Department *</label>
                  <select
                    value={visitDept}
                    onChange={(e) => setVisitDept(e.target.value)}
                    className="clinical-select w-full"
                  >
                    {hospitalDepts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#172033] mb-1 font-semibold">Physician *</label>
                  <input
                    type="text"
                    value={visitDoctor}
                    onChange={(e) => setVisitDoctor(e.target.value)}
                    placeholder="Dr. Rajesh Sharma"
                    className="clinical-input w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#172033] mb-1 font-semibold">Chief Complaint / Reason *</label>
                <input
                  type="text"
                  value={visitReason}
                  onChange={(e) => setVisitReason(e.target.value)}
                  placeholder="e.g. Follow-up consultation"
                  className="clinical-input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-[#172033] mb-1 font-semibold">Assessment *</label>
                <textarea
                  value={visitAssessment}
                  onChange={(e) => setVisitAssessment(e.target.value)}
                  placeholder="Clinical assessment..."
                  rows={2}
                  className="clinical-textarea w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-[#172033] mb-1 font-semibold">Clinical Notes *</label>
                <textarea
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Care plan, prescriptions..."
                  rows={2}
                  className="clinical-textarea w-full"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowLogVisitModal(false)}
                  className="clinical-btn-secondary h-8 text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="clinical-btn-primary h-8 text-xs font-bold">
                  Save Encounter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScheduleApptModal && (
        <div className="fixed inset-0 z-50 bg-[#172033]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-[#CBD5E1] rounded-lg shadow-modal p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#172033]">Schedule Patient Appointment</h3>
            {modalError && (
              <div className="p-2.5 bg-[#FDECEC] border border-[#F3A6A6] rounded text-[#B91C1C] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span className="font-semibold">{modalError}</span>
              </div>
            )}
            <form onSubmit={handleScheduleAppt} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172033] mb-1 font-semibold">Date *</label>
                  <input
                    type="date"
                    min={getTodayDateString()}
                    value={apptDate}
                    onChange={(e) => setApptDate(e.target.value)}
                    className="clinical-input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#172033] mb-1 font-semibold">Time *</label>
                  <input
                    type="text"
                    value={apptTime}
                    onChange={(e) => setApptTime(e.target.value)}
                    placeholder="10:30 AM"
                    className="clinical-input w-full"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172033] mb-1 font-semibold">Physician *</label>
                  <select
                    value={apptDoctor}
                    onChange={(e) => setApptDoctor(e.target.value)}
                    className="clinical-select w-full"
                    required
                  >
                    <option value="">Select Physician</option>
                    {hospitalDoctors.map((doc) => (
                      <option key={doc.id} value={doc.name}>{doc.name}</option>
                    ))}
                    {hospitalDoctors.length === 0 && <option value="Dr. Specialist On-Duty">Dr. Specialist On-Duty</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-[#172033] mb-1 font-semibold">Department</label>
                  <select
                    value={apptDept}
                    onChange={(e) => setApptDept(e.target.value)}
                    className="clinical-select w-full"
                  >
                    {hospitalDepts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowScheduleApptModal(false)}
                  className="clinical-btn-secondary h-8 text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="clinical-btn-primary h-8 text-xs font-bold">
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddNoteModal && (
        <div className="fixed inset-0 z-50 bg-[#172033]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-[#CBD5E1] rounded-lg shadow-modal p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#172033]">Append Clinical Note</h3>
            {modalError && (
              <div className="p-2.5 bg-[#FDECEC] border border-[#F3A6A6] rounded text-[#B91C1C] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span className="font-semibold">{modalError}</span>
              </div>
            )}
            <form onSubmit={handleAddNote} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#172033] mb-1 font-semibold">Observation *</label>
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Enter detailed bedside observation..."
                  rows={4}
                  className="clinical-textarea w-full"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(false)}
                  className="clinical-btn-secondary h-8 text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="clinical-btn-primary h-8 text-xs font-bold">
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
