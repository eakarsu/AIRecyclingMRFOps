import React from 'react';
import AIPage from '../components/AIPage';
import { aiVendorQuoteCompare } from '../services/api';

export default function AIVendorQuoteComparePage() {
  return (
    <AIPage
      title="AI · Vendor Quote Compare"
      feature="vendor-quote-compare"
      subtitle="Score competing OEM, hauler or processor quotes against a requirement."
      inputs={[
        { key: 'requirement', label: 'Requirement', type: 'textarea',
          placeholder: 'Describe what you are buying — throughput target, lead time, certification, etc.' },
        { key: 'quotes_json', label: 'Quotes (JSON array)', type: 'textarea',
          placeholder: '[{"vendor":"TOMRA","price_usd":685000,"lead_time_weeks":14, ...}, ...]' },
      ]}
      run={(v) => aiVendorQuoteCompare(v)}
      buttonLabel="Compare Quotes"
    />
  );
}
