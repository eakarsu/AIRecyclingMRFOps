import React from 'react';
import AIPage from '../components/AIPage';
import { aiExecutiveBrief } from '../services/api';

export default function AIExecutiveBriefPage() {
  return (
    <AIPage
      title="AI · Executive Brief"
      feature="executive-brief"
      subtitle="Plant-manager snapshot covering throughput, quality, safety, and decisions."
      inputs={[
        { key: 'notes', label: 'Optional bias notes', type: 'textarea',
          placeholder: 'e.g. Bias the brief toward downtime / quality / safety.' },
      ]}
      run={(v) => aiExecutiveBrief({ notes: v.notes })}
      buttonLabel="Generate Brief"
    />
  );
}
