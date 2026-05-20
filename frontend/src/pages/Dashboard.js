import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../services/api';

const FEATURES = [
  // 18 entities
  { path: '/loads-in',           title: 'Loads In',            icon: 'I', color: '#f59e0b', desc: 'Inbound hauler loads at the tipping floor.' },
  { path: '/contamination-logs', title: 'Contamination Logs',  icon: 'C', color: '#ef4444', desc: 'Tracked contaminants per inbound load.' },
  { path: '/bales',              title: 'Bales',               icon: 'B', color: '#10b981', desc: 'Finished bales by commodity and grade.' },
  { path: '/loads-out',          title: 'Loads Out',           icon: 'O', color: '#22c55e', desc: 'Bale shipments to customers.' },
  { path: '/customers',          title: 'Customers',           icon: 'U', color: '#0ea5e9', desc: 'Off-take buyers for bales.' },
  { path: '/contracts',          title: 'Contracts',           icon: 'K', color: '#06b6d4', desc: 'Customer purchase agreements.' },
  { path: '/commodities',        title: 'Commodities',         icon: '$', color: '#a78bfa', desc: 'Tracked recyclable commodities.' },
  { path: '/prices',             title: 'Prices',              icon: 'P', color: '#facc15', desc: 'Market price observations.' },
  { path: '/drivers',            title: 'Drivers',             icon: 'D', color: '#34d399', desc: 'CDL-A drivers on roster.' },
  { path: '/vehicles',           title: 'Vehicles',            icon: 'V', color: '#14b8a6', desc: 'Trucks and yard equipment.' },
  { path: '/equipment',          title: 'Equipment',           icon: 'E', color: '#7dd3fc', desc: 'Balers, screens, optical sorters, robots.' },
  { path: '/sortation-lines',    title: 'Sortation Lines',     icon: 'L', color: '#60a5fa', desc: 'Live production line state.' },
  { path: '/downtime-events',    title: 'Downtime Events',     icon: 'X', color: '#fb7185', desc: 'Open and resolved line downtime.' },
  { path: '/operators',          title: 'Operators',           icon: 'R', color: '#a3e635', desc: 'Sort cabin and line operators.' },
  { path: '/safety-incidents',   title: 'Safety Incidents',    icon: '+', color: '#dc2626', desc: 'OSHA-recordable and near-miss tracking.' },
  { path: '/training-records',   title: 'Training Records',    icon: 'T', color: '#f472b6', desc: 'Operator certifications and refreshers.' },
  { path: '/vendors',            title: 'Vendors',             icon: 'N', color: '#3b82f6', desc: 'OEMs, haulers, downstream processors.' },
  { path: '/audit-log',          title: 'Audit Log',           icon: 'A', color: '#94a3b8', desc: 'Actor / target / action / result trail.' },

  // 16 AI verbs
  { path: '/ai/contamination-vision-score', title: 'AI · Contamination Vision', icon: '*', color: '#8b5cf6', desc: 'Score inbound load contamination from a description.' },
  { path: '/ai/commodity-price-forecast',   title: 'AI · Price Forecast',       icon: '*', color: '#8b5cf6', desc: 'Forecast bale pricing over the next 30-90 days.' },
  { path: '/ai/sortation-line-balance',     title: 'AI · Sortation Balance',    icon: '*', color: '#8b5cf6', desc: 'Rebalance lines and operators against inbound mix.' },
  { path: '/ai/downtime-rca',               title: 'AI · Downtime RCA',         icon: '*', color: '#8b5cf6', desc: 'Root-cause analysis on recent downtime.' },
  { path: '/ai/executive-brief',            title: 'AI · Executive Brief',      icon: '*', color: '#8b5cf6', desc: 'Plant-manager snapshot and decisions.' },
  { path: '/ai/customer-quality-feedback',  title: 'AI · Customer Quality',     icon: '*', color: '#8b5cf6', desc: 'Draft a corrective-action response.' },
  { path: '/ai/vendor-quote-compare',       title: 'AI · Vendor Quote Compare', icon: '*', color: '#8b5cf6', desc: 'Score competing OEM / hauler quotes.' },
  { path: '/ai/route-pickup-optimize',      title: 'AI · Route / Pickup',       icon: '*', color: '#8b5cf6', desc: 'Optimize hauler routes and outbound deliveries.' },
  { path: '/ai/safety-incident-summary',    title: 'AI · Safety Summary',       icon: '*', color: '#8b5cf6', desc: 'Daily safety stand-up summary.' },
  { path: '/ai/training-needs',             title: 'AI · Training Needs',       icon: '*', color: '#8b5cf6', desc: 'Identify gaps and propose a curriculum.' },
  { path: '/ai/hauler-payment-recon',       title: 'AI · Hauler Recon',         icon: '*', color: '#8b5cf6', desc: 'Reconcile invoices against load tickets.' },
  { path: '/ai/capacity-utilization-brief', title: 'AI · Capacity Brief',       icon: '*', color: '#8b5cf6', desc: 'Plant capacity utilization narrative.' },
  { path: '/ai/equipment-prognostic',       title: 'AI · Equipment Prognostic', icon: '*', color: '#8b5cf6', desc: 'Predict component failures across equipment.' },
  { path: '/ai/bale-quality-grade',         title: 'AI · Bale Quality Grade',   icon: '*', color: '#8b5cf6', desc: 'Assign ISRI-spec grade to a finished bale.' },
  { path: '/ai/regulatory-reporting',       title: 'AI · Regulatory Report',    icon: '*', color: '#8b5cf6', desc: 'Draft EPA / municipal reporting outputs.' },
  { path: '/ai/scrap-market-brief',         title: 'AI · Scrap Market Brief',   icon: '*', color: '#8b5cf6', desc: 'Weekly secondary-commodity market summary.' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    getDashboardStats().then(setStats).catch((e) => setErr(e.message));
  }, []);

  return (
    <div>
      <div className="dashboard-header">
        <h2>MRF Command Overview</h2>
        <p>Unified plant picture · {new Date().toUTCString()}</p>
      </div>

      {err && <div className="ai-error">Stats unavailable: {err}</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat"><div className="stat-label">Bales</div><div className="stat-value">{stats.bales?.total ?? '—'}</div><div className="stat-sub">{stats.bales?.staged ?? 0} staged · {stats.bales?.shipped ?? 0} shipped</div></div>
          <div className="stat"><div className="stat-label">Loads In</div><div className="stat-value">{stats.loads_in?.total ?? '—'}</div><div className="stat-sub">{stats.loads_in?.flagged ?? 0} flagged · {stats.loads_in?.rejected ?? 0} rejected</div></div>
          <div className="stat"><div className="stat-label">Avg Contam %</div><div className="stat-value">{stats.loads_in?.avg_contam ?? '—'}</div><div className="stat-sub">across {stats.loads_in?.total ?? 0} loads</div></div>
          <div className="stat"><div className="stat-label">Loads Out</div><div className="stat-value">{stats.loads_out?.total ?? '—'}</div><div className="stat-sub">{stats.loads_out?.scheduled ?? 0} scheduled · {stats.loads_out?.in_transit ?? 0} in transit</div></div>
          <div className="stat"><div className="stat-label">Contamination</div><div className="stat-value">{stats.contamination_logs?.total ?? '—'}</div><div className="stat-sub">{stats.contamination_logs?.critical ?? 0} critical · {stats.contamination_logs?.high ?? 0} high</div></div>
          <div className="stat"><div className="stat-label">Commodities</div><div className="stat-value">{stats.commodities?.total ?? '—'}</div><div className="stat-sub">{stats.commodities?.low_demand ?? 0} low-demand</div></div>
          <div className="stat"><div className="stat-label">Prices</div><div className="stat-value">{stats.prices?.total ?? '—'}</div><div className="stat-sub">market observations</div></div>
          <div className="stat"><div className="stat-label">Customers</div><div className="stat-value">{stats.customers?.total ?? '—'}</div><div className="stat-sub">{stats.customers?.active ?? 0} active · {stats.customers?.suspended ?? 0} suspended</div></div>
          <div className="stat"><div className="stat-label">Contracts</div><div className="stat-value">{stats.contracts?.total ?? '—'}</div><div className="stat-sub">{stats.contracts?.active ?? 0} active · {stats.contracts?.pending ?? 0} pending</div></div>
          <div className="stat"><div className="stat-label">Lines</div><div className="stat-value">{stats.sortation_lines?.total ?? '—'}</div><div className="stat-sub">{stats.sortation_lines?.running ?? 0} running · {stats.sortation_lines?.idle ?? 0} idle</div></div>
          <div className="stat"><div className="stat-label">Downtime</div><div className="stat-value">{stats.downtime_events?.total ?? '—'}</div><div className="stat-sub">{stats.downtime_events?.open ?? 0} open</div></div>
          <div className="stat"><div className="stat-label">Equipment</div><div className="stat-value">{stats.equipment?.total ?? '—'}</div><div className="stat-sub">{stats.equipment?.operational ?? 0} op · {stats.equipment?.fault ?? 0} fault</div></div>
          <div className="stat"><div className="stat-label">Drivers</div><div className="stat-value">{stats.drivers?.total ?? '—'}</div><div className="stat-sub">{stats.drivers?.available ?? 0} available · {stats.drivers?.on_route ?? 0} on route</div></div>
          <div className="stat"><div className="stat-label">Vehicles</div><div className="stat-value">{stats.vehicles?.total ?? '—'}</div><div className="stat-sub">{stats.vehicles?.ready ?? 0} ready · {stats.vehicles?.in_service ?? 0} in service</div></div>
          <div className="stat"><div className="stat-label">Operators</div><div className="stat-value">{stats.operators?.total ?? '—'}</div><div className="stat-sub">{stats.operators?.active ?? 0} active</div></div>
          <div className="stat"><div className="stat-label">Safety</div><div className="stat-value">{stats.safety_incidents?.total ?? '—'}</div><div className="stat-sub">{stats.safety_incidents?.open ?? 0} open · {stats.safety_incidents?.critical ?? 0} critical</div></div>
          <div className="stat"><div className="stat-label">Training</div><div className="stat-value">{stats.training_records?.total ?? '—'}</div><div className="stat-sub">{stats.training_records?.recheck ?? 0} recheck</div></div>
          <div className="stat"><div className="stat-label">Vendors</div><div className="stat-value">{stats.vendors?.total ?? '—'}</div><div className="stat-sub">{stats.vendors?.approved ?? 0} approved · {stats.vendors?.under_review ?? 0} review</div></div>
        </div>
      )}

      <h3 style={{ color: '#cbd5e1', margin: '8px 0 14px', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 }}>Capabilities</h3>
      <div className="feature-grid">
        {FEATURES.map((f) => (
          <div
            key={f.path}
            className="feature-card"
            style={{ ['--card-color']: f.color }}
            onClick={() => navigate(f.path)}
          >
            <div className="feature-card-icon" style={{ background: f.color + '22', color: f.color }}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
