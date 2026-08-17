import React from 'react';
import { HospitalHeader } from './HospitalHeader';
import { SidebarNavigation } from './SidebarNavigation';

interface ClinicalAppShellProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenRegisterPatient?: () => void;
  onOpenInviteStaff?: () => void;
  onSelectPatient?: (patientId: string) => void;
  liveQueueCount?: number;
  waitingCount?: number;
  criticalCount?: number;
  children: React.ReactNode;
}

export const ClinicalAppShell: React.FC<ClinicalAppShellProps> = ({
  currentView,
  onNavigate,
  onOpenRegisterPatient,
  onOpenInviteStaff,
  onSelectPatient,
  liveQueueCount,
  waitingCount,
  criticalCount,
  children,
}) => {
  return (
    <div className="min-h-screen bg-[#F5F8FC] text-[#172033] flex flex-col font-sans antialiased selection:bg-[#2563EB] selection:text-white">
      {/* 64px Top White Hospital Header */}
      <HospitalHeader
        onOpenRegisterPatient={onOpenRegisterPatient}
        onOpenInviteStaff={onOpenInviteStaff}
        onSelectPatient={onSelectPatient}
        liveQueueCount={liveQueueCount}
        waitingCount={waitingCount}
        criticalCount={criticalCount}
      />

      {/* Split Body: 230px Sidebar + Main Clinical Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Fixed 230px White Sidebar */}
        <SidebarNavigation
          currentView={currentView}
          onNavigate={onNavigate}
        />

        {/* Dynamic Main Workspace Container (max-w 1400px centered, background #F5F8FC) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F5F8FC]">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Persistent Clinical Disclaimer Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white px-6 py-2.5 text-center text-[10px] text-[#64748B]">
        <p>
          <strong className="text-[#172033]">PatientTriage.ai</strong> • Clinical Decision-Support Research Prototype • AI Recommends. Humans Decide. • Multi-Hospital Architecture
        </p>
      </footer>
    </div>
  );
};
