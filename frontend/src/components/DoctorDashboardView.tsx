import React from 'react';
import { PatientSummary, Appointment } from '../services/types';
import { useAuth } from '../context/AuthContext';
import {
  Stethoscope,
  Users,
  Calendar,
  Activity,
  AlertTriangle,
  ChevronRight,
  ClipboardList
} from 'lucide-react';

interface DoctorDashboardViewProps {
  patients: PatientSummary[];
  appointments: Appointment[];
  triageQueue: any[];
  onSelectPatient: (patientId: string) => void;
  onOpenAppointments: () => void;
  onOpenDirectory: () => void;
}

export const DoctorDashboardView: React.FC<DoctorDashboardViewProps> = ({
  patients,
  appointments,
  triageQueue,
  onSelectPatient,
  onOpenAppointments,
  onOpenDirectory,
}) => {
  const { user, hospital } = useAuth();

  const myPatients = patients.filter((p) => p.primary_doctor_name === user?.name || p.primary_doctor_id === user?.id);
  const myAppointments = appointments.filter((a) => a.doctor_name === user?.name || a.doctor_id === user?.id);
  const emergencyWaiting = triageQueue.filter((p) => p.status === 'WAITING' || p.status === 'ACCEPTED');
  const reassessmentNeeded = triageQueue.filter((p) => p.status === 'REASSESSMENT_REQUESTED');

  const getPriorityBadge = (priority?: string) => {
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
    <div className="space-y-4 max-w-7xl mx-auto pb-12 font-sans text-xs">
      {/* Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-[#2563EB]" />
            <h1 className="text-base font-bold text-[#172033] tracking-tight">
              Physician Consultation & Clinical Hub
            </h1>
          </div>
          <p className="text-xs text-[#64748B]">
            Welcome, <strong className="text-[#172033]">{user?.name}</strong> • Attending Physician ({user?.department || 'Emergency Medicine'}) • {hospital?.name}
          </p>
        </div>

        <button
          onClick={onOpenDirectory}
          className="clinical-btn-secondary h-8 px-3 text-xs flex items-center gap-1.5"
        >
          <Users className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Patient Directory</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
          <div className="text-[#64748B] text-xs font-medium flex items-center justify-between">
            <span>My Assigned Patients</span>
            <Users className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl font-bold text-[#172033]">{myPatients.length}</div>
          <p className="text-[11px] text-[#64748B]">Under your primary clinical care</p>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
          <div className="text-[#64748B] text-xs font-medium flex items-center justify-between">
            <span>Upcoming Consultations</span>
            <Calendar className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl font-bold text-[#172033]">
            {myAppointments.filter((a) => a.status === 'Scheduled').length}
          </div>
          <p className="text-[11px] text-[#64748B]">Scheduled consultations</p>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
          <div className="text-[#64748B] text-xs font-medium flex items-center justify-between">
            <span>Waiting in Emergency</span>
            <Activity className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-2xl font-bold text-[#D97706]">{emergencyWaiting.length}</div>
          <p className="text-[11px] text-[#64748B]">Patients in triage queue</p>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
          <div className="text-[#64748B] text-xs font-medium flex items-center justify-between">
            <span>Reassessment Required</span>
            <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="text-2xl font-bold text-[#DC2626]">{reassessmentNeeded.length}</div>
          <p className="text-[11px] text-[#64748B]">Awaiting re-evaluation</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My Assigned Patients */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#2563EB]" />
              <h2 className="text-xs font-bold text-[#172033] uppercase tracking-wide">My Assigned Patients</h2>
            </div>
            <span className="text-[11px] text-[#64748B] font-semibold">{myPatients.length} Active</span>
          </div>

          {myPatients.length === 0 ? (
            <div className="py-8 text-center text-[#94A3B8] space-y-1">
              <Users className="w-6 h-6 mx-auto text-[#CBD5E1]" />
              <p>No patients currently assigned to your care.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {myPatients.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectPatient(p.patient_id)}
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
                      {p.age}y • {p.sex} • Blood: {p.blood_group || 'Unknown'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.latest_triage_priority && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadge(p.latest_triage_priority)}`}>
                        {p.latest_triage_priority}
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emergency Triage Queue */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#DC2626]" />
              <h2 className="text-xs font-bold text-[#172033] uppercase tracking-wide">Emergency Patients Waiting</h2>
            </div>
            <span className="text-[11px] text-[#DC2626] font-bold font-mono">{emergencyWaiting.length} In Queue</span>
          </div>

          {emergencyWaiting.length === 0 ? (
            <div className="py-8 text-center text-[#94A3B8]">No patients currently waiting in emergency triage.</div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {emergencyWaiting.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectPatient(p.patient_id)}
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
                      Wait: <strong className="text-[#172033] font-mono">{p.waiting_minutes || 1} min</strong> • Route: {p.recommended_route || 'Rapid Evaluation'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadge(p.triage_priority)}`}>
                      {p.triage_priority || 'TRIAGED'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
