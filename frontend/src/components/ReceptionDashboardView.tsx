import React from 'react';
import { PatientSummary, Appointment } from '../services/types';
import { useAuth } from '../context/AuthContext';
import { formatDateForDisplay } from '../utils/dateUtils';
import {
  UserPlus,
  Users,
  Calendar,
  ChevronRight,
  Clock,
  Building2
} from 'lucide-react';

interface ReceptionDashboardViewProps {
  patients: PatientSummary[];
  appointments: Appointment[];
  onRegisterPatient: () => void;
  onSelectPatient: (patientId: string) => void;
  onOpenAppointments: () => void;
}

export const ReceptionDashboardView: React.FC<ReceptionDashboardViewProps> = ({
  patients,
  appointments,
  onRegisterPatient,
  onSelectPatient,
  onOpenAppointments,
}) => {
  const { user, hospital } = useAuth();

  const todayAppts = appointments.filter((a) => a.status === 'Scheduled');
  const recentPatients = patients.slice(0, 8);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 font-sans text-xs">
      {/* Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#2563EB]" />
            <h1 className="text-base font-bold text-[#172033] tracking-tight">
              Hospital Reception & Patient Intake Hub
            </h1>
          </div>
          <p className="text-xs text-[#64748B]">
            Logged in as <strong className="text-[#172033]">{user?.name}</strong> • Front Desk Receptionist • {hospital?.name}
          </p>
        </div>

        <button
          onClick={onRegisterPatient}
          className="clinical-btn-primary h-8 px-3 text-xs flex items-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
          <div className="text-[#64748B] text-xs font-medium flex items-center justify-between">
            <span>Total Registered Patients</span>
            <Users className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl font-bold text-[#172033]">{patients.length}</div>
          <p className="text-[11px] text-[#64748B]">In hospital database</p>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
          <div className="text-[#64748B] text-xs font-medium flex items-center justify-between">
            <span>Scheduled Consultations</span>
            <Calendar className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl font-bold text-[#172033]">{todayAppts.length}</div>
          <p className="text-[11px] text-[#64748B]">Appointments booked</p>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
          <div className="text-[#64748B] text-xs font-medium flex items-center justify-between">
            <span>Registration Sequence</span>
            <Clock className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="text-2xl font-bold text-[#16A34A]">{hospital?.code}-2026</div>
          <p className="text-[11px] text-[#64748B]">Deterministic sequential IDs</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Patients */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
            <h2 className="text-xs font-bold text-[#172033] uppercase tracking-wide">Recently Registered Patients</h2>
            <span className="text-[11px] text-[#64748B] font-semibold">{recentPatients.length} Patients</span>
          </div>

          {recentPatients.length === 0 ? (
            <div className="py-8 text-center text-[#94A3B8]">No patients registered yet.</div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {recentPatients.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectPatient(p.patient_id)}
                  className="py-2.5 flex items-center justify-between hover:bg-[#F8FAFC] px-2 rounded cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-bold text-[#172033] text-xs">{p.name}</div>
                    <div className="text-[11px] text-[#64748B]">
                      {p.patient_id} • {p.age}y ({p.sex}) • Phone: {p.phone || '—'}
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scheduled Appointments */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
            <h2 className="text-xs font-bold text-[#172033] uppercase tracking-wide">Upcoming Consultations</h2>
            <button
              onClick={onOpenAppointments}
              className="text-[#2563EB] hover:underline font-semibold text-xs"
            >
              View All
            </button>
          </div>

          {todayAppts.length === 0 ? (
            <div className="py-8 text-center text-[#94A3B8]">No appointments scheduled today.</div>
          ) : (
            <div className="space-y-2">
              {todayAppts.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  onClick={() => onSelectPatient(a.patient_id)}
                  className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded cursor-pointer hover:bg-white transition-colors"
                >
                  <div className="flex items-center justify-between font-bold text-[#172033]">
                    <span>{a.patient_name}</span>
                    <span className="text-[11px] text-[#2563EB] font-mono">{a.appointment_time}</span>
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    {formatDateForDisplay(a.appointment_date)} • Dr. {a.doctor_name} ({a.department})
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
