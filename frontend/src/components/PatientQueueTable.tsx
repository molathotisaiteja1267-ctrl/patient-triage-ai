import React from 'react';
import { EmergencyQueue } from './EmergencyQueue';

interface PatientQueueTableProps {
  patients: any[];
  onSelectPatient: (patientId: string) => void;
  onNewIntake: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const PatientQueueTable: React.FC<PatientQueueTableProps> = (props) => {
  return <EmergencyQueue {...props} />;
};
