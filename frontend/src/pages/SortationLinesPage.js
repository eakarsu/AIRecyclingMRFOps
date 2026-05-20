import React from 'react';
import CrudPage from '../components/CrudPage';
import { sortationLinesApi } from '../services/api';

export default function SortationLinesPage() {
  return (
    <CrudPage
      title="Sortation Lines"
      subtitle="Live state of each production line and its operator."
      api={sortationLinesApi}
      statusKey="status"
      fields={[
        { key: 'line_id',        label: 'Line ID' },
        { key: 'name',           label: 'Name' },
        { key: 'throughput_tph', label: 'Throughput (tph)', type: 'number' },
        { key: 'status',         label: 'Status',           type: 'select', options: ['running','idle','maintenance','fault'] },
        { key: 'last_event',     label: 'Last Event',       type: 'datetime-local' },
        { key: 'operator',       label: 'Operator' },
        { key: 'notes',          label: 'Notes',            type: 'textarea' },
      ]}
    />
  );
}
