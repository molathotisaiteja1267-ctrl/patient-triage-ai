import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StaffMember } from '../services/types';
import { formatDateForDisplay } from '../utils/dateUtils';
import {
  UserCheck,
  UserPlus,
  Mail,
  CheckCircle2,
  XCircle,
  Activity,
  RefreshCw
} from 'lucide-react';

interface StaffManagementViewProps {
  onOpenInviteModal: () => void;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({ onOpenInviteModal }) => {
  const { hospital, isAdmin } = useAuth();
  const toast = useToast();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const data = await api.getHospitalStaff();
      setStaffList(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load hospital staff.', 'Staff Directory Error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await api.toggleStaffStatus(userId, !currentStatus);
      toast.success(`Staff account ${!currentStatus ? 'activated' : 'deactivated'}.`, 'Status Updated');
      await loadStaff();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update staff status.', 'Update Error');
    }
  };

  const filteredStaff = staffList.filter((s) => {
    if (roleFilter !== 'ALL' && s.role !== roleFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans text-xs pb-12">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#2563EB]" />
            <h1 className="text-base font-bold text-[#172033] tracking-tight">Hospital Staff & Physicians</h1>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Organization: <strong className="text-[#172033]">{hospital?.name}</strong> ({hospital?.code}) • {staffList.length} Total Clinical Members
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadStaff}
            disabled={isLoading}
            className="clinical-btn-secondary h-8 px-2.5"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {isAdmin && (
            <button
              onClick={onOpenInviteModal}
              className="clinical-btn-primary h-8 px-3 text-xs flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Clinical Staff</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-3 flex flex-wrap items-center gap-2 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <span className="text-[#64748B] text-xs font-semibold">Filter by Role:</span>
        <div className="flex flex-wrap gap-1">
          {['ALL', 'DOCTOR', 'TRIAGE_NURSE', 'NURSE', 'RECEPTIONIST', 'HOSPITAL_ADMIN'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                roleFilter === r
                  ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                  : 'bg-[#F8FAFC] border border-[#CBD5E1] text-[#172033] hover:bg-[#EAF2FF]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        {isLoading ? (
          <div className="p-12 text-center text-[#64748B] flex flex-col items-center justify-center gap-2">
            <Activity className="w-6 h-6 animate-spin text-[#2563EB]" />
            <p>Loading staff directory...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-12 text-center text-[#94A3B8]">
            No staff members found matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase text-[11px]">
                  <th className="py-2.5 px-4">Staff Member</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Employee ID</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Joined Date</th>
                  {isAdmin && <th className="py-2.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#172033]">{staff.name}</div>
                      <div className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-[#94A3B8]" />
                        <span>{staff.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-[#EAF2FF] text-[#2563EB] border border-[#C9DBF8]">
                        {staff.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#172033] font-medium">{staff.department || 'General'}</td>
                    <td className="py-3 px-4 font-mono text-[#64748B]">{staff.employee_id || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1 w-fit ${
                        staff.is_active ? 'bg-[#EAF8EF] text-[#16A34A] border border-[#B7E4C7]' : 'bg-[#FDECEC] text-[#DC2626] border border-[#F3A6A6]'
                      }`}>
                        {staff.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{staff.is_active ? 'Active' : 'Deactivated'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">{formatDateForDisplay(staff.created_at)}</td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-right">
                        {staff.role !== 'HOSPITAL_ADMIN' && (
                          <button
                            onClick={() => handleToggleStatus(staff.id, staff.is_active)}
                            className={`px-2.5 py-1 rounded font-semibold text-[10px] border transition-colors ${
                              staff.is_active
                                ? 'bg-white text-[#DC2626] border-[#F3A6A6] hover:bg-[#FDECEC]'
                                : 'bg-[#EAF8EF] text-[#16A34A] border-[#B7E4C7] hover:bg-[#DCFCE7]'
                            }`}
                          >
                            {staff.is_active ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    )}
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
