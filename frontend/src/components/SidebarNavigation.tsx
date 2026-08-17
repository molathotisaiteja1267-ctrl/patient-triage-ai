import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Clock,
  UserPlus,
  Users,
  Stethoscope,
  Calendar,
  UserCheck,
  BarChart3,
  FileSpreadsheet,
  Settings
} from 'lucide-react';

interface SidebarNavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  currentView,
  onNavigate,
}) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'triage_queue', label: 'Emergency Queue', icon: Clock },
    { id: 'new_intake', label: 'New Arrival', icon: UserPlus },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'staff', label: 'Staff', icon: UserCheck },
    { id: 'analytics', label: 'Reports', icon: BarChart3 },
    { id: 'audit', label: 'Audit Log', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-[230px] bg-white border-r border-[#E2E8F0] flex flex-col justify-between shrink-0 select-none min-h-[calc(100vh-64px)]">
      {/* Navigation List */}
      <div className="py-2">
        <div className="px-4 py-2 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
          Clinical Navigation
        </div>
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 h-11 text-xs font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-[#EAF2FF] text-[#2563EB] font-semibold border-l-[3px] border-[#2563EB]'
                    : 'text-[#172033] hover:bg-[#F8FAFC] hover:text-[#2563EB] border-l-[3px] border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role / Hospital Footnote */}
      <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] text-[11px] text-[#64748B]">
        <div className="flex items-center justify-between">
          <span className="font-medium text-[#172033]">Mode</span>
          <span className="font-mono text-[10px] text-[#2563EB] bg-[#EAF2FF] px-1.5 py-0.5 rounded border border-[#C9DBF8]">
            EHR LIVE
          </span>
        </div>
        <div className="mt-1 text-[10px] truncate">
          Logged in: <strong className="text-[#172033]">{user?.email}</strong>
        </div>
      </div>
    </aside>
  );
};
