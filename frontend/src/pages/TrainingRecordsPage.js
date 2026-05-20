import React from 'react';
import CrudPage from '../components/CrudPage';
import { trainingRecordsApi } from '../services/api';

export default function TrainingRecordsPage() {
  return (
    <CrudPage
      title="Training Records"
      subtitle="Operator certifications, refreshers, and compliance status."
      api={trainingRecordsApi}
      statusKey="status"
      fields={[
        { key: 'record_id',    label: 'Record ID' },
        { key: 'op_id',        label: 'Operator ID' },
        { key: 'topic',        label: 'Topic' },
        { key: 'completed_at', label: 'Completed At', type: 'date' },
        { key: 'score',        label: 'Score',        type: 'number' },
        { key: 'status',       label: 'Status',       type: 'select', options: ['complete','in_progress','recheck_required','expired'] },
        { key: 'notes',        label: 'Notes',        type: 'textarea' },
      ]}
    />
  );
}
