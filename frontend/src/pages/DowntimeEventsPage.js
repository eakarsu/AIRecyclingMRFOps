import React from 'react';
import CrudPage from '../components/CrudPage';
import { downtimeEventsApi } from '../services/api';

export default function DowntimeEventsPage() {
  return (
    <CrudPage
      title="Downtime Events"
      subtitle="Open and resolved sortation-line downtime."
      api={downtimeEventsApi}
      statusKey="status"
      fields={[
        { key: 'event_id',   label: 'Event ID' },
        { key: 'line_id',    label: 'Line ID' },
        { key: 'reason',     label: 'Reason' },
        { key: 'started_at', label: 'Started At', type: 'datetime-local' },
        { key: 'ended_at',   label: 'Ended At',   type: 'datetime-local' },
        { key: 'status',     label: 'Status',     type: 'select', options: ['open','closed','escalated'] },
        { key: 'notes',      label: 'Notes',      type: 'textarea' },
      ]}
    />
  );
}
