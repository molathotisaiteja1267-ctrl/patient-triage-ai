import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HospitalResponse } from '../services/types';
import {
  Building2,
  Lock,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Activity,
  RefreshCw
} from 'lucide-react';

export const HospitalSettingsView: React.FC = () => {
  const { hospital: authHospital, isAdmin } = useAuth();
  const [hospital, setHospital] = useState<HospitalResponse | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable fields
  const [name, setName] = useState('');
  const [hospitalType, setHospitalType] = useState('Hospital');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('United States');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getHospitalSettings();
      setHospital(data);
      setName(data.name);
      setHospitalType(data.hospital_type);
      setAddress(data.address);
      setCity(data.city);
      setState(data.state);
      setCountry(data.country);
      setContactEmail(data.contact_email);
      setContactPhone(data.contact_phone);

      const depts = await api.getHospitalDepartments();
      setDepartments(depts);
    } catch (err) {
      console.warn('Failed to load hospital settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSaving(true);

    try {
      const updated = await api.updateHospitalSettings({
        name,
        hospital_type: hospitalType,
        address,
        city,
        state,
        country,
        contact_email: contactEmail,
        contact_phone: contactPhone,
      });
      setHospital(updated);
      setSuccessMsg('Hospital configuration successfully updated.');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-[#64748B] flex flex-col items-center justify-center gap-2">
        <Activity className="w-6 h-6 animate-spin text-[#2563EB]" />
        <p>Loading hospital settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto font-sans text-xs pb-12">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#EAF2FF] text-[#2563EB] border border-[#C9DBF8]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#172033] tracking-tight">Hospital Organization Settings</h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Manage facility metadata, contact parameters, and organizational tenant preferences
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-[#64748B] uppercase font-semibold">Hospital Code</div>
          <div className="font-mono font-bold text-xs text-[#2563EB] bg-[#EAF2FF] px-2.5 py-0.5 rounded border border-[#C9DBF8] mt-0.5">
            {hospital?.code}
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-[#EAF8EF] border border-[#B7E4C7] rounded-lg text-[#16A34A] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-[#FDECEC] border border-[#F3A6A6] rounded-lg text-[#DC2626] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="text-[#64748B] text-xs font-semibold">Registered Staff Members</div>
          <div className="text-2xl font-bold text-[#172033] mt-1">{hospital?.staff_count || 0}</div>
        </div>
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="text-[#64748B] text-xs font-semibold">Total Hospital Patients</div>
          <div className="text-2xl font-bold text-[#2563EB] mt-1">{hospital?.patient_count || 0}</div>
        </div>
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="text-[#64748B] text-xs font-semibold">Tenant Created</div>
          <div className="text-sm font-bold text-[#172033] mt-1">
            {hospital?.created_at ? new Date(hospital.created_at).toLocaleDateString() : 'Active'}
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-4">
        <h2 className="text-xs font-bold text-[#172033] uppercase tracking-wider border-b border-[#F1F5F9] pb-2">
          Facility Details & Contact Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[#172033] font-semibold mb-1">Organization / Hospital Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isAdmin}
              className="clinical-input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-[#172033] font-semibold mb-1 flex items-center justify-between">
              <span>Hospital Code</span>
              <span className="text-[10px] text-[#64748B] flex items-center gap-1 font-normal">
                <Lock className="w-3 h-3 text-[#94A3B8]" /> Immutable
              </span>
            </label>
            <input
              type="text"
              value={hospital?.code || ''}
              readOnly
              className="clinical-input w-full bg-[#F8FAFC] text-[#64748B] font-mono font-bold tracking-widest cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[#172033] font-semibold mb-1">Facility Type</label>
            <select
              value={hospitalType}
              onChange={(e) => setHospitalType(e.target.value)}
              disabled={!isAdmin}
              className="clinical-select w-full"
            >
              <option value="Hospital">Hospital</option>
              <option value="Clinic">Clinic</option>
              <option value="Medical Center">Medical Center</option>
              <option value="Emergency Care Center">Emergency Care Center</option>
              <option value="Nursing Home">Nursing Home</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[#172033] font-semibold mb-1">Street Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={!isAdmin}
              className="clinical-input w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[#172033] font-semibold mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={!isAdmin}
              className="clinical-input w-full"
            />
          </div>
          <div>
            <label className="block text-[#172033] font-semibold mb-1">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              disabled={!isAdmin}
              className="clinical-input w-full"
            />
          </div>
          <div>
            <label className="block text-[#172033] font-semibold mb-1">Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={!isAdmin}
              className="clinical-input w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[#172033] font-semibold mb-1">Official Contact Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              disabled={!isAdmin}
              className="clinical-input w-full"
            />
          </div>

          <div>
            <label className="block text-[#172033] font-semibold mb-1">Contact Phone</label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              disabled={!isAdmin}
              className="clinical-input w-full"
            />
          </div>
        </div>

        {/* Clinical Departments */}
        <div className="pt-2">
          <label className="block text-[#172033] font-semibold mb-1.5">Active Care Departments</label>
          <div className="flex flex-wrap gap-1.5">
            {departments.map((dept, i) => (
              <span key={i} className="px-2.5 py-1 bg-[#F8FAFC] border border-[#CBD5E1] text-[#172033] font-medium rounded text-xs">
                {dept}
              </span>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div className="pt-3 border-t border-[#F1F5F9] flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="clinical-btn-primary h-9 px-5 text-xs font-bold"
            >
              {isSaving ? 'Saving Changes...' : 'Save Settings'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
