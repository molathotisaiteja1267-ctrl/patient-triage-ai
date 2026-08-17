import React from 'react';
import { X, ArrowLeft, Activity, ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { VitalsState } from './VitalsGrid';
import { SafetyCheckItem } from './SafetyScreenTable';

interface AssessmentReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitAssessment: () => void;
  patientName: string;
  patientId: string;
  age: number | string;
  sex: string;
  chiefComplaint: string;
  symptoms: string[];
  safetyChecks: SafetyCheckItem[];
  vitals: VitalsState;
  medicalConditions: string[];
  allergies: string[];
  isSubmitting?: boolean;
}

export const AssessmentReviewDrawer: React.FC<AssessmentReviewDrawerProps> = ({
  isOpen,
  onClose,
  onSubmitAssessment,
  patientName,
  patientId,
  age,
  sex,
  chiefComplaint,
  symptoms,
  safetyChecks,
  vitals,
  medicalConditions,
  allergies,
  isSubmitting = false,
}) => {
  if (!isOpen) return null;

  const positiveChecks = safetyChecks.filter((c) => c.value === 'YES');
  const unknownChecks = safetyChecks.filter((c) => c.value === 'UNKNOWN');
  const negativeChecks = safetyChecks.filter((c) => c.value === 'NO');

  return (
    <div className="fixed inset-0 z-50 bg-[#172033]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white border border-[#CBD5E1] rounded-lg shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div>
            <h3 className="text-base font-bold text-[#172033]">Assessment Review</h3>
            <p className="text-xs text-[#64748B]">
              Verify clinical arrival data before generating AI decision support recommendation
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#172033] hover:bg-[#E2E8F0] rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Patient Card */}
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md flex items-center justify-between">
            <div>
              <div className="font-bold text-[#172033] text-sm">{patientName}</div>
              <div className="text-[#64748B] mt-0.5">
                {age} yrs • {sex}
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-[#2563EB] bg-[#EAF2FF] px-2.5 py-1 rounded border border-[#C9DBF8]">
              {patientId}
            </span>
          </div>

          {/* Chief Complaint & Symptoms */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              CHIEF COMPLAINT & SYMPTOMS
            </div>
            <div className="p-3 border border-[#E2E8F0] rounded-md bg-white space-y-2">
              <div className="font-medium text-[#172033]">
                <span className="text-[#64748B]">Primary Complaint: </span>
                {chiefComplaint || 'Not specified'}
              </div>
              {symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {symptoms.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-[#EAF2FF] text-[#2563EB] border border-[#C9DBF8] rounded text-[11px] font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Safety Screening Status */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              SAFETY SCREENING ({positiveChecks.length} Positive, {unknownChecks.length} Unknown)
            </div>
            <div className="p-3 border border-[#E2E8F0] rounded-md bg-white space-y-2">
              {positiveChecks.length > 0 ? (
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-[#DC2626] flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Positive Emergency Safety Flags:</span>
                  </div>
                  <ul className="space-y-1 pl-5 list-disc text-[#DC2626]">
                    {positiveChecks.map((c) => (
                      <li key={c.id}>
                        <strong>{c.label}</strong>
                        {c.detailValue && <span className="text-[#172033] font-normal"> — {c.detailValue}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-[#16A34A] flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No immediate red flags positive.</span>
                </div>
              )}

              {unknownChecks.length > 0 && (
                <div className="pt-2 border-t border-[#F1F5F9] text-[#D97706]">
                  <span className="font-semibold">{unknownChecks.length} Safety items marked UNKNOWN: </span>
                  <span className="text-[11px] text-[#64748B]">
                    {unknownChecks.map((c) => c.label).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Arrival Vitals Summary */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              RECORDED ARRIVAL VITALS
            </div>
            <div className="grid grid-cols-3 gap-2 p-3 border border-[#E2E8F0] rounded-md bg-white text-xs">
              <div>
                <span className="text-[#64748B]">SpO₂: </span>
                <strong className={vitals.spo2 ? 'text-[#172033]' : 'text-[#94A3B8]'}>
                  {vitals.spo2 ? `${vitals.spo2}%` : 'Not recorded'}
                </strong>
              </div>
              <div>
                <span className="text-[#64748B]">HR: </span>
                <strong className={vitals.heartRate ? 'text-[#172033]' : 'text-[#94A3B8]'}>
                  {vitals.heartRate ? `${vitals.heartRate} bpm` : 'Not recorded'}
                </strong>
              </div>
              <div>
                <span className="text-[#64748B]">BP: </span>
                <strong className={vitals.bpSystolic ? 'text-[#172033]' : 'text-[#94A3B8]'}>
                  {vitals.bpSystolic && vitals.bpDiastolic ? `${vitals.bpSystolic}/${vitals.bpDiastolic}` : 'Not recorded'}
                </strong>
              </div>
              <div>
                <span className="text-[#64748B]">RR: </span>
                <strong className={vitals.respiratoryRate ? 'text-[#172033]' : 'text-[#94A3B8]'}>
                  {vitals.respiratoryRate ? `${vitals.respiratoryRate} /min` : 'Not recorded'}
                </strong>
              </div>
              <div>
                <span className="text-[#64748B]">Temp: </span>
                <strong className={vitals.temperature ? 'text-[#172033]' : 'text-[#94A3B8]'}>
                  {vitals.temperature ? `${vitals.temperature} °C` : 'Not recorded'}
                </strong>
              </div>
              <div>
                <span className="text-[#64748B]">GCS: </span>
                <strong className={vitals.gcs ? 'text-[#172033]' : 'text-[#94A3B8]'}>
                  {vitals.gcs ? `${vitals.gcs}/15` : 'Not recorded'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="clinical-btn-secondary h-9 px-4 text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Edit</span>
          </button>

          <button
            type="button"
            onClick={onSubmitAssessment}
            disabled={isSubmitting}
            className="clinical-btn-primary h-9 px-5 text-xs font-bold"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Evaluating Priority...' : 'Generate Priority Recommendation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
