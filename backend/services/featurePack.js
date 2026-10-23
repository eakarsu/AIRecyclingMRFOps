'use strict';
// Deterministic feature-pack logic for AIRecyclingMRFOps.
// This module never calls an AI provider, never loads dotenv, and never
// touches the database, so tests can import it offline with provider
// keys unset. AI-style endpoints built on it always return the labelled
// deterministic fallback (aiGenerated: false).

const FALLBACK_LABEL = 'Deterministic fallback — not AI-generated';
const TASK_STATUSES = ['open', 'in_progress', 'done', 'blocked'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];

function cleanText(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizeTaskInput(body, { partial = false } = {}) {
  const input = body && typeof body === 'object' ? body : {};
  const errors = [];
  const task = {};
  if (!partial || Object.prototype.hasOwnProperty.call(input, 'title')) {
    const title = cleanText(input.title);
    if (!title) errors.push('title is required');
    else task.title = title.slice(0, 300);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(input, 'description')) {
    task.description = cleanText(input.description);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(input, 'status')) {
    const status = cleanText(input.status).toLowerCase();
    task.status = TASK_STATUSES.includes(status) ? status : 'open';
  }
  if (!partial || Object.prototype.hasOwnProperty.call(input, 'priority')) {
    const priority = cleanText(input.priority).toLowerCase();
    task.priority = TASK_PRIORITIES.includes(priority) ? priority : 'medium';
  }
  if (!partial || Object.prototype.hasOwnProperty.call(input, 'due_date')) {
    task.due_date = cleanText(input.due_date) || null;
  }
  if (!partial || Object.prototype.hasOwnProperty.call(input, 'related_type')) {
    task.related_type = cleanText(input.related_type);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(input, 'related_id')) {
    const raw = input.related_id;
    task.related_id = raw === null || raw === undefined ? '' : String(raw);
  }
  return { task, errors };
}

// Merges a partial patch without dropping explicit false / 0 / '' values.
function applyTaskUpdate(existing, patch) {
  const base = existing && typeof existing === 'object' ? existing : {};
  const next = { ...base };
  const input = patch && typeof patch === 'object' ? patch : {};
  for (const key of ['title', 'description', 'status', 'priority', 'due_date', 'related_type', 'related_id']) {
    if (Object.prototype.hasOwnProperty.call(input, key) && input[key] !== undefined) {
      next[key] = input[key];
    }
  }
  return next;
}

function filterRecords(records, { search = '', status = '', priority = '', searchFields = [] } = {}) {
  const rows = Array.isArray(records) ? records : [];
  const q = cleanText(search).toLowerCase();
  const wantedStatus = cleanText(status).toLowerCase();
  const wantedPriority = cleanText(priority).toLowerCase();
  return rows.filter((row) => {
    if (!row || typeof row !== 'object') return false;
    if (wantedStatus && String(row.status ?? '').toLowerCase() !== wantedStatus) return false;
    if (wantedPriority && String(row.priority ?? '').toLowerCase() !== wantedPriority) return false;
    if (!q) return true;
    const fields = searchFields.length ? searchFields : Object.keys(row);
    return fields.some((field) => String(row[field] ?? '').toLowerCase().includes(q));
  });
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

// Serializes rows without dropping false / 0 values; empties stay empty.
function toCsv(rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return '';
  const columns = Array.from(new Set(list.flatMap((row) => Object.keys(row && typeof row === 'object' ? row : {}))));
  if (!columns.length) return '';
  return [columns.map(csvEscape).join(','), ...list.map((row) => columns.map((c) => csvEscape(row ? row[c] : '')).join(','))].join('\n');
}

function serializeExport(rows, format) {
  const fmt = cleanText(format).toLowerCase();
  if (fmt === 'csv') return { contentType: 'text/csv; charset=utf-8', body: toCsv(rows) };
  if (fmt === 'json') return { contentType: 'application/json; charset=utf-8', body: JSON.stringify(rows ?? [], null, 2) };
  return null;
}

function section(label, value) {
  return { label: String(label), value: value === undefined ? null : value };
}

function fallbackEnvelope(feature, summary, sections, extra = {}) {
  return {
    aiGenerated: false,
    label: FALLBACK_LABEL,
    feature,
    summary,
    sections,
    ...extra,
  };
}

function numberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// --- Domain deterministic fallbacks over the caller's own MRF records ---

function contaminationRiskSummary({ contaminationLogs = [], bales = [] } = {}) {
  const logs = Array.isArray(contaminationLogs) ? contaminationLogs : [];
  const baleRows = Array.isArray(bales) ? bales : [];
  const highCount = logs.filter((r) => ['high', 'critical'].includes(String(r.severity ?? '').toLowerCase())).length;
  const rejected = baleRows.filter((r) => String(r.status ?? '').toLowerCase() === 'rejected').length;
  const rates = logs.map((r) => numberOrZero(r.contamination_rate)).filter((n) => n > 0 || logs.length > 0);
  const average = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  const summary = logs.length
    ? `${logs.length} contamination log(s) reviewed; ${highCount} high/critical and ${rejected} rejected bale(s).`
    : 'No contamination logs available; all counts are zero.';
  return fallbackEnvelope('contamination-risk-summary', summary, [
    section('Contamination logs reviewed', logs.length),
    section('High or critical logs', highCount),
    section('Average contamination rate', Math.round(average * 100) / 100),
    section('Rejected bales', rejected),
    section('Has high/critical log', highCount > 0),
    section('Notes on file', logs.filter((r) => cleanText(r.notes) !== '').length),
  ]);
}

function throughputOutlook({ loadsIn = [], loadsOut = [], downtimeEvents = [] } = {}) {
  const inbound = Array.isArray(loadsIn) ? loadsIn : [];
  const outbound = Array.isArray(loadsOut) ? loadsOut : [];
  const downtime = Array.isArray(downtimeEvents) ? downtimeEvents : [];
  const openDowntime = downtime.filter((r) => String(r.status ?? '').toLowerCase() !== 'resolved').length;
  const summary = `Inbound ${inbound.length}, outbound ${outbound.length}, downtime events ${downtime.length} (${openDowntime} unresolved).`;
  return fallbackEnvelope('throughput-outlook', summary, [
    section('Inbound loads', inbound.length),
    section('Outbound loads', outbound.length),
    section('Downtime events', downtime.length),
    section('Unresolved downtime events', openDowntime),
    section('Net load balance', inbound.length - outbound.length),
    section('Has unresolved downtime', openDowntime > 0),
  ]);
}

function baleQualityFlags({ bales = [] } = {}) {
  const rows = Array.isArray(bales) ? bales : [];
  const totalWeight = rows.reduce((sum, r) => sum + numberOrZero(r.weight_kg), 0);
  const ungraded = rows.filter((r) => cleanText(r.grade) === '').length;
  const summary = rows.length
    ? `${rows.length} bale(s) totalling ${totalWeight} kg; ${ungraded} without a grade.`
    : 'No bales available; weight and counts are zero.';
  return fallbackEnvelope('bale-quality-flags', summary, [
    section('Bales reviewed', rows.length),
    section('Total weight (kg)', totalWeight),
    section('Bales without grade', ungraded),
    section('Rejected bales', rows.filter((r) => String(r.status ?? '').toLowerCase() === 'rejected').length),
    section('All bales graded', ungraded === 0 && rows.length > 0),
    section('Commodities present', Array.from(new Set(rows.map((r) => cleanText(r.commodity)).filter(Boolean))).length),
  ]);
}

const TASKS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date DATE,
  related_type TEXT NOT NULL DEFAULT '',
  related_id TEXT NOT NULL DEFAULT '',
  owner_id INTEGER,
  tenant_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

module.exports = {
  FALLBACK_LABEL,
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASKS_TABLE_SQL,
  normalizeTaskInput,
  applyTaskUpdate,
  filterRecords,
  toCsv,
  serializeExport,
  contaminationRiskSummary,
  throughputOutlook,
  baleQualityFlags,
};
