import React from 'react';
import CrudPage from '../components/CrudPage';
import { customersApi } from '../services/api';

export default function CustomersPage() {
  return (
    <CrudPage
      title="Customers"
      subtitle="Off-take buyers for sorted bales — mills, smelters, brokers."
      api={customersApi}
      statusKey="status"
      fields={[
        { key: 'customer_id', label: 'Customer ID' },
        { key: 'name',        label: 'Name' },
        { key: 'country',     label: 'Country' },
        { key: 'commodity',   label: 'Primary Commodity' },
        { key: 'contract_id', label: 'Contract ID' },
        { key: 'status',      label: 'Status', type: 'select', options: ['active','pending','suspended','blocked'] },
        { key: 'notes',       label: 'Notes',  type: 'textarea' },
      ]}
    />
  );
}
