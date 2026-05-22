import React from 'react';
import CrudPage from '../components/CrudPage';
import { eprFilingsApi } from '../services/api';

export default function EprFilingsPage() {
  return (
    <CrudPage
      title="EPR Filings"
      subtitle="Extended-Producer-Responsibility filings — units, weight, fees, submission status."
      api={eprFilingsApi}
      statusKey="status"
      fields={[
        { key: 'filing_id',     label: 'Filing ID' },
        { key: 'producer_id',   label: 'Producer ID' },
        { key: 'period',        label: 'Period' },
        { key: 'jurisdiction',  label: 'Jurisdiction' },
        { key: 'total_units',   label: 'Total Units',   type: 'number' },
        { key: 'total_kg',      label: 'Total Weight (kg)', type: 'number' },
        { key: 'fee_total_usd', label: 'Fees Total (USD)',  type: 'number' },
        { key: 'submitted_at',  label: 'Submitted At', type: 'datetime-local' },
        { key: 'status',        label: 'Status', type: 'select', options: ['draft','submitted','accepted','rejected','amended'] },
        { key: 'notes',         label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
