import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { API_BASE, getToken } from '../services/api';

const PALETTE = [
  '#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa',
  '#fb7185', '#22d3ee', '#facc15', '#10b981', '#e879f9',
];

export default function CommodityTrend() {
  const [series, setSeries] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    fetch(`${API_BASE}/custom-views/commodity-price-trend`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setSeries(d.series || []);
        setCommodities(d.commodities || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="ai-card" style={{ marginBottom: 24 }}>
      <h3 style={{ marginTop: 0 }}>Commodity Price Trend</h3>
      <p style={{ color: '#94a3b8', marginTop: 0 }}>
        USD per ton over time, grouped by commodity ({commodities.length} tracked,{' '}
        {series.length} days).
      </p>
      {loading && <div>Loading price trend…</div>}
      {error && <div className="ai-error">Failed to load: {error}</div>}
      {!loading && !error && series.length === 0 && (
        <div style={{ color: '#94a3b8' }}>No price observations yet.</div>
      )}
      {!loading && !error && series.length > 0 && (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="ts" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
            <YAxis tick={{ fill: '#cbd5e1', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ color: '#cbd5e1' }} />
            {commodities.map((c, i) => (
              <Line
                key={c}
                type="monotone"
                dataKey={c}
                stroke={PALETTE[i % PALETTE.length]}
                dot={false}
                strokeWidth={2}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
