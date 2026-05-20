import React from 'react';
import AIPage from '../components/AIPage';
import { aiContaminationVisionScore } from '../services/api';

export default function AIContaminationVisionScorePage() {
  return (
    <AIPage
      title="AI · Contamination Vision Score"
      feature="contamination-vision-score"
      subtitle="Score an inbound load's contamination risk from a description and inspector notes."
      inputs={[
        { key: 'load_description', label: 'Load Description', type: 'textarea',
          placeholder: 'e.g. 14 t curbside single-stream from Republic Services Route 7. Mostly PET / OCC with some film and food residue.' },
        { key: 'sample_notes',     label: 'Inspector / Sample Notes', type: 'textarea',
          placeholder: 'Free-form: hazards spotted, recovery audit picks, AMP cam tags, etc.' },
      ]}
      run={(v) => aiContaminationVisionScore(v)}
      buttonLabel="Score Contamination"
    />
  );
}
