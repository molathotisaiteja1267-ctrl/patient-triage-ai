import React, { useState } from 'react';
import { api } from '../services/api';
import { RoleEnum, StaffInviteResponse } from '../services/types';
import {
  UserPlus,
  X,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Shield
} from 'lucide-react';

interface StaffInviteModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const StaffInviteModal: React.FC<StaffInviteModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleEnum>('DOCTOR');
  const [department, setDepartment] = useState('Emergency Medicine');
  const [employeeId, setEmployeeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<StaffInviteResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await api.inviteStaff({
        name: name.trim(),
        email: email.trim(),
        role,
        department: department.trim() || undefined,
        employee_id: employeeId.trim() || undefined,
      });
      setInviteResult(res);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate staff invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#172033]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-[#CBD5E1] rounded-lg shadow-modal overflow-hidden flex flex-col font-sans text-xs">
        {/* Header */}
        <div className="bg-[#F8FAFC] px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#EAF2FF] text-[#2563EB] border border-[#C9DBF8]">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#172033] tracking-tight">Invite Clinical / Hospital Staff</h2>
              <p className="text-[11px] text-[#64748B]">
                Grant role-based platform access within your hospital organization
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#64748B] hover:text-[#172033] rounded hover:bg-[#E2E8F0]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#FDECEC] border-b border-[#F3A6A6] text-[#DC2626] text-xs flex items-center gap-2 px-5">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {inviteResult ? (
          <div className="p-5 space-y-4 text-xs">
            <div className="p-3.5 bg-[#EAF8EF] border border-[#B7E4C7] rounded-lg text-[#16A34A] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">Staff Invitation Generated</div>
                <p className="text-xs text-[#172033] mt-0.5">
                  Invitation created for <strong>{inviteResult.name}</strong> ({inviteResult.role}) at {inviteResult.email}.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[#172033] font-semibold">Invitation Token</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteResult.token}
                  className="clinical-input flex-1 font-mono text-xs select-all bg-[#F8FAFC]"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(inviteResult.token)}
                  className="clinical-btn-secondary h-10 px-3 flex items-center gap-1 font-medium shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Provide this token to the staff member so they can set their password and sign in.
              </p>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex justify-end">
              <button
                onClick={onClose}
                className="clinical-btn-primary h-9 px-5 text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="p-5 space-y-3 text-xs">
            <div>
              <label className="block text-[#172033] font-semibold mb-1">Staff Member Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Ananya Rao, RN John Miller"
                className="clinical-input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-[#172033] font-semibold mb-1">Staff Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@hospital.org"
                className="clinical-input w-full"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#172033] font-semibold mb-1">Role / Permissions *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as RoleEnum)}
                  className="clinical-select w-full font-medium"
                >
                  <option value="DOCTOR">Doctor / Physician</option>
                  <option value="TRIAGE_NURSE">Triage Nurse (Acuity Assessment)</option>
                  <option value="NURSE">Staff Nurse</option>
                  <option value="RECEPTIONIST">Receptionist (Intake & Appointments)</option>
                  <option value="STAFF">General Hospital Staff</option>
                  <option value="HOSPITAL_ADMIN">Hospital Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-[#172033] font-semibold mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Emergency Medicine, Cardiology, etc."
                  className="clinical-input w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#172033] font-semibold mb-1">Employee / License ID (Optional)</label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. DOC-9821, RN-4412"
                className="clinical-input w-full"
              />
            </div>

            <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] text-[#64748B] flex items-start gap-2">
              <Shield className="w-3.5 h-3.5 text-[#2563EB] shrink-0 mt-0.5" />
              <span>
                Staff members will only have access to records within your hospital. Cross-hospital access is strictly isolated.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={onClose}
                className="clinical-btn-secondary h-9 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="clinical-btn-primary h-9 px-5 text-xs font-bold"
              >
                {isSubmitting ? 'Generating...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
