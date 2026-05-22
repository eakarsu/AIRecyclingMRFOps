import React from 'react';
import CrudPage from '../components/CrudPage';
import { routeStopsApi } from '../services/api';

export default function RouteStopsPage() {
  return (
    <CrudPage
      title="Route Stops"
      subtitle="Ordered stops on each persisted route — sequence, address, tonnage, ETA."
      api={routeStopsApi}
      statusKey="status"
      fields={[
        { key: 'stop_id',     label: 'Stop ID' },
        { key: 'route_id',    label: 'Route ID' },
        { key: 'sequence',    label: 'Sequence', type: 'number' },
        { key: 'address',     label: 'Address' },
        { key: 'client',      label: 'Client' },
        { key: 'est_tons',    label: 'Est. Tons', type: 'number' },
        { key: 'arrival_eta', label: 'Arrival ETA', type: 'datetime-local' },
        { key: 'status',      label: 'Status', type: 'select', options: ['pending','arrived','completed','skipped','failed'] },
        { key: 'notes',       label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
