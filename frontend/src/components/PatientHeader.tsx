import React from 'react';
import { User, Clock, ShieldAlert } from 'lucide-react';

interface PatientHeaderProps {
  patientId: string;
  patientName: string;
  age: number | string;
  sex: string;
  arrivalTime?: string;
  arrivalMode?: string;
  statusBadge?: string;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patientId,
  patientName,
  age,
  sex,
  arrivalTime = '10:42 AM',
  arrivalMode = 'Walk-in',
  statusBadge = 'NEW ARRIVAL',
}) => {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Side: Patient Identity */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
            PATIENT
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-[#172033] tracking-tight">{patientName}</h2>
            <span className="text-xs text-[#64748B] font-medium">
              {age} years • {sex}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#64748B] pt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span>Arrival: <strong className="text-[#172033]">{arrivalTime}</strong></span>
            </span>
            <span>•</span>
            <span>Mode: <strong className="text-[#172033]">{arrivalMode}</strong></span>
          </div>
        </div>

        {/* Right Side: Identifier & Status */}
        <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-1.5 border-t sm:border-t-0 border-[#F1F5F9] pt-2 sm:pt-0">
          <span className="font-mono font-bold text-xs text-[#2563EB] bg-[#EAF2FF] px-2.5 py-1 rounded border border-[#C9DBF8]">
            {patientId}
          </span>
          <span className="text-[11px] font-bold uppercase text-[#16A34A] bg-[#EAF8EF] px-2 py-0.5 rounded border border-[#B7E4C7]">
            {statusBadge}
          </span>
        </div>
      </div>
    </div>
  );
};
