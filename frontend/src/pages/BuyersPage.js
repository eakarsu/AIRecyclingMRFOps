import React from 'react';
import CrudPage from '../components/CrudPage';
import { buyersApi } from '../services/api';

export default function BuyersPage() {
  return (
    <CrudPage
      title="End-Market Buyers"
      subtitle="Downstream mills, pelletizers, smelters and brokers who consume baled commodities."
      api={buyersApi}
      statusKey="status"
      fields={[
        { key: 'buyer_id',       label: 'Buyer ID' },
        { key: 'name',           label: 'Name' },
        { key: 'country',        label: 'Country' },
        { key: 'region',         label: 'Region' },
        { key: 'contact',        label: 'Contact' },
        { key: 'certifications', label: 'Certifications', placeholder: 'R2v3, ISO 14001, etc.' },
        { key: 'status',         label: 'Status', type: 'select', options: ['active','paused','watchlist','suspended'] },
        { key: 'notes',          label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
