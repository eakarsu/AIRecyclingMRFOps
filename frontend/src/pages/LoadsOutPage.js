import React from 'react';
import CrudPage from '../components/CrudPage';
import { loadsOutApi } from '../services/api';

export default function LoadsOutPage() {
  return (
    <CrudPage
      title="Loads Out"
      subtitle="Bale shipments to customers — outbound logistics."
      api={loadsOutApi}
      statusKey="status"
      fields={[
        { key: 'out_id',      label: 'Out ID' },
        { key: 'bale_id',     label: 'Bale ID' },
        { key: 'customer_id', label: 'Customer ID' },
        { key: 'weight_kg',   label: 'Weight (kg)', type: 'number' },
        { key: 'shipped_at',  label: 'Shipped At',  type: 'datetime-local' },
        { key: 'status',      label: 'Status',      type: 'select', options: ['scheduled','in_transit','delivered','cancelled'] },
        { key: 'notes',       label: 'Notes',       type: 'textarea' },
      ]}
    />
  );
}
