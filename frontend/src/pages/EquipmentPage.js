import React from 'react';
import CrudPage from '../components/CrudPage';
import { equipmentApi } from '../services/api';

export default function EquipmentPage() {
  return (
    <CrudPage
      title="Equipment"
      subtitle="Balers, screens, optical sorters, magnets and AI robots."
      api={equipmentApi}
      statusKey="status"
      fields={[
        { key: 'eq_id',         label: 'Equipment ID' },
        { key: 'name',          label: 'Name' },
        { key: 'line_id',       label: 'Line ID' },
        { key: 'vendor',        label: 'Vendor' },
        { key: 'last_service',  label: 'Last Service', type: 'date' },
        { key: 'status',        label: 'Status',       type: 'select', options: ['operational','maintenance','standby','fault','retired'] },
        { key: 'notes',         label: 'Notes',        type: 'textarea' },
      ]}
    />
  );
}
