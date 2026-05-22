import React from 'react';
import CrudPage from '../components/CrudPage';
import { routesApi } from '../services/api';

export default function RoutesPage() {
  return (
    <CrudPage
      title="Hauler Routes"
      subtitle="Persisted routes — driver, vehicle, distance, duration, fill-rate, status."
      api={routesApi}
      statusKey="status"
      fields={[
        { key: 'route_id',       label: 'Route ID' },
        { key: 'name',           label: 'Name' },
        { key: 'driver_id',      label: 'Driver ID' },
        { key: 'vehicle_id',     label: 'Vehicle ID' },
        { key: 'scheduled_date', label: 'Scheduled Date', type: 'date' },
        { key: 'distance_km',    label: 'Distance (km)', type: 'number' },
        { key: 'duration_hours', label: 'Duration (h)',   type: 'number' },
        { key: 'fill_pct',       label: 'Fill (%)',       type: 'number' },
        { key: 'status',         label: 'Status', type: 'select', options: ['planned','dispatched','in_progress','completed','cancelled'] },
        { key: 'notes',          label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
