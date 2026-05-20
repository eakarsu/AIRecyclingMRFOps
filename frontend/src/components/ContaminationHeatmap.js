import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { API_BASE, getToken } from '../services/api';

const PALETTE = [
  '#ef4444', '#f97316', '#facc15', '#84cc16', '#22d3ee',
  '#3b82f6', '#a78bfa', '#ec4899', '#f472b6', '#14b8a6',
];

export default function ContaminationHeatmap() {
  const [data, setData] = useState([]);
  const [lines, setLines] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    fetch(`${API_BASE}/custom-views/contamination-by-line`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d.data || []);
        setLines(d.lines || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="ai-card" style={{ marginBottom: 24 }}>
      <h3 style={{ marginTop: 0 }}>Contamination Heatmap by Sortation Line</h3>
      <p style={{ color: '#94a3b8', marginTop: 0 }}>
        Contamination log counts grouped by type across {lines.length} sortation lines.
      </p>
      {loading && <div>Loading heatmap…</div>}
      {error && <div className="ai-error">Failed to load: {error}</div>}
      {!loading && !error && data.length === 0 && (
        <div style={{ color: '#94a3b8' }}>No contamination logs yet.</div>
      )}
      {!loading && !error && data.length > 0 && (
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="type"
              tick={{ fill: '#cbd5e1', fontSize: 11 }}
              angle={-25}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fill: '#cbd5e1', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ color: '#cbd5e1' }} />
            {lines.map((ln, i) => (
              <Bar
                key={ln}
                dataKey={ln}
                stackId="a"
                fill={PALETTE[i % PALETTE.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
