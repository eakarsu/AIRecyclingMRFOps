import React from 'react';
import CrudPage from '../components/CrudPage';
import { contractsApi } from '../services/api';

export default function ContractsPage() {
  return (
    <CrudPage
      title="Contracts"
      subtitle="Customer purchase agreements per commodity."
      api={contractsApi}
      statusKey="status"
      fields={[
        { key: 'contract_id', label: 'Contract ID' },
        { key: 'customer_id', label: 'Customer ID' },
        { key: 'commodity',   label: 'Commodity' },
        { key: 'term_months', label: 'Term (months)', type: 'number' },
        { key: 'status',      label: 'Status',        type: 'select', options: ['active','pending','suspended','closed'] },
        { key: 'value_usd',   label: 'Value (USD)',   type: 'number' },
        { key: 'notes',       label: 'Notes',         type: 'textarea' },
      ]}
    />
  );
}
