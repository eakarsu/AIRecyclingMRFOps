import React from 'react';
import { NavLink } from 'react-router-dom';
import { logout, getStoredUser } from '../services/api';

const INBOUND_LINKS = [
  { to: '/loads-in',           label: 'Loads In' },
  { to: '/contamination-logs', label: 'Contamination Logs' },
  { to: '/drivers',            label: 'Drivers' },
  { to: '/vehicles',           label: 'Vehicles' },
];

const BALES_LINKS = [
  { to: '/bales', label: 'Bales (Finished)' },
];

const OUTBOUND_LINKS = [
  { to: '/loads-out', label: 'Loads Out' },
];

const LINES_LINKS = [
  { to: '/sortation-lines', label: 'Sortation Lines' },
  { to: '/downtime-events', label: 'Downtime Events' },
  { to: '/equipment',       label: 'Equipment' },
  { to: '/operators',       label: 'Operators' },
];

const CUSTOMERS_LINKS = [
  { to: '/customers',  label: 'Customers' },
  { to: '/contracts',  label: 'Contracts' },
];

const SAFETY_LINKS = [
  { to: '/safety-incidents', label: 'Safety Incidents' },
  { to: '/training-records', label: 'Training Records' },
];

const GOVERNANCE_LINKS = [
  { to: '/vendors',     label: 'Vendors' },
  { to: '/commodities', label: 'Commodities' },
  { to: '/prices',      label: 'Prices' },
  { to: '/audit-log',   label: 'Audit Log' },
];

const AI_SORTING_LINKS = [
  { to: '/ai/contamination-vision-score', label: 'AI · Contamination Vision' },
  { to: '/ai/sortation-line-balance',     label: 'AI · Sortation Balance' },
  { to: '/ai/downtime-rca',               label: 'AI · Downtime RCA' },
  { to: '/ai/equipment-prognostic',       label: 'AI · Equipment Prognostic' },
  { to: '/ai/bale-quality-grade',         label: 'AI · Bale Quality Grade' },
];

const AI_PRICING_LINKS = [
  { to: '/ai/commodity-price-forecast',  label: 'AI · Price Forecast' },
  { to: '/ai/scrap-market-brief',        label: 'AI · Scrap Market Brief' },
  { to: '/ai/customer-quality-feedback', label: 'AI · Customer Quality' },
  { to: '/ai/vendor-quote-compare',      label: 'AI · Vendor Quote Compare' },
  { to: '/ai/hauler-payment-recon',      label: 'AI · Hauler Payment Recon' },
];

const AI_REPORTING_LINKS = [
  { to: '/ai/executive-brief',            label: 'AI · Executive Brief' },
  { to: '/ai/capacity-utilization-brief', label: 'AI · Capacity Utilization' },
  { to: '/ai/safety-incident-summary',    label: 'AI · Safety Summary' },
  { to: '/ai/training-needs',             label: 'AI · Training Needs' },
  { to: '/ai/route-pickup-optimize',      label: 'AI · Route / Pickup' },
  { to: '/ai/regulatory-reporting',       label: 'AI · Regulatory Reporting' },
];

export default function Sidebar() {
  const user = getStoredUser();
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <h1>MRF COMMAND</h1>
        <p>Materials Recovery Facility Ops</p>
      </div>

      <NavLink to="/" end>Overview</NavLink>

      <div className="sidebar-group-label">Inbound</div>
      {INBOUND_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}

      <div className="sidebar-group-label">Bales</div>
      {BALES_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}

      <div className="sidebar-group-label">Outbound</div>
      {OUTBOUND_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}

      <div className="sidebar-group-label">Lines</div>
      {LINES_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}

      <div className="sidebar-group-label">Customers</div>
      {CUSTOMERS_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}

      <div className="sidebar-group-label">Safety</div>
      {SAFETY_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}

      <div className="sidebar-group-label">Governance</div>
      {GOVERNANCE_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}

      <div className="sidebar-group-label">AI Sorting</div>
      {AI_SORTING_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}

      <div className="sidebar-group-label">AI Pricing</div>
      {AI_PRICING_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}

      <div className="sidebar-group-label">AI Reporting</div>
      {AI_REPORTING_LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}

      <div className="sidebar-group-label">Analytics</div>
      <NavLink to="/custom-views">MRF Analytics</NavLink>

      <div className="sidebar-group-label">Admin</div>
      <NavLink to="/webhooks">Webhooks</NavLink>

      <div className="sidebar-user">
        {user && (
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name || user.email}</div>
            <div className="sidebar-user-role">{user.role || 'user'}</div>
          </div>
        )}
        <button className="btn secondary sidebar-logout" onClick={logout}>Sign Out</button>
      </div>
    </nav>
  );
}
