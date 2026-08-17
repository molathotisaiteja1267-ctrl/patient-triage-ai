import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import {
  calculateAgeFromDob,
  formatDateForAPI,
  getTodayDateString,
  isValidDateString
} from '../utils/dateUtils';
import {
  UserPlus,
  CheckCircle2,
  X,
  AlertTriangle,
  User,
  Activity,
  ArrowRight
} from 'lucide-react';

interface PatientRegisterModalProps {
  onClose: () => void;
  onSuccess: (newPatientId: string, action?: 'open' | 'triage') => void;
}

export const PatientRegisterModal: React.FC<PatientRegisterModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { hospital } = useAuth();
  const toast = useToast();

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [sex, setSex] = useState('Male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [bloodGroup, setBloodGroup] = useState('Unknown');
  const [allergiesInput, setAllergiesInput] = useState('');
  const [conditionsInput, setConditionsInput] = useState('');
  const [primaryDoctor, setPrimaryDoctor] = useState('');
  const [department, setDepartment] = useState('Emergency Medicine');

  // Dynamic departments & doctors
  const [departments, setDepartments] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string; department?: string }>>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success State
  const [registeredResult, setRegisteredResult] = useState<{
    patientId: string;
    patientName: string;
  } | null>(null);

  useEffect(() => {
    loadHospitalMeta();
  }, []);

  const loadHospitalMeta = async () => {
    try {
      const [depts, docs] = await Promise.all([
        api.getHospitalDepartments(),
        api.getHospitalDoctors(),
      ]);
      setDepartments(depts);
      setDoctors(docs);
      if (depts.length > 0 && !department) {
        setDepartment(depts[0]);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDob(val);
    if (val && isValidDateString(val)) {
      const calculatedAge = calculateAgeFromDob(val);
      if (calculatedAge !== null) {
        setAge(calculatedAge);
      }
    } else {
      setAge('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Patient full name is required.');
      return;
    }
    if (!dob || !isValidDateString(dob)) {
      setErrorMsg('A valid Date of Birth is required (YYYY-MM-DD).');
      return;
    }

    const formattedDob = formatDateForAPI(dob);
    if (!formattedDob) {
      setErrorMsg('Invalid Date of Birth format. Please select a valid date.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const allergiesList = allergiesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const conditionsList = conditionsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await api.registerPatient({
        name: name.trim(),
        dob: formattedDob,
        age: age === '' ? (calculateAgeFromDob(formattedDob) ?? 30) : Number(age),
        sex,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        emergency_contact: emergencyContact.trim() || undefined,
        blood_group: bloodGroup,
        allergies: allergiesList,
        existing_conditions: conditionsList,
        primary_doctor_name: primaryDoctor || undefined,
        department: department || undefined,
      });

      toast.success(`Patient registered with ID ${res.patient_id}`, 'Registration Successful');

      setRegisteredResult({
        patientId: res.patient_id,
        patientName: name.trim(),
      });
    } catch (err: any) {
      const msg = err.message || 'Failed to register patient.';
      setErrorMsg(msg);
      toast.error(msg, 'Registration Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#172033]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white border border-[#CBD5E1] rounded-lg shadow-modal overflow-hidden font-sans text-xs flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#EAF2FF] border border-[#C9DBF8] flex items-center justify-center text-[#2563EB]">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#172033] tracking-tight">Register Hospital Patient</h2>
              <p className="text-[11px] text-[#64748B]">
                Hospital: <strong className="text-[#172033]">{hospital?.name}</strong> • Deterministic ID: <span className="text-[#2563EB] font-mono font-bold">{hospital?.code}-YYYY-XXXXXX</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#172033] p-1.5 rounded-md hover:bg-[#E2E8F0]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {registeredResult ? (
            /* Success Screen with Direct Action Hub */
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#EAF8EF] border border-[#B7E4C7] text-[#16A34A] flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-[#172033]">Patient Successfully Registered</h3>
                <p className="text-xs text-[#64748B]">Deterministic patient ID generated and saved to hospital database.</p>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg max-w-md mx-auto text-left space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Deterministic Patient ID:</span>
                  <span className="font-mono font-bold text-[#2563EB] text-sm bg-[#EAF2FF] px-2 py-0.5 rounded border border-[#C9DBF8]">
                    {registeredResult.patientId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Patient Name:</span>
                  <span className="font-bold text-[#172033]">{registeredResult.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Department:</span>
                  <span className="text-[#172033]">{department}</span>
                </div>
                {primaryDoctor && (
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Primary Physician:</span>
                    <span className="text-[#172033]">{primaryDoctor}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => onSuccess(registeredResult.patientId, 'open')}
                  className="w-full py-2 px-4 clinical-btn-secondary flex items-center justify-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Open Patient Record</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSuccess(registeredResult.patientId, 'triage')}
                  className="w-full py-2 px-4 clinical-btn-primary bg-[#DC2626] hover:bg-[#B91C1C] flex items-center justify-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Start Emergency Triage</span>
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-3">
              {errorMsg && (
                <div className="p-3 bg-[#FDECEC] border border-[#F3A6A6] rounded-md text-[#B91C1C] text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
                  <span className="font-semibold">{errorMsg}</span>
                </div>
              )}

              {/* Demographics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172033] font-semibold mb-1">Patient Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    className="clinical-input w-full"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      max={getTodayDateString()}
                      value={dob}
                      onChange={handleDobChange}
                      className="clinical-input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">Calculated Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Auto"
                      className="clinical-input w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#172033] font-semibold mb-1">Biological Sex *</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className="clinical-select w-full"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#172033] font-semibold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="clinical-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-[#172033] font-semibold mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="clinical-select w-full"
                  >
                    <option value="Unknown">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172033] font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="clinical-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-[#172033] font-semibold mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Spouse / Kin: +91 98765 00000"
                    className="clinical-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#172033] font-semibold mb-1">Residential Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, Area"
                  className="clinical-input w-full"
                />
              </div>

              {/* Baseline History */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172033] font-semibold mb-1">Known Conditions (comma separated)</label>
                  <input
                    type="text"
                    value={conditionsInput}
                    onChange={(e) => setConditionsInput(e.target.value)}
                    placeholder="e.g. Hypertension, Diabetes Type 2"
                    className="clinical-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-[#172033] font-semibold mb-1">Documented Allergies</label>
                  <input
                    type="text"
                    value={allergiesInput}
                    onChange={(e) => setAllergiesInput(e.target.value)}
                    placeholder="e.g. Penicillin, Sulfa, NKDA"
                    className="clinical-input w-full"
                  />
                </div>
              </div>

              {/* Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172033] font-semibold mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="clinical-select w-full"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#172033] font-semibold mb-1">Primary Attending Physician</label>
                  <select
                    value={primaryDoctor}
                    onChange={(e) => setPrimaryDoctor(e.target.value)}
                    className="clinical-select w-full"
                  >
                    <option value="">-- Assign Physician (Optional) --</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.name}>
                        {doc.name} ({doc.department || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
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
                  <span>{isSubmitting ? 'Registering...' : 'Register Patient'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
