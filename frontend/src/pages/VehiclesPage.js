import React from 'react';
import CrudPage from '../components/CrudPage';
import { vehiclesApi } from '../services/api';

export default function VehiclesPage() {
  return (
    <CrudPage
      title="Vehicles"
      subtitle="Trucks, yard equipment, and trailers."
      api={vehiclesApi}
      statusKey="status"
      fields={[
        { key: 'vehicle_id',  label: 'Vehicle ID' },
        { key: 'type',        label: 'Type' },
        { key: 'plate',       label: 'Plate' },
        { key: 'fuel_status', label: 'Fuel Status', type: 'select', options: ['full','half','low','empty','charging'] },
        { key: 'location',    label: 'Location' },
        { key: 'status',      label: 'Status',      type: 'select', options: ['ready','in_service','maintenance','retired'] },
        { key: 'notes',       label: 'Notes',       type: 'textarea' },
      ]}
    />
  );
}
