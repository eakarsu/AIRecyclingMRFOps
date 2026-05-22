import React from 'react';
import AIPage from '../components/AIPage';
import { aiLineCameraAnomalyNarrate } from '../services/api';

export default function AILineCameraAnomalyNarratePage() {
  return (
    <AIPage
      title="AI · Line-Camera Anomaly Narrator"
      feature="line-camera-anomaly-narrate"
      subtitle="Turn a burst of frame-level vision-AI events into a plant-floor narrative with severity and actions."
      inputs={[
        { key: 'line_id',           label: 'Line ID', placeholder: 'LINE-01, LINE-02, …' },
        { key: 'operator_notes',    label: 'Operator Notes', type: 'textarea',
          placeholder: 'Free-form: thermal event, jam, hazard, etc.' },
        { key: 'frame_events_json', label: 'Frame Events (JSON array)', type: 'textarea',
          placeholder: '[ { "ts": "07:14:30", "object": "lithium_ion_cell", "confidence": 0.96 }, … ]' },
      ]}
      run={(v) => aiLineCameraAnomalyNarrate(v)}
      buttonLabel="Narrate Anomaly"
    />
  );
}
