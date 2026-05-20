import React from 'react';
import CrudPage from '../components/CrudPage';
import { commoditiesApi } from '../services/api';

export default function CommoditiesPage() {
  return (
    <CrudPage
      title="Commodities"
      subtitle="Tracked recyclable commodities with current marker pricing."
      api={commoditiesApi}
      statusKey="status"
      fields={[
        { key: 'comm_id',               label: 'Commodity ID' },
        { key: 'name',                  label: 'Name' },
        { key: 'current_price_usd_ton', label: 'Current Price (USD/ton)', type: 'number' },
        { key: 'currency',              label: 'Currency' },
        { key: 'last_updated',          label: 'Last Updated', type: 'datetime-local' },
        { key: 'status',                label: 'Status',       type: 'select', options: ['tracked','low_demand','negative_value','watchlist'] },
        { key: 'notes',                 label: 'Notes',        type: 'textarea' },
      ]}
    />
  );
}
