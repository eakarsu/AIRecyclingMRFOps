import React from 'react';
import AIPage from '../components/AIPage';
import { aiEquipmentPrognostic } from '../services/api';

export default function AIEquipmentPrognosticPage() {
  return (
    <AIPage
      title="AI · Equipment Prognostic"
      feature="equipment-prognostic"
      subtitle="Predict component failures across plant equipment."
      inputs={[]}
      run={(_values, requestOptions) => aiEquipmentPrognostic({}, requestOptions)}
      buttonLabel="Run Prognostic"
    />
  );
}
