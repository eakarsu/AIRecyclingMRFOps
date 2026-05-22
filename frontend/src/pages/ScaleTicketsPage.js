import React from 'react';
import CrudPage from '../components/CrudPage';
import { scaleTicketsApi } from '../services/api';

export default function ScaleTicketsPage() {
  return (
    <CrudPage
      title="Scale-House Tickets"
      subtitle="Weighbridge tickets — gross / tare / net, direction, scale house, operator."
      api={scaleTicketsApi}
      statusKey="status"
      fields={[
        { key: 'ticket_id',     label: 'Ticket ID' },
        { key: 'load_id',       label: 'Load ID' },
        { key: 'direction',     label: 'Direction', type: 'select', options: ['in','out'] },
        { key: 'hauler',        label: 'Hauler' },
        { key: 'vehicle_plate', label: 'Vehicle Plate' },
        { key: 'gross_kg',      label: 'Gross (kg)', type: 'number' },
        { key: 'tare_kg',       label: 'Tare (kg)',  type: 'number' },
        { key: 'net_kg',        label: 'Net (kg)',   type: 'number' },
        { key: 'weighed_at',    label: 'Weighed At', type: 'datetime-local' },
        { key: 'scale_house',   label: 'Scale House' },
        { key: 'operator',      label: 'Operator' },
        { key: 'status',        label: 'Status', type: 'select', options: ['open','closed','disputed','voided'] },
        { key: 'notes',         label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}
