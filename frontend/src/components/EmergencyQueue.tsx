import React, { useState, useEffect } from 'react';
import { PriorityLevel } from '../services/types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Clock,
  Search,
  ChevronRight,
  UserPlus,
  RefreshCw,
  Stethoscope,
  X,
  AlertTriangle
} from 'lucide-react';

interface EmergencyQueueProps {
  patients: any[];
  onSelectPatient: (patientId: string) => void;
  onNewIntake: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const EmergencyQueue: React.FC<EmergencyQueueProps> = ({
  patients,
  onSelectPatient,
  onNewIntake,
  onRefresh,
  isLoading,
}) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  // Doctor Assignment Modal State
  const [assignPatientId, setAssignPatientId] = useState<string | null>(null);
  const [assignDocName, setAssignDocName] = useState('');
  const [assignDocDept, setAssignDocDept] = useState('Emergency Medicine');
  const [hospitalDoctors, setHospitalDoctors] = useState<any[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    api.getHospitalDoctors().then(setHospitalDoctors).catch(console.warn);
  }, []);

  const handleAssignDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignPatientId || !assignDocName.trim()) return;
    setIsAssigning(true);
    try {
      await api.assignDoctor(assignPatientId, assignDocName.trim(), assignDocDept);
      toast.success(`Assigned Dr. ${assignDocName.trim()} to patient ${assignPatientId}`, 'Physician Assigned');
      setAssignPatientId(null);
      setAssignDocName('');
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign physician.', 'Assignment Error');
    } finally {
      setIsAssigning(false);
    }
  };

  // Stats calculation
  const totalCount = patients.length;
  const criticalCount = patients.filter((p) => (p.triage_priority || p.latest_triage_priority) === 'RED').length;
  const veryUrgentCount = patients.filter((p) => (p.triage_priority || p.latest_triage_priority) === 'ORANGE').length;
  const urgentCount = patients.filter((p) => (p.triage_priority || p.latest_triage_priority) === 'YELLOW').length;
  const routineCount = patients.filter((p) => {
    const prio = p.triage_priority || p.latest_triage_priority;
    return prio === 'GREEN' || prio === 'BLUE';
  }).length;

  // Filter patients
  const filteredPatients = patients.filter((p) => {
    const pid = p.patient_id || '';
    const name = p.name || '';
    const cc = p.chief_complaint || p.reason_for_visit || '';
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      searchTerm === '' ||
      pid.toLowerCase().includes(term) ||
      name.toLowerCase().includes(term) ||
      cc.toLowerCase().includes(term);

    const prio = p.triage_priority || p.latest_triage_priority || p.current_priority;
    let matchesFilter = true;
    if (selectedFilter === 'CRITICAL') matchesFilter = prio === 'RED';
    else if (selectedFilter === 'VERY_URGENT') matchesFilter = prio === 'ORANGE';
    else if (selectedFilter === 'URGENT') matchesFilter = prio === 'YELLOW';
    else if (selectedFilter === 'ROUTINE') matchesFilter = prio === 'GREEN' || prio === 'BLUE';
    else if (selectedFilter === 'WAITING') matchesFilter = p.status === 'WAITING' || p.status === 'Active';

    return matchesSearch && matchesFilter;
  });

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
    <div className="space-y-4 font-sans text-xs max-w-7xl mx-auto pb-12">
      {/* Header & Stats Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold text-[#172033] uppercase tracking-wide">
              EMERGENCY QUEUE
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Active patient prioritization, wait times, and clinical bay management
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="clinical-btn-secondary h-8 px-2.5"
              title="Refresh queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onNewIntake}
              className="clinical-btn-primary h-8 px-3 text-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Arrival Intake</span>
            </button>
          </div>
        </div>

        {/* Small Light-Colored Statistics Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          {/* Total */}
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedFilter === 'ALL'
                ? 'bg-[#EAF2FF] border-[#2563EB] ring-1 ring-[#2563EB]'
                : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-white'
            }`}
          >
            <div className="text-[10px] font-semibold text-[#64748B] uppercase">Total Active</div>
            <div className="text-lg font-bold text-[#172033] mt-0.5">{totalCount}</div>
          </button>

          {/* Critical */}
          <button
            onClick={() => setSelectedFilter('CRITICAL')}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedFilter === 'CRITICAL'
                ? 'bg-[#FDECEC] border-[#DC2626] ring-1 ring-[#DC2626]'
                : 'bg-[#FDECEC]/40 border-[#F3A6A6] hover:bg-[#FDECEC]'
            }`}
          >
            <div className="text-[10px] font-semibold text-[#DC2626] uppercase">Critical (RED)</div>
            <div className="text-lg font-bold text-[#DC2626] mt-0.5">{criticalCount}</div>
          </button>

          {/* Very Urgent */}
          <button
            onClick={() => setSelectedFilter('VERY_URGENT')}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedFilter === 'VERY_URGENT'
                ? 'bg-[#FFF1E8] border-[#F97316] ring-1 ring-[#F97316]'
                : 'bg-[#FFF1E8]/40 border-[#FDBA74] hover:bg-[#FFF1E8]'
            }`}
          >
            <div className="text-[10px] font-semibold text-[#F97316] uppercase">Very Urgent (ORANGE)</div>
            <div className="text-lg font-bold text-[#F97316] mt-0.5">{veryUrgentCount}</div>
          </button>

          {/* Urgent */}
          <button
            onClick={() => setSelectedFilter('URGENT')}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedFilter === 'URGENT'
                ? 'bg-[#FFF7E6] border-[#F59E0B] ring-1 ring-[#F59E0B]'
                : 'bg-[#FFF7E6]/40 border-[#F5C451] hover:bg-[#FFF7E6]'
            }`}
          >
            <div className="text-[10px] font-semibold text-[#D97706] uppercase">Urgent (YELLOW)</div>
            <div className="text-lg font-bold text-[#D97706] mt-0.5">{urgentCount}</div>
          </button>

          {/* Routine */}
          <button
            onClick={() => setSelectedFilter('ROUTINE')}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedFilter === 'ROUTINE'
                ? 'bg-[#EAF8EF] border-[#16A34A] ring-1 ring-[#16A34A]'
                : 'bg-[#EAF8EF]/40 border-[#B7E4C7] hover:bg-[#EAF8EF]'
            }`}
          >
            <div className="text-[10px] font-semibold text-[#16A34A] uppercase">Routine (GREEN)</div>
            <div className="text-lg font-bold text-[#16A34A] mt-0.5">{routineCount}</div>
          </button>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient ID, name, or complaint..."
            className="clinical-input w-full pl-9 h-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <span className="text-[#64748B]">Showing: </span>
          <span className="font-semibold text-[#172033]">{filteredPatients.length} patients</span>
        </div>
      </div>

      {/* Main Queue Table */}
      {patients.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-12 text-center space-y-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <Clock className="w-8 h-8 text-[#94A3B8] mx-auto" />
          <div>
            <h3 className="font-bold text-[#172033] text-sm">No Patients Currently in Queue</h3>
            <p className="text-[#64748B] text-xs mt-0.5">
              Patients evaluated during emergency arrival intake will appear in this active queue.
            </p>
          </div>
          <button
            onClick={onNewIntake}
            className="clinical-btn-primary inline-flex items-center gap-1.5 h-8 text-xs mt-1"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Start Arrival Intake</span>
          </button>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-8 text-center text-[#64748B] text-xs space-y-2 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <p>No patients match the active filter criteria.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedFilter('ALL');
            }}
            className="text-[#2563EB] hover:underline font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase text-[11px]">
                  <th className="py-2.5 px-4">Patient ID</th>
                  <th className="py-2.5 px-4">Patient</th>
                  <th className="py-2.5 px-4">Arrival</th>
                  <th className="py-2.5 px-4">Priority</th>
                  <th className="py-2.5 px-4">Wait Time</th>
                  <th className="py-2.5 px-4">Assigned Staff</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredPatients.map((patient) => {
                  const prio = patient.triage_priority || patient.latest_triage_priority || patient.current_priority || 'UNASSIGNED';
                  const pid = patient.patient_id;

                  return (
                    <tr
                      key={patient.id || pid}
                      onClick={() => onSelectPatient(pid)}
                      className="hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                    >
                      {/* Patient ID */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-[#2563EB]">
                        {pid}
                      </td>

                      {/* Patient Name & Demographics */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-[#172033]">{patient.name}</div>
                        <div className="text-[11px] text-[#64748B]">
                          {patient.age}y • {patient.sex}
                        </div>
                      </td>

                      {/* Arrival / Route */}
                      <td className="py-3 px-4 max-w-xs truncate">
                        <div className="font-medium text-[#172033] truncate">
                          {patient.recommended_route || patient.chief_complaint || 'Rapid Clinical Review'}
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${getPriorityBadgeClass(prio)}`}>
                          {prio}
                        </span>
                      </td>

                      {/* Wait Time */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono">
                        <div className="flex items-center gap-1 font-semibold text-[#172033]">
                          <Clock className="w-3 h-3 text-[#94A3B8]" />
                          <span>{patient.waiting_minutes || 1} min</span>
                        </div>
                      </td>

                      {/* Assigned Staff */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {patient.primary_doctor_name ? (
                          <div className="font-medium text-[#172033] flex items-center gap-1">
                            <Stethoscope className="w-3.5 h-3.5 text-[#64748B]" />
                            <span>{patient.primary_doctor_name}</span>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssignPatientId(pid);
                            }}
                            className="px-2 py-0.5 bg-[#F8FAFC] hover:bg-[#EAF2FF] text-[#2563EB] rounded border border-[#CBD5E1] hover:border-[#C9DBF8] text-[10px] flex items-center gap-1 font-medium"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Assign</span>
                          </button>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                          {patient.status || 'Active'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPatient(pid);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-[#F8FAFC] text-[#172033] border border-[#CBD5E1] rounded text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Open Record</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Assign Physician Modal */}
      {assignPatientId && (
        <div className="fixed inset-0 z-50 bg-[#172033]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-[#CBD5E1] rounded-lg shadow-modal p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h3 className="text-sm font-bold text-[#172033]">Assign Physician to {assignPatientId}</h3>
              <button onClick={() => setAssignPatientId(null)} className="text-[#64748B] hover:text-[#172033]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignDoctor} className="space-y-3">
              <div>
                <label className="block text-[#172033] mb-1 font-semibold">Select Physician *</label>
                <select
                  value={assignDocName}
                  onChange={(e) => setAssignDocName(e.target.value)}
                  className="clinical-select w-full"
                  required
                >
                  <option value="">-- Choose Doctor --</option>
                  {hospitalDoctors.map((doc) => (
                    <option key={doc.id} value={doc.name}>
                      {doc.name} ({doc.department || 'Emergency Medicine'})
                    </option>
                  ))}
                  {hospitalDoctors.length === 0 && (
                    <option value="Dr. Priya Sharma">Dr. Priya Sharma (Emergency Medicine)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[#172033] mb-1 font-semibold">Department</label>
                <input
                  type="text"
                  value={assignDocDept}
                  onChange={(e) => setAssignDocDept(e.target.value)}
                  className="clinical-input w-full"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setAssignPatientId(null)}
                  className="clinical-btn-secondary h-9 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning || !assignDocName}
                  className="clinical-btn-primary h-9 text-xs font-bold"
                >
                  {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
