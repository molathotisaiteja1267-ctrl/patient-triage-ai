import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { PatientSummary } from '../services/types';
import {
  Activity,
  Building2,
  Search,
  UserPlus,
  LogOut,
  User,
  X
} from 'lucide-react';

interface NavbarProps {
  onOpenRegisterPatient: () => void;
  onOpenInviteStaff: () => void;
  onSelectPatient: (patientId: string) => void;
  liveQueueCount?: number;
  waitingCount?: number;
  criticalCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenRegisterPatient,
  onOpenInviteStaff,
  onSelectPatient,
  liveQueueCount = 18,
  waitingCount = 11,
  criticalCount = 2,
}) => {
  const { user, hospital, logout, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PatientSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const patients = await api.getPatients({ search: searchTerm.trim() });
        setSearchResults(patients.slice(0, 6));
        setShowDropdown(true);
      } catch (err) {
        console.warn('Quick search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 h-14 flex items-center justify-between font-sans text-xs shadow-sm">
      {/* LEFT: Hospital & System Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-bold text-slate-900 text-sm tracking-tight">PatientTriage.ai</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 font-medium text-xs">Emergency Department</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span>{hospital?.name || 'ApexCare Medical Center'}</span>
              <span className="font-mono text-[10px] text-slate-400 font-semibold">({hospital?.code || 'AC'})</span>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER: Live Emergency Queue Stats */}
      <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 bg-slate-50 border border-slate-200 rounded">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium text-[11px]">Live Queue:</span>
          <span className="font-mono font-bold text-slate-900 text-xs">{liveQueueCount}</span>
        </div>
        <span className="text-slate-300">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium text-[11px]">Waiting:</span>
          <span className="font-mono font-bold text-slate-900 text-xs">{waitingCount}</span>
        </div>
        <span className="text-slate-300">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium text-[11px]">Critical:</span>
          <span className="font-mono font-bold text-red-600 text-xs">{criticalCount}</span>
        </div>
      </div>

      {/* RIGHT: Search, Register, User Info & Logout */}
      <div className="flex items-center gap-3">
        {/* Quick Search */}
        <div className="relative hidden md:block w-56">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            placeholder="Search patient ID / name..."
            className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setShowDropdown(false);
              }}
              className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Autocomplete Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg overflow-hidden z-50 divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectPatient(p.patient_id);
                    setShowDropdown(false);
                    setSearchTerm('');
                  }}
                  className="w-full p-2.5 text-left hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{p.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {p.patient_id} • {p.age}y ({p.sex})
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    {p.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Register Patient Button */}
        <button
          onClick={onOpenRegisterPatient}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Register Patient</span>
        </button>

        {/* User Badge */}
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200 text-xs">
          <div className="text-right">
            <div className="font-semibold text-slate-900 leading-tight">{user?.name || 'Dr. Arjun Mehta'}</div>
            <div className="text-[10px] text-slate-500 font-medium leading-tight">
              {user?.role === 'HOSPITAL_ADMIN' ? 'Hospital Administrator' : user?.role || 'Clinician'}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
