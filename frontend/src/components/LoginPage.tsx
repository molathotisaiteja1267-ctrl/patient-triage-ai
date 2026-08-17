import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Lock,
  Mail,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Activity
} from 'lucide-react';

interface LoginPageProps {
  onBackToHome: () => void;
  onOpenRegisterHospital: () => void;
  onOpenRedeemInvitation: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onBackToHome,
  onOpenRegisterHospital,
  onOpenRedeemInvitation,
}) => {
  const { login } = useAuth();
  const [hospitalCode, setHospitalCode] = useState('AC');
  const [email, setEmail] = useState('admin@apexcare.example');
  const [password, setPassword] = useState('ApexCare@2026!');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const code = hospitalCode.trim().toUpperCase();
    const userEmail = email.trim();

    if (!code) {
      setErrorMsg('Please enter your Hospital Code.');
      return;
    }
    if (!userEmail) {
      setErrorMsg('Please enter your staff email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    setIsSubmitting(true);

    try {
      await login(code, userEmail, password);
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Login error:', err);
      setIsSuccess(false);
      setErrorMsg(err.message || 'Invalid credentials or hospital code. Please check your login details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC] text-[#172033] flex flex-col justify-center items-center p-4 relative font-sans">
      {/* Top back button */}
      <button
        type="button"
        onClick={onBackToHome}
        className="absolute top-6 left-6 text-xs text-[#64748B] hover:text-[#172033] flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-[#CBD5E1] transition-colors shadow-xs"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Portal Overview</span>
      </button>

      <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-lg p-8 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-lg bg-[#EAF2FF] border border-[#C9DBF8] text-[#2563EB] mb-2">
            <Activity className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-[#172033] tracking-tight">PatientTriage.ai</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Hospital Clinical Decision-Support Portal
          </p>
          <div className="inline-block mt-2 px-2.5 py-0.5 rounded bg-[#F8FAFC] text-[10px] font-semibold text-[#64748B] border border-[#E2E8F0]">
            AI Recommends. Humans Decide.
          </div>
        </div>

        {isSuccess && (
          <div className="mb-4 p-3 rounded bg-[#EAF8EF] border border-[#B7E4C7] text-[#16A34A] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span className="font-semibold">Login successful. Accessing hospital workspace...</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded bg-[#FDECEC] border border-[#F3A6A6] text-[#DC2626] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[#172033] font-semibold mb-1 flex items-center justify-between">
              <span>Hospital Organization Code *</span>
              <span className="text-[10px] text-[#64748B] font-normal">e.g. AC, KI, MG</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                maxLength={6}
                value={hospitalCode}
                onChange={(e) => setHospitalCode(e.target.value.toUpperCase())}
                placeholder="AC"
                className="clinical-input w-full pl-9 uppercase font-mono font-bold tracking-widest text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[#172033] font-semibold mb-1">Staff Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@hospital.org"
                className="clinical-input w-full pl-9 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[#172033] font-semibold mb-1">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="clinical-input w-full pl-9 text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="clinical-btn-primary w-full h-10 text-sm font-bold mt-2 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isSubmitting ? 'Signing in...' : 'Sign In to Hospital Portal'}</span>
          </button>
        </form>

        {/* Footer Actions */}
        <div className="mt-5 pt-4 border-t border-[#F1F5F9] text-center space-y-2 text-xs text-[#64748B]">
          <div>
            <span>New healthcare facility? </span>
            <button
              type="button"
              onClick={onOpenRegisterHospital}
              className="text-[#2563EB] hover:underline font-semibold"
            >
              Register Hospital
            </button>
          </div>

          <div>
            <span>Received a staff invitation? </span>
            <button
              type="button"
              onClick={onOpenRedeemInvitation}
              className="text-[#16A34A] hover:underline font-semibold"
            >
              Accept Invitation
            </button>
          </div>
        </div>
      </div>

      {/* Persistent Disclaimer Footer */}
      <div className="mt-6 text-center max-w-lg text-[10px] text-[#64748B]">
        PatientTriage.ai is a clinical decision-support research prototype using synthetic data.
      </div>
    </div>
  );
};
