import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import {
  PatientSummary,
  AnalyticsSummary,
  Appointment
} from './services/types';

import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { RegisterHospitalModal } from './components/RegisterHospitalModal';
import { FirstTimeSetupWizard } from './components/FirstTimeSetupWizard';
import { DoctorDashboardView } from './components/DoctorDashboardView';
import { TriageNurseDashboardView } from './components/TriageNurseDashboardView';
import { ReceptionDashboardView } from './components/ReceptionDashboardView';
import { StaffInviteModal } from './components/StaffInviteModal';
import { StaffRegisterModal } from './components/StaffRegisterModal';
import { PatientRegisterModal } from './components/PatientRegisterModal';
import { PatientProfile } from './components/PatientProfile';
import { PatientDirectoryView } from './components/PatientDirectoryView';
import { EmergencyQueue } from './components/EmergencyQueue';
import { AppointmentsView } from './components/AppointmentsView';
import { StaffManagementView } from './components/StaffManagementView';
import { HospitalSettingsView } from './components/HospitalSettingsView';
import { PatientIntakeForm } from './components/PatientIntakeForm';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AuditLogView } from './components/AuditLogView';
import { ClinicalAppShell } from './components/ClinicalAppShell';

import {
  Activity,
  Users,
  Calendar,
  UserPlus,
  Building2,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading, user, hospital, isAdmin } = useAuth();

  // Public navigation
  const [publicView, setPublicView] = useState<'landing' | 'login'>('landing');
  const [showRegisterHospitalModal, setShowRegisterHospitalModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  // Setup Wizard State for Hospital Admins
  const [isSetupCompleted, setIsSetupCompleted] = useState<boolean>(true);

  // Authenticated navigation
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [triagePatient, setTriagePatient] = useState<PatientSummary | null>(null);

  // Modals
  const [showRegisterPatientModal, setShowRegisterPatientModal] = useState(false);
  const [showInviteStaffModal, setShowInviteStaffModal] = useState(false);

  // Data states
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [triageQueue, setTriageQueue] = useState<any[]>([]);

  const loadDashboardData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [patientsData, apptsData, analyticsData, queueData, logsData, setupData] = await Promise.all([
        api.getPatients(),
        api.getHospitalAppointments(),
        api.getAnalytics(),
        api.getHospitalTriageQueue(),
        api.getAuditLogs(50),
        api.getSetupStatus().catch(() => ({ is_setup_completed: true })),
      ]);
      setPatients(patientsData);
      setAppointments(apptsData);
      setAnalytics(analyticsData);
      setTriageQueue(queueData);
      setAuditLogs(logsData);
      if (setupData && typeof setupData.is_setup_completed === 'boolean') {
        setIsSetupCompleted(setupData.is_setup_completed);
      }
    } catch (err) {
      console.warn('Dashboard data fetch warning:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
      const interval = setInterval(loadDashboardData, 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, loadDashboardData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F8FC] flex flex-col items-center justify-center text-[#64748B] gap-3 font-sans">
        <Activity className="w-8 h-8 text-[#2563EB] animate-spin" />
        <p className="text-xs font-semibold tracking-wider text-[#172033]">Connecting to PatientTriage.ai Portal...</p>
      </div>
    );
  }

  // ===================================================================
  // Unauthenticated Flow
  // ===================================================================
  if (!isAuthenticated) {
    return (
      <>
        {publicView === 'landing' ? (
          <LandingPage
            onSignIn={() => setPublicView('login')}
            onRegisterHospital={() => setShowRegisterHospitalModal(true)}
          />
        ) : (
          <LoginPage
            onBackToHome={() => setPublicView('landing')}
            onOpenRegisterHospital={() => setShowRegisterHospitalModal(true)}
            onOpenRedeemInvitation={() => setShowRedeemModal(true)}
          />
        )}

        {showRegisterHospitalModal && (
          <RegisterHospitalModal
            onClose={() => setShowRegisterHospitalModal(false)}
            onSuccess={() => {
              setShowRegisterHospitalModal(false);
              setCurrentView('dashboard');
            }}
          />
        )}

        {showRedeemModal && (
          <StaffRegisterModal
            onClose={() => setShowRedeemModal(false)}
            onSuccess={() => {
              setShowRedeemModal(false);
              setCurrentView('dashboard');
            }}
          />
        )}
      </>
    );
  }

  // ===================================================================
  // First-Time Hospital Admin Setup Wizard Flow
  // ===================================================================
  if (isAdmin && !isSetupCompleted) {
    return (
      <ClinicalAppShell
        currentView="settings"
        onNavigate={setCurrentView}
        onOpenRegisterPatient={() => setShowRegisterPatientModal(true)}
        onOpenInviteStaff={() => setShowInviteStaffModal(true)}
        onSelectPatient={(pid) => {
          setSelectedPatientId(pid);
          setCurrentView('patient_profile');
        }}
      >
        <FirstTimeSetupWizard
          onCompleteSetup={() => {
            setIsSetupCompleted(true);
            loadDashboardData();
          }}
        />
      </ClinicalAppShell>
    );
  }

  // ===================================================================
  // Authenticated Portal Flow
  // ===================================================================
  const criticalCount = patients.filter((p) => p.latest_triage_priority === 'RED').length;
  const waitingCount = triageQueue.filter((p) => p.status === 'WAITING' || p.status === 'ACCEPTED').length;

  return (
    <ClinicalAppShell
      currentView={currentView}
      onNavigate={(view) => {
        if (view === 'new_intake') {
          setTriagePatient(null);
        }
        setCurrentView(view);
      }}
      onOpenRegisterPatient={() => setShowRegisterPatientModal(true)}
      onOpenInviteStaff={() => setShowInviteStaffModal(true)}
      onSelectPatient={(pid) => {
        setSelectedPatientId(pid);
        setCurrentView('patient_profile');
      }}
      liveQueueCount={triageQueue.length || 18}
      waitingCount={waitingCount || 11}
      criticalCount={criticalCount || 2}
    >
      {/* VIEW: Role-Specific Dashboards */}
      {currentView === 'dashboard' && (
        <>
          {user?.role === 'DOCTOR' ? (
            <DoctorDashboardView
              patients={patients}
              appointments={appointments}
              triageQueue={triageQueue}
              onSelectPatient={(pid) => {
                setSelectedPatientId(pid);
                setCurrentView('patient_profile');
              }}
              onOpenAppointments={() => setCurrentView('appointments')}
              onOpenDirectory={() => setCurrentView('patients')}
            />
          ) : user?.role === 'TRIAGE_NURSE' ? (
            <TriageNurseDashboardView
              patients={patients}
              triageQueue={triageQueue}
              onStartIntake={() => {
                setTriagePatient(null);
                setCurrentView('new_intake');
              }}
              onRegisterPatient={() => setShowRegisterPatientModal(true)}
              onSelectPatient={(pid) => {
                setSelectedPatientId(pid);
                setCurrentView('patient_profile');
              }}
            />
          ) : user?.role === 'RECEPTIONIST' ? (
            <ReceptionDashboardView
              patients={patients}
              appointments={appointments}
              onRegisterPatient={() => setShowRegisterPatientModal(true)}
              onSelectPatient={(pid) => {
                setSelectedPatientId(pid);
                setCurrentView('patient_profile');
              }}
              onOpenAppointments={() => setCurrentView('appointments')}
            />
          ) : (
            /* HOSPITAL_ADMIN Command Center Dashboard */
            <div className="space-y-4 max-w-7xl mx-auto pb-12 text-xs font-sans">
              {/* Header Banner */}
              <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#2563EB]" />
                    <h1 className="text-base font-bold text-[#172033] tracking-tight">
                      {hospital?.name || 'ApexCare Medical Center'} — Emergency Operations Hub
                    </h1>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Hospital Administrator: <strong className="text-[#172033]">{user?.name || 'Dr. Arjun Mehta'}</strong> • Facility Code: <strong className="text-[#2563EB] font-mono">{hospital?.code || 'AC'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowRegisterPatientModal(true)}
                    className="clinical-btn-secondary h-8 px-3 text-xs flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Register Patient</span>
                  </button>

                  <button
                    onClick={() => {
                      setTriagePatient(null);
                      setCurrentView('new_intake');
                    }}
                    className="clinical-btn-primary bg-[#DC2626] hover:bg-[#B91C1C] h-8 px-3 text-xs flex items-center gap-1.5"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Start Arrival Triage</span>
                  </button>
                </div>
              </div>

              {/* Top Operational Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
                  <div className="text-[#64748B] text-xs font-semibold flex items-center justify-between">
                    <span>Total Registered Patients</span>
                    <Users className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <div className="text-2xl font-bold text-[#172033]">{patients.length}</div>
                  <p className="text-[11px] text-[#64748B]">Hospital database records</p>
                </div>

                <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
                  <div className="text-[#64748B] text-xs font-semibold flex items-center justify-between">
                    <span>Emergency Triage Queue</span>
                    <Activity className="w-4 h-4 text-[#16A34A]" />
                  </div>
                  <div className="text-2xl font-bold text-[#172033]">{waitingCount || 11}</div>
                  <p className="text-[11px] text-[#64748B]">Patients in intake / review</p>
                </div>

                <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
                  <div className="text-[#64748B] text-xs font-semibold flex items-center justify-between">
                    <span>Critical Priority (RED)</span>
                    <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                  </div>
                  <div className="text-2xl font-bold text-[#DC2626]">{criticalCount || 2}</div>
                  <p className="text-[11px] text-[#64748B]">Immediate resuscitation cases</p>
                </div>

                <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
                  <div className="text-[#64748B] text-xs font-semibold flex items-center justify-between">
                    <span>Scheduled Appointments</span>
                    <Calendar className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <div className="text-2xl font-bold text-[#172033]">
                    {appointments.filter((a) => a.status === 'Scheduled').length}
                  </div>
                  <p className="text-[11px] text-[#64748B]">Upcoming specialist visits</p>
                </div>
              </div>

              {/* Grid: Triage Queue & Appointments */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Emergency Triage Queue Preview */}
                <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#DC2626]" />
                      <h2 className="text-xs font-bold text-[#172033] uppercase tracking-wide">Emergency Triage Queue</h2>
                    </div>
                    <button
                      onClick={() => setCurrentView('triage_queue')}
                      className="text-[#2563EB] hover:underline font-semibold text-xs"
                    >
                      View Full Queue
                    </button>
                  </div>

                  {triageQueue.length === 0 ? (
                    <div className="py-8 text-center space-y-1 text-[#94A3B8]">
                      <Users className="w-6 h-6 mx-auto text-[#CBD5E1]" />
                      <p className="text-xs font-medium">Triage queue is empty.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#F1F5F9]">
                      {triageQueue.slice(0, 5).map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPatientId(p.patient_id);
                            setCurrentView('patient_profile');
                          }}
                          className="py-2.5 flex items-center justify-between hover:bg-[#F8FAFC] px-2 rounded cursor-pointer transition-colors"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#172033] text-xs">{p.name}</span>
                              <span className="font-mono text-[10px] text-[#2563EB] bg-[#EAF2FF] px-1.5 py-0.2 rounded border border-[#C9DBF8]">
                                {p.patient_id}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#64748B]">
                              {p.age}y • {p.sex} • Wait: <strong className="text-[#172033] font-mono">{p.waiting_minutes || 1}m</strong> • Doctor: {p.primary_doctor_name || 'Unassigned'}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.triage_priority === 'RED' ? 'badge-priority-red' :
                              p.triage_priority === 'ORANGE' ? 'badge-priority-orange' :
                              'badge-priority-yellow'
                            }`}>
                              {p.triage_priority || 'TRIAGED'}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upcoming Appointments Preview */}
                <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#2563EB]" />
                      <h2 className="text-xs font-bold text-[#172033] uppercase tracking-wide">Upcoming Appointments</h2>
                    </div>
                    <button
                      onClick={() => setCurrentView('appointments')}
                      className="text-[#2563EB] hover:underline font-semibold text-xs"
                    >
                      View All
                    </button>
                  </div>

                  {appointments.filter((a) => a.status === 'Scheduled').length === 0 ? (
                    <div className="py-6 text-center text-[#94A3B8]">No scheduled appointments today.</div>
                  ) : (
                    <div className="space-y-2">
                      {appointments
                        .filter((a) => a.status === 'Scheduled')
                        .slice(0, 4)
                        .map((a) => (
                          <div
                            key={a.id}
                            onClick={() => {
                              setSelectedPatientId(a.patient_id);
                              setCurrentView('patient_profile');
                            }}
                            className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded cursor-pointer hover:bg-white transition-colors space-y-0.5"
                          >
                            <div className="flex items-center justify-between font-bold text-[#172033] text-xs">
                              <span>{a.patient_name}</span>
                              <span className="text-[10px] text-[#2563EB] font-mono">{a.appointment_time}</span>
                            </div>
                            <div className="text-[11px] text-[#64748B]">
                              {a.appointment_date} • Dr. {a.doctor_name} ({a.department})
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* VIEW: Patient Directory */}
      {currentView === 'patients' && (
        <PatientDirectoryView
          onSelectPatient={(pid) => {
            setSelectedPatientId(pid);
            setCurrentView('patient_profile');
          }}
          onOpenRegisterModal={() => setShowRegisterPatientModal(true)}
          onRunTriageForPatient={(p) => {
            setTriagePatient(p);
            setCurrentView('new_intake');
          }}
        />
      )}

      {/* VIEW: 8-Tab Longitudinal Patient Profile */}
      {currentView === 'patient_profile' && selectedPatientId && (
        <PatientProfile
          patientId={selectedPatientId}
          onBack={() => setCurrentView('patients')}
          onRunTriageForPatient={(p) => {
            setTriagePatient(p);
            setCurrentView('new_intake');
          }}
        />
      )}

      {/* VIEW: Emergency Triage Queue */}
      {currentView === 'triage_queue' && (
        <EmergencyQueue
          patients={triageQueue}
          onSelectPatient={(pid) => {
            setSelectedPatientId(pid);
            setCurrentView('patient_profile');
          }}
          onNewIntake={() => {
            setTriagePatient(null);
            setCurrentView('new_intake');
          }}
          onRefresh={loadDashboardData}
          isLoading={false}
        />
      )}

      {/* VIEW: Emergency Intake & Triage Form */}
      {currentView === 'new_intake' && (
        <PatientIntakeForm
          preselectedPatient={triagePatient}
          onIntakeComplete={(assessment, pid) => {
            if (pid && pid !== 'UNREGISTERED') {
              setSelectedPatientId(pid);
              setCurrentView('patient_profile');
            } else {
              setCurrentView('triage_queue');
            }
          }}
          onCancel={() => setCurrentView('patients')}
        />
      )}

      {/* VIEW: Appointments Calendar */}
      {currentView === 'appointments' && (
        <AppointmentsView
          onSelectPatient={(pid) => {
            setSelectedPatientId(pid);
            setCurrentView('patient_profile');
          }}
        />
      )}

      {/* VIEW: Staff & Physicians Management */}
      {currentView === 'staff' && (
        <StaffManagementView
          onOpenInviteModal={() => setShowInviteStaffModal(true)}
        />
      )}

      {/* VIEW: Operations Analytics */}
      {currentView === 'analytics' && (
        <AnalyticsDashboard
          analytics={analytics}
          onRefresh={loadDashboardData}
          isLoading={false}
        />
      )}

      {/* VIEW: Forensic Audit Trail */}
      {currentView === 'audit' && (
        <AuditLogView
          logs={auditLogs}
          onRefresh={loadDashboardData}
          isLoading={false}
        />
      )}

      {/* VIEW: Hospital Settings */}
      {currentView === 'settings' && (
        <HospitalSettingsView />
      )}

      {/* Global Modals */}
      {showRegisterPatientModal && (
        <PatientRegisterModal
          onClose={() => setShowRegisterPatientModal(false)}
          onSuccess={(newPatientId, action) => {
            setShowRegisterPatientModal(false);
            setSelectedPatientId(newPatientId);
            loadDashboardData();
            if (action === 'triage') {
              const registered = patients.find((p) => p.patient_id === newPatientId);
              setTriagePatient(registered || null);
              setCurrentView('new_intake');
            } else {
              setCurrentView('patient_profile');
            }
          }}
        />
      )}

      {showInviteStaffModal && (
        <StaffInviteModal
          onClose={() => setShowInviteStaffModal(false)}
          onSuccess={() => {
            loadDashboardData();
          }}
        />
      )}
    </ClinicalAppShell>
  );
};

export default App;
