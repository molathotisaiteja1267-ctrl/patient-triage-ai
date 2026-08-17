import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PatientSummary, PriorityLevel } from '../services/types';
import { formatDateForDisplay } from '../utils/dateUtils';
import {
  Users,
  Search,
  UserPlus,
  Calendar,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

interface PatientDirectoryViewProps {
  onSelectPatient: (patientId: string) => void;
  onOpenRegisterModal: () => void;
  onRunTriageForPatient: (patient: PatientSummary) => void;
}

export const PatientDirectoryView: React.FC<PatientDirectoryViewProps> = ({
  onSelectPatient,
  onOpenRegisterModal,
  onRunTriageForPatient,
}) => {
  const { hospital } = useAuth();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPatients({
        search: searchTerm.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        department: deptFilter !== 'ALL' ? deptFilter : undefined,
      });
      setPatients(data);
    } catch (err) {
      console.warn('Failed to load patients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [statusFilter, deptFilter]);

  useEffect(() => {
    api.getHospitalDepartments().then(setDepartments).catch(console.warn);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPatients();
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'RED':
        return 'badge-priority-red';
      case 'ORANGE':
        return 'badge-priority-orange';
      case 'YELLOW':
        return 'badge-priority-yellow';
      case 'GREEN':
        return 'badge-priority-green';
      case 'BLUE':
        return 'badge-priority-blue';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-300';
    }
  };

  return (
    <div className="space-y-3 max-w-7xl mx-auto font-sans text-xs pb-12">
      {/* Top Header & Search Controls */}
      <div className="bg-white border border-slate-200 rounded p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h1 className="text-sm font-bold text-slate-900">Hospital Patient Directory</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {hospital?.name || 'ApexCare Medical Center'} • {patients.length} Registered Patients
          </p>
        </div>

        <button
          onClick={onOpenRegisterModal}
          className="clinical-btn-primary h-8 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Register Patient</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, name, phone, or DOB..."
            className="clinical-input w-full pl-8 pr-16 h-8"
          />
          <button
            type="submit"
            className="absolute inset-y-1 right-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded text-[11px]"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium text-[11px]">Dept:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="clinical-select h-8 text-xs py-1"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="clinical-select h-8 text-xs py-1"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="WAITING">WAITING</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="OVERRIDDEN">OVERRIDDEN</option>
              <option value="IN_TREATMENT">IN_TREATMENT</option>
              <option value="DISCHARGED">DISCHARGED</option>
            </select>
          </div>

          <button
            onClick={loadPatients}
            disabled={isLoading}
            className="clinical-btn-secondary h-8 px-2"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <p>Loading patient directory...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-6 h-6 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-900 text-sm">No Patients Found</h3>
            <p className="text-slate-500 text-xs">
              No patient records match the criteria. Register a patient to start tracking care.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="clinical-table-header">
                  <th className="py-2.5 px-3">Patient ID</th>
                  <th className="py-2.5 px-3">Demographics</th>
                  <th className="py-2.5 px-3">Department & Physician</th>
                  <th className="py-2.5 px-3">Last Encounter</th>
                  <th className="py-2.5 px-3">Next Appointment</th>
                  <th className="py-2.5 px-3">Triage Acuity</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => onSelectPatient(p.patient_id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                      {p.patient_id}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {p.age}y • {p.sex} • Blood: <strong className="text-slate-700">{p.blood_group || '—'}</strong>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-800">{p.department || 'General Medicine'}</div>
                      <div className="text-[11px] text-slate-500">
                        Doctor: {p.primary_doctor_name || 'Unassigned'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {formatDateForDisplay(p.last_visit_date, '—')}
                    </td>
                    <td className="py-2.5 px-3">
                      {p.next_appointment_date ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDateForDisplay(p.next_appointment_date)}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">None scheduled</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {p.latest_triage_priority ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadge(p.latest_triage_priority)}`}>
                          {p.latest_triage_priority}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-0.5">
                        <span>Record</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
