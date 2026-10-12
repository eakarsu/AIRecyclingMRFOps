const configuredApiBase =
  (typeof window !== 'undefined' && window.__API_BASE__) ||
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:3083/api';

// Accept either a bare origin (http://host:port) or an origin already ending in /api.
const API_BASE = configuredApiBase.replace(/\/+$/, '').replace(/\/api$/, '') + '/api';

export { API_BASE };

const TOKEN_KEY = 'mrf_token';
const USER_KEY  = 'mrf_user';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch (_) { return null; }
}
export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (_) {}
}
export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}
export function setStoredUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch (_) {}
}
export function logout() {
  setToken(null);
  setStoredUser(null);
  if (typeof window !== 'undefined') {
    window.location.assign('/login');
  }
}

// Role helpers — MRF roles: admin | ops | viewer
// (also accept legacy 'commander' / 'analyst' for back-compat)
export function getRole() {
  return (getStoredUser()?.role || 'viewer').toLowerCase();
}
export function canWrite() {
  return ['admin', 'ops', 'commander', 'analyst'].includes(getRole());
}
export function isCommander() {
  return ['admin', 'commander'].includes(getRole());
}
export const isAdmin = isCommander;

async function request(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  let res;
  try {
    res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  } catch (e) {
    throw new Error(`Network error: ${e.message}`);
  }

  // Global 401 interceptor: token missing/expired → boot to login.
  if (res.status === 401) {
    if (!url.startsWith('/auth/login')) {
      logout();
      throw new Error('Session expired');
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// Generic CRUD factory
function crud(base) {
  return {
    list:   (options = {}) => request(`/${base}`, options),
    get:    (id)     => request(`/${base}/${id}`),
    create: (data)   => request(`/${base}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, d)  => request(`/${base}/${id}`, { method: 'PUT',  body: JSON.stringify(d) }),
    remove: (id)     => request(`/${base}/${id}`, { method: 'DELETE' }),
    bulkImport: (csv) => request(`/${base}/bulk-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csv,
    }),
    listAttachments: (id) => request(`/${base}/${id}/attachments`),
    uploadAttachment: async (id, file) => {
      const token = getToken();
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE}/${base}/${id}/attachments`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
      return data;
    },
  };
}

// Pass 7 — backlog CRUD APIs
export const producersApi        = crud('producers');
export const skuObligationsApi   = crud('sku-obligations');
export const eprFilingsApi       = crud('epr-filings');
export const scaleTicketsApi     = crud('scale-tickets');
export const routesApi           = crud('routes');
export const routeStopsApi       = crud('route-stops');
export const buyersApi           = crud('buyers');
export const buyerSpecsApi       = crud('buyer-specs');

// 18 MRF CRUD APIs
export const balesApi             = crud('bales');
export const loadsInApi           = crud('loads-in');
export const loadsOutApi          = crud('loads-out');
export const contaminationLogsApi = crud('contamination-logs');
export const commoditiesApi       = crud('commodities');
export const pricesApi            = crud('prices');
export const customersApi         = crud('customers');
export const driversApi           = crud('drivers');
export const vehiclesApi          = crud('vehicles');
export const equipmentApi         = crud('equipment');
export const sortationLinesApi    = crud('sortation-lines');
export const downtimeEventsApi    = crud('downtime-events');
export const operatorsApi         = crud('operators');
export const safetyIncidentsApi   = crud('safety-incidents');
export const trainingRecordsApi   = crud('training-records');
export const vendorsApi           = crud('vendors');
export const contractsApi         = crud('contracts');
export const auditLogApi          = crud('audit-log');

// Dashboard
export const getDashboardStats = () => request('/dashboard');

// Auth
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const getMe = () => request('/auth/me');

// AI endpoints — 16 MRF verbs
export const aiContaminationVisionScore = (body, options = {}) => request('/ai/contamination-vision-score', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiCommodityPriceForecast   = (body, options = {}) => request('/ai/commodity-price-forecast',   { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiSortationLineBalance     = (body, options = {}) => request('/ai/sortation-line-balance',     { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiDowntimeRCA              = (body, options = {}) => request('/ai/downtime-rca',               { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiExecutiveBrief           = (body, options = {}) => request('/ai/executive-brief',            { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiCustomerQualityFeedback  = (body, options = {}) => request('/ai/customer-quality-feedback',  { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiVendorQuoteCompare       = (body, options = {}) => request('/ai/vendor-quote-compare',       { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiRoutePickupOptimize      = (body, options = {}) => request('/ai/route-pickup-optimize',      { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiSafetyIncidentSummary    = (body, options = {}) => request('/ai/safety-incident-summary',    { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiTrainingNeeds            = (body, options = {}) => request('/ai/training-needs',             { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiHaulerPaymentRecon       = (body, options = {}) => request('/ai/hauler-payment-recon',       { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiCapacityUtilizationBrief = (body, options = {}) => request('/ai/capacity-utilization-brief', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiEquipmentPrognostic      = (body, options = {}) => request('/ai/equipment-prognostic',       { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiBaleQualityGrade         = (body, options = {}) => request('/ai/bale-quality-grade',         { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiRegulatoryReporting      = (body, options = {}) => request('/ai/regulatory-reporting',       { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiScrapMarketBrief         = (body, options = {}) => request('/ai/scrap-market-brief',         { ...options, method: 'POST', body: JSON.stringify(body || {}) });

// Pass 7 — backlog AI verbs
export const aiLineCameraAnomalyNarrate = (body, options = {}) => request('/ai/line-camera-anomaly-narrate', { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiThroughputForecast       = (body, options = {}) => request('/ai/throughput-forecast',         { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiEndMarketMatch           = (body, options = {}) => request('/ai/end-market-match',            { ...options, method: 'POST', body: JSON.stringify(body || {}) });
export const aiContaminationReportCard  = (body, options = {}) => request('/ai/contamination-report-card',   { ...options, method: 'POST', body: JSON.stringify(body || {}) });

// AI history
export const getAIHistory = (feature, limit = 25) => {
  const qs = new URLSearchParams({
    ...(feature ? { feature } : {}),
    limit: String(limit),
  }).toString();
  return request(`/ai/history?${qs}`);
};

// AI sample fills — backend returns { feature, samples: [{label, values}, ...] }
export const getAISamples = (feature) => {
  const qs = new URLSearchParams({ feature: feature || '' }).toString();
  return request(`/ai/samples?${qs}`);
};

// Notifications
export const getNotifications       = () => request('/notifications');
export const getUnreadNotifications = () => request('/notifications/unread');
export const markNotificationRead   = (id) => request(`/notifications/${id}/read`, { method: 'POST' });
export const markAllNotificationsRead = () => request('/notifications/mark-all-read', { method: 'POST' });

// Webhooks
export const webhooksApi = {
  list:    ()         => request('/webhooks'),
  create:  (d)        => request('/webhooks',          { method: 'POST', body: JSON.stringify(d) }),
  update:  (id, d)    => request(`/webhooks/${id}`,    { method: 'PUT',  body: JSON.stringify(d) }),
  remove:  (id)       => request(`/webhooks/${id}`,    { method: 'DELETE' }),
  test:    (event, payload) => request('/webhooks/test', {
    method: 'POST',
    body: JSON.stringify({ event, payload }),
  }),
  deliveries: (id)    => request(`/webhooks/${id}/deliveries`),
};
