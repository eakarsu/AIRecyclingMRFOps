import React from 'react';
import AIPage from '../components/AIPage';
import { aiTrainingNeeds } from '../services/api';

export default function AITrainingNeedsPage() {
  return (
    <AIPage
      title="AI · Training Needs"
      feature="training-needs"
      subtitle="Identify operator gaps and propose a curriculum."
      inputs={[]}
      run={() => aiTrainingNeeds({})}
      buttonLabel="Analyze Training"
    />
  );
}
