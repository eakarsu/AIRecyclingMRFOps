import React from 'react';
import CrudPage from '../components/CrudPage';
import { safetyIncidentsApi } from '../services/api';

export default function SafetyIncidentsPage() {
  return (
    <CrudPage
      title="Safety Incidents"
      subtitle="OSHA-recordable, near-miss, and hazardous-material incidents."
      api={safetyIncidentsApi}
      statusKey="severity"
      fields={[
        { key: 'incident_id', label: 'Incident ID' },
        { key: 'location',    label: 'Location' },
        { key: 'type',        label: 'Type' },
        { key: 'severity',    label: 'Severity', type: 'select', options: ['low','medium','high','critical'] },
        { key: 'opened_at',   label: 'Opened At', type: 'datetime-local' },
        { key: 'status',      label: 'Status',   type: 'select', options: ['open','investigating','closed'] },
        { key: 'notes',       label: 'Notes',    type: 'textarea' },
      ]}
    />
  );
}
