import React from 'react';
import AIPage from '../components/AIPage';
import { aiHaulerPaymentRecon } from '../services/api';

export default function AIHaulerPaymentReconPage() {
  return (
    <AIPage
      title="AI · Hauler Payment Reconciliation"
      feature="hauler-payment-recon"
      subtitle="Reconcile a hauler invoice against recent load tickets."
      inputs={[
        { key: 'invoice_text', label: 'Invoice Text', type: 'textarea',
          placeholder: 'Paste the hauler invoice text here.' },
      ]}
      run={(v, requestOptions) => aiHaulerPaymentRecon(v, requestOptions)}
      buttonLabel="Reconcile Invoice"
    />
  );
}
