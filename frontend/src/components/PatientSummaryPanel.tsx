import React from 'react';
import { User, Clock, ShieldAlert, Activity, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { VitalsState } from './VitalsGrid';
import { SafetyCheckItem } from './SafetyScreenTable';

interface PatientSummaryPanelProps {
  patientName: string;
  patientId: string;
  age: number | string;
  sex: string;
  arrivalMode: string;
  arrivalTime: string;
  safetyChecks: SafetyCheckItem[];
  vitals: VitalsState;
  onReviewMissingData?: () => void;
}

export const PatientSummaryPanel: React.FC<PatientSummaryPanelProps> = ({
  patientName,
  patientId,
  age,
  sex,
  arrivalMode,
  arrivalTime,
  safetyChecks,
  vitals,
  onReviewMissingData,
}) => {
  const criticalCount = safetyChecks.filter((c) => c.value === 'YES').length;
  const unknownCount = safetyChecks.filter((c) => c.value === 'UNKNOWN').length;

  // Calculate completeness score
  const totalFields = 12 + 6 + 1; // 12 safety + 6 vitals + chief complaint
  let filledFields = 0;
  safetyChecks.forEach((c) => {
    if (c.value !== 'UNKNOWN') filledFields += 1;
  });
  if (vitals.spo2) filledFields += 1;
  if (vitals.heartRate) filledFields += 1;
  if (vitals.bpSystolic && vitals.bpDiastolic) filledFields += 1;
  if (vitals.respiratoryRate) filledFields += 1;
  if (vitals.temperature) filledFields += 1;
  if (vitals.gcs) filledFields += 1;

  const completenessPercent = Math.min(100, Math.round((filledFields / totalFields) * 100));
  const missingCount = totalFields - filledFields;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-4 sticky top-20">
      {/* Header: PATIENT SUMMARY */}
      <div className="border-b border-[#F1F5F9] pb-3">
        <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
          PATIENT SUMMARY
        </div>
        <h3 className="text-base font-bold text-[#172033] mt-1">{patientName}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-mono text-xs font-bold text-[#2563EB] bg-[#EAF2FF] px-2 py-0.5 rounded border border-[#C9DBF8]">
            {patientId}
          </span>
          <span className="text-xs text-[#64748B] font-medium">
            {age} • {sex}
          </span>
        </div>
      </div>

      {/* Section: CURRENT VISIT */}
      <div className="border-b border-[#F1F5F9] pb-3 text-xs space-y-1">
        <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
          CURRENT VISIT
        </div>
        <div className="flex items-center justify-between text-[#172033] pt-1">
          <span className="text-[#64748B]">Mode:</span>
          <span className="font-semibold">{arrivalMode}</span>
        </div>
        <div className="flex items-center justify-between text-[#172033]">
          <span className="text-[#64748B]">Time:</span>
          <span className="font-semibold">{arrivalTime}</span>
        </div>
      </div>

      {/* Section: SAFETY */}
      <div className="border-b border-[#F1F5F9] pb-3 text-xs space-y-2">
        <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
          SAFETY
        </div>
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <div className={`p-2 rounded border text-center ${
            criticalCount > 0
              ? 'bg-[#FDECEC] text-[#DC2626] border-[#F3A6A6]'
              : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
          }`}>
            <div className="text-[10px] font-medium">Critical</div>
            <div className="text-base font-bold">{criticalCount}</div>
          </div>
          <div className={`p-2 rounded border text-center ${
            unknownCount > 0
              ? 'bg-[#FFF7E6] text-[#D97706] border-[#F5C451]'
              : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
          }`}>
            <div className="text-[10px] font-medium">Unknown</div>
            <div className="text-base font-bold">{unknownCount}</div>
          </div>
        </div>
      </div>

      {/* Section: VITALS SNAPSHOT */}
      <div className="border-b border-[#F1F5F9] pb-3 text-xs space-y-1.5">
        <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
          VITALS SNAPSHOT
        </div>
        <div className="space-y-1 text-[#172033] pt-0.5">
          <div className="flex justify-between">
            <span className="text-[#64748B]">SpO₂:</span>
            <span className={`font-semibold ${vitals.spo2 ? 'text-[#172033]' : 'text-[#94A3B8]'}`}>
              {vitals.spo2 ? `${vitals.spo2}%` : 'Not recorded'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748B]">HR:</span>
            <span className={`font-semibold ${vitals.heartRate ? 'text-[#172033]' : 'text-[#94A3B8]'}`}>
              {vitals.heartRate ? `${vitals.heartRate} bpm` : 'Not recorded'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748B]">BP:</span>
            <span className={`font-semibold ${vitals.bpSystolic ? 'text-[#172033]' : 'text-[#94A3B8]'}`}>
              {vitals.bpSystolic && vitals.bpDiastolic ? `${vitals.bpSystolic}/${vitals.bpDiastolic}` : 'Not recorded'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748B]">GCS:</span>
            <span className={`font-semibold ${vitals.gcs ? 'text-[#172033]' : 'text-[#94A3B8]'}`}>
              {vitals.gcs ? `${vitals.gcs}/15` : 'Not recorded'}
            </span>
          </div>
        </div>
      </div>

      {/* Section: DATA COMPLETENESS */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
          <span>DATA COMPLETENESS</span>
          <span className="text-[#2563EB] font-mono text-xs">{completenessPercent}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              completenessPercent >= 80 ? 'bg-[#16A34A]' : completenessPercent >= 50 ? 'bg-[#F59E0B]' : 'bg-[#DC2626]'
            }`}
            style={{ width: `${completenessPercent}%` }}
          />
        </div>

        {missingCount > 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] text-[#64748B]">
              {missingCount} important field{missingCount > 1 ? 's' : ''} not yet documented
            </p>
            {onReviewMissingData && (
              <button
                type="button"
                onClick={onReviewMissingData}
                className="w-full py-1.5 bg-[#F8FAFC] hover:bg-[#EAF2FF] text-[#2563EB] border border-[#CBD5E1] hover:border-[#C9DBF8] rounded text-xs font-semibold transition-colors"
              >
                Review Missing Data
              </button>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-[#16A34A] flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Complete arrival record</span>
          </p>
        )}
      </div>
    </div>
  );
};
