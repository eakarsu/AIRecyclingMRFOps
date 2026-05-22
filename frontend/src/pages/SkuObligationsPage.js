import React from 'react';
import CrudPage from '../components/CrudPage';
import { skuObligationsApi } from '../services/api';

export default function SkuObligationsPage() {
  return (
    <CrudPage
      title="SKU Obligations"
      subtitle="EPR-reportable SKUs — material category, unit weight, fee per unit, jurisdiction."
      api={skuObligationsApi}
      statusKey="status"
      fields={[
        { key: 'sku_id',            label: 'SKU ID' },
        { key: 'producer_id',       label: 'Producer ID' },
        { key: 'sku_description',   label: 'SKU Description' },
        { key: 'material_category', label: 'Material Category', placeholder: 'PET, HDPE, OCC, Glass, Aluminum, etc.' },
        { key: 'unit_weight_g',     label: 'Unit Weight (g)',   type: 'number' },
        { key: 'fee_usd_unit',      label: 'Fee per Unit (USD)', type: 'number' },
        { key: 'jurisdiction',      label: 'Jurisdiction' },
        { key: 'status',            label: 'Status', type: 'select', options: ['active','retired','draft'] },
        { key: 'notes',             label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
