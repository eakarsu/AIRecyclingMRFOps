import React from 'react';
import CrudPage from '../components/CrudPage';
import { balesApi } from '../services/api';

export default function BalesPage() {
  return (
    <CrudPage
      title="Bales"
      subtitle="Finished bales by commodity, weight, grade, and disposition."
      api={balesApi}
      statusKey="status"
      fields={[
        { key: 'bale_id',   label: 'Bale ID' },
        { key: 'commodity', label: 'Commodity' },
        { key: 'weight_kg', label: 'Weight (kg)', type: 'number' },
        { key: 'baled_at',  label: 'Baled At',    type: 'datetime-local' },
        { key: 'grade',     label: 'Grade',       type: 'select', options: ['A','B','C','reject'] },
        { key: 'status',    label: 'Status',      type: 'select', options: ['staged','shipped','rejected','hold','re_sort'] },
        { key: 'notes',     label: 'Notes',       type: 'textarea' },
      ]}
    />
  );
}
