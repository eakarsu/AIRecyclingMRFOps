import React from 'react';
import AIPage from '../components/AIPage';
import { aiCustomerQualityFeedback } from '../services/api';

export default function AICustomerQualityFeedbackPage() {
  return (
    <AIPage
      title="AI · Customer Quality Feedback"
      feature="customer-quality-feedback"
      subtitle="Draft a corrective-action response to a customer quality complaint."
      inputs={[
        { key: 'customer_name',      label: 'Customer Name' },
        { key: 'customer_commodity', label: 'Customer Commodity' },
        { key: 'complaint_text',     label: 'Complaint Text', type: 'textarea',
          placeholder: 'Paste the customer email or summarized issue here.' },
      ]}
      run={(v) => aiCustomerQualityFeedback(v)}
      buttonLabel="Draft Response"
    />
  );
}
