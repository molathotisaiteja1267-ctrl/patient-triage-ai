import React, { useState } from 'react';
import {
  PatientRecord,
  PriorityLevel,
  OverrideRequest
} from '../services/types';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Edit3,
  RefreshCw,
  ArrowRight,
  AlertTriangle,
  FileText,
  UserCheck,
  Building2,
  Gauge
} from 'lucide-react';

interface TriageResultViewProps {
  patient: PatientRecord;
  onAccept: (patientId: string, staffId: string) => Promise<void>;
  onOverride: (patientId: string, payload: OverrideRequest) => Promise<void>;
  onRequestReassess: (patientId: string, staffId: string, reason: string) => Promise<void>;
  onNavigateToQueue: () => void;
  onStartNewIntake: () => void;
}

export const TriageResultView: React.FC<TriageResultViewProps> = ({
  patient,
  onAccept,
  onOverride,
  onRequestReassess,
  onNavigateToQueue,
  onStartNewIntake,
}) => {
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overridePriority, setOverridePriority] = useState<PriorityLevel>('YELLOW');
  const [overrideReason, setOverrideReason] = useState('');
  const [staffId, setStaffId] = useState('RN-TRIAGE-101');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const assessment = patient.assessment;
  const safety = assessment.safety_eval;
  const priority = patient.current_priority;

  const getPriorityTheme = (p: PriorityLevel) => {
    switch (p) {
      case 'RED':
        return {
          bg: 'bg-red-500/15',
          border: 'border-red-500/40',
          text: 'text-red-400',
          badge: 'bg-red-500 text-white',
          label: 'RED — IMMEDIATE ASSESSMENT',
          sub: 'Resuscitation / Immediate Life Threat',
        };
      case 'ORANGE':
        return {
          bg: 'bg-orange-500/15',
          border: 'border-orange-500/40',
          text: 'text-orange-400',
          badge: 'bg-orange-500 text-white',
          label: 'ORANGE — VERY URGENT',
          sub: 'High-Acuity / Rapid Assessment Required',
        };
      case 'YELLOW':
        return {
          bg: 'bg-yellow-500/15',
          border: 'border-yellow-500/40',
          text: 'text-yellow-400',
          badge: 'bg-yellow-500 text-slate-950',
          label: 'YELLOW — URGENT',
          sub: 'ED Main Treatment / Timely Care',
        };
      case 'GREEN':
        return {
          bg: 'bg-emerald-500/15',
          border: 'border-emerald-500/40',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500 text-white',
          label: 'GREEN — LESS URGENT',
          sub: 'Fast-Track / Ambulatory Care',
        };
      case 'BLUE':
        return {
          bg: 'bg-blue-500/15',
          border: 'border-blue-500/40',
          text: 'text-blue-400',
          badge: 'bg-blue-500 text-white',
          label: 'BLUE — NON-EMERGENCY',
          sub: 'Sub-Acute / Primary Care Pathway',
        };
    }
  };

  const theme = getPriorityTheme(priority);

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
      setErrorMsg('A valid clinical rationale (minimum 5 characters) is mandatory to override.');
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
      setShowOverrideModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to override recommendation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReassess = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onRequestReassess(patient.patient_id, staffId, 'Staff requested formal triage re-evaluation');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request reassessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Triage Assessment Result</h1>
            <p className="text-xs text-slate-400 font-mono">
              Patient ID: <span className="text-blue-300 font-bold">{patient.patient_id}</span> • Synthetic Profile
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
            patient.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
            patient.status === 'OVERRIDDEN' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
            'bg-blue-500/20 text-blue-300 border-blue-500/40'
          }`}>
            Status: {patient.status}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Priority Card */}
      <div className={`p-6 rounded-2xl border ${theme.border} ${theme.bg} backdrop-blur-sm space-y-5 shadow-lg`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
              Priority Recommendation
            </div>
            <div className={`text-2xl sm:text-3xl font-black tracking-tight ${theme.text}`}>
              {theme.label}
            </div>
            <div className="text-xs text-slate-300 mt-0.5">{theme.sub}</div>
          </div>

          <div className="flex sm:flex-col items-start sm:items-end justify-between gap-1 text-right">
            <span className="text-[11px] font-mono text-slate-400">Confidence Score</span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-mono font-bold text-slate-200">
              <Gauge className="w-3.5 h-3.5 text-blue-400" />
              <span>{Math.round(assessment.confidence_score * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Recommended Route */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
          <Building2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase">Recommended Hospital Care Pathway</div>
            <div className="text-sm font-bold text-white mt-0.5">{assessment.recommended_route}</div>
          </div>
        </div>
      </div>

      {/* Grid: Reasoning, Safety Flags, Missing Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Why this recommendation */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span>Why This Recommendation?</span>
          </div>
          <ul className="space-y-2">
            {assessment.reasoning_bullets.map((bullet: string, idx: number) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                <span className="text-blue-400 font-bold">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Safety Flags & Missing Information */}
        <div className="space-y-4">
          {/* Safety Flags */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-red-300 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Safety Flags ({safety.risk_flags.length})</span>
            </div>
            {safety.risk_flags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {safety.risk_flags.map((flag: string, idx: number) => (
                  <span key={idx} className="px-2.5 py-1 rounded-md bg-red-950/70 border border-red-500/40 text-red-300 text-[11px]">
                    🔴 {flag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No active clinical red flags flagged.</p>
            )}
          </div>

          {/* Missing Information */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Missing Information ({safety.missing_information.length})</span>
            </div>
            {safety.missing_information.length > 0 ? (
              <div className="space-y-1.5">
                {safety.missing_information.map((item: string, idx: number) => (
                  <div key={idx} className="text-xs text-amber-300/90 flex items-start gap-2">
                    <span>⚠</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">All key arrival vitals recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Uncertainty & Safety Callout */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-200">
            Uncertainty Level: <span className={
              safety.uncertainty_level === 'LOW' ? 'text-emerald-400' :
              safety.uncertainty_level === 'MODERATE' ? 'text-yellow-400' : 'text-red-400'
            }>{safety.uncertainty_level}</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {safety.uncertainty_reason || 'Arrival information sufficient for baseline priority estimation.'}
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-blue-950/60 border border-blue-500/30 text-blue-300 text-[11px] font-semibold flex items-center gap-1.5 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Human clinical confirmation required</span>
        </div>
      </div>

      {/* Decision Hub Actions */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <UserCheck className="w-4 h-4 text-blue-400" />
            <span>Clinician Decision Hub</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Staff ID: {staffId}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Accept Button */}
          <button
            onClick={handleAccept}
            disabled={isSubmitting || patient.status === 'ACCEPTED'}
            className="flex-1 min-w-[180px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{patient.status === 'ACCEPTED' ? 'Recommendation Accepted' : 'Accept Recommendation'}</span>
          </button>

          {/* Override Button */}
          <button
            onClick={() => setShowOverrideModal(true)}
            disabled={isSubmitting}
            className="flex-1 min-w-[180px] py-2.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-950/50"
          >
            <Edit3 className="w-4 h-4" />
            <span>Override Recommendation</span>
          </button>

          {/* Request Reassessment */}
          <button
            onClick={handleReassess}
            disabled={isSubmitting || patient.status === 'REASSESSMENT_REQUESTED'}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Request Reassessment</span>
          </button>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
          <button
            onClick={onStartNewIntake}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            + Start Another Patient Intake
          </button>
          <button
            onClick={onNavigateToQueue}
            className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
          >
            <span>View Live Triage Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Override Confirmation Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Override AI Triage Recommendation</h3>
              </div>
              <button
                onClick={() => setShowOverrideModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOverrideSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Select New Priority Level *
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {(['RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE'] as PriorityLevel[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setOverridePriority(p)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        overridePriority === p
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Clinical Rationale for Override * (Mandatory for audit trail)
                </label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="State clinical observation or bedside finding (e.g. visible severe distress, abnormal skin color, high-risk mechanism)..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Staff Identifier *</label>
                  <input
                    type="text"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Staff Role</label>
                  <input
                    type="text"
                    disabled
                    value="Triage Registered Nurse"
                    className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !overrideReason.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Confirm Override & Record in Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
