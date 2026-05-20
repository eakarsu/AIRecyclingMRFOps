import React from 'react';
import AIPage from '../components/AIPage';
import { aiRegulatoryReporting } from '../services/api';

export default function AIRegulatoryReportingPage() {
  return (
    <AIPage
      title="AI · Regulatory Reporting"
      feature="regulatory-reporting"
      subtitle="Draft EPA / municipal / EPR reporting outputs for a chosen period."
      inputs={[
        { key: 'period',          label: 'Reporting Period', placeholder: 'e.g. May 2026' },
        { key: 'narrative_notes', label: 'Narrative notes',  type: 'textarea',
          placeholder: 'Optional emphasis: diversion rate, contamination trend, incidents, etc.' },
      ]}
      run={(v) => aiRegulatoryReporting(v)}
      buttonLabel="Generate Report"
    />
  );
}
