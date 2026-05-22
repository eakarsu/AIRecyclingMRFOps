import React from 'react';
import AIPage from '../components/AIPage';
import { aiThroughputForecast } from '../services/api';

export default function AIThroughputForecastPage() {
  return (
    <AIPage
      title="AI · Throughput Forecast"
      feature="throughput-forecast"
      subtitle="Predict hourly tons-per-hour for a sortation line over the next 12–48 hours."
      inputs={[
        { key: 'line_id',            label: 'Line ID', placeholder: 'LINE-01, LINE-02, … or PLANT for plant-wide' },
        { key: 'horizon_hours',      label: 'Horizon (hours)', type: 'number', defaultValue: 24 },
        { key: 'context_notes',      label: 'Context Notes',  type: 'textarea',
          placeholder: 'Staffing, PM windows, expected mix shifts, weather, etc.' },
        { key: 'shift_history_json', label: 'Shift History (JSON array)', type: 'textarea',
          placeholder: '[ { "hour_offset": -24, "tph": 17.4, "shift": "A" }, … ]' },
      ]}
      run={(v) => aiThroughputForecast(v)}
      buttonLabel="Forecast Throughput"
    />
  );
}
