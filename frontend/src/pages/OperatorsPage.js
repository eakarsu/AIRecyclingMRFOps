import React from 'react';
import CrudPage from '../components/CrudPage';
import { operatorsApi } from '../services/api';

export default function OperatorsPage() {
  return (
    <CrudPage
      title="Operators"
      subtitle="Sort-cabin and line operators by shift and line assignment."
      api={operatorsApi}
      statusKey="status"
      fields={[
        { key: 'op_id',   label: 'Operator ID' },
        { key: 'name',    label: 'Name' },
        { key: 'shift',   label: 'Shift', type: 'select', options: ['day','swing','night'] },
        { key: 'line_id', label: 'Line ID' },
        { key: 'status',  label: 'Status', type: 'select', options: ['active','on_break','medical','off_duty'] },
        { key: 'contact', label: 'Contact' },
        { key: 'notes',   label: 'Notes',  type: 'textarea' },
      ]}
    />
  );
}
