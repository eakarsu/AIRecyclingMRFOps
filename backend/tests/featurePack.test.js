'use strict';
// Offline tests for the feature pack. Provider keys are removed before the
// (provider-free) module is imported, and no network or database is used.
delete process.env.OPENROUTER_API_KEY;
delete process.env.OPENAI_API_KEY;

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const {
  FALLBACK_LABEL,
  normalizeTaskInput,
  applyTaskUpdate,
  filterRecords,
  toCsv,
  serializeExport,
  contaminationRiskSummary,
  throughputOutlook,
  baleQualityFlags,
} = require('../services/featurePack');

test('task create requires a title and applies defaults', () => {
  assert.deepEqual(normalizeTaskInput({}).errors, ['title is required']);
  const { task, errors } = normalizeTaskInput({ title: '  Sort line check  ' });
  assert.deepEqual(errors, []);
  assert.equal(task.title, 'Sort line check');
  assert.equal(task.status, 'open');
  assert.equal(task.priority, 'medium');
  assert.equal(task.description, '');
});

test('task update preserves explicit false-like and empty values', () => {
  const next = applyTaskUpdate(
    { title: 'Old', description: 'keep?', status: 'open', priority: 'high' },
    { description: '', status: 'done' }
  );
  assert.equal(next.title, 'Old');
  assert.equal(next.description, '');
  assert.equal(next.status, 'done');
  assert.equal(next.priority, 'high');
});

test('search and status/priority filters narrow the main list', () => {
  const rows = [
    { title: 'Check PET bales', status: 'open', priority: 'high' },
    { title: 'Glass audit', status: 'done', priority: 'low' },
    { title: 'PET line wash', status: 'open', priority: 'low' },
  ];
  assert.equal(filterRecords(rows, { search: 'pet' }).length, 2);
  assert.equal(filterRecords(rows, { status: 'open' }).length, 2);
  assert.equal(filterRecords(rows, { search: 'pet', priority: 'low' }).length, 1);
  assert.equal(filterRecords(rows, {}).length, 3);
});

test('CSV and JSON export preserve false, 0 and empty values', () => {
  const rows = [{ name: 'bale-1', weight_kg: 0, graded: false, grade: '' }];
  const csv = toCsv(rows);
  assert.match(csv, /weight_kg/);
  assert.match(csv, /,0,/);
  assert.match(csv, /false/);
  const json = JSON.parse(serializeExport(rows, 'json').body);
  assert.equal(json[0].weight_kg, 0);
  assert.equal(json[0].graded, false);
  assert.equal(json[0].grade, '');
  assert.equal(serializeExport(rows, 'xml'), null);
});

test('domain fallbacks are labelled, deterministic and keep zero counts', () => {
  const input = {
    contaminationLogs: [{ severity: 'high', contamination_rate: 10, notes: 'film' }, { severity: 'low', contamination_rate: 0, notes: '' }],
    bales: [{ status: 'rejected', weight_kg: 0, grade: '', commodity: 'PET' }],
  };
  const first = contaminationRiskSummary(input);
  assert.equal(first.aiGenerated, false);
  assert.equal(first.label, FALLBACK_LABEL);
  assert.deepEqual(first, contaminationRiskSummary(input));
  const values = Object.fromEntries(first.sections.map((s) => [s.label, s.value]));
  assert.equal(values['High or critical logs'], 1);
  assert.equal(values['Has high/critical log'], true);
  assert.equal(values['Rejected bales'], 1);

  const empty = baleQualityFlags({ bales: [] });
  assert.equal(empty.aiGenerated, false);
  assert.equal(Object.fromEntries(empty.sections.map((s) => [s.label, s.value]))['Total weight (kg)'], 0);
  assert.equal(Object.fromEntries(empty.sections.map((s) => [s.label, s.value]))['All bales graded'], false);

  const flow = throughputOutlook({ loadsIn: [{ id: 1 }], loadsOut: [], downtimeEvents: [{ status: 'open' }] });
  assert.equal(flow.aiGenerated, false);
  assert.equal(Object.fromEntries(flow.sections.map((s) => [s.label, s.value]))['Outbound loads'], 0);
});

test('server mounts the authenticated feature pack without provider calls', () => {
  const server = fs.readFileSync(__dirname + '/../server.js', 'utf8');
  assert.ok(server.includes("require('./routes/featurePack')"), 'feature pack must be mounted');
  const route = fs.readFileSync(__dirname + '/../routes/featurePack.js', 'utf8');
  assert.ok(!route.includes('openrouter.ai') && !route.includes('api.openai.com'), 'feature pack must not call a provider');
});
