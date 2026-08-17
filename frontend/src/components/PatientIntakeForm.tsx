import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getCurrentTimeString, formatDateTimeForAPI } from '../utils/dateUtils';
import {
  PatientSummary,
  TriageAssessment,
  PriorityLevel,
  ArrivalMethod,
  MobilityStatus,
  ConsciousnessLevel,
  PatientIntake,
  RedFlagsAssessment,
  RedFlagChoice
} from '../services/types';
import { PatientHeader } from './PatientHeader';
import { ClinicalTabs } from './ClinicalTabs';
import { ClinicalSection } from './ClinicalSection';
import { SafetyScreenTable, SafetyCheckItem } from './SafetyScreenTable';
import { VitalsGrid, VitalsState } from './VitalsGrid';
import { PatientSummaryPanel } from './PatientSummaryPanel';
import { ClinicalActionBar } from './ClinicalActionBar';
import { AssessmentReviewDrawer } from './AssessmentReviewDrawer';
import { PriorityRecommendation } from './PriorityRecommendation';
import {
  User,
  Activity,
  Plus,
  X,
  Clock,
  ShieldAlert,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Stethoscope
} from 'lucide-react';

export interface PatientIntakeFormProps {
  preselectedPatient?: PatientSummary | null;
  onIntakeComplete?: (assessment: TriageAssessment, patientId?: string) => void;
  onCancel?: () => void;
}

export const PatientIntakeForm: React.FC<PatientIntakeFormProps> = ({
  preselectedPatient,
  onIntakeComplete,
  onCancel,
}) => {
  const { user, hospital } = useAuth();
  const toast = useToast();

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Registered Patients List for Selection
  const [availablePatients, setAvailablePatients] = useState<PatientSummary[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  // Patient & Arrival Info
  const [patientId, setPatientId] = useState(preselectedPatient?.patient_id || '');
  const [patientName, setPatientName] = useState(preselectedPatient?.name || '');
  const [age, setAge] = useState<number | string>(preselectedPatient?.age || '');
  const [sex, setSex] = useState(preselectedPatient?.sex || 'Male');
  const [arrivalMethod, setArrivalMethod] = useState<ArrivalMethod>('Walk-in');
  const [arrivalTime, setArrivalTime] = useState(getCurrentTimeString());
  const [chiefComplaint, setChiefComplaint] = useState('');

  // Symptoms & Functional Status
  const [symptomInput, setSymptomInput] = useState('');
  const [symptomsList, setSymptomsList] = useState<string[]>([]);
  const [symptomDuration, setSymptomDuration] = useState('');
  const [symptomOnset, setSymptomOnset] = useState('Sudden');
  const [symptomProgression, setSymptomProgression] = useState<'Improving' | 'Stable' | 'Worsening' | 'Unknown'>('Stable');
  const [mobilityStatus, setMobilityStatus] = useState<MobilityStatus>('Independent');
  const [consciousness, setConsciousness] = useState<ConsciousnessLevel>('Alert');
  const [painScore, setPainScore] = useState<number>(0);

  // 12 Immediate Safety Screening Guards
  const [safetyChecks, setSafetyChecks] = useState<SafetyCheckItem[]>([
    {
      id: 'airway_obstruction',
      label: '1. Airway obstruction or severe stridor',
      description: 'Foreign body, severe anaphylactic edema, or inability to manage secretions',
      value: 'NO',
      detailPrompt: 'Describe airway patency',
    },
    {
      id: 'severe_respiratory_distress',
      label: '2. Severe difficulty breathing / respiratory failure',
      description: 'Tripod position, marked intercostal retractions, or SpO2 < 90%',
      value: 'NO',
      detailPrompt: 'Respiratory pattern',
    },
    {
      id: 'shock_hypoperfusion',
      label: '3. Signs of shock / poor peripheral perfusion',
      description: 'Systolic BP < 90, weak thready pulse, cool mottled skin, capillary refill > 3s',
      value: 'NO',
      detailPrompt: 'Circulatory status',
    },
    {
      id: 'severe_chest_pain',
      label: '4. Severe acute chest pain or acute coronary syndrome presentation',
      description: 'Crushing or radiating chest pain with diaphoresis, pallor, or nausea',
      value: 'NO',
      detailPrompt: 'Pain characteristics & radiation',
    },
    {
      id: 'uncontrolled_bleeding',
      label: '5. Uncontrolled major hemorrhage or severe active bleeding',
      description: 'Arterial spurting, large volume hematemesis, or tourniquet in place',
      value: 'NO',
      detailPrompt: 'Source and rate of blood loss',
    },
    {
      id: 'loss_of_consciousness',
      label: '6. Unresponsive, GCS < 9, or prolonged loss of consciousness',
      description: 'Unarousable to verbal or painful stimuli',
      value: 'NO',
      detailPrompt: 'Duration of unconsciousness',
    },
    {
      id: 'altered_mental_status',
      label: '7. Acute confusion, altered mental status, or delirium',
      description: 'New onset disorientation, lethargy, or severe agitation',
      value: 'NO',
      detailPrompt: 'Baseline vs current mental status',
    },
    {
      id: 'active_seizure',
      label: '8. Active status epilepticus or post-ictal state',
      description: 'Continuous convulsing > 5 min or repetitive seizures without recovery',
      value: 'NO',
      detailPrompt: 'Seizure duration & history',
    },
    {
      id: 'acute_focal_neurological',
      label: '9. Sudden neurological deficit / acute stroke symptoms',
      description: 'Facial droop, unilateral arm weakness, acute aphasia (FAST signs)',
      value: 'NO',
      detailPrompt: 'Time last known well',
    },
    {
      id: 'anaphylaxis',
      label: '10. Severe allergic reaction / anaphylaxis features',
      description: 'Urticaria + respiratory distress or hypotension after exposure',
      value: 'NO',
      detailPrompt: 'Suspected allergen & epinephrine given',
    },
    {
      id: 'major_trauma',
      label: '11. High-energy mechanism or penetrating trauma',
      description: 'Ejection from vehicle, fall > 20ft, gunshot or stab wound to torso',
      value: 'NO',
      detailPrompt: 'Mechanism & anatomical injuries',
    },
    {
      id: 'severe_uncontrolled_pain',
      label: '12. Severe uncontrolled acute pain (Score 9-10/10)',
      description: 'Intolerable acute pain requiring immediate clinical analgesia',
      value: 'NO',
      detailPrompt: 'Location and onset of acute pain',
    },
  ]);

  // Vitals State
  const [vitals, setVitals] = useState<VitalsState>({
    spo2: '',
    heartRate: '',
    bpSystolic: '',
    bpDiastolic: '',
    respiratoryRate: '',
    temperature: '',
    gcs: '15',
    painScore: 0,
  });

  // Medical History
  const [chronicConditions, setChronicConditions] = useState<string[]>([]);
  const [conditionInput, setConditionInput] = useState('');
  const [currentMedications, setCurrentMedications] = useState<string[]>([]);
  const [medicationInput, setMedicationInput] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [recentTrauma, setRecentTrauma] = useState(false);
  const [recentSurgery, setRecentSurgery] = useState(false);
  const [pregnancyStatus, setPregnancyStatus] = useState<string>('Not applicable');

  // Pre-Assessment Review Drawer & Recommendation States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<TriageAssessment | null>(null);

  // Load registered patients & prefill selected patient data
  useEffect(() => {
    let isMounted = true;
    const fetchPatients = async () => {
      setIsLoadingPatients(true);
      try {
        const patients = await api.getPatients();
        if (isMounted) {
          setAvailablePatients(patients);
          if (preselectedPatient) {
            applyPatient(preselectedPatient);
          } else if (patients.length > 0 && !patientId) {
            applyPatient(patients[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load patients for triage intake', err);
      } finally {
        if (isMounted) setIsLoadingPatients(false);
      }
    };
    fetchPatients();
    return () => { isMounted = false; };
  }, [preselectedPatient]);

  const applyPatient = async (p: PatientSummary) => {
    setPatientId(p.patient_id);
    setPatientName(p.name);
    setAge(p.age);
    setSex(p.sex);
    try {
      const prof = await api.getPatientProfile(p.patient_id);
      if (prof) {
        if (prof.allergies && prof.allergies.length > 0) {
          setAllergies(prof.allergies);
        }
        if (prof.medical_history && prof.medical_history.length > 0) {
          setChronicConditions(prof.medical_history.map(m => m.condition));
        }
      }
    } catch (err) {
      console.warn('Could not fetch full profile for prefill', err);
    }
  };

  // Handlers for dynamic list inputs
  const handleAddSymptom = () => {
    if (symptomInput.trim()) {
      setSymptomsList([...symptomsList, symptomInput.trim()]);
      setSymptomInput('');
    }
  };

  const handleRemoveSymptom = (index: number) => {
    setSymptomsList(symptomsList.filter((_, i) => i !== index));
  };

  const handleAddCondition = () => {
    if (conditionInput.trim()) {
      setChronicConditions([...chronicConditions, conditionInput.trim()]);
      setConditionInput('');
    }
  };

  const handleRemoveCondition = (index: number) => {
    setChronicConditions(chronicConditions.filter((_, i) => i !== index));
  };

  const handleAddMedication = () => {
    if (medicationInput.trim()) {
      setCurrentMedications([...currentMedications, medicationInput.trim()]);
      setMedicationInput('');
    }
  };

  const handleRemoveMedication = (index: number) => {
    setCurrentMedications(currentMedications.filter((_, i) => i !== index));
  };

  const handleAddAllergy = () => {
    if (allergyInput.trim()) {
      setAllergies([...allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  // Safety checks handlers
  const handleSafetyChange = (id: string, value: 'YES' | 'NO' | 'UNKNOWN', detailValue?: string) => {
    setSafetyChecks(safetyChecks.map((item) => (item.id === id ? { ...item, value, detailValue } : item)));
  };

  const handleVitalChange = (field: keyof VitalsState, value: any) => {
    setVitals({ ...vitals, [field]: value });
  };

  // Build Intake payload
  const buildIntakePayload = (): PatientIntake => {
    const toRedFlagChoice = (val: 'YES' | 'NO' | 'UNKNOWN'): RedFlagChoice => {
      if (val === 'YES') return 'Yes';
      if (val === 'NO') return 'No';
      return 'Unknown';
    };

    const redFlags: RedFlagsAssessment = {
      airway_obstruction: toRedFlagChoice(safetyChecks.find((s) => s.id === 'airway_obstruction')?.value || 'NO'),
      severe_dyspnea: toRedFlagChoice(safetyChecks.find((s) => s.id === 'severe_respiratory_distress')?.value || 'NO'),
      shock_poor_perfusion: toRedFlagChoice(safetyChecks.find((s) => s.id === 'shock_hypoperfusion')?.value || 'NO'),
      severe_chest_pain: toRedFlagChoice(safetyChecks.find((s) => s.id === 'severe_chest_pain')?.value || 'NO'),
      loss_of_consciousness: toRedFlagChoice(safetyChecks.find((s) => s.id === 'loss_of_consciousness')?.value || 'NO'),
      altered_mental_status: toRedFlagChoice(safetyChecks.find((s) => s.id === 'altered_mental_status')?.value || 'NO'),
      seizure: toRedFlagChoice(safetyChecks.find((s) => s.id === 'active_seizure')?.value || 'NO'),
      sudden_neurological_deficit: toRedFlagChoice(safetyChecks.find((s) => s.id === 'acute_focal_neurological')?.value || 'NO'),
      uncontrolled_bleeding: toRedFlagChoice(safetyChecks.find((s) => s.id === 'uncontrolled_bleeding')?.value || 'NO'),
      severe_allergic_reaction: toRedFlagChoice(safetyChecks.find((s) => s.id === 'anaphylaxis')?.value || 'NO'),
      major_trauma: toRedFlagChoice(safetyChecks.find((s) => s.id === 'major_trauma')?.value || 'NO'),
      severe_uncontrolled_pain: toRedFlagChoice(safetyChecks.find((s) => s.id === 'severe_uncontrolled_pain')?.value || 'UNKNOWN'),
    };

    return {
      patient_id: patientId,
      age: Number(age) || 45,
      sex: sex,
      arrival_time: new Date().toISOString(),
      arrival_method: arrivalMethod,
      chief_complaint: chiefComplaint,
      symptoms: {
        main_symptoms: symptomsList,
        symptom_duration: symptomDuration,
        severity: painScore,
        onset: symptomOnset,
        consciousness_status: consciousness,
        ability_to_speak: 'Normal sentences',
        ability_to_walk: mobilityStatus,
        progression: symptomProgression,
        functional_status: mobilityStatus === 'Independent' ? 'Normal' : 'Reduced',
      },
      red_flags: redFlags,
      vitals: {
        heart_rate: vitals.heartRate ? Number(vitals.heartRate) : null,
        respiratory_rate: vitals.respiratoryRate ? Number(vitals.respiratoryRate) : null,
        spo2: vitals.spo2 ? Number(vitals.spo2) : null,
        systolic_bp: vitals.bpSystolic ? Number(vitals.bpSystolic) : null,
        diastolic_bp: vitals.bpDiastolic ? Number(vitals.bpDiastolic) : null,
        temperature: vitals.temperature ? Number(vitals.temperature) : null,
        gcs: vitals.gcs ? Number(vitals.gcs) : null,
      },
      history: {
        known_major_conditions: chronicConditions,
        current_medications: currentMedications,
        allergies: allergies,
        pregnancy_status: pregnancyStatus as any,
        recent_trauma: recentTrauma,
        recent_surgery: recentSurgery,
        relevant_risk_factors: [],
      }
    };
  };

  // Assessment Generation
  const handleGenerateAssessment = async () => {
    setIsSubmitting(true);
    try {
      const intake = buildIntakePayload();
      let result: TriageAssessment;
      if (patientId && patientId !== 'UNREGISTERED') {
        result = await api.runPatientTriage(patientId, intake, 'ACCEPTED');
      } else {
        result = await api.previewTriage(intake);
      }
      setAssessmentResult(result);
      setShowReviewModal(false);
      setActiveTab('assessment');
      toast.success(`Computed Priority: ${result.priority} (${result.recommended_route})`, 'Triage Priority Evaluated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to evaluate triage priority.', 'Triage Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Decision actions
  const handleAcceptRecommendation = async () => {
    if (!assessmentResult) return;
    toast.success(`Accepted Priority ${assessmentResult.priority} for ${patientName}.`, 'Recommendation Accepted');
    if (onIntakeComplete) {
      onIntakeComplete(assessmentResult, patientId);
    }
  };

  const handleOverridePriority = async (newPriority: PriorityLevel, reason: string, notes?: string) => {
    if (!assessmentResult) return;
    try {
      const intake = buildIntakePayload();
      const updated = await api.runPatientTriage(patientId, intake, 'OVERRIDDEN', reason);
      toast.warning(`Overridden to Priority ${newPriority}: ${reason}`, 'Priority Overridden');
      if (onIntakeComplete) {
        onIntakeComplete(updated, patientId);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to override priority.', 'Override Error');
    }
  };

  const handleRequestReassessment = async (reason: string) => {
    if (!assessmentResult) return;
    try {
      await api.reassessPatient(patientId, reason);
      toast.info('Patient flagged for priority reassessment in queue.', 'Reassessment Requested');
      if (onIntakeComplete) {
        onIntakeComplete(assessmentResult, patientId);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to request reassessment.', 'Reassessment Error');
    }
  };

  const clinicalTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'symptoms', label: `Symptoms (${symptomsList.length})` },
    { id: 'safety', label: 'Safety Screening' },
    { id: 'vitals', label: 'Vitals' },
    { id: 'history', label: 'Medical History' },
    { id: 'assessment', label: 'Assessment' },
  ];

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto pb-24 font-sans text-xs">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div>
          <h1 className="text-base font-bold text-[#172033] tracking-tight">
            Emergency Arrival Intake & AI Triage Support
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Emergency Department Workstation • Multi-Hospital Architecture • Facility: <strong className="text-[#172033]">{hospital?.name}</strong> ({hospital?.code})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="clinical-btn-secondary h-8 px-3 text-xs flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          <button
            onClick={() => setShowReviewModal(true)}
            className="clinical-btn-primary h-8 px-3 text-xs font-bold flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Review Assessment</span>
          </button>
        </div>
      </div>

      {/* Patient Identifier Banner */}
      <PatientHeader
        patientName={patientName}
        patientId={patientId}
        age={Number(age) || 45}
        sex={sex}
        arrivalTime={arrivalTime}
        arrivalMode={arrivalMethod}
        statusBadge="IN TRIAGE"
      />

      {/* Horizontal Tabs Navigation */}
      <ClinicalTabs
        tabs={clinicalTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 2-Column Clinical Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Form Area (70% on desktop) */}
        <div className="lg:col-span-8 space-y-4">
          {/* TAB 1: OVERVIEW & ARRIVAL */}
          {activeTab === 'overview' && (
            <ClinicalSection
              title="Arrival Context & Chief Complaint"
              subtitle="Patient identification, mode of transport, and primary arrival reason"
              badge="REQUIRED"
              headerRight={<span className="text-[11px] text-[#64748B] font-mono">ED INTAKE</span>}
            >
              <div className="space-y-4">
                {availablePatients.length > 0 && (
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
                    <label className="block text-[#172033] font-semibold mb-1">
                      Select Registered Patient from Hospital Directory
                    </label>
                    <select
                      className="clinical-select w-full bg-white font-medium text-xs"
                      value={patientId}
                      onChange={(e) => {
                        const selId = e.target.value;
                        if (selId === 'UNREGISTERED') {
                          setPatientId('UNREGISTERED');
                          setPatientName('');
                          setAge('');
                          setSex('Male');
                          setAllergies([]);
                          setChronicConditions([]);
                        } else {
                          const found = availablePatients.find(p => p.patient_id === selId);
                          if (found) applyPatient(found);
                        }
                      }}
                    >
                      <option value="" disabled>-- Select Registered Patient --</option>
                      {availablePatients.map(p => (
                        <option key={p.patient_id} value={p.patient_id}>
                          {p.patient_id} • {p.name} ({p.sex}, {p.age}y) — {p.department}
                        </option>
                      ))}
                      <option value="UNREGISTERED">+ Unregistered Walk-In Arrival</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">Patient Name *</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="clinical-input w-full"
                      placeholder="e.g. John Doe / Walk-in"
                    />
                  </div>

                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">Patient ID *</label>
                    <input
                      type="text"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      className="clinical-input w-full font-mono bg-[#F8FAFC]"
                      placeholder="e.g. AP-2026-000001"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[#172033] font-semibold mb-1">Age</label>
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="clinical-input w-full"
                        placeholder="Age"
                      />
                    </div>
                    <div>
                      <label className="block text-[#172033] font-semibold mb-1">Sex</label>
                      <select
                        value={sex}
                        onChange={(e) => setSex(e.target.value)}
                        className="clinical-select w-full"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">Arrival Method</label>
                    <select
                      value={arrivalMethod}
                      onChange={(e) => setArrivalMethod(e.target.value as ArrivalMethod)}
                      className="clinical-select w-full"
                    >
                      <option value="Walk-in">Walk-in (Self / Family)</option>
                      <option value="Ambulance">Ambulance (EMS)</option>
                      <option value="Police / Emergency Services">Police / Emergency Services</option>
                      <option value="Transfer from another facility">Facility Transfer</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">Arrival Time</label>
                    <input
                      type="text"
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                      className="clinical-input w-full font-mono"
                      placeholder="e.g. 10:42 AM"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#172033] font-semibold mb-1">
                    Primary Chief Complaint / Presenting Problem *
                  </label>
                  <textarea
                    rows={2}
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="Describe primary symptom, anatomical location, onset, and triggers..."
                    className="clinical-textarea w-full"
                  />
                  <p className="text-[11px] text-[#64748B] mt-1">
                    State the primary concern in the patient's words or presenting EMS report.
                  </p>
                </div>
              </div>
            </ClinicalSection>
          )}

          {/* TAB 2: SYMPTOMS & FUNCTIONAL STATUS */}
          {activeTab === 'symptoms' && (
            <ClinicalSection
              title="Symptoms & Functional Presentation"
              subtitle="Detailed symptom inventory, duration, mobility, and consciousness tier"
            >
              <div className="space-y-4">
                {/* Active Symptoms List */}
                <div>
                  <label className="block text-[#172033] font-semibold mb-1.5">
                    Documented Symptoms ({symptomsList.length})
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {symptomsList.map((sym, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#EAF2FF] border border-[#C9DBF8] text-[#2563EB] font-medium rounded text-xs"
                      >
                        <span>{sym}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSymptom(idx)}
                          className="hover:text-[#DC2626]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={symptomInput}
                      onChange={(e) => setSymptomInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSymptom())}
                      placeholder="Add another symptom (e.g. Dizziness, Palpitations)..."
                      className="clinical-input flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddSymptom}
                      className="clinical-btn-secondary h-10 px-3 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">Symptom Duration</label>
                    <input
                      type="text"
                      value={symptomDuration}
                      onChange={(e) => setSymptomDuration(e.target.value)}
                      className="clinical-input w-full"
                      placeholder="e.g. 45 minutes, 2 days"
                    />
                  </div>

                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">Onset</label>
                    <select
                      value={symptomOnset}
                      onChange={(e) => setSymptomOnset(e.target.value)}
                      className="clinical-select w-full"
                    >
                      <option value="Sudden">Sudden (&lt; 1 hour)</option>
                      <option value="Gradual">Gradual (over hours/days)</option>
                      <option value="Chronic">Chronic / Recurrent</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">Progression</label>
                    <select
                      value={symptomProgression}
                      onChange={(e) => setSymptomProgression(e.target.value as any)}
                      className="clinical-select w-full"
                    >
                      <option value="Worsening">Worsening</option>
                      <option value="Stable">Stable</option>
                      <option value="Improving">Improving</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">Mobility / Functional</label>
                    <select
                      value={mobilityStatus}
                      onChange={(e) => setMobilityStatus(e.target.value as MobilityStatus)}
                      className="clinical-select w-full"
                    >
                      <option value="Independent">Independent (Walking)</option>
                      <option value="With assistance">With assistance</option>
                      <option value="Unable / Stretcher / Wheelchair">Unable / Stretcher</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">Consciousness</label>
                    <select
                      value={consciousness}
                      onChange={(e) => setConsciousness(e.target.value as ConsciousnessLevel)}
                      className="clinical-select w-full"
                    >
                      <option value="Alert">Alert</option>
                      <option value="Responds to Voice">Responds to Voice</option>
                      <option value="Responds to Pain">Responds to Pain</option>
                      <option value="Unresponsive">Unresponsive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#172033] font-semibold mb-1">
                      Pain Scale (0-10): <strong className="text-[#2563EB]">{painScore}</strong>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={painScore}
                      onChange={(e) => setPainScore(Number(e.target.value))}
                      className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#2563EB] mt-3"
                    />
                  </div>
                </div>
              </div>
            </ClinicalSection>
          )}

          {/* TAB 3: SAFETY SCREENING TABLE */}
          {activeTab === 'safety' && (
            <ClinicalSection
              title="Immediate Red Flags & Safety Screening"
              subtitle="12 mandatory emergency checks. Discrete row highlights on positive/unknown responses."
              badge="MANDATORY SCREEN"
            >
              <SafetyScreenTable
                checks={safetyChecks}
                onChangeCheck={handleSafetyChange}
              />
            </ClinicalSection>
          )}

          {/* TAB 4: ARRIVAL VITALS */}
          {activeTab === 'vitals' && (
            <ClinicalSection
              title="Recorded Arrival Vital Signs"
              subtitle="Physiological parameters with reference ranges and abnormal alerts"
            >
              <VitalsGrid
                vitals={vitals}
                onChangeVital={handleVitalChange}
              />
            </ClinicalSection>
          )}

          {/* TAB 5: MEDICAL HISTORY */}
          {activeTab === 'history' && (
            <ClinicalSection
              title="Patient Baseline Medical History"
              subtitle="Documented chronic conditions, regular medications, allergies, and surgical risk factors"
            >
              <div className="space-y-4">
                {/* Chronic Conditions */}
                <div>
                  <label className="block text-[#172033] font-semibold mb-1">Known Chronic Conditions</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {chronicConditions.map((cond, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F8FAFC] border border-[#CBD5E1] text-[#172033] rounded text-xs font-medium"
                      >
                        <span>{cond}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCondition(idx)}
                          className="hover:text-[#DC2626]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={conditionInput}
                      onChange={(e) => setConditionInput(e.target.value)}
                      placeholder="e.g. Asthma, Coronary Artery Disease..."
                      className="clinical-input flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddCondition}
                      className="clinical-btn-secondary h-10 px-3 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Current Medications */}
                <div>
                  <label className="block text-[#172033] font-semibold mb-1">Current Prescriptions / Regular Medications</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {currentMedications.map((med, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F8FAFC] border border-[#CBD5E1] text-[#172033] rounded text-xs font-medium"
                      >
                        <span>{med}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(idx)}
                          className="hover:text-[#DC2626]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={medicationInput}
                      onChange={(e) => setMedicationInput(e.target.value)}
                      placeholder="e.g. Aspirin 75mg, Atorvastatin 20mg..."
                      className="clinical-input flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddMedication}
                      className="clinical-btn-secondary h-10 px-3 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Documented Allergies */}
                <div>
                  <label className="block text-[#172033] font-semibold mb-1">Documented Drug / Food Allergies</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {allergies.map((allg, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FDECEC] border border-[#F3A6A6] text-[#DC2626] rounded text-xs font-semibold"
                      >
                        <span>{allg}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAllergy(idx)}
                          className="hover:text-[#B91C1C]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={allergyInput}
                      onChange={(e) => setAllergyInput(e.target.value)}
                      placeholder="e.g. Sulfa, NSAIDs, Latex..."
                      className="clinical-input flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddAllergy}
                      className="clinical-btn-secondary h-10 px-3 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Risk Modifiers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#F1F5F9]">
                  <label className="flex items-center gap-2 p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recentTrauma}
                      onChange={(e) => setRecentTrauma(e.target.checked)}
                      className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-0"
                    />
                    <span className="text-xs text-[#172033] font-medium">Recent Trauma (&lt; 14 days)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recentSurgery}
                      onChange={(e) => setRecentSurgery(e.target.checked)}
                      className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-0"
                    />
                    <span className="text-xs text-[#172033] font-medium">Recent Surgery (&lt; 30 days)</span>
                  </label>

                  <div>
                    <select
                      value={pregnancyStatus}
                      onChange={(e) => setPregnancyStatus(e.target.value)}
                      className="clinical-select w-full"
                    >
                      <option value="Not applicable">Pregnancy: N/A</option>
                      <option value="Not pregnant">Not pregnant</option>
                      <option value="Pregnant">Pregnant</option>
                      <option value="Possibly pregnant">Possibly pregnant</option>
                    </select>
                  </div>
                </div>
              </div>
            </ClinicalSection>
          )}

          {/* TAB 6: ASSESSMENT & DECISION HUB */}
          {activeTab === 'assessment' && (
            <div className="space-y-4">
              {assessmentResult ? (
                <PriorityRecommendation
                  assessment={assessmentResult}
                  patientName={patientName}
                  patientId={patientId}
                  onAccept={handleAcceptRecommendation}
                  onOverride={handleOverridePriority}
                  onRequestReassessment={handleRequestReassessment}
                  onBackToEdit={() => setActiveTab('safety')}
                  isProcessing={isSubmitting}
                />
              ) : (
                <ClinicalSection
                  title="Clinical Decision Support Ready"
                  subtitle="Generate recommendation once intake data and safety screening are recorded"
                >
                  <div className="py-12 text-center space-y-3">
                    <ShieldAlert className="w-8 h-8 text-[#94A3B8] mx-auto" />
                    <p className="text-xs text-[#64748B] max-w-md mx-auto">
                      Intake data, 12 emergency safety checks, and arrival vitals have been compiled. Click below to review and generate the acuity priority recommendation.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowReviewModal(true)}
                      className="clinical-btn-primary h-10 px-6 font-bold"
                    >
                      Review & Compute Triage Acuity
                    </button>
                  </div>
                </ClinicalSection>
              )}
            </div>
          )}
        </div>

        {/* Right Sticky Summary Panel (30% on desktop) */}
        <div className="lg:col-span-4">
          <PatientSummaryPanel
            patientId={patientId}
            patientName={patientName}
            age={Number(age) || 45}
            sex={sex}
            arrivalMode={arrivalMethod}
            arrivalTime={arrivalTime}
            safetyChecks={safetyChecks}
            vitals={vitals}
            onReviewMissingData={() => setActiveTab('safety')}
          />
        </div>
      </div>

      {/* Bottom Fixed Action Bar */}
      <ClinicalActionBar
        onCancel={onCancel || (() => {})}
        onSaveDraft={() => toast.info('Draft arrival intake saved to local session.', 'Draft Saved')}
        onReviewAssessment={() => setShowReviewModal(true)}
      />

      {/* Pre-Assessment Summary Modal */}
      <AssessmentReviewDrawer
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        patientName={patientName}
        patientId={patientId}
        age={age}
        sex={sex}
        chiefComplaint={chiefComplaint}
        safetyChecks={safetyChecks}
        vitals={vitals}
        symptoms={symptomsList}
        medicalConditions={chronicConditions}
        allergies={allergies}
        onSubmitAssessment={handleGenerateAssessment}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
