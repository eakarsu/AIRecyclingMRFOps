import React from 'react';
import AIPage from '../components/AIPage';
import { aiCommodityPriceForecast } from '../services/api';

export default function AICommodityPriceForecastPage() {
  return (
    <AIPage
      title="AI · Commodity Price Forecast"
      feature="commodity-price-forecast"
      subtitle="Forecast secondary-commodity bale pricing for a chosen horizon."
      inputs={[
        { key: 'commodity',          label: 'Commodity', placeholder: 'e.g. PET, HDPE-Natural, OCC, Aluminum UBC' },
        { key: 'horizon_days',       label: 'Horizon (days)', type: 'number', defaultValue: 30 },
        { key: 'recent_prices_json', label: 'Recent prices (JSON, optional)', type: 'textarea',
          placeholder: '[{"day": -7, "usd_ton": 332}, {"day": 0, "usd_ton": 335}]' },
      ]}
      run={(v) => aiCommodityPriceForecast({
        commodity: v.commodity,
        horizon_days: Number(v.horizon_days) || 30,
        recent_prices_json: v.recent_prices_json,
      })}
      buttonLabel="Forecast Price"
    />
  );
}
