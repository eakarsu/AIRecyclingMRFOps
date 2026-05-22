import React from 'react';
import AIPage from '../components/AIPage';
import { aiEndMarketMatch } from '../services/api';

export default function AIEndMarketMatchPage() {
  return (
    <AIPage
      title="AI · End-Market Matchmaker"
      feature="end-market-match"
      subtitle="Match a finished bale to its best downstream mill/buyer using buyer-spec fit and economics."
      inputs={[
        { key: 'bale_id',           label: 'Bale ID' },
        { key: 'commodity',         label: 'Commodity', placeholder: 'PET, HDPE-Natural, OCC, Aluminum UBC, …' },
        { key: 'weight_kg',         label: 'Weight (kg)', type: 'number' },
        { key: 'grade',             label: 'Grade', type: 'select', options: ['A','B','C','reject'] },
        { key: 'contamination_pct', label: 'Contamination %', type: 'number' },
        { key: 'constraints_notes', label: 'Constraints / Notes', type: 'textarea',
          placeholder: 'Logistics, regional preferences, certifications required, etc.' },
      ]}
      run={(v) => aiEndMarketMatch(v)}
      buttonLabel="Match Bale"
    />
  );
}
