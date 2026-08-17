import React from 'react';
import { Activity, Heart, Thermometer, Wind, AlertCircle } from 'lucide-react';

export interface VitalsState {
  spo2: string;
  heartRate: string;
  bpSystolic: string;
  bpDiastolic: string;
  respiratoryRate: string;
  temperature: string;
  gcs: string;
  painScore: number;
}

interface VitalsGridProps {
  vitals: VitalsState;
  onChangeVital?: (field: keyof VitalsState, value: any) => void;
  isEditable?: boolean;
}

export const VitalsGrid: React.FC<VitalsGridProps> = ({
  vitals,
  onChangeVital,
  isEditable = true,
}) => {
  // Helper to determine abnormality
  const getVitalStatus = (name: string, val: string) => {
    if (!val || val.trim() === '') return { status: 'EMPTY', text: 'NOT RECORDED' };
    const num = parseFloat(val);
    if (isNaN(num)) return { status: 'NORMAL', text: val };

    switch (name) {
      case 'spo2':
        if (num < 90) return { status: 'CRITICAL', text: `${num}% (Hypoxia)` };
        if (num < 95) return { status: 'WARNING', text: `${num}% (Sub-optimal)` };
        return { status: 'NORMAL', text: `${num}%` };
      case 'hr':
        if (num < 45 || num > 140) return { status: 'CRITICAL', text: `${num} bpm` };
        if (num < 60 || num > 100) return { status: 'WARNING', text: `${num} bpm` };
        return { status: 'NORMAL', text: `${num} bpm` };
      case 'rr':
        if (num < 8 || num > 30) return { status: 'CRITICAL', text: `${num} /min` };
        if (num < 12 || num > 20) return { status: 'WARNING', text: `${num} /min` };
        return { status: 'NORMAL', text: `${num} /min` };
      case 'temp':
        if (num >= 39.0 || num < 35.0) return { status: 'CRITICAL', text: `${num} °C` };
        if (num >= 38.0) return { status: 'WARNING', text: `${num} °C` };
        return { status: 'NORMAL', text: `${num} °C` };
      case 'gcs':
        if (num <= 8) return { status: 'CRITICAL', text: `${num}/15 (Severe)` };
        if (num <= 13) return { status: 'WARNING', text: `${num}/15 (Moderate)` };
        return { status: 'NORMAL', text: `${num}/15` };
      default:
        return { status: 'NORMAL', text: val };
    }
  };

  const getBpStatus = (sys: string, dia: string) => {
    if (!sys || !dia) return { status: 'EMPTY', text: 'NOT RECORDED' };
    const s = parseFloat(sys);
    const d = parseFloat(dia);
    if (isNaN(s) || isNaN(d)) return { status: 'NORMAL', text: `${sys}/${dia} mmHg` };
    if (s < 90 || s > 180 || d > 110) return { status: 'CRITICAL', text: `${s}/${d} mmHg` };
    if (s > 140 || d > 90) return { status: 'WARNING', text: `${s}/${d} mmHg` };
    return { status: 'NORMAL', text: `${s}/${d} mmHg` };
  };

  const spo2Status = getVitalStatus('spo2', vitals.spo2);
  const hrStatus = getVitalStatus('hr', vitals.heartRate);
  const rrStatus = getVitalStatus('rr', vitals.respiratoryRate);
  const tempStatus = getVitalStatus('temp', vitals.temperature);
  const gcsStatus = getVitalStatus('gcs', vitals.gcs);
  const bpStatus = getBpStatus(vitals.bpSystolic, vitals.bpDiastolic);

  const getCardBorder = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return 'border-[#F3A6A6] bg-[#FDECEC]/30';
      case 'WARNING':
        return 'border-[#F5C451] bg-[#FFF7E6]/30';
      default:
        return 'border-[#E2E8F0] bg-white';
    }
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-4">
      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
        <div>
          <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wide">
            ARRIVAL VITALS
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Initial physiological observations recorded at presentation
          </p>
        </div>
      </div>

      {/* 6-box Vitals Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* SpO2 */}
        <div className={`p-3 border rounded-lg ${getCardBorder(spo2Status.status)}`}>
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-1 font-medium">
            <span>SpO₂</span>
            <Wind className="w-3.5 h-3.5 text-[#2563EB]" />
          </div>
          {isEditable && onChangeVital ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={vitals.spo2}
                onChange={(e) => onChangeVital('spo2', e.target.value)}
                placeholder="—"
                className="clinical-input w-full h-8 text-sm font-bold"
              />
              <span className="text-xs text-[#64748B] font-medium">%</span>
            </div>
          ) : (
            <div className={`text-sm font-bold ${
              spo2Status.status === 'CRITICAL' ? 'text-[#DC2626]' :
              spo2Status.status === 'WARNING' ? 'text-[#D97706]' :
              spo2Status.status === 'EMPTY' ? 'text-[#94A3B8]' : 'text-[#172033]'
            }`}>
              {spo2Status.text}
            </div>
          )}
          <div className="text-[10px] text-[#94A3B8] mt-1">Ref: 95 – 100%</div>
        </div>

        {/* Heart Rate */}
        <div className={`p-3 border rounded-lg ${getCardBorder(hrStatus.status)}`}>
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-1 font-medium">
            <span>Heart Rate</span>
            <Heart className="w-3.5 h-3.5 text-[#DC2626]" />
          </div>
          {isEditable && onChangeVital ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={vitals.heartRate}
                onChange={(e) => onChangeVital('heartRate', e.target.value)}
                placeholder="—"
                className="clinical-input w-full h-8 text-sm font-bold"
              />
              <span className="text-xs text-[#64748B] font-medium">bpm</span>
            </div>
          ) : (
            <div className={`text-sm font-bold ${
              hrStatus.status === 'CRITICAL' ? 'text-[#DC2626]' :
              hrStatus.status === 'WARNING' ? 'text-[#D97706]' :
              hrStatus.status === 'EMPTY' ? 'text-[#94A3B8]' : 'text-[#172033]'
            }`}>
              {hrStatus.text}
            </div>
          )}
          <div className="text-[10px] text-[#94A3B8] mt-1">Ref: 60 – 100 bpm</div>
        </div>

        {/* Blood Pressure */}
        <div className={`p-3 border rounded-lg ${getCardBorder(bpStatus.status)}`}>
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-1 font-medium">
            <span>Blood Pressure</span>
            <Activity className="w-3.5 h-3.5 text-[#2563EB]" />
          </div>
          {isEditable && onChangeVital ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={vitals.bpSystolic}
                onChange={(e) => onChangeVital('bpSystolic', e.target.value)}
                placeholder="Sys"
                className="clinical-input w-1/2 h-8 text-sm font-bold text-center px-1"
              />
              <span className="text-[#94A3B8]">/</span>
              <input
                type="number"
                value={vitals.bpDiastolic}
                onChange={(e) => onChangeVital('bpDiastolic', e.target.value)}
                placeholder="Dia"
                className="clinical-input w-1/2 h-8 text-sm font-bold text-center px-1"
              />
            </div>
          ) : (
            <div className={`text-sm font-bold ${
              bpStatus.status === 'CRITICAL' ? 'text-[#DC2626]' :
              bpStatus.status === 'WARNING' ? 'text-[#D97706]' :
              bpStatus.status === 'EMPTY' ? 'text-[#94A3B8]' : 'text-[#172033]'
            }`}>
              {bpStatus.text}
            </div>
          )}
          <div className="text-[10px] text-[#94A3B8] mt-1">Ref: 120/80 mmHg</div>
        </div>

        {/* Respiratory Rate */}
        <div className={`p-3 border rounded-lg ${getCardBorder(rrStatus.status)}`}>
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-1 font-medium">
            <span>Resp Rate</span>
            <Wind className="w-3.5 h-3.5 text-[#2563EB]" />
          </div>
          {isEditable && onChangeVital ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={vitals.respiratoryRate}
                onChange={(e) => onChangeVital('respiratoryRate', e.target.value)}
                placeholder="—"
                className="clinical-input w-full h-8 text-sm font-bold"
              />
              <span className="text-xs text-[#64748B] font-medium">/min</span>
            </div>
          ) : (
            <div className={`text-sm font-bold ${
              rrStatus.status === 'CRITICAL' ? 'text-[#DC2626]' :
              rrStatus.status === 'WARNING' ? 'text-[#D97706]' :
              rrStatus.status === 'EMPTY' ? 'text-[#94A3B8]' : 'text-[#172033]'
            }`}>
              {rrStatus.text}
            </div>
          )}
          <div className="text-[10px] text-[#94A3B8] mt-1">Ref: 12 – 20 /min</div>
        </div>

        {/* Temperature */}
        <div className={`p-3 border rounded-lg ${getCardBorder(tempStatus.status)}`}>
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-1 font-medium">
            <span>Temperature</span>
            <Thermometer className="w-3.5 h-3.5 text-[#F97316]" />
          </div>
          {isEditable && onChangeVital ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                value={vitals.temperature}
                onChange={(e) => onChangeVital('temperature', e.target.value)}
                placeholder="—"
                className="clinical-input w-full h-8 text-sm font-bold"
              />
              <span className="text-xs text-[#64748B] font-medium">°C</span>
            </div>
          ) : (
            <div className={`text-sm font-bold ${
              tempStatus.status === 'CRITICAL' ? 'text-[#DC2626]' :
              tempStatus.status === 'WARNING' ? 'text-[#D97706]' :
              tempStatus.status === 'EMPTY' ? 'text-[#94A3B8]' : 'text-[#172033]'
            }`}>
              {tempStatus.text}
            </div>
          )}
          <div className="text-[10px] text-[#94A3B8] mt-1">Ref: 36.5 – 37.5 °C</div>
        </div>

        {/* GCS (Glasgow Coma Scale) */}
        <div className={`p-3 border rounded-lg ${getCardBorder(gcsStatus.status)}`}>
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-1 font-medium">
            <span>GCS Score</span>
            <AlertCircle className="w-3.5 h-3.5 text-[#2563EB]" />
          </div>
          {isEditable && onChangeVital ? (
            <select
              value={vitals.gcs}
              onChange={(e) => onChangeVital('gcs', e.target.value)}
              className="clinical-select w-full h-8 text-sm font-bold py-0"
            >
              <option value="15">15 — Fully Alert & Oriented</option>
              <option value="14">14 — Mild Confusion</option>
              <option value="13">13 — Lethargic</option>
              <option value="12">12 — Stuporous</option>
              <option value="10">10 — Eye Open to Pain</option>
              <option value="8">8 — Severe Impairment (Coma)</option>
              <option value="3">3 — Completely Flaccid</option>
            </select>
          ) : (
            <div className={`text-sm font-bold ${
              gcsStatus.status === 'CRITICAL' ? 'text-[#DC2626]' :
              gcsStatus.status === 'WARNING' ? 'text-[#D97706]' :
              gcsStatus.status === 'EMPTY' ? 'text-[#94A3B8]' : 'text-[#172033]'
            }`}>
              {gcsStatus.text}
            </div>
          )}
          <div className="text-[10px] text-[#94A3B8] mt-1">Range: 3 – 15</div>
        </div>
      </div>
    </div>
  );
};
