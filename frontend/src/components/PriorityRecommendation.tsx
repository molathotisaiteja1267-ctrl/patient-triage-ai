import React, { useState } from 'react';
import { TriageAssessment, PriorityLevel } from '../services/types';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Stethoscope,
  ArrowLeft,
  X,
  FileCheck
} from 'lucide-react';

interface PriorityRecommendationProps {
  assessment: TriageAssessment;
  patientName: string;
  patientId: string;
  onAccept: () => void;
  onOverride: (newPriority: PriorityLevel, reason: string, notes?: string) => void;
  onRequestReassessment: (reason: string) => void;
  onBackToEdit: () => void;
  isProcessing?: boolean;
}

export const PriorityRecommendation: React.FC<PriorityRecommendationProps> = ({
  assessment,
  patientName,
  patientId,
  onAccept,
  onOverride,
  onRequestReassessment,
  onBackToEdit,
  isProcessing = false,
}) => {
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overridePriority, setOverridePriority] = useState<PriorityLevel>('YELLOW');
  const [overrideReason, setOverrideReason] = useState('Senior Physician Clinical Discretion');
  const [overrideNotes, setOverrideNotes] = useState('');

  const [showReassessModal, setShowReassessModal] = useState(false);
  const [reassessReason, setReassessReason] = useState('Physiological condition changed / updated vitals needed');

  const getPriorityDisplay = (priority: PriorityLevel) => {
    switch (priority) {
      case 'RED':
        return {
          title: 'CRITICAL',
          sub: 'Immediate Resuscitation Required (Target: Immediate)',
          badgeClass: 'bg-[#FDECEC] text-[#DC2626] border-[#F3A6A6]',
        };
      case 'ORANGE':
        return {
          title: 'VERY URGENT',
          sub: 'Emergent Evaluation Required (Target: < 10–15 min)',
          badgeClass: 'bg-[#FFF1E8] text-[#F97316] border-[#FDBA74]',
        };
      case 'YELLOW':
        return {
          title: 'URGENT',
          sub: 'Urgent Care Pathway (Target: < 30–60 min)',
          badgeClass: 'bg-[#FFF7E6] text-[#D97706] border-[#F5C451]',
        };
      case 'GREEN':
        return {
          title: 'LESS URGENT',
          sub: 'Standard Outpatient / Minor Injury (Target: < 120 min)',
          badgeClass: 'bg-[#EAF8EF] text-[#16A34A] border-[#B7E4C7]',
        };
      case 'BLUE':
      default:
        return {
          title: 'ROUTINE',
          sub: 'Non-Emergency / Fast Track Review',
          badgeClass: 'bg-[#EAF8EF] text-[#16A34A] border-[#B7E4C7]',
        };
    }
  };

  const prioInfo = getPriorityDisplay(assessment.priority);

  const handleConfirmOverride = (e: React.FormEvent) => {
    e.preventDefault();
    onOverride(overridePriority, overrideReason, overrideNotes);
    setShowOverrideModal(false);
  };

  const handleConfirmReassess = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestReassessment(reassessReason);
    setShowReassessModal(false);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-16 font-sans text-xs">
      {/* Top Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
            PRIORITY RECOMMENDATION
          </div>
          <div className="font-bold text-[#172033] text-base mt-0.5">{patientName}</div>
          <div className="text-xs text-[#64748B] font-mono">{patientId}</div>
        </div>
        <button
          onClick={onBackToEdit}
          className="clinical-btn-secondary h-8 px-3 text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Intake Form</span>
        </button>
      </div>

      {/* Main Recommendation Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-6">
        {/* Recommended Priority Big Block */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            Recommended Priority
          </div>
          <div className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${prioInfo.badgeClass}`}>
            <div>
              <div className="text-2xl font-black tracking-tight">{prioInfo.title}</div>
              <div className="text-xs font-medium mt-0.5 opacity-90">{prioInfo.sub}</div>
            </div>
            <div className="text-right sm:border-l sm:border-current/20 sm:pl-4">
              <div className="text-[10px] uppercase font-bold opacity-75">Care Pathway</div>
              <div className="text-sm font-bold mt-0.5">{assessment.recommended_route}</div>
            </div>
          </div>
        </div>

        {/* Section: WHY THIS RECOMMENDATION? */}
        <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
          <div className="text-xs font-bold text-[#172033] uppercase tracking-wide">
            WHY THIS RECOMMENDATION?
          </div>
          <p className="text-xs text-[#64748B]">
            Decision-support recommendation based on the recorded arrival information.
          </p>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 space-y-2 text-xs">
            <div className="font-semibold text-[#172033]">Key Clinical Factors:</div>
            <ul className="space-y-1.5 pl-4 list-disc text-[#172033]">
              {assessment.reasoning_bullets && assessment.reasoning_bullets.length > 0 ? (
                assessment.reasoning_bullets.map((bullet, idx) => (
                  <li key={idx} className="leading-relaxed">{bullet}</li>
                ))
              ) : (
                <li>Evaluated against standard Manchester / ESI clinical triage rule matrix.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Section: CLINICAL DECISION & HUMAN AUTHORITY */}
        <div className="space-y-3 pt-3 border-t border-[#F1F5F9]">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-[#2563EB]" />
            <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wide">
              CLINICAL DECISION
            </h4>
          </div>
          <div className="p-3 bg-[#EAF2FF]/50 border border-[#C9DBF8] rounded-md text-xs text-[#172033] leading-relaxed">
            <strong className="text-[#2563EB]">Advisory Notice: </strong>
            AI recommendation is an assistive decision-support tool. Final triage prioritization and care pathway assignment remain with qualified clinical staff.
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onAccept}
              disabled={isProcessing}
              className="clinical-btn-primary bg-[#16A34A] hover:bg-[#15803D] h-10 px-5 text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Accept Recommendation</span>
            </button>

            <button
              onClick={() => setShowOverrideModal(true)}
              disabled={isProcessing}
              className="clinical-btn-primary bg-[#F97316] hover:bg-[#EA580C] h-10 px-5 text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Override Priority</span>
            </button>

            <button
              onClick={() => setShowReassessModal(true)}
              disabled={isProcessing}
              className="clinical-btn-secondary h-10 px-4 text-xs font-medium"
            >
              <Activity className="w-4 h-4 text-[#64748B]" />
              <span>Request Reassessment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 bg-[#172033]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-[#CBD5E1] rounded-lg shadow-modal p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h3 className="text-sm font-bold text-[#172033]">Clinical Priority Override</h3>
              <button onClick={() => setShowOverrideModal(false)} className="text-[#64748B] hover:text-[#172033]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmOverride} className="space-y-3">
              <div>
                <label className="block text-[#172033] mb-1 font-semibold">New Clinician Priority *</label>
                <select
                  value={overridePriority}
                  onChange={(e) => setOverridePriority(e.target.value as PriorityLevel)}
                  className="clinical-select w-full"
                >
                  <option value="RED">RED — Priority 1 (Immediate)</option>
                  <option value="ORANGE">ORANGE — Priority 2 (Very Urgent)</option>
                  <option value="YELLOW">YELLOW — Priority 3 (Urgent)</option>
                  <option value="GREEN">GREEN — Priority 4 (Less Urgent)</option>
                  <option value="BLUE">BLUE — Priority 5 (Routine)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#172033] mb-1 font-semibold">Mandatory Clinical Rationale *</label>
                <select
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="clinical-select w-full"
                  required
                >
                  <option value="Senior Physician Clinical Discretion">Senior Physician Clinical Discretion</option>
                  <option value="Atypical Presentation of Critical Pathology">Atypical Presentation of Critical Pathology</option>
                  <option value="High-Risk Comorbidities Not Reflected in Vitals">High-Risk Comorbidities Not Reflected in Vitals</option>
                  <option value="Patient Condition Rapidly Deteriorating">Patient Condition Rapidly Deteriorating</option>
                  <option value="Non-urgent Chronic Presentation Suitable for Clinic">Non-urgent Chronic Presentation Suitable for Clinic</option>
                </select>
              </div>

              <div>
                <label className="block text-[#172033] mb-1 font-semibold">Detailed Bedside Notes</label>
                <textarea
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="Document specific clinical observations explaining priority change..."
                  rows={3}
                  className="clinical-textarea w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="clinical-btn-secondary h-9 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="clinical-btn-primary bg-[#F97316] hover:bg-[#EA580C] h-9 text-xs font-bold"
                >
                  Confirm Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassessment Modal */}
      {showReassessModal && (
        <div className="fixed inset-0 z-50 bg-[#172033]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-[#CBD5E1] rounded-lg shadow-modal p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h3 className="text-sm font-bold text-[#172033]">Request Reassessment</h3>
              <button onClick={() => setShowReassessModal(false)} className="text-[#64748B] hover:text-[#172033]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReassess} className="space-y-3">
              <div>
                <label className="block text-[#172033] mb-1 font-semibold">Reason for Reassessment *</label>
                <select
                  value={reassessReason}
                  onChange={(e) => setReassessReason(e.target.value)}
                  className="clinical-select w-full"
                  required
                >
                  <option value="Physiological condition changed / updated vitals needed">
                    Physiological condition changed / updated vitals needed
                  </option>
                  <option value="Patient reported new symptoms while waiting">
                    Patient reported new symptoms while waiting
                  </option>
                  <option value="Additional historical medical records retrieved">
                    Additional historical medical records retrieved
                  </option>
                  <option value="Initial vitals incomplete or contradictory">
                    Initial vitals incomplete or contradictory
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowReassessModal(false)}
                  className="clinical-btn-secondary h-9 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="clinical-btn-primary h-9 text-xs font-bold"
                >
                  Confirm Reassessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
