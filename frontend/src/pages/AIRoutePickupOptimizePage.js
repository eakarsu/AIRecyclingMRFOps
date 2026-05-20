import React from 'react';
import AIPage from '../components/AIPage';
import { aiRoutePickupOptimize } from '../services/api';

export default function AIRoutePickupOptimizePage() {
  return (
    <AIPage
      title="AI · Route / Pickup Optimize"
      feature="route-pickup-optimize"
      subtitle="Group stops into efficient routes using available drivers and vehicles."
      inputs={[
        { key: 'constraints', label: 'Constraints', type: 'textarea',
          placeholder: 'Fleet size, shift caps, time windows, school zones, etc.' },
        { key: 'stops_json',  label: 'Stops (JSON array)', type: 'textarea',
          placeholder: '[{"id":"S-01","address":"1200 Lakeshore Dr","est_tons":1.2}, ...]' },
      ]}
      run={(v) => aiRoutePickupOptimize(v)}
      buttonLabel="Optimize Routes"
    />
  );
}
