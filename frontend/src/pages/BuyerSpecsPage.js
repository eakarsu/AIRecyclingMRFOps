import React from 'react';
import CrudPage from '../components/CrudPage';
import { buyerSpecsApi } from '../services/api';

export default function BuyerSpecsPage() {
  return (
    <CrudPage
      title="Buyer Specs"
      subtitle="Buyer-specific bale specifications — ISRI grade, contamination ceiling, density floor, price."
      api={buyerSpecsApi}
      statusKey="status"
      fields={[
        { key: 'spec_id',               label: 'Spec ID' },
        { key: 'buyer_id',              label: 'Buyer ID' },
        { key: 'commodity',             label: 'Commodity' },
        { key: 'isri_grade',            label: 'ISRI Grade' },
        { key: 'max_contamination_pct', label: 'Max Contamination %', type: 'number' },
        { key: 'min_density_kg_m3',     label: 'Min Density (kg/m³)', type: 'number' },
        { key: 'min_bale_weight_kg',    label: 'Min Bale Weight (kg)', type: 'number' },
        { key: 'price_usd_ton',         label: 'Price (USD/ton)', type: 'number' },
        { key: 'monthly_demand_tons',   label: 'Monthly Demand (t)', type: 'number' },
        { key: 'status',                label: 'Status', type: 'select', options: ['active','paused','expired'] },
        { key: 'notes',                 label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
