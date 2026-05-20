import React from 'react';
import AIPage from '../components/AIPage';
import { aiScrapMarketBrief } from '../services/api';

export default function AIScrapMarketBriefPage() {
  return (
    <AIPage
      title="AI · Scrap Market Brief"
      feature="scrap-market-brief"
      subtitle="Weekly secondary-commodity scrap market brief with movers and outlook."
      inputs={[
        { key: 'focus',                label: 'Focus', placeholder: 'all | paper | plastics | metals | export' },
        { key: 'recent_prices_notes',  label: 'Context notes', type: 'textarea',
          placeholder: 'Optional — anything to bias the brief toward.' },
      ]}
      run={(v) => aiScrapMarketBrief(v)}
      buttonLabel="Generate Market Brief"
    />
  );
}
