import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TokenResponse } from '../services/types';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  X,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  User,
  Mail,
  Lock,
  MapPin,
  Phone
} from 'lucide-react';

interface RegisterHospitalModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const RegisterHospitalModal: React.FC<RegisterHospitalModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { registerHospital, setSession } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STEP 1 — Hospital Information
  const [hospitalName, setHospitalName] = useState('ApexCare Medical Center');
  const [hospitalType, setHospitalType] = useState('Hospital');
  const [hospitalCode, setHospitalCode] = useState('AC');
  const [address, setAddress] = useState('100 Health Park Blvd');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [country, setCountry] = useState('India');
  const [contactEmail, setContactEmail] = useState('contact@apexcare.example');
  const [contactPhone, setContactPhone] = useState('+91 98765 43210');

  // STEP 2 — Administrator
  const [adminName, setAdminName] = useState('Dr. Arjun Mehta');
  const [adminEmail, setAdminEmail] = useState('admin@apexcare.example');
  const [password, setPassword] = useState('ApexCare@2026!');
  const [confirmPassword, setConfirmPassword] = useState('ApexCare@2026!');

  // Result state for Step 4
  const [createdAuthData, setCreatedAuthData] = useState<TokenResponse | null>(null);
  const [createdInfo, setCreatedInfo] = useState<{
    hospitalName: string;
    code: string;
    adminName: string;
  } | null>(null);

  const validateStep1 = () => {
    setErrorMsg(null);
    if (!hospitalName.trim()) {
      setErrorMsg('Hospital organization name is required.');
      return false;
    }
    const codeClean = hospitalCode.trim().toUpperCase();
    if (!codeClean || codeClean.length < 2 || codeClean.length > 4) {
      setErrorMsg('Hospital Code must be 2 to 4 uppercase letters/digits (e.g. AC, KI).');
      return false;
    }
    if (!/^[A-Z0-9]+$/.test(codeClean)) {
      setErrorMsg('Hospital Code can only contain letters and numbers.');
      return false;
    }
    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      setErrorMsg('A valid contact email address is required.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    setErrorMsg(null);
    if (!adminName.trim()) {
      setErrorMsg('Administrator name is required.');
      return false;
    }
    if (!adminEmail.trim() || !adminEmail.includes('@')) {
      setErrorMsg('A valid administrator login email is required.');
      return false;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleNextStep = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const authData = await registerHospital({
        hospital_name: hospitalName.trim(),
        hospital_type: hospitalType,
        hospital_address: address.trim() || 'Main Hospital Campus',
        city: city.trim() || 'Central',
        state: state.trim() || 'State',
        country: country.trim() || 'India',
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim() || '+91 00000 00000',
        hospital_code: hospitalCode.trim().toUpperCase(),
        admin_name: adminName.trim(),
        admin_email: adminEmail.trim(),
        password,
        confirm_password: confirmPassword,
      });

      setCreatedAuthData(authData);
      setCreatedInfo({
        hospitalName: hospitalName.trim(),
        code: hospitalCode.trim().toUpperCase(),
        adminName: adminName.trim(),
      });
      setStep(4);
    } catch (err: any) {
      console.error('Hospital registration error:', err);
      setErrorMsg(err.message || 'Failed to create hospital workspace. Please check your inputs or try another hospital code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToDashboard = () => {
    if (createdAuthData) {
      setSession(createdAuthData);
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden font-sans text-xs flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Create Hospital Workspace</h2>
              <p className="text-[11px] text-slate-400">Isolated clinical decision-support tenant for your facility</p>
            </div>
          </div>
          {step !== 4 && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Tracker (Steps 1-3) */}
        {step !== 4 && (
          <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between shrink-0">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <span>Hospital Information</span>
            </div>
            <div className="w-8 h-[1px] bg-slate-800" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {step > 2 ? '✓' : '2'}
              </div>
              <span>Administrator</span>
            </div>
            <div className="w-8 h-[1px] bg-slate-800" />
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                3
              </div>
              <span>Review</span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3.5 bg-red-950/70 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Hospital Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Hospital / Organization Name *</label>
                  <input
                    type="text"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    placeholder="e.g. ApexCare Medical Center"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Facility Type</label>
                  <select
                    value={hospitalType}
                    onChange={(e) => setHospitalType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Hospital">Hospital</option>
                    <option value="Clinic">Clinic</option>
                    <option value="Medical Center">Medical Center</option>
                    <option value="Emergency Care Center">Emergency Care Center</option>
                    <option value="Nursing Home">Nursing Home</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Unique Hospital Code (2–4 Characters) *
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={hospitalCode}
                  onChange={(e) => setHospitalCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AC or KI"
                  className="w-full px-3 py-2 bg-slate-950 border border-blue-500/50 rounded-xl text-blue-400 font-mono font-bold tracking-widest uppercase focus:outline-none focus:border-blue-400 text-sm"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Patient IDs are automatically prefixed with this code (e.g. <span className="font-mono text-blue-400">{hospitalCode || 'AC'}-2026-000001</span>).
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Physical Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 100 Health Park Blvd"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. India"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Contact Email *</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@apexcare.example"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Administrator Account */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-2xl text-[11px] text-blue-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>This account will be assigned the <strong>HOSPITAL_ADMIN</strong> role for {hospitalName}.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Administrator Full Name *</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Dr. Arjun Mehta"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Admin Email (Login ID) *</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@apexcare.example"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Password *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Review & Summary */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
                  Review Hospital Workspace Details
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Hospital:</span>
                    <p className="font-bold text-white mt-0.5">{hospitalName}</p>
                  </div>

                  <div>
                    <span className="text-slate-400">Hospital Code:</span>
                    <p className="font-mono font-bold text-blue-400 mt-0.5">{hospitalCode}</p>
                  </div>

                  <div>
                    <span className="text-slate-400">Location:</span>
                    <p className="text-slate-200 mt-0.5">{city}, {state}, {country}</p>
                  </div>

                  <div>
                    <span className="text-slate-400">Facility Type:</span>
                    <p className="text-slate-200 mt-0.5">{hospitalType}</p>
                  </div>

                  <div className="col-span-2 pt-2 border-t border-slate-800">
                    <span className="text-slate-400">Administrator:</span>
                    <p className="font-bold text-white mt-0.5">{adminName} ({adminEmail})</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl text-[11px] text-slate-300">
                • 100% tenant isolation enabled. All patient IDs, visits, appointments, and staff will be isolated under code <strong>{hospitalCode}</strong>.
              </div>
            </div>
          )}

          {/* STEP 4: Success Screen */}
          {step === 4 && createdInfo && (
            <div className="py-6 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">Hospital registered successfully.</h3>
                <p className="text-xs text-slate-400">Your hospital workspace has been created and verified in the database.</p>
              </div>

              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl max-w-md mx-auto text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Hospital:</span>
                  <span className="font-bold text-white">{createdInfo.hospitalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hospital Code:</span>
                  <span className="font-mono font-bold text-blue-400">{createdInfo.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Administrator:</span>
                  <span className="font-bold text-slate-200">{createdInfo.adminName}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoToDashboard}
                className="w-full max-w-md py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2 mx-auto transition-all text-sm hover:scale-105"
              >
                <span>GO TO ADMIN DASHBOARD</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {step !== 4 && (
          <div className="p-6 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-900/40"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-900/40 transition-all"
              >
                {isSubmitting ? (
                  <span>Creating hospital workspace...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>CREATE HOSPITAL WORKSPACE</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
