import React from 'react';
import AIPage from '../components/AIPage';
import { aiCapacityUtilizationBrief } from '../services/api';

export default function AICapacityUtilizationBriefPage() {
  return (
    <AIPage
      title="AI · Capacity Utilization Brief"
      feature="capacity-utilization-brief"
      subtitle="Narrative capacity utilization across all sortation lines."
      inputs={[
        { key: 'targets_notes', label: 'Targets / context', type: 'textarea',
          placeholder: 'Optional — utilization targets, customer commits, time window.' },
      ]}
      run={(v, requestOptions) => aiCapacityUtilizationBrief({ targets_notes: v.targets_notes }, requestOptions)}
      buttonLabel="Generate Capacity Brief"
    />
  );
}
