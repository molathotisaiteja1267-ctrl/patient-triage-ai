import React from 'react';
import { Save, Check, X, ArrowRight, Clock } from 'lucide-react';

interface ClinicalActionBarProps {
  lastSavedTime?: string;
  onCancel: () => void;
  onSaveDraft: () => void;
  onReviewAssessment: () => void;
  isSaving?: boolean;
  canReview?: boolean;
}

export const ClinicalActionBar: React.FC<ClinicalActionBarProps> = ({
  lastSavedTime = 'Just now',
  onCancel,
  onSaveDraft,
  onReviewAssessment,
  isSaving = false,
  canReview = true,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E2E8F0] px-4 lg:px-8 py-3 shadow-[0_-2px_10px_0_rgba(0,0,0,0.03)] flex items-center justify-between">
      {/* LEFT: Save Status */}
      <div className="flex items-center gap-2 text-xs text-[#64748B]">
        <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
        <span>
          Draft saved: <strong className="text-[#172033] font-medium">{lastSavedTime}</strong>
        </span>
      </div>

      {/* RIGHT: Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="clinical-btn-secondary h-9 px-4 text-xs"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSaving}
          className="clinical-btn-secondary h-9 px-4 text-xs"
        >
          <Save className="w-3.5 h-3.5 text-[#64748B]" />
          <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
        </button>

        <button
          type="button"
          onClick={onReviewAssessment}
          disabled={!canReview}
          className="clinical-btn-primary h-9 px-5 text-xs shadow-xs"
        >
          <span>Review Assessment</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
