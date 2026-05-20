import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { API_BASE, getToken } from '../services/api';

const PALETTE = [
  '#10b981', '#3b82f6', '#a78bfa', '#fbbf24', '#f472b6',
  '#22d3ee', '#84cc16', '#fb7185', '#facc15', '#e879f9',
];

export default function BaleProductionChart() {
  const [series, setSeries] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    fetch(`${API_BASE}/custom-views/bale-production-trend`, {
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
      <h3 style={{ marginTop: 0 }}>Bale Production Trend</h3>
      <p style={{ color: '#94a3b8', marginTop: 0 }}>
        Daily bale weight (kg) by commodity ({commodities.length} commodities,{' '}
        {series.length} days).
      </p>
      {loading && <div>Loading production trend…</div>}
      {error && <div className="ai-error">Failed to load: {error}</div>}
      {!loading && !error && series.length === 0 && (
        <div style={{ color: '#94a3b8' }}>No bales recorded yet.</div>
      )}
      {!loading && !error && series.length > 0 && (
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              {commodities.map((c, i) => (
                <linearGradient key={c} id={`bale-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.7} />
                  <stop offset="95%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="ts" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
            <YAxis tick={{ fill: '#cbd5e1', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ color: '#cbd5e1' }} />
            {commodities.map((c, i) => (
              <Area
                key={c}
                type="monotone"
                dataKey={c}
                stackId="1"
                stroke={PALETTE[i % PALETTE.length]}
                fill={`url(#bale-grad-${i})`}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
