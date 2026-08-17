import React from 'react';
import { AlertTriangle, HelpCircle, CheckCircle2 } from 'lucide-react';

interface SafetyStatusSummaryProps {
  criticalCount: number;
  unknownCount: number;
  negativeCount: number;
}

export const SafetyStatusSummary: React.FC<SafetyStatusSummaryProps> = ({
  criticalCount,
  unknownCount,
  negativeCount,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Critical / Positive */}
      <div className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 border transition-colors ${
        criticalCount > 0
          ? 'bg-[#FDECEC] text-[#DC2626] border-[#F3A6A6]'
          : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
      }`}>
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>{criticalCount} Critical</span>
      </div>

      {/* Unknown */}
      <div className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 border transition-colors ${
        unknownCount > 0
          ? 'bg-[#FFF7E6] text-[#D97706] border-[#F5C451]'
          : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
      }`}>
        <HelpCircle className="w-3.5 h-3.5" />
        <span>{unknownCount} Unknown</span>
      </div>

      {/* Negative / Normal */}
      <div className="px-2.5 py-1 bg-[#EAF8EF] text-[#16A34A] border border-[#B7E4C7] rounded text-xs font-bold flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>{negativeCount} Negative</span>
      </div>
    </div>
  );
};
