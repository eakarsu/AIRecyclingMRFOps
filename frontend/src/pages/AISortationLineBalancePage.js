import React from 'react';
import AIPage from '../components/AIPage';
import { aiSortationLineBalance } from '../services/api';

export default function AISortationLineBalancePage() {
  return (
    <AIPage
      title="AI · Sortation Line Balance"
      feature="sortation-line-balance"
      subtitle="Rebalance throughput and operators across lines for the current inbound mix."
      inputs={[
        { key: 'inbound_mix_json', label: 'Inbound Mix (JSON)', type: 'textarea',
          placeholder: '{"PET":0.18,"HDPE":0.07,"OCC":0.42,"MP":0.14,"Aluminum":0.03,"Steel":0.05,"Residual":0.11}' },
      ]}
      run={(v) => aiSortationLineBalance({ inbound_mix_json: v.inbound_mix_json })}
      buttonLabel="Balance Lines"
    />
  );
}
