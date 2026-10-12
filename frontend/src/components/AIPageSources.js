import { useEffect, useState } from 'react';
import { balesApi, sortationLinesApi, routeStopsApi } from '../services/api';

const sourceApis = { bale_id: balesApi, line_id: sortationLinesApi, stops_json: routeStopsApi };
export const hasNativeSource = key => ['bale_id', 'line_id'].includes(key);
const same = (a, b) => String(a) === String(b);
const present = value => value !== null && value !== undefined && String(value).trim() !== '';
const numeric = value => present(value) && Number.isFinite(Number(value));
const reviewed = (key, filled, current, manual) => manual[key] && same(current.bale_id, filled.bale_id) && present(current[key]);
const parseArray = value => { try { const result = typeof value === 'string' ? JSON.parse(value) : value; return Array.isArray(result) ? result : null; } catch { return null; } };

export function initialNativeFields(inputs = []) {
  const linkedBale = inputs.some(field => field.key === 'bale_id');
  return Object.fromEntries(inputs.map(field => [field.key, linkedBale && ['weight_kg', 'contamination_pct'].includes(field.key) ? '' : field.defaultValue ?? (field.type === 'number' ? 0 : '')]));
}

export function useNativeSourceRecords(inputs = []) {
  const signature = inputs.filter(field => Object.hasOwn(sourceApis, field.key)).map(field => field.key).sort().join(',');
  const [state, setState] = useState({ signature: '', loading: false, rows: {}, errors: {} });
  useEffect(() => {
    if (!signature) { setState({ signature, loading: false, rows: {}, errors: {} }); return undefined; }
    const controller = new AbortController(); setState({ signature, loading: true, rows: {}, errors: {} });
    const keys = signature.split(',');
    Promise.allSettled(keys.map(key => sourceApis[key].list({ signal: controller.signal }))).then(results => {
      if (controller.signal.aborted) return;
      const rows = {}, errors = {};
      results.forEach((result, index) => {
        const key = keys[index];
        if (result.status === 'rejected') { rows[key] = []; errors[key] = result.reason?.message || 'Could not load accessible saved sources.'; return; }
        const data = result.value, list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : null;
        if (!list) { rows[key] = []; errors[key] = 'The source API returned an invalid record list. Reload the page or sign in again.'; return; }
        const seen = new Set(), nativeKey = key === 'stops_json' ? 'stop_id' : key; rows[key] = list.filter(row => row && typeof row === 'object' && present(row[nativeKey]) && !seen.has(String(row[nativeKey])) && seen.add(String(row[nativeKey])));
      });
      setState({ signature, loading: false, rows, errors });
    });
    return () => controller.abort();
  }, [signature]);
  return state.signature === signature ? state : { signature, loading: Boolean(signature), rows: {}, errors: {} };
}

export function withNativeSourceOptions(fields, records) {
  const linkedBale = fields.some(field => field.key === 'bale_id');
  return fields.map(field => {
    if (hasNativeSource(field.key)) return { ...field, requiresExistingRecord: true, nativeSource: true, options: (records.rows[field.key] || []).map(row => ({ value: String(row[field.key]), label: String(row[field.key]) + (row.name ? ' · ' + row.name : row.commodity ? ' · ' + row.commodity : '') })) };
    if (field.key === 'stops_json') return { ...field, nativeStructuredSource: true, options: (records.rows.stops_json || []).map(row => ({ value: String(row.stop_id), label: String(row.stop_id) })) };
    if (linkedBale && ['commodity', 'weight_kg', 'grade', 'contamination_pct'].includes(field.key)) return { ...field, required: true, ...(field.key === 'contamination_pct' ? { min: 0, max: 100, requiresManualFact: true } : {}) };
    return field;
  });
}

export function sourcePrerequisite(fields, records, values) {
  const actual = fields.filter(field => field.nativeSource || field.nativeStructuredSource); if (!actual.length) return '';
  if (records.loading) return 'Loading actual accessible bale, sortation-line or route-stop records…';
  const failed = actual.find(field => records.errors[field.key]); if (failed) return failed.label + ': ' + records.errors[failed.key];
  const empty = actual.find(field => !field.options.length); if (empty) return 'Load an accessible saved record for ' + empty.label + ' before filling the complete example. No source ID is invented.';
  const structured = actual.find(field => field.nativeStructuredSource && present(values[field.key]) && (() => { const items = parseArray(values[field.key]); return !items || items.some(item => !item || !field.options.some(option => same(option.value, item.id ?? item.stop_id))); })());
  if (structured) return 'The manually supplied route stops contain invalid or inaccessible saved IDs. Choose documented accessible stops before generating.';
  const invalid = actual.find(field => field.nativeSource && present(values[field.key]) && !field.options.some(option => same(option.value, values[field.key])));
  return invalid ? 'The selected ' + invalid.label + ' is unavailable. Choose an actual accessible source.' : '';
}

export function bindNativeReferenceExample(fields, filled, current, records, variant, manual = {}) {
  const keys = new Set(fields.map(field => field.key)), focus = ['Check documented source facts and missing observations.', 'Plan human review of source gaps before operational changes.', 'Review uncertainty and retain original evidence for verification.'][variant % 3];
  if (keys.has('bale_id')) {
    if (!present(current.bale_id)) {
      const eligible = (records.rows.bale_id || []).filter(row => (!keys.has('commodity') || present(row.commodity)) && (!keys.has('weight_kg') || numeric(row.weight_kg)) && (!keys.has('grade') || (fields.find(field => field.key === 'grade')?.options || []).some(option => String(option).toLowerCase() === String(row.grade || '').trim().toLowerCase())));
      if (eligible.length) filled.bale_id = String(eligible[variant % eligible.length].bale_id);
    }
    const bale = (records.rows.bale_id || []).find(row => same(row.bale_id, filled.bale_id)); if (!bale) throw new Error('Choose an actual accessible saved bale.');
    for (const key of ['commodity', 'weight_kg', 'grade']) if (keys.has(key)) {
      if (reviewed(key, filled, current, manual)) filled[key] = current[key];
      else if (key === 'weight_kg') filled[key] = numeric(bale.weight_kg) ? Number(bale.weight_kg) : '';
      else if (key === 'grade') { const candidate = String(bale.grade || '').trim(), options = fields.find(field => field.key === key)?.options || []; filled[key] = options.find(option => String(option).toLowerCase() === candidate.toLowerCase()) || ''; }
      else filled[key] = present(bale[key]) ? bale[key] : '';
    }
    if (keys.has('contamination_pct')) filled.contamination_pct = reviewed('contamination_pct', filled, current, manual) && numeric(current.contamination_pct) && Number(current.contamination_pct) >= 0 && Number(current.contamination_pct) <= 100 ? Number(current.contamination_pct) : '';
    if (keys.has('inspection_notes')) filled.inspection_notes = reviewed('inspection_notes', filled, current, manual) ? current.inspection_notes : 'Inspection observations: Not documented. Inspect the selected actual bale before relying on a quality grade.' + (present(bale.notes) ? '\nSaved workflow notes (not inspection observations): ' + bale.notes : '') + '\n' + focus;
    if (keys.has('constraints_notes')) filled.constraints_notes = manual.constraints_notes && same(current.bale_id, filled.bale_id) && present(current.constraints_notes) ? current.constraints_notes : focus + ' No shipment, certification, buyer acceptance or contamination finding is confirmed by this example.';
  }
  if (keys.has('line_id')) {
    const line = (records.rows.line_id || []).find(row => same(row.line_id, filled.line_id)); if (!line) throw new Error('Choose an actual accessible saved sortation line.');
    for (const [jsonKey, notesKey, description] of [['frame_events_json', 'operator_notes', 'Recorded frame observations'], ['shift_history_json', 'context_notes', 'Historical shift measurements']]) if (keys.has(jsonKey)) {
      const manualArray = manual[jsonKey] && same(current.line_id, filled.line_id) ? parseArray(current[jsonKey]) : null;
      filled[jsonKey] = manualArray ? current[jsonKey] : '[]';
      if (keys.has(notesKey)) filled[notesKey] = manual[notesKey] && same(current.line_id, filled.line_id) && present(current[notesKey]) ? current[notesKey] : description + ': Not documented in the saved source. ' + focus + (present(line.status) ? '\nSaved current line status: ' + line.status : '') + (numeric(line.throughput_tph) ? '\nSaved current throughput snapshot: ' + line.throughput_tph + ' tph (not a time series).' : '');
    }
  }
  if (keys.has('stops_json')) {
    const actual = records.rows.stops_json || [], existing = manual.stops_json ? parseArray(current.stops_json) : null;
    if (existing) filled.stops_json = current.stops_json;
    else {
      const selected = variant % 3 === 2 ? actual : actual.length ? [actual[variant % actual.length]] : [];
      filled.stops_json = JSON.stringify(selected.map(row => ({ id: String(row.stop_id), address: present(row.address) ? row.address : null, est_tons: numeric(row.est_tons) ? Number(row.est_tons) : null })), null, 2);
    }
  }
  return filled;
}

export function changeNativeReference(inputs, initial, values, key, value) {
  const next = { ...initial }; for (const field of inputs) if (hasNativeSource(field.key)) next[field.key] = values[field.key] || ''; next[key] = value; return next;
}
