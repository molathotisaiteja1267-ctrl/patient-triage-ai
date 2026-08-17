import React from 'react';
import { PatientSummary } from '../services/types';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  UserPlus,
  AlertTriangle,
  Users,
  ChevronRight,
  Clock
} from 'lucide-react';

interface TriageNurseDashboardViewProps {
  patients: PatientSummary[];
  triageQueue: any[];
  onStartIntake: () => void;
  onRegisterPatient: () => void;
  onSelectPatient: (patientId: string) => void;
}

export const TriageNurseDashboardView: React.FC<TriageNurseDashboardViewProps> = ({
  patients,
  triageQueue,
  onStartIntake,
  onRegisterPatient,
  onSelectPatient,
}) => {
  const { user, hospital } = useAuth();

  const criticalCases = triageQueue.filter((p) => p.triage_priority === 'RED');
  const urgentCases = triageQueue.filter((p) => p.triage_priority === 'ORANGE');
  const reassessmentCases = triageQueue.filter((p) => p.status === 'REASSESSMENT_REQUESTED');

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
            <Activity className="w-5 h-5 text-[#DC2626]" />
            <h1 className="text-base font-bold text-[#172033] tracking-tight">
              Emergency Triage Command Station
            </h1>
          </div>
          <p className="text-xs text-[#64748B]">
            Logged in as <strong className="text-[#172033]">{user?.name}</strong> • Triage Registered Nurse ({user?.department || 'Emergency Department'}) • {hospital?.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRegisterPatient}
            className="clinical-btn-secondary h-8 px-3 text-xs flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Register Patient</span>
          </button>
          <button
            onClick={onStartIntake}
            className="clinical-btn-primary bg-[#DC2626] hover:bg-[#B91C1C] h-8 px-3 text-xs flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Start Arrival Triage</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
          <div className="text-[#64748B] text-xs font-medium flex items-center justify-between">
            <span>Critical Priority (RED)</span>
            <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="text-2xl font-bold text-[#DC2626]">{criticalCases.length}</div>
          <p className="text-[11px] text-[#64748B]">Immediate resuscitation</p>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
          <div className="text-[#64748B] text-xs font-medium flex items-center justify-between">
            <span>Very Urgent (ORANGE)</span>
            <Activity className="w-4 h-4 text-[#F97316]" />
          </div>
          <div className="text-2xl font-bold text-[#F97316]">{urgentCases.length}</div>
          <p className="text-[11px] text-[#64748B]">Within 10-15 minutes</p>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
          <div className="text-[#64748B] text-xs font-medium flex items-center justify-between">
            <span>Active Queue Count</span>
            <Users className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl font-bold text-[#172033]">{triageQueue.length}</div>
          <p className="text-[11px] text-[#64748B]">In emergency care zone</p>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
          <div className="text-[#64748B] text-xs font-medium flex items-center justify-between">
            <span>Reassessment Required</span>
            <AlertTriangle className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-2xl font-bold text-[#D97706]">{reassessmentCases.length}</div>
          <p className="text-[11px] text-[#64748B]">Needs clinical re-evaluation</p>
        </div>
      </div>

      {/* Priority Triage Queue */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#DC2626]" />
            <h2 className="text-xs font-bold text-[#172033] uppercase tracking-wide">Live Emergency Triage Queue</h2>
          </div>
          <span className="text-[11px] text-[#64748B] font-mono">Sorted by Acuity & Wait Time</span>
        </div>

        {triageQueue.length === 0 ? (
          <div className="py-8 text-center text-[#94A3B8] space-y-2">
            <Users className="w-6 h-6 mx-auto text-[#CBD5E1]" />
            <p className="font-medium">Triage queue is currently clear.</p>
            <button
              onClick={onStartIntake}
              className="clinical-btn-primary bg-[#DC2626] hover:bg-[#B91C1C] h-8 text-xs"
            >
              Start Arrival Triage
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {triageQueue.map((p) => (
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
                    {p.status === 'REASSESSMENT_REQUESTED' && (
                      <span className="px-1.5 py-0.2 rounded bg-[#FFF7E6] text-[#D97706] border border-[#F5C451] text-[10px] font-bold">
                        REASSESSMENT REQUIRED
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    {p.age}y • {p.sex} • Wait: <strong className="text-[#172033] font-mono">{p.waiting_minutes || 1} min</strong> • Doctor: {p.primary_doctor_name || 'Unassigned'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${getPriorityBadge(p.triage_priority)}`}>
                    {p.triage_priority || 'TRIAGE'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
