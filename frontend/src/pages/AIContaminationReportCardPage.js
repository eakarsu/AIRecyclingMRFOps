import React from 'react';
import AIPage from '../components/AIPage';
import { aiContaminationReportCard } from '../services/api';

export default function AIContaminationReportCardPage() {
  return (
    <AIPage
      title="AI · Per-Municipality Contamination Report Card"
      feature="contamination-report-card"
      subtitle="Aggregate contamination events by municipality and generate a stakeholder-ready report card."
      inputs={[
        { key: 'municipality',     label: 'Municipality', placeholder: 'Leave blank for plant-wide rollup' },
        { key: 'period_days',      label: 'Period (days)', type: 'number', defaultValue: 30 },
        { key: 'narrative_notes',  label: 'Narrative Notes', type: 'textarea',
          placeholder: 'Special framing — trends, incidents, contract context, etc.' },
      ]}
      run={(v) => aiContaminationReportCard(v)}
      buttonLabel="Generate Report Card"
    />
  );
}
