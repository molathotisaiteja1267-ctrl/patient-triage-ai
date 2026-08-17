import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface DisclaimerBannerProps {
  variant?: 'top' | 'compact' | 'footer';
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ variant = 'top' }) => {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-950/40 border border-amber-500/30 rounded-lg text-amber-300 text-xs font-medium">
        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
        <span>Prototype Decision Support Only • Synthetic Data • Clinician Confirmation Required</span>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <footer className="mt-12 py-6 px-4 border-t border-slate-800 text-center text-xs text-slate-400 bg-slate-950/50">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-2 text-slate-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>PatientTriage.ai Research & Portfolio Prototype</span>
          </div>
          <p className="text-slate-400">
            <strong>Mandatory Medical Disclaimer:</strong> PatientTriage.ai is a portfolio decision-support demonstration utilizing 100% synthetic patient scenarios.
            It is NOT a certified medical device and must NEVER be used for real-world clinical diagnosis, prescription, or autonomous healthcare delivery.
            Clinical decisions must always be made by licensed healthcare professionals.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <div className="bg-amber-950/30 border-b border-amber-500/20 px-4 py-2 text-amber-200/90 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
          <span className="font-semibold text-amber-300 uppercase tracking-wider text-[10px] bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/40">
            Clinical Prototype
          </span>
          <span className="hidden sm:inline text-amber-200/80">
            Decision support assistance only. All recommendations require licensed staff verification.
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-amber-300/80">
          <span>Synthetic ED Data</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline font-mono">Worst-Case-First Guardrails Active</span>
        </div>
      </div>
    </div>
  );
};
