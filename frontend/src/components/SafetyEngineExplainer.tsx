import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  HeartPulse,
  Brain,
  FileSearch,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const SafetyEngineExplainer: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 p-6 rounded-2xl border border-blue-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Safety-First & Worst-Case-First Architecture
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Engineering rigorous guardrails for healthcare decision support: Preventing false reassurance and enforcing human oversight.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Core Pillars of Safety */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Pillar 1: Missing Data Handling */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <h3>1. Worst-Case Missing Data Handling</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Standard machine learning models often impute missing values to the population mean, creating dangerous false reassurance. PatientTriage.ai explicitly enforces:
          </p>
          <ul className="space-y-1.5 text-xs text-slate-400">
            <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>Never Assume Normal:</strong> If SpO2 is missing for a respiratory presentation, the patient is never downgraded to low acuity.</span>
            </li>
            <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>Acuity Escalation:</strong> Missing critical parameters automatically trigger safety flags and reduce confidence scores.</span>
            </li>
          </ul>
        </div>

        {/* Pillar 2: Physiological Plausibility */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <HeartPulse className="w-5 h-5" />
            <h3>2. Physiological Plausibility Bounds</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Automated sensor glitches and data entry errors are caught before affecting patient prioritization:
          </p>
          <ul className="space-y-1.5 text-xs text-slate-400">
            <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-rose-400 font-bold">•</span>
              <span><strong>Hard Physiological Limits:</strong> Heart Rate (20–300 bpm), SpO2 (40–100%), Systolic BP (30–300 mmHg), Temp (25–45°C).</span>
            </li>
            <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-rose-400 font-bold">•</span>
              <span><strong>Outlier Isolation:</strong> Implausible values flag <code className="text-rose-300 bg-rose-950/60 px-1 py-0.5 rounded">SUSPICIOUS_VALUES</code> and require nurse re-measurement.</span>
            </li>
          </ul>
        </div>

        {/* Pillar 3: Contradictory Data Detection */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
            <FileSearch className="w-5 h-5" />
            <h3>3. Contradictory Input Detection</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Cross-field clinical validation detects mutual inconsistencies in intake forms:
          </p>
          <ul className="space-y-1.5 text-xs text-slate-400">
            <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-purple-400 font-bold">•</span>
              <span><strong>Consciousness vs Mobility:</strong> Flags conflict if patient is marked <em>Unresponsive</em> but mobility is set to <em>Independent</em>.</span>
            </li>
            <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-purple-400 font-bold">•</span>
              <span><strong>Pressure Inversion:</strong> Catches reversed blood pressure entries (Systolic ≤ Diastolic).</span>
            </li>
          </ul>
        </div>

        {/* Pillar 4: Human-in-the-Loop & Immutable Audit */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Lock className="w-5 h-5" />
            <h3>4. Human Decision Authority</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The system cannot autonomously admit, discharge, or prescribe. All outputs are decision-support recommendations:
          </p>
          <ul className="space-y-1.5 text-xs text-slate-400">
            <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Mandatory Override Rationale:</strong> Staff can override any priority tier by recording an explicit clinical rationale.</span>
            </li>
            <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Immutable Audit Log:</strong> Every event stores full input snapshots, clinician IDs, and timestamps.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Priority Framework Matrix */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Transparent 5-Tier Triage Decision Matrix
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 rounded-xl badge-priority-red space-y-1.5">
            <div className="font-bold text-red-300 text-sm">RED • Immediate</div>
            <div className="text-[11px] text-red-200/90 font-medium">Life-threatening emergency</div>
            <p className="text-[10px] text-red-300/80">SpO2 &lt;88%, SBP &lt;80, GCS &lt;9, severe airway obstruction, active seizure.</p>
            <div className="text-[10px] font-bold text-red-200">Route: Resuscitation Bay</div>
          </div>

          <div className="p-3.5 rounded-xl badge-priority-orange space-y-1.5">
            <div className="font-bold text-orange-300 text-sm">ORANGE • Very Urgent</div>
            <div className="text-[11px] text-orange-200/90 font-medium">High risk presentation</div>
            <p className="text-[10px] text-orange-300/80">SpO2 89-93%, severe acute pain 8-10, suspected stroke, HR &gt;130 bpm.</p>
            <div className="text-[10px] font-bold text-orange-200">Route: High-Acuity Acute Area</div>
          </div>

          <div className="p-3.5 rounded-xl badge-priority-yellow space-y-1.5">
            <div className="font-bold text-yellow-300 text-sm">YELLOW • Urgent</div>
            <div className="text-[11px] text-yellow-200/90 font-medium">Timely assessment needed</div>
            <p className="text-[10px] text-yellow-300/80">Moderate distress, abdominal pain, high fever, closed fractures.</p>
            <div className="text-[10px] font-bold text-yellow-200">Route: ED Main Treatment</div>
          </div>

          <div className="p-3.5 rounded-xl badge-priority-green space-y-1.5">
            <div className="font-bold text-emerald-300 text-sm">GREEN • Less Urgent</div>
            <div className="text-[11px] text-emerald-200/90 font-medium">Stable presentation</div>
            <p className="text-[10px] text-emerald-300/80">Minor lacerations, mild sprains, sore throat with stable vitals.</p>
            <div className="text-[10px] font-bold text-emerald-200">Route: Fast-Track / Minor Injuries</div>
          </div>

          <div className="p-3.5 rounded-xl badge-priority-blue space-y-1.5">
            <div className="font-bold text-blue-300 text-sm">BLUE • Non-Emergency</div>
            <div className="text-[11px] text-blue-200/90 font-medium">Alternative pathway</div>
            <p className="text-[10px] text-blue-300/80">Prescription refill, routine suture removal, chronic mild symptom.</p>
            <div className="text-[10px] font-bold text-blue-200">Route: Sub-Acute / Primary Care</div>
          </div>
        </div>
      </div>
    </div>
  );
};
