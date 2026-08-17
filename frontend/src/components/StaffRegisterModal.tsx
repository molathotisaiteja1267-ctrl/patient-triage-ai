import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  UserCheck,
  X,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  Building2,
  Lock
} from 'lucide-react';

interface StaffRegisterModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const StaffRegisterModal: React.FC<StaffRegisterModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { refreshUser } = useAuth();
  const [token, setToken] = useState('');
  const [invitationInfo, setInvitationInfo] = useState<any | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleVerifyToken = async () => {
    if (!token.trim()) return;
    setIsLoadingToken(true);
    setErrorMsg(null);
    try {
      const data = await api.getInvitation(token.trim());
      setInvitationInfo(data);
      setName(data.name || '');
      setEmail(data.email || '');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired invitation token.');
    } finally {
      setIsLoadingToken(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await api.registerStaff({
        token: token.trim(),
        name: name.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
      });
      localStorage.setItem('auth_token', res.access_token);
      await refreshUser();
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Accept Staff Invitation</h2>
              <p className="text-xs text-slate-400">
                Activate your clinical account using your organization invitation token.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/60 border-b border-red-500/40 text-red-300 text-xs flex items-center gap-2 px-6">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-6 space-y-4 text-xs">
          {!invitationInfo ? (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Invitation Token</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="inv_..."
                    className="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyToken}
                    disabled={isLoadingToken || !token.trim()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shrink-0"
                  >
                    {isLoadingToken ? 'Verifying...' : 'Verify Token'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <div className="text-[11px] text-slate-400">Hospital Organization</div>
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>{invitationInfo.hospital_name}</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-700/50">
                    {invitationInfo.hospital_code}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Assigned Role: <span className="text-emerald-400 font-bold">{invitationInfo.role}</span> ({invitationInfo.department || 'General'})
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Create Password *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/40 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Registering...' : 'Complete Registration & Sign In'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
