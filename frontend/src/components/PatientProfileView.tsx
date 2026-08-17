import React from 'react';
import { PatientProfile } from './PatientProfile';
import { PatientSummary } from '../services/types';

interface PatientProfileViewProps {
  patientId: string;
  onBack: () => void;
  onRunTriageForPatient: (patient: PatientSummary) => void;
}

export const PatientProfileView: React.FC<PatientProfileViewProps> = (props) => {
  return <PatientProfile {...props} />;
};
