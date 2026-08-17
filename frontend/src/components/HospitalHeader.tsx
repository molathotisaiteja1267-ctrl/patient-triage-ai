import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, UserPlus, LogOut, User, Building2, Search } from 'lucide-react';

interface HospitalHeaderProps {
  onOpenRegisterPatient?: () => void;
  onOpenInviteStaff?: () => void;
  onSelectPatient?: (patientId: string) => void;
  liveQueueCount?: number;
  waitingCount?: number;
  criticalCount?: number;
}

export const HospitalHeader: React.FC<HospitalHeaderProps> = ({
  onOpenRegisterPatient,
  onOpenInviteStaff,
  onSelectPatient,
  liveQueueCount = 18,
  waitingCount = 11,
  criticalCount = 2,
}) => {
  const { user, hospital, logout } = useAuth();
  const [patientSearch, setPatientSearch] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (patientSearch.trim() && onSelectPatient) {
      onSelectPatient(patientSearch.trim().toUpperCase());
      setPatientSearch('');
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'HOSPITAL_ADMIN':
        return 'Hospital Administrator';
      case 'DOCTOR':
        return 'Attending Physician';
      case 'TRIAGE_NURSE':
        return 'Emergency Triage Nurse';
      case 'RECEPTIONIST':
        return 'Front Desk Reception';
      default:
        return 'Clinical Staff';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 select-none shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
      {/* LEFT: Logo & System Identifier */}
      <div className="flex items-center gap-3 min-w-[240px]">
        <div className="w-9 h-9 rounded-lg bg-[#EAF2FF] border border-[#C9DBF8] flex items-center justify-center text-[#2563EB]">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-[#172033] tracking-tight flex items-center gap-1.5">
            <span>PatientTriage.ai</span>
            <span className="text-[10px] font-semibold text-[#2563EB] bg-[#EAF2FF] px-1.5 py-0.5 rounded border border-[#C9DBF8]">
              ED v2.4
            </span>
          </div>
          <p className="text-[11px] text-[#64748B]">Emergency Department Workstation</p>
        </div>
      </div>

      {/* CENTER: Active Hospital & Department */}
      <div className="hidden md:flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
          <Building2 className="w-4 h-4 text-[#2563EB]" />
          <div>
            <span className="font-semibold text-[#172033]">{hospital?.name || 'ApexCare Medical Center'}</span>
            <span className="text-[#64748B] ml-1.5 font-mono text-[11px]">({hospital?.code || 'AC'})</span>
          </div>
          <span className="text-[#CBD5E1]">|</span>
          <span className="text-[#64748B] font-medium">Emergency Department</span>
        </div>

        {/* Quick Patient Search */}
        {onSelectPatient && (
          <form onSubmit={handleSearch} className="relative w-48">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Search ID (e.g. AC-001)..."
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-md pl-8 pr-2 py-1 text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white"
            />
          </form>
        )}
      </div>

      {/* RIGHT: Status, User Credentials & Actions */}
      <div className="flex items-center gap-3">
        {/* System Online Status */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-[#EAF8EF] border border-[#B7E4C7] rounded-md text-[11px] font-medium text-[#16A34A]">
          <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
          <span>System Online</span>
        </div>

        {/* Register Patient Button */}
        {onOpenRegisterPatient && (
          <button
            onClick={onOpenRegisterPatient}
            className="clinical-btn-primary h-8 px-3 text-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Register Patient</span>
          </button>
        )}

        {/* User Card */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-full bg-[#EAF2FF] border border-[#C9DBF8] text-[#2563EB] flex items-center justify-center text-xs font-bold">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-[#172033] leading-tight">{user?.name || 'Dr. Arjun Mehta'}</div>
            <div className="text-[10px] text-[#64748B] leading-tight">{getRoleLabel(user?.role)}</div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-[#FDECEC] rounded-md transition-colors ml-1"
            title="Sign out of hospital system"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
