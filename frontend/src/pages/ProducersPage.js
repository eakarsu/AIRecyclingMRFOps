import React from 'react';
import CrudPage from '../components/CrudPage';
import { producersApi } from '../services/api';

export default function ProducersPage() {
  return (
    <CrudPage
      title="Producers"
      subtitle="EPR-obligated brand owners / producers whose SKUs flow through the MRF."
      api={producersApi}
      statusKey="status"
      fields={[
        { key: 'producer_id',  label: 'Producer ID' },
        { key: 'name',         label: 'Name' },
        { key: 'jurisdiction', label: 'Jurisdiction' },
        { key: 'contact',      label: 'Contact' },
        { key: 'status',       label: 'Status', type: 'select', options: ['active','inactive','pending','suspended'] },
        { key: 'notes',        label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
