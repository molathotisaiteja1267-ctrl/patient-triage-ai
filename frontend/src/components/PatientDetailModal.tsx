import React, { useState } from 'react';
import {
  PatientRecord,
  PriorityLevel,
  OverrideRequest,
  VitalSigns
} from '../services/types';
import {
  X,
  Clock,
  Building2,
  ShieldAlert,
  ShieldCheck,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Gauge,
  Activity,
  History,
  User,
  Heart
} from 'lucide-react';

interface PatientDetailModalProps {
  patient: PatientRecord;
  onClose: () => void;
  onAccept: (patientId: string, staffId: string) => Promise<void>;
  onOverride: (patientId: string, payload: OverrideRequest) => Promise<void>;
  onRequestReassess: (patientId: string, staffId: string, reason: string) => Promise<void>;
  onDeletePatient?: (patientId: string) => Promise<void>;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  patient,
  onClose,
  onAccept,
  onOverride,
  onRequestReassess,
  onDeletePatient,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'decisions' | 'history'>('overview');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Override Form State
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overridePriority, setOverridePriority] = useState<PriorityLevel>('YELLOW');
  const [overrideReason, setOverrideReason] = useState('');
  const [staffId, setStaffId] = useState('RN-TRIAGE-101');

  // Reassessment Form State
  const [showReassessForm, setShowReassessForm] = useState(false);
  const [reassessReason, setReassessReason] = useState('');

  const intake = patient.intake;
  const assessment = patient.assessment;
  const safety = assessment.safety_eval;
  const vitals = intake.vitals;

  const handleAccept = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onAccept(patient.patient_id, staffId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to accept recommendation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim() || overrideReason.trim().length < 5) {
      setErrorMsg('Clinical rationale for override is mandatory (min 5 characters).');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onOverride(patient.patient_id, {
        new_priority: overridePriority,
        reason: overrideReason.trim(),
        staff_id: staffId,
        staff_role: 'Triage Registered Nurse',
      });
      setShowOverrideForm(false);
      setOverrideReason('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to override recommendation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReassessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassessReason.trim()) {
      setErrorMsg('Please specify reason for reassessment.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onRequestReassess(patient.patient_id, staffId, reassessReason.trim());
      setShowReassessForm(false);
      setReassessReason('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request reassessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadgeClass = (priority: PriorityLevel) => {
    switch (priority) {
      case 'RED':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'ORANGE':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'YELLOW':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'GREEN':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      case 'BLUE':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-lg border font-mono font-bold text-xs ${getPriorityBadgeClass(patient.current_priority)}`}>
              {patient.current_priority}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">{patient.patient_id}</h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  SYNTHETIC PROFILE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {intake.age}y • {intake.sex} • Arrived via {intake.arrival_method} • Waiting {patient.waiting_minutes} mins
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/60 border-b border-red-500/40 text-red-300 text-xs flex items-center gap-2 px-6">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div className="bg-slate-950/60 px-6 border-b border-slate-800 flex items-center gap-4 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview & AI Reasoning
          </button>
          <button
            onClick={() => setActiveTab('vitals')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'vitals'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Vital Signs & Physiology
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Symptoms & Medical History
          </button>
          <button
            onClick={() => setActiveTab('decisions')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'decisions'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Human Decision Audit ({patient.human_decisions.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Chief Complaint & Route */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Primary Chief Complaint</div>
                  <div className="text-sm font-bold text-white">{intake.chief_complaint}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Onset: {intake.symptoms.onset} • Distress Severity: {intake.symptoms.severity}/10
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Care Pathway Route</div>
                  <div className="text-sm font-bold text-blue-300 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    <span>{patient.assigned_route}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Current Status: <strong className="text-slate-200">{patient.status}</strong>
                  </div>
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                    <Gauge className="w-4 h-4 text-blue-400" />
                    <span>Clinical Reasoning Factors</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Confidence: {Math.round(assessment.confidence_score * 100)}%
                  </span>
                </div>

                <ul className="space-y-2 text-xs text-slate-300">
                  {assessment.reasoning_bullets.map((bullet: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Safety Evaluation Flags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span>Safety Flags ({safety.risk_flags.length})</span>
                  </div>
                  {safety.risk_flags.length > 0 ? (
                    <div className="space-y-1 text-xs text-red-300">
                      {safety.risk_flags.map((flag: string, idx: number) => (
                        <div key={idx}>🔴 {flag}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">No active red flags.</div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Missing Data ({safety.missing_information.length})</span>
                  </div>
                  {safety.missing_information.length > 0 ? (
                    <div className="space-y-1 text-xs text-amber-300">
                      {safety.missing_information.map((item: string, idx: number) => (
                        <div key={idx}>⚠ {item}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">All vital parameters recorded.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vitals' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Oxygen Saturation (SpO2)</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {vitals.spo2 !== null && vitals.spo2 !== undefined ? `${vitals.spo2}%` : '--'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Normal: 95–100%</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Heart Rate</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {vitals.heart_rate !== null && vitals.heart_rate !== undefined ? `${vitals.heart_rate} bpm` : '--'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Normal: 60–100 bpm</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Blood Pressure</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {vitals.systolic_bp ?? '--'}/{vitals.diastolic_bp ?? '--'} mmHg
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Normal: 120/80 mmHg</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Respiratory Rate</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {vitals.respiratory_rate !== null && vitals.respiratory_rate !== undefined ? `${vitals.respiratory_rate}/min` : '--'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Normal: 12–20/min</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Body Temperature</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {vitals.temperature !== null && vitals.temperature !== undefined ? `${vitals.temperature}°C` : '--'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Normal: 36.5–37.5°C</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] text-slate-400">GCS Score</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {vitals.gcs !== null && vitals.gcs !== undefined ? `${vitals.gcs}/15` : '--'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Normal: 15 (Alert)</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="font-bold text-white uppercase text-[11px]">Reported Symptoms & Functional Status</div>
                <div className="flex flex-wrap gap-1.5">
                  {intake.symptoms.main_symptoms.map((s: string, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] text-slate-400">
                  <div>Progression: <strong className="text-slate-200">{intake.symptoms.progression}</strong></div>
                  <div>Functional Status: <strong className="text-slate-200">{intake.symptoms.functional_status}</strong></div>
                  <div>Consciousness: <strong className="text-slate-200">{intake.symptoms.consciousness_status}</strong></div>
                  <div>Mobility: <strong className="text-slate-200">{intake.symptoms.ability_to_walk}</strong></div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="font-bold text-white uppercase text-[11px]">Known Conditions</div>
                  <p>{intake.history.known_major_conditions.join(', ') || 'None documented'}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="font-bold text-white uppercase text-[11px]">Current Medications</div>
                  <p>{intake.history.current_medications.join(', ') || 'None documented'}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="font-bold text-white uppercase text-[11px]">Documented Allergies</div>
                  <p>{intake.history.allergies.join(', ') || 'No known drug allergies'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'decisions' && (
            <div className="space-y-4">
              {patient.human_decisions.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6">
                  No human override or decision events recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {patient.human_decisions.map((dec: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{dec.decision_type}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(dec.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-slate-300">
                        Staff: <strong>{dec.staff_id}</strong> ({dec.staff_role})
                      </div>
                      {dec.override_reason && (
                        <div className="p-2 rounded bg-amber-950/30 border border-amber-500/30 text-amber-300 italic">
                          "{dec.override_reason}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer: Action Hub */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleAccept}
              disabled={isSubmitting || patient.status === 'ACCEPTED'}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{patient.status === 'ACCEPTED' ? 'Accepted' : 'Accept Priority'}</span>
            </button>

            <button
              onClick={() => setShowOverrideForm(!showOverrideForm)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Override Priority</span>
            </button>

            <button
              onClick={() => setShowReassessForm(!showReassessForm)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Request Reassess</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onDeletePatient && (
              <button
                onClick={async () => {
                  await onDeletePatient(patient.patient_id);
                  onClose();
                }}
                className="text-xs text-red-400 hover:text-red-300 underline mr-2"
              >
                Discharge / Remove
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>

        {/* Inline Override Form Sub-Modal */}
        {showOverrideForm && (
          <div className="p-4 bg-slate-900 border-t border-slate-800">
            <form onSubmit={handleOverrideSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase">Override AI Recommendation</span>
                <button type="button" onClick={() => setShowOverrideForm(false)} className="text-slate-400 text-xs">Cancel</button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {(['RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE'] as PriorityLevel[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setOverridePriority(p)}
                    className={`py-1.5 text-xs font-bold rounded-lg border ${
                      overridePriority === p ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Enter mandatory clinical rationale for override..."
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                required
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !overrideReason.trim()}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl"
                >
                  Confirm Override
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Inline Reassess Form Sub-Modal */}
        {showReassessForm && (
          <div className="p-4 bg-slate-900 border-t border-slate-800">
            <form onSubmit={handleReassessSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 uppercase">Request Triage Reassessment</span>
                <button type="button" onClick={() => setShowReassessForm(false)} className="text-slate-400 text-xs">Cancel</button>
              </div>

              <input
                type="text"
                value={reassessReason}
                onChange={(e) => setReassessReason(e.target.value)}
                placeholder="Reason for reassessment (e.g. deteriorating condition, newly observed vitals)..."
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                required
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !reassessReason.trim()}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl"
                >
                  Submit Reassessment Request
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
