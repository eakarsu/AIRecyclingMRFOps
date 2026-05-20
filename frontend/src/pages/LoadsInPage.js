import React from 'react';
import CrudPage from '../components/CrudPage';
import { loadsInApi } from '../services/api';

export default function LoadsInPage() {
  return (
    <CrudPage
      title="Loads In"
      subtitle="Inbound hauler loads at the tipping floor — weight and contamination%."
      api={loadsInApi}
      statusKey="status"
      fields={[
        { key: 'load_id',           label: 'Load ID' },
        { key: 'hauler',            label: 'Hauler' },
        { key: 'weight_tons',       label: 'Weight (tons)',      type: 'number' },
        { key: 'contamination_pct', label: 'Contamination %',    type: 'number' },
        { key: 'arrived_at',        label: 'Arrived At',         type: 'datetime-local' },
        { key: 'status',            label: 'Status',             type: 'select', options: ['accepted','flagged','rejected','hold'] },
        { key: 'notes',             label: 'Notes',              type: 'textarea' },
      ]}
    />
  );
}
