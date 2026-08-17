import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StaffMember } from '../services/types';
import { useToast } from '../context/ToastContext';
import {
  Building2,
  CheckCircle2,
  Users,
  Stethoscope,
  Plus,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  Activity,
  AlertTriangle,
  Mail,
  UserCheck
} from 'lucide-react';

interface FirstTimeSetupWizardProps {
  onCompleteSetup: () => void;
}

export const FirstTimeSetupWizard: React.FC<FirstTimeSetupWizardProps> = ({
  onCompleteSetup,
}) => {
  const { hospital, user } = useAuth();
  const toast = useToast();

  const [setupStep, setSetupStep] = useState<2 | 3 | 4>(2);
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [staffList, setStaffList] = useState<StaffMember[]>([]);

  // Quick Invite Form
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('DOCTOR');
  const [inviteDept, setInviteDept] = useState('Emergency Department');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);
  const [inviteErrorMsg, setInviteErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadSetupData();
  }, []);

  const loadSetupData = async () => {
    try {
      const [depts, staff] = await Promise.all([
        api.getHospitalDepartments(),
        api.getHospitalStaff(),
      ]);
      setDepartments(depts);
      setStaffList(staff);
      if (depts.length > 0 && !inviteDept) {
        setInviteDept(depts[0]);
      }
    } catch (err) {
      console.warn('Failed to load setup data', err);
    }
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    try {
      await api.addDepartment(newDeptName.trim());
      toast.success(`Department '${newDeptName.trim()}' added.`, 'Department Created');
      setNewDeptName('');
      await loadSetupData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add department', 'Setup Error');
    }
  };

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteErrorMsg('Staff name and email are required.');
      return;
    }
    setInviteErrorMsg(null);
    setIsInviting(true);

    try {
      const res = await api.inviteStaff({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        department: inviteDept,
      });
      setInviteSuccessMsg(`Invitation token generated for ${inviteName}. Link: ${window.location.origin}/register-staff?token=${res.token}`);
      setInviteName('');
      setInviteEmail('');
      await loadSetupData();
    } catch (err: any) {
      setInviteErrorMsg(err.message || 'Failed to invite staff.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleFinishSetup = async () => {
    try {
      await api.completeSetup();
      onCompleteSetup();
    } catch (err) {
      onCompleteSetup();
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-sans text-xs space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-black text-white tracking-tight">Complete Hospital Setup</h1>
          </div>
          <p className="text-slate-400 text-xs">
            Organization: <strong className="text-slate-200">{hospital?.name}</strong> (Code: <span className="text-blue-400 font-mono font-bold">{hospital?.code}</span>)
          </p>
        </div>

        <button
          onClick={handleFinishSetup}
          className="text-xs text-slate-400 hover:text-slate-200 border border-slate-800 px-3 py-1.5 rounded-xl hover:bg-slate-800"
        >
          Skip to Dashboard
        </button>
      </div>

      {/* Progress Track */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-bold">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px]">
            ✓
          </div>
          <span>Hospital Information</span>
        </div>

        <div className="w-12 h-[1px] bg-slate-800" />

        <div className={`flex items-center gap-2 ${setupStep === 2 ? 'text-blue-400 font-bold' : setupStep > 2 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
            setupStep > 2 ? 'bg-emerald-500/20 text-emerald-400' : setupStep === 2 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            {setupStep > 2 ? '✓' : '2'}
          </div>
          <span>Departments</span>
        </div>

        <div className="w-12 h-[1px] bg-slate-800" />

        <div className={`flex items-center gap-2 ${setupStep === 3 ? 'text-blue-400 font-bold' : setupStep > 3 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
            setupStep > 3 ? 'bg-emerald-500/20 text-emerald-400' : setupStep === 3 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            {setupStep > 3 ? '✓' : '3'}
          </div>
          <span>Staff Onboarding</span>
        </div>

        <div className="w-12 h-[1px] bg-slate-800" />

        <div className={`flex items-center gap-2 ${setupStep === 4 ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
            setupStep === 4 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            4
          </div>
          <span>Ready</span>
        </div>
      </div>

      {/* STEP 2: Departments */}
      {setupStep === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Step 2: Configure Clinical Departments</span>
            </h2>
            <p className="text-slate-400 text-[11px]">
              Set up the operational departments in your hospital where patients can be triaged and admitted.
            </p>
          </div>

          <form onSubmit={handleAddDept} className="flex gap-2">
            <input
              type="text"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="e.g. Intensive Care Unit (ICU) or Pediatrics"
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Department</span>
            </button>
          </form>

          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Departments ({departments.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {departments.map((dept) => (
                <div
                  key={dept}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-slate-200"
                >
                  <span className="font-semibold">{dept}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={() => setSetupStep(3)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-900/40"
            >
              <span>Next: Add Staff</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Add Staff */}
      {setupStep === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Step 3: Onboard Physicians & Triage Staff</span>
            </h2>
            <p className="text-slate-400 text-[11px]">
              Invite clinical staff to {hospital?.name}. Each staff member receives an activation token to set their password.
            </p>
          </div>

          {inviteErrorMsg && (
            <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl text-red-300 text-xs">
              {inviteErrorMsg}
            </div>
          )}

          {inviteSuccessMsg && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="break-all">{inviteSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleInviteStaff} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
            <div className="text-xs font-bold text-slate-200">Invite Clinical Staff Member</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Staff Name *</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Dr. Priya Sharma or Nisha Reddy"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Email Address *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="priya.sharma@apexcare.example"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Role *</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="DOCTOR">Doctor / Attending Physician</option>
                  <option value="TRIAGE_NURSE">Triage Nurse</option>
                  <option value="NURSE">Nurse</option>
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="HOSPITAL_ADMIN">Hospital Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Department</label>
                <select
                  value={inviteDept}
                  onChange={(e) => setInviteDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isInviting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-900/40"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{isInviting ? 'Generating Invitation...' : 'Send Invitation / Generate Token'}</span>
            </button>
          </form>

          {/* Current Staff List */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Onboarded Hospital Staff ({staffList.length})
            </div>
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl bg-slate-950 overflow-hidden">
              {staffList.map((s) => (
                <div key={s.id} className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200">{s.name}</span>
                    <span className="text-slate-500 text-[11px] ml-2">({s.email})</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-blue-400 font-mono font-bold text-[10px]">
                    {s.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setSetupStep(2)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setSetupStep(4)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-900/40"
            >
              <span>Next: Ready</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Ready */}
      {setupStep === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-white">Hospital setup complete.</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your hospital workspace <strong className="text-slate-200">{hospital?.name}</strong> is fully configured with active departments and staff access.
            </p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl max-w-md mx-auto text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Hospital Code:</span>
              <span className="font-mono font-bold text-blue-400">{hospital?.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active Departments:</span>
              <span className="font-bold text-white">{departments.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Onboarded Staff:</span>
              <span className="font-bold text-white">{staffList.length}</span>
            </div>
          </div>

          <button
            onClick={handleFinishSetup}
            className="w-full max-w-md py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 mx-auto transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4" />
            <span>Go to Hospital Dashboard</span>
          </button>
        </div>
      )}
    </div>
  );
};
