import React from 'react';
import AIPage from '../components/AIPage';
import { aiBaleQualityGrade } from '../services/api';

export default function AIBaleQualityGradePage() {
  return (
    <AIPage
      title="AI · Bale Quality Grade"
      feature="bale-quality-grade"
      subtitle="Assign an ISRI-spec grade and ship recommendation to a finished bale."
      inputs={[
        { key: 'bale_id',          label: 'Bale ID' },
        { key: 'commodity',        label: 'Commodity', placeholder: 'PET, HDPE-Natural, OCC, Aluminum UBC, etc.' },
        { key: 'weight_kg',        label: 'Weight (kg)', type: 'number' },
        { key: 'inspection_notes', label: 'Inspection Notes', type: 'textarea',
          placeholder: 'Free-form: moisture, contaminants, density, baler issues, etc.' },
      ]}
      run={(v) => aiBaleQualityGrade(v)}
      buttonLabel="Grade Bale"
    />
  );
}
