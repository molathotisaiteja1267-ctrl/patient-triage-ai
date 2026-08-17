import React, { useState } from 'react';
import { AuditLogEntry } from '../services/types';
import {
  ScrollText,
  Search,
  Calendar,
  UserCheck,
  RefreshCw
} from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  logs,
  onRefresh,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDecision, setFilterDecision] = useState<string>('ALL');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === '' ||
      log.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.chief_complaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.staff_id && log.staff_id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDecision =
      filterDecision === 'ALL' || log.human_decision === filterDecision;

    return matchesSearch && matchesDecision;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans text-xs pb-12">
      {/* Header & Controls */}
      <div className="bg-white border border-[#E2E8F0] p-5 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div>
          <h1 className="text-base font-bold text-[#172033] tracking-tight flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-[#2563EB]" />
            <span>Immutable Clinical Triage Audit Trail</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Complete audit logging of all AI recommendations, clinician overrides, and staff identifiers
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Patient ID or Staff..."
              className="clinical-input w-full pl-8 h-8 text-xs"
            />
          </div>

          <select
            value={filterDecision}
            onChange={(e) => setFilterDecision(e.target.value)}
            className="clinical-select h-8 text-xs py-0"
          >
            <option value="ALL">All Decisions</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="OVERRIDDEN">OVERRIDDEN</option>
            <option value="REASSESSMENT_REQUESTED">REASSESS</option>
            <option value="INITIAL_AI_RECOMMENDATION">INITIAL INTAKE</option>
          </select>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="clinical-btn-secondary h-8 px-2.5"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Audit Log Entries or Empty State */}
      {logs.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-12 text-center space-y-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <ScrollText className="w-8 h-8 text-[#94A3B8] mx-auto" />
          <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
            No Audit Events Yet
          </h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            All AI triage evaluations, nurse approvals, and clinical override rationales will be recorded here automatically with verifiable timestamps and staff IDs.
          </p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-8 text-center text-xs text-[#64748B] shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          No audit records matched the filter criteria.
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase text-[11px]">
                  <th className="py-2.5 px-4">Audit ID & Time</th>
                  <th className="py-2.5 px-4">Patient ID</th>
                  <th className="py-2.5 px-4">Chief Complaint</th>
                  <th className="py-2.5 px-4">AI Rec → Final</th>
                  <th className="py-2.5 px-4">Decision Type</th>
                  <th className="py-2.5 px-4">Staff Identifier</th>
                  <th className="py-2.5 px-4">Override Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] font-mono">
                {filteredLogs.map((log) => {
                  const dateStr = new Date(log.timestamp).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-[#2563EB] text-xs">{log.id}</div>
                        <div className="text-[10px] text-[#64748B] flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#94A3B8]" />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-bold text-[#172033]">
                        {log.patient_id}
                      </td>

                      <td className="py-3 px-4 max-w-xs font-sans">
                        <div className="text-[#172033] truncate" title={log.chief_complaint}>
                          {log.chief_complaint}
                        </div>
                        <div className="text-[10px] text-[#64748B]">
                          Route: {log.recommended_route}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-bold text-[#172033]">
                          {log.initial_priority} → {log.final_priority}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.human_decision === 'OVERRIDDEN' ? 'bg-[#FFF1E8] text-[#F97316] border border-[#FDBA74]' :
                          log.human_decision === 'ACCEPTED' ? 'bg-[#EAF8EF] text-[#16A34A] border border-[#B7E4C7]' :
                          'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                        }`}>
                          {log.human_decision}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[#172033]">
                          <UserCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                          <span className="font-bold">{log.staff_id || 'System'}</span>
                        </div>
                        <div className="text-[10px] text-[#64748B] font-sans">{log.staff_role}</div>
                      </td>

                      <td className="py-3 px-4 font-sans text-xs">
                        {log.override_reason ? (
                          <div className="text-[#172033] italic bg-[#FFF7E6] p-1.5 rounded border border-[#F5C451] max-w-sm">
                            "{log.override_reason}"
                          </div>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
