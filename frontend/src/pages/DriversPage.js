import React from 'react';
import CrudPage from '../components/CrudPage';
import { driversApi } from '../services/api';

export default function DriversPage() {
  return (
    <CrudPage
      title="Drivers"
      subtitle="CDL-A drivers on the MRF roster."
      api={driversApi}
      statusKey="status"
      fields={[
        { key: 'driver_id', label: 'Driver ID' },
        { key: 'name',      label: 'Name' },
        { key: 'license',   label: 'License' },
        { key: 'base',      label: 'Base Yard' },
        { key: 'last_run',  label: 'Last Run', type: 'datetime-local' },
        { key: 'status',    label: 'Status',   type: 'select', options: ['available','on_route','off_duty','medical_hold'] },
        { key: 'notes',     label: 'Notes',    type: 'textarea' },
      ]}
    />
  );
}
