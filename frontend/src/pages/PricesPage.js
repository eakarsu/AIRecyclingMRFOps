import React from 'react';
import CrudPage from '../components/CrudPage';
import { pricesApi } from '../services/api';

export default function PricesPage() {
  return (
    <CrudPage
      title="Prices"
      subtitle="Time-series market observations for each commodity."
      api={pricesApi}
      fields={[
        { key: 'price_id',      label: 'Price ID' },
        { key: 'comm_id',       label: 'Commodity ID' },
        { key: 'market',        label: 'Market' },
        { key: 'value_usd_ton', label: 'Value (USD/ton)', type: 'number' },
        { key: 'ts',            label: 'Timestamp',       type: 'datetime-local' },
        { key: 'source',        label: 'Source' },
        { key: 'notes',         label: 'Notes',           type: 'textarea' },
      ]}
    />
  );
}
