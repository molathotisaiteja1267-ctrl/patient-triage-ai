import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Appointment } from '../services/types';
import { useToast } from '../context/ToastContext';
import { formatDateForDisplay, formatTimeForDisplay } from '../utils/dateUtils';
import {
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  Activity,
  User,
  Stethoscope,
  Filter,
  RefreshCw
} from 'lucide-react';

interface AppointmentsViewProps {
  onSelectPatient: (patientId: string) => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({ onSelectPatient }) => {
  const toast = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const data = await api.getHospitalAppointments(statusFilter !== 'ALL' ? statusFilter : undefined);
      setAppointments(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load appointments schedule.', 'Calendar Error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [statusFilter]);

  const handleUpdateStatus = async (apptId: string, newStatus: string) => {
    try {
      await api.updateAppointment(apptId, { status: newStatus });
      toast.success(`Appointment status updated to ${newStatus}.`, 'Appointment Updated');
      await loadAppointments();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update appointment status.', 'Update Error');
    }
  };

  const filteredAppts = appointments.filter((a) => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        a.patient_name.toLowerCase().includes(term) ||
        a.patient_id.toLowerCase().includes(term) ||
        a.doctor_name.toLowerCase().includes(term) ||
        a.appointment_number.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans text-xs pb-12">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#2563EB]" />
            <h1 className="text-base font-bold text-[#172033] tracking-tight">Hospital Appointments Schedule</h1>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage patient consultation schedules, specialist visits, and follow-ups
          </p>
        </div>

        <button
          onClick={loadAppointments}
          disabled={isLoading}
          className="clinical-btn-secondary h-8 px-2.5 self-start sm:self-auto"
          title="Refresh schedule"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2">
          <span className="text-[#64748B] font-semibold text-xs flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </span>
          <div className="flex flex-wrap gap-1">
            {['ALL', 'Scheduled', 'Completed', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                    : 'bg-[#F8FAFC] border border-[#CBD5E1] text-[#172033] hover:bg-[#EAF2FF]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient, doctor, or appt #..."
            className="clinical-input w-full pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        {isLoading ? (
          <div className="p-12 text-center text-[#64748B] flex flex-col items-center justify-center gap-2">
            <Activity className="w-6 h-6 animate-spin text-[#2563EB]" />
            <p>Loading appointments calendar...</p>
          </div>
        ) : filteredAppts.length === 0 ? (
          <div className="p-12 text-center text-[#94A3B8]">
            No appointments found matching your search and filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase text-[11px]">
                  <th className="py-2.5 px-4">Appointment #</th>
                  <th className="py-2.5 px-4">Patient</th>
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th className="py-2.5 px-4">Physician</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredAppts.map((appt) => (
                  <tr key={appt.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#2563EB]">{appt.appointment_number}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onSelectPatient(appt.patient_id)}
                        className="font-bold text-[#172033] hover:text-[#2563EB] transition-colors text-left"
                      >
                        {appt.patient_name}
                      </button>
                      <div className="font-mono text-[10px] text-[#64748B]">{appt.patient_id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#172033]">{formatDateForDisplay(appt.appointment_date)}</div>
                      <div className="text-[11px] text-[#64748B]">{formatTimeForDisplay(appt.appointment_time)}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#172033]">{appt.doctor_name}</td>
                    <td className="py-3 px-4 text-[#64748B]">{appt.department}</td>
                    <td className="py-3 px-4 text-[#172033]">{appt.appointment_type}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded font-bold text-[10px] ${
                        appt.status === 'Scheduled' ? 'bg-[#EAF2FF] text-[#2563EB] border border-[#C9DBF8]' :
                        appt.status === 'Completed' ? 'bg-[#EAF8EF] text-[#16A34A] border border-[#B7E4C7]' :
                        'bg-[#FDECEC] text-[#DC2626] border border-[#F3A6A6]'
                      }`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {appt.status === 'Scheduled' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(appt.id, 'Completed')}
                            className="px-2 py-0.5 bg-[#EAF8EF] hover:bg-[#DCFCE7] text-[#16A34A] font-semibold rounded border border-[#B7E4C7] text-[10px]"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(appt.id, 'Cancelled')}
                            className="px-2 py-0.5 bg-[#FDECEC] hover:bg-[#FEE2E2] text-[#DC2626] font-semibold rounded border border-[#F3A6A6] text-[10px]"
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
    </div>
  );
};
