import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Activity,
  UserPlus,
  Calendar,
  UserCheck,
  BarChart3,
  Clock,
  Settings,
  Stethoscope
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ALL'] },
    { id: 'triage_queue', label: 'Emergency Queue', icon: Activity, roles: ['ALL'] },
    { id: 'new_intake', label: 'New Arrival', icon: UserPlus, roles: ['ALL'] },
    { id: 'patients', label: 'Patients', icon: Users, roles: ['ALL'] },
    { id: 'appointments', label: 'Appointments', icon: Calendar, roles: ['ALL'] },
    { id: 'staff', label: 'Staff & Clinicians', icon: UserCheck, roles: ['HOSPITAL_ADMIN', 'DOCTOR'] },
    { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3, roles: ['HOSPITAL_ADMIN', 'DOCTOR', 'TRIAGE_NURSE'] },
    { id: 'audit', label: 'Audit Log', icon: Clock, roles: ['HOSPITAL_ADMIN', 'DOCTOR'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['HOSPITAL_ADMIN'] },
  ];

  const userRole = user?.role || 'STAFF';
  const visibleItems = navItems.filter((item) => {
    if (item.roles.includes('ALL')) return true;
    return item.roles.includes(userRole) || userRole === 'PLATFORM_ADMIN';
  });

  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0 font-sans text-xs select-none">
      <div className="p-3 space-y-0.5 flex-1">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Hospital Navigation
        </div>

        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors rounded ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-normal'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer: System Status */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span className="font-semibold text-slate-700">Hospital Online</span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono truncate">
          ApexCare ED • v2.6.4
        </div>
      </div>
    </aside>
  );
};
