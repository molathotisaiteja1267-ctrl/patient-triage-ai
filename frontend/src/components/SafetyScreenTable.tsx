import React from 'react';
import { SafetyStatusSummary } from './SafetyStatusSummary';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export interface SafetyCheckItem {
  id: string;
  label: string;
  description?: string;
  value: 'YES' | 'NO' | 'UNKNOWN';
  detailValue?: string;
  detailPrompt?: string;
}

interface SafetyScreenTableProps {
  checks: SafetyCheckItem[];
  onChangeCheck: (id: string, value: 'YES' | 'NO' | 'UNKNOWN', detailValue?: string) => void;
}

export const SafetyScreenTable: React.FC<SafetyScreenTableProps> = ({
  checks,
  onChangeCheck,
}) => {
  const criticalCount = checks.filter((c) => c.value === 'YES').length;
  const unknownCount = checks.filter((c) => c.value === 'UNKNOWN').length;
  const negativeCount = checks.filter((c) => c.value === 'NO').length;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Header & Status Summary */}
      <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
            <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wide">
              IMMEDIATE SAFETY SCREENING
            </h3>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Core emergency warning signs requiring human review
          </p>
        </div>

        <SafetyStatusSummary
          criticalCount={criticalCount}
          unknownCount={unknownCount}
          negativeCount={negativeCount}
        />
      </div>

      {/* Structured EHR Safety Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase text-[11px]">
              <th className="py-2.5 px-4">Safety Check</th>
              <th className="py-2.5 px-4 text-center w-20">Yes</th>
              <th className="py-2.5 px-4 text-center w-20">No</th>
              <th className="py-2.5 px-4 text-center w-24">Unknown</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {checks.map((check) => {
              const isYes = check.value === 'YES';
              const isUnknown = check.value === 'UNKNOWN';
              const isNo = check.value === 'NO';

              const rowBg = isYes
                ? 'bg-[#FDECEC] border-l-4 border-l-[#DC2626]'
                : isUnknown
                ? 'bg-[#FFF7E6] border-l-4 border-l-[#F59E0B]'
                : 'bg-white hover:bg-[#F8FAFC] border-l-4 border-l-transparent';

              return (
                <React.Fragment key={check.id}>
                  <tr className={`transition-colors ${rowBg}`}>
                    {/* Safety Check Title & Description */}
                    <td className="py-2.5 px-4 align-middle">
                      <div className="flex items-center gap-2">
                        {isYes && <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />}
                        <div>
                          <div className={`font-semibold ${isYes ? 'text-[#DC2626]' : isUnknown ? 'text-[#D97706]' : 'text-[#172033]'}`}>
                            {check.label}
                          </div>
                          {check.description && (
                            <div className="text-[11px] text-[#64748B]">{check.description}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Radio YES */}
                    <td className="py-2.5 px-4 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => onChangeCheck(check.id, 'YES', check.detailValue)}
                        className={`w-full py-1 rounded text-[11px] font-bold transition-all border ${
                          isYes
                            ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-xs'
                            : 'bg-white text-[#64748B] border-[#CBD5E1] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        YES
                      </button>
                    </td>

                    {/* Radio NO */}
                    <td className="py-2.5 px-4 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => onChangeCheck(check.id, 'NO', undefined)}
                        className={`w-full py-1 rounded text-[11px] font-semibold transition-all border ${
                          isNo
                            ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-xs'
                            : 'bg-white text-[#64748B] border-[#CBD5E1] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        NO
                      </button>
                    </td>

                    {/* Radio UNKNOWN */}
                    <td className="py-2.5 px-4 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => onChangeCheck(check.id, 'UNKNOWN', undefined)}
                        className={`w-full py-1 rounded text-[11px] font-semibold transition-all border ${
                          isUnknown
                            ? 'bg-[#F59E0B] text-white border-[#F59E0B] shadow-xs'
                            : 'bg-white text-[#64748B] border-[#CBD5E1] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        UNKNOWN
                      </button>
                    </td>
                  </tr>

                  {/* Expandable Clinical Details on Positive Flag */}
                  {isYes && check.detailPrompt && (
                    <tr className="bg-[#FDECEC]/60">
                      <td colSpan={4} className="py-2 px-4 border-t border-[#F3A6A6]/40 pl-8">
                        <div className="flex items-center gap-3">
                          <label className="text-[11px] font-bold text-[#DC2626] shrink-0">
                            {check.detailPrompt}:
                          </label>
                          <input
                            type="text"
                            value={check.detailValue || ''}
                            onChange={(e) => onChangeCheck(check.id, 'YES', e.target.value)}
                            placeholder="Specify clinical observations / onset..."
                            className="clinical-input flex-1 h-7 text-xs bg-white"
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
