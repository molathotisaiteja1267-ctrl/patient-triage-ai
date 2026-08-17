import React, { useState } from 'react';
import {
  Flame,
  AlertTriangle,
  X,
  Clock,
  ShieldAlert,
  Gauge
} from 'lucide-react';

interface OverloadSimulationModalProps {
  currentLoad: string;
  onClose: () => void;
  onApplySurge: (level: string, multiplier: number) => Promise<void>;
  patientCount: number;
}

const SURGE_LEVELS = [
  {
    name: 'Normal',
    multiplier: 1.0,
    desc: 'Standard arrival rate. Baseline waiting times.',
    color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    badge: '1.0x Baseline',
  },
  {
    name: 'Moderate',
    multiplier: 1.5,
    desc: 'Elevated arrivals (+50%). Minor queue delays.',
    color: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
    badge: '1.5x Scaled Wait',
  },
  {
    name: 'High',
    multiplier: 2.5,
    desc: 'ED crowding. Resuscitation bays prioritized; lower acuity wait times escalate.',
    color: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
    badge: '2.5x High Surge',
  },
  {
    name: 'Critical Overload',
    multiplier: 4.0,
    desc: 'Severe emergency room saturation. High risk of clinical bottleneck without rapid triage routing.',
    color: 'border-red-500/50 bg-red-500/15 text-red-300',
    badge: '4.0x Critical Saturation',
  },
];

export const OverloadSimulationModal: React.FC<OverloadSimulationModalProps> = ({
  currentLoad,
  onClose,
  onApplySurge,
  patientCount,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<string>(currentLoad || 'Normal');
  const [isApplying, setIsApplying] = useState(false);

  const activeSurge = SURGE_LEVELS.find((l) => l.name === selectedLevel) || SURGE_LEVELS[0];

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApplySurge(activeSurge.name, activeSurge.multiplier);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Emergency Department Surge Simulator</h2>
              <p className="text-xs text-slate-400">
                Model real-time queue congestion and wait-time scaling across {patientCount} active patient(s).
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Surge Level Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SURGE_LEVELS.map((level) => {
            const isSelected = selectedLevel === level.name;
            return (
              <button
                key={level.name}
                type="button"
                onClick={() => setSelectedLevel(level.name)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? `${level.color} shadow-lg ring-1 ring-blue-500`
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-white">{level.name}</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-700">
                    {level.badge}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">{level.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Live Impact Preview */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-blue-400" />
            <span>Surge Impact Analysis:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
            <div>
              Waiting Multiplier: <strong className="text-slate-200">{activeSurge.multiplier}x</strong>
            </div>
            <div>
              Active Patients Affected: <strong className="text-slate-200">{patientCount}</strong>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isApplying}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-950/50"
          >
            {isApplying ? 'Applying Surge...' : `Apply ${activeSurge.name} Surge`}
          </button>
        </div>
      </div>
    </div>
  );
};
