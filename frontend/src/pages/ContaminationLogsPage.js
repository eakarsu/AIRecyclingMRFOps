import React from 'react';
import CrudPage from '../components/CrudPage';
import { contaminationLogsApi } from '../services/api';

export default function ContaminationLogsPage() {
  return (
    <CrudPage
      title="Contamination Logs"
      subtitle="Per-load contamination findings with severity and inspector."
      api={contaminationLogsApi}
      statusKey="severity"
      fields={[
        { key: 'log_id',   label: 'Log ID' },
        { key: 'load_id',  label: 'Load ID' },
        { key: 'type',     label: 'Contaminant Type' },
        { key: 'severity', label: 'Severity', type: 'select', options: ['low','medium','high','critical'] },
        { key: 'found_by', label: 'Found By' },
        { key: 'ts',       label: 'When',     type: 'datetime-local' },
        { key: 'notes',    label: 'Notes',    type: 'textarea' },
      ]}
    />
  );
}
