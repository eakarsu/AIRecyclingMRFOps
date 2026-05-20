import React, { useEffect, useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { API_BASE, getToken } from '../services/api';

export default function DowntimePareto() {
  const [data, setData] = useState([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    fetch(`${API_BASE}/custom-views/downtime-pareto`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d.data || []);
        setTotalEvents(d.total_events || 0);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="ai-card" style={{ marginBottom: 24 }}>
      <h3 style={{ marginTop: 0 }}>Downtime Pareto</h3>
      <p style={{ color: '#94a3b8', marginTop: 0 }}>
        Top {data.length} downtime reasons (out of {totalEvents} events) with cumulative %.
      </p>
      {loading && <div>Loading downtime…</div>}
      {error && <div className="ai-error">Failed to load: {error}</div>}
      {!loading && !error && data.length === 0 && (
        <div style={{ color: '#94a3b8' }}>No downtime events recorded.</div>
      )}
      {!loading && !error && data.length > 0 && (
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="reason"
              tick={{ fill: '#cbd5e1', fontSize: 11 }}
              angle={-30}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#cbd5e1', fontSize: 11 }}
              label={{ value: 'Count', angle: -90, fill: '#94a3b8', position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#cbd5e1', fontSize: 11 }}
              domain={[0, 100]}
              label={{ value: 'Cumulative %', angle: 90, fill: '#94a3b8', position: 'insideRight' }}
            />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ color: '#cbd5e1' }} />
            <Bar yAxisId="left" dataKey="count" name="Event count" fill="#fb7185" />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative_pct"
              name="Cumulative %"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
