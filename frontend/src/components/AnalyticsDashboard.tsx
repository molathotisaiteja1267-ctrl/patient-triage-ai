import React from 'react';
import { AnalyticsSummary } from '../services/types';
import {
  BarChart3,
  Users,
  AlertOctagon,
  Clock,
  Shuffle,
  ShieldCheck,
  Building2,
  PieChart,
  RefreshCw
} from 'lucide-react';

interface AnalyticsDashboardProps {
  analytics: AnalyticsSummary | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  analytics,
  onRefresh,
  isLoading,
}) => {
  if (!analytics || !analytics.has_data || analytics.total_arrivals === 0) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto font-sans text-xs pb-12">
        {/* KPI Cards (Empty State) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
            <div className="flex items-center justify-between text-[#64748B] text-xs">
              <span>Total Patients</span>
              <Users className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div className="text-2xl font-bold text-[#172033]">0</div>
            <div className="text-[10px] text-[#64748B]">Intakes recorded</div>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
            <div className="flex items-center justify-between text-[#64748B] text-xs">
              <span>Critical Patients (RED)</span>
              <AlertOctagon className="w-4 h-4 text-[#DC2626]" />
            </div>
            <div className="text-2xl font-bold text-[#DC2626]">0</div>
            <div className="text-[10px] text-[#64748B]">Resuscitation tier</div>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
            <div className="flex items-center justify-between text-[#64748B] text-xs">
              <span>Waiting in Queue</span>
              <Clock className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <div className="text-2xl font-bold text-[#D97706]">0</div>
            <div className="text-[10px] text-[#64748B]">Active arrivals</div>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
            <div className="flex items-center justify-between text-[#64748B] text-xs">
              <span>Average Wait Time</span>
              <Clock className="w-4 h-4 text-[#16A34A]" />
            </div>
            <div className="text-2xl font-bold text-[#64748B]">—</div>
            <div className="text-[10px] text-[#64748B]">No active queue data</div>
          </div>
        </div>

        {/* Empty State Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-12 text-center space-y-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <BarChart3 className="w-8 h-8 text-[#94A3B8] mx-auto" />
          <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
            No Patient Data Available Yet
          </h3>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            Emergency department operational analytics, priority distributions, and clinician override rates will populate automatically as patients complete intake.
          </p>
        </div>
      </div>
    );
  }

  const priorityColors: Record<string, string> = {
    RED: 'bg-[#DC2626]',
    ORANGE: 'bg-[#F97316]',
    YELLOW: 'bg-[#F59E0B]',
    GREEN: 'bg-[#16A34A]',
    BLUE: 'bg-[#2563EB]',
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans text-xs pb-12">
      {/* Top Header */}
      <div className="bg-white border border-[#E2E8F0] p-5 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div>
          <h1 className="text-base font-bold text-[#172033] tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#2563EB]" />
            <span>Emergency Department Operations & Triage Analytics</span>
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time throughput metrics, priority stratification, and clinician override monitoring
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="clinical-btn-secondary h-8 px-3 text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Updating...' : 'Refresh Metrics'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
          <div className="flex items-center justify-between text-[#64748B] text-xs">
            <span>Total Patients</span>
            <Users className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl font-bold text-[#172033]">{analytics.total_arrivals}</div>
          <div className="text-[10px] text-[#64748B]">Live active arrivals</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
          <div className="flex items-center justify-between text-[#64748B] text-xs">
            <span>Critical Patients (RED)</span>
            <AlertOctagon className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="text-2xl font-bold text-[#DC2626]">{analytics.critical_patients_count}</div>
          <div className="text-[10px] text-[#64748B]">Immediate resuscitation</div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
          <div className="flex items-center justify-between text-[#64748B] text-xs">
            <span>Average Wait Time</span>
            <Clock className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-2xl font-bold text-[#D97706]">
            {analytics.average_wait_minutes !== null ? `${analytics.average_wait_minutes}m` : '—'}
          </div>
          <div className="text-[10px] text-[#64748B]">
            Median: {analytics.median_wait_minutes !== null ? `${analytics.median_wait_minutes}m` : '—'}
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-1">
          <div className="flex items-center justify-between text-[#64748B] text-xs">
            <span>Clinician Override Rate</span>
            <Shuffle className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl font-bold text-[#2563EB]">
            {analytics.human_override_rate_pct !== null ? `${analytics.human_override_rate_pct}%` : '—'}
          </div>
          <div className="text-[10px] text-[#64748B]">Human-in-the-loop decisions</div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Priority Stratification Distribution */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#172033] uppercase tracking-wider">
              <PieChart className="w-4 h-4 text-[#2563EB]" />
              <span>Priority Level Stratification</span>
            </div>
            <span className="text-xs font-mono text-[#64748B]">Total: {analytics.total_arrivals}</span>
          </div>

          <div className="space-y-3">
            {Object.entries(analytics.patients_by_priority).map(([priority, count]) => {
              const pct = analytics.total_arrivals > 0 ? Math.round((count / analytics.total_arrivals) * 100) : 0;
              return (
                <div key={priority} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-[#172033]">{priority}</span>
                    <span className="text-[#64748B] font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${priorityColors[priority] || 'bg-[#CBD5E1]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Care Route Allocations */}
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#172033] uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-[#2563EB]" />
              <span>Hospital Care Pathways</span>
            </div>
          </div>

          <div className="space-y-2">
            {Object.entries(analytics.patients_by_route).map(([route, count]) => (
              <div
                key={route}
                className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md flex items-center justify-between"
              >
                <div className="text-xs font-medium text-[#172033]">{route}</div>
                <span className="px-2 py-0.5 bg-[#EAF2FF] text-[#2563EB] font-mono font-bold rounded text-xs border border-[#C9DBF8]">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Override Log Breakdown */}
      {analytics.override_reasons_breakdown.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-lg space-y-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#172033] uppercase tracking-wider border-b border-[#F1F5F9] pb-2">
            <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
            <span>Recent Clinician Override Rationales</span>
          </div>

          <div className="divide-y divide-[#F1F5F9]">
            {analytics.override_reasons_breakdown.map((item, idx) => (
              <div key={idx} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#2563EB] font-bold">{item.patient_id}</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#F8FAFC] text-[#64748B] font-mono text-[10px] border border-[#E2E8F0]">
                    {item.from} → {item.to}
                  </span>
                </div>
                <div className="text-[#172033] italic text-xs">"{item.reason}"</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
