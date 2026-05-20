import React from 'react';
import CommodityTrend from '../components/CommodityTrend';
import ContaminationHeatmap from '../components/ContaminationHeatmap';
import DowntimePareto from '../components/DowntimePareto';
import BaleProductionChart from '../components/BaleProductionChart';

export default function CustomViewsPage() {
  return (
    <div data-testid="custom-views-page">
      <div className="dashboard-header">
        <h2>MRF Analytics</h2>
        <p>Plant-wide custom views — commodity pricing, contamination, downtime, baling production.</p>
      </div>

      <CommodityTrend />
      <ContaminationHeatmap />
      <DowntimePareto />
      <BaleProductionChart />
    </div>
  );
}
