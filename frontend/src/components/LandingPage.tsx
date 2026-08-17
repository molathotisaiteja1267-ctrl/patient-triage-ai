import React, { useState } from 'react';
import {
  ShieldAlert,
  Activity,
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  Stethoscope,
  Lock,
  Calendar,
  ChevronRight,
  ClipboardList
} from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  onRegisterHospital: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  onRegisterHospital,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const workflowSteps = [
    {
      step: '01',
      title: 'Register Patient',
      subtitle: 'Deterministic Sequencing',
      icon: Users,
      desc: 'Patient registers into the hospital database. Server automatically generates a sequential ID ({HOSPITAL_CODE}-YYYY-XXXXXX). Demographics and baseline medical history are established.',
    },
    {
      step: '02',
      title: 'Emergency Triage',
      subtitle: '12 Red Flag Safety Matrix',
      icon: Activity,
      desc: 'Arrival staff input chief complaints, 12 emergency red flags, and available vitals. Missing or conflicting inputs automatically raise uncertainty.',
    },
    {
      step: '03',
      title: 'Prioritize & Decide',
      subtitle: 'AI Recommends. Humans Decide.',
      icon: ShieldAlert,
      desc: 'Deterministic rules and AI compute conservative acuity (CRITICAL, VERY URGENT, URGENT, ROUTINE). Clinician reviews bullets and accepts, overrides, or requests reassessment.',
    },
    {
      step: '04',
      title: 'Doctor Consultation',
      subtitle: 'Clinical Visits & Notes',
      icon: Stethoscope,
      desc: 'Attending physician opens patient profile, starts visit ({CODE}-V-YYYY-XXXXXX), documents clinical notes and examination findings into the permanent record.',
    },
    {
      step: '05',
      title: 'Follow-Up Care',
      subtitle: 'Longitudinal Timeline',
      icon: Calendar,
      desc: 'Specialist appointments are scheduled ({CODE}-APT-YYYY-XXXXXX). The unified patient timeline chronologically connects every encounter from intake to recovery.',
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F8FC] text-[#172033] font-sans flex flex-col antialiased selection:bg-[#2563EB] selection:text-white">
      {/* 64px Top Header */}
      <header className="border-b border-[#E2E8F0] bg-white sticky top-0 z-40 shadow-header">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-[#172033] flex items-center gap-1">
                PatientTriage<span className="text-[#2563EB]">.ai</span>
              </span>
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block">
                Hospital Clinical Decision Support Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSignIn}
              className="clinical-btn-secondary h-8 px-3 text-xs font-semibold"
            >
              Sign In
            </button>
            <button
              onClick={onRegisterHospital}
              className="clinical-btn-primary h-8 px-3 text-xs font-bold flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Register Hospital</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#EAF2FF] border border-[#C9DBF8] text-[#2563EB] text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" />
            <span>End-to-End Hospital Coordination & Clinical Decision Support</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-[#172033] tracking-tight leading-tight">
            Connected Clinical Triage & Care Workflow for Modern Hospitals
          </h1>

          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
            PatientTriage.ai is an intelligent hospital EHR platform designed to streamline emergency intake, detect critical red flags, recommend conservative acuity triage, and maintain a unified longitudinal patient journey.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              onClick={onRegisterHospital}
              className="clinical-btn-primary h-10 px-5 text-xs font-bold flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              <span>Create Hospital Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onSignIn}
              className="clinical-btn-secondary h-10 px-5 text-xs font-semibold"
            >
              Staff & Admin Login
            </button>
          </div>

          {/* Master Workflow Steps Banner */}
          <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-lg shadow-xs flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-[#64748B]">
            <span className="text-[#2563EB] font-semibold">Hospital Setup</span>
            <span>→</span>
            <span className="text-[#2563EB] font-semibold">Staff Onboarding</span>
            <span>→</span>
            <span className="text-[#2563EB] font-semibold">Patient Registration</span>
            <span>→</span>
            <span className="text-[#DC2626] font-semibold">AI Triage</span>
            <span>→</span>
            <span className="text-[#16A34A] font-semibold">Doctor Visit</span>
            <span>→</span>
            <span className="text-[#2563EB] font-semibold">Follow-up Appointment</span>
          </div>
        </div>

        {/* SECTION: How a Patient Moves Through the Hospital */}
        <section className="space-y-4 bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="text-center space-y-1">
            <div className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">
              Connected Healthcare Journey
            </div>
            <h2 className="text-lg font-bold text-[#172033]">How a Patient Moves Through the Hospital</h2>
            <p className="text-xs text-[#64748B] max-w-xl mx-auto">
              Explore how PatientTriage.ai connects hospital reception, emergency triage, physicians, and specialist follow-up.
            </p>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {workflowSteps.map((s, idx) => {
              const IconComp = s.icon;
              const isSelected = activeStep === idx + 1;
              return (
                <button
                  key={s.step}
                  onClick={() => setActiveStep(idx + 1)}
                  className={`p-3.5 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'bg-[#EAF2FF] border-[#2563EB] shadow-xs'
                      : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono font-bold text-[#2563EB]">{s.step}</span>
                    <IconComp className={`w-4 h-4 ${isSelected ? 'text-[#2563EB]' : 'text-[#94A3B8]'}`} />
                  </div>
                  <div className="text-xs font-bold text-[#172033] leading-tight">{s.title}</div>
                  <div className="text-[10px] text-[#64748B] mt-0.5 truncate">{s.subtitle}</div>
                </button>
              );
            })}
          </div>

          {/* Active Step Deep-Dive Box */}
          <div className="bg-[#F8FAFC] border border-[#C9DBF8] rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#EAF2FF] text-[#2563EB] text-[10px] font-bold">
                STEP {workflowSteps[activeStep - 1].step} OF 05
              </div>
              <h3 className="text-sm font-bold text-[#172033]">
                {workflowSteps[activeStep - 1].title} — {workflowSteps[activeStep - 1].subtitle}
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed max-w-2xl">
                {workflowSteps[activeStep - 1].desc}
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {activeStep > 1 && (
                <button
                  onClick={() => setActiveStep(activeStep - 1)}
                  className="clinical-btn-secondary h-8 px-3 text-xs"
                >
                  Previous
                </button>
              )}
              {activeStep < 5 ? (
                <button
                  onClick={() => setActiveStep(activeStep + 1)}
                  className="clinical-btn-primary h-8 px-3 text-xs flex items-center gap-1"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={onRegisterHospital}
                  className="clinical-btn-primary bg-[#16A34A] hover:bg-[#15803D] h-8 px-3 text-xs flex items-center gap-1"
                >
                  <span>Launch Platform</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 3 Core Platform Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-2 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <div className="w-9 h-9 rounded-lg bg-[#EAF2FF] border border-[#C9DBF8] flex items-center justify-center text-[#2563EB]">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wide">Multi-Hospital Data Isolation</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Every hospital organization operates in strict cryptographic isolation. Hospital A staff can never access, query, or view Hospital B's patients or clinical data.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-2 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <div className="w-9 h-9 rounded-lg bg-[#FDECEC] border border-[#F3A6A6] flex items-center justify-center text-[#DC2626]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wide">Clinical Safety First</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Deterministic 12 red flag safety matrix and physiological validation ensure worst-case acuity is never under-triaged by AI.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 space-y-2 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <div className="w-9 h-9 rounded-lg bg-[#EAF8EF] border border-[#B7E4C7] flex items-center justify-center text-[#16A34A]">
              <ClipboardList className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wide">Longitudinal Patient Record</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Longitudinal patient profile consolidates overview, medical history, consultations, triage records, doctor notes, allergies, and vertical timeline.
            </p>
          </div>
        </div>

        {/* Research Prototype Disclaimer Banner */}
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg text-center space-y-1 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#172033]">
            <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Research & Clinical Decision-Support Prototype</span>
          </div>
          <p className="text-[11px] text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            PatientTriage.ai is a clinical decision-support research prototype using synthetic data. Core philosophy: <strong className="text-[#172033]">"AI recommends. Humans decide."</strong>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white py-4 text-center text-xs text-[#64748B]">
        <p>PatientTriage.ai • Hospital Clinical Decision-Support Platform Prototype • 2026</p>
      </footer>
    </div>
  );
};
