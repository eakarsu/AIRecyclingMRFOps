import React from 'react';
import AIPage from '../components/AIPage';
import { aiDowntimeRCA } from '../services/api';

export default function AIDowntimeRCAPage() {
  return (
    <AIPage
      title="AI · Downtime Root-Cause Analysis"
      feature="downtime-rca"
      subtitle="Identify chronic offenders and preventive actions from recent downtime."
      inputs={[
        { key: 'context_notes', label: 'Context / Bias notes', type: 'textarea',
          placeholder: 'Optional — focus on a specific line, equipment, or shift.' },
      ]}
      run={(v) => aiDowntimeRCA({ context_notes: v.context_notes })}
      buttonLabel="Run RCA"
    />
  );
}
