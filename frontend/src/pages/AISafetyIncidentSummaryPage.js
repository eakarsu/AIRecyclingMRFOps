import React from 'react';
import AIPage from '../components/AIPage';
import { aiSafetyIncidentSummary } from '../services/api';

export default function AISafetyIncidentSummaryPage() {
  return (
    <AIPage
      title="AI · Safety Incident Summary"
      feature="safety-incident-summary"
      subtitle="Daily safety stand-up summary across open + closed incidents."
      inputs={[]}
      run={() => aiSafetyIncidentSummary({})}
      buttonLabel="Summarize Safety"
    />
  );
}
