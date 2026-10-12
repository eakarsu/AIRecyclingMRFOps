import AIFieldPresets, { completeExample } from './AIFieldPresets';
import { safeAIExamples, nativeAIFields, mergeReviewedSources } from './AIPagePresets';
import useCancelableAI from './useCancelableAI';
import { hasNativeSource, useNativeSourceRecords, withNativeSourceOptions, sourcePrerequisite, bindNativeReferenceExample, changeNativeReference, initialNativeFields } from './AIPageSources';
import React, { useEffect, useRef, useState } from 'react';
import AIResultDisplay from './AIResultView';
import { getAIHistory, getAISamples } from '../services/api';

/**
 * Generic AI feature page.
 * Props:
 *   - title, subtitle
 *   - feature: string  (matches backend `feature` column in ai_results, e.g. "plan-mission")
 *   - inputs: [{ key, label, type?, placeholder?, options?, defaultValue? }]
 *   - run: async (values) => result
 *   - buttonLabel?
 */
export default function AIPage({ title, subtitle, feature, inputs, run, buttonLabel = 'Generate with OpenRouter' }) {
  const sourceRecords = useNativeSourceRecords(inputs);
  const manualFields = useRef({});
  const previousDemo = useRef({});
  const initial = initialNativeFields(inputs);
  const [values, setValues] = useState(initial);
  const nativeInputs = withNativeSourceOptions(nativeAIFields(inputs, feature), sourceRecords, values);
  const sourceIssue = sourcePrerequisite(nativeInputs, sourceRecords, values);
  const aiRequest = useCancelableAI();
  const { loading, result, error, setResult, setError } = aiRequest;



  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const [samples, setSamples] = useState([]);

  useEffect(() => {
    let alive = true;
    if (!feature) return undefined;
    getAISamples(feature)
      .then((data) => {
        if (!alive) return;
        const list = Array.isArray(data?.samples) ? data.samples : [];
        setSamples(list);
      })
      .catch(() => { if (alive) setSamples([]); });
    return () => { alive = false; };
  }, [feature]);

  const setField = (k, v) => {
    if (loading || sourceRecords.loading) return;
    if (hasNativeSource(k)) { manualFields.current = {}; previousDemo.current = {}; setValues(changeNativeReference(inputs, initial, values, k, v, sourceRecords)); }
    else { manualFields.current[k] = true; setValues((s) => ({ ...s, [k]: v })); }
    setResult(null); setError(null);
  };

  const applySample = (sample, index = 0) => {
    if (loading || sourceRecords.loading || sourceIssue) return;
    try {
      const normalized = safeAIExamples(nativeInputs, sample || {}, values);
      const nextDemo = { ...previousDemo.current };
      const filled = mergeReviewedSources(nativeInputs, completeExample(nativeInputs, normalized, index, title, values), values, nextDemo);
      setValues(bindNativeReferenceExample(nativeInputs, filled, values, sourceRecords, index, manualFields.current));
      previousDemo.current = nextDemo;
      setResult(null); setError(null);
    } catch (failure) { setError(failure.message); }
  };

  const missingReferences = nativeInputs.filter(field => (field.required && !String(values[field.key] ?? '').trim()) || field.requiresManualFact && (!manualFields.current[field.key] || !Number.isFinite(Number(values[field.key])) || Number(values[field.key]) < field.min || Number(values[field.key]) > field.max) || field.nativeSource && String(values[field.key] ?? '').trim() && !field.options.some(option => String(option.value) === String(values[field.key])));
  const handleRun = async () => { if (sourceRecords.loading) return; if (sourceIssue) { setError(sourceIssue); return; } if (missingReferences.length) { setError('Complete required fields and choose actual matching saved references before generating: ' + missingReferences.map(field => field.label).join(', ')); return; } return aiRequest.run((options) => run(values, options)); };

  const openHistory = async () => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryRows([]);
    try {
      const rows = await getAIHistory(feature, 50);
      setHistoryRows(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setHistoryError(e.message);
    } finally {
      setHistoryLoading(false);
    }
  };
  const closeHistory = () => setHistoryOpen(false);

  return (
    <div className="sr-ai-workspace">
      <div className="page-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="page-header-actions">
          {feature && (
            <button className="btn secondary" onClick={openHistory}>History</button>
          )}
          <button className="btn ai" onClick={handleRun} disabled={loading || sourceRecords.loading || Boolean(sourceIssue) || missingReferences.length > 0}>
            {loading ? <><span className="spinner" />Running...</> : buttonLabel}
          </button>
          {loading && <button type="button" className="btn secondary btn-secondary" onClick={aiRequest.cancel}>Cancel</button>}
        </div>
      </div>

      <AIFieldPresets fields={nativeInputs} samples={samples.map((sample, index) => ({ ...sample, label: `Demo AI · ${sample.label || ["Quick review", "Team planning", "Detailed review"][index % 3]}` }))} context={title} disabled={loading || sourceRecords.loading || Boolean(sourceIssue)} onFill={applySample} />
      {missingReferences.length > 0 && <p role="status">Complete {missingReferences.map(field => field.label).join(", ")}; source references must use actual saved records. Demo AI never invents IDs or undocumented source facts. {nativeInputs.some(field => field.requiresManualFact) && ' A verified contamination measurement between 0 and 100 must be entered manually; no default zero is assumed.'}</p>}
      {sourceIssue && <p role="status">{sourceIssue}</p>}
      <p>Demo inputs are illustrative planning examples. Preserve verified observations, record references and original source data; review them before sending.</p>
      {aiRequest.notice && <div className="sr-notice" role="status">{aiRequest.notice}</div>}

      {(inputs && inputs.length > 0) && (
        <div className="card">
          <div className="form-grid">
            {inputs.map((i) => (
              <div key={i.key} className={`form-group ${i.type === 'textarea' ? 'full-width' : ''}`}>
                <label>{i.label}</label>
                {hasNativeSource(i.key) ? (
                  <select data-ai-field={i.key} data-ai-real-source={i.key} disabled={loading || sourceRecords.loading} required={Boolean(nativeInputs.find(field => field.key === i.key)?.required)} value={values[i.key] ?? ''} onChange={e => setField(i.key, e.target.value)}>
                    <option value="">Choose an actual saved record, or use Demo AI</option>
                    {values[i.key] && !nativeInputs.find(field => field.key === i.key)?.options.some(option => String(option.value) === String(values[i.key])) && <option value={values[i.key]} disabled>Previously selected source unavailable</option>}
                    {(nativeInputs.find(field => field.key === i.key)?.options || []).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                ) : i.type === 'select' ? (
                  <select data-ai-field={i.key} disabled={loading || sourceRecords.loading} required={Boolean(nativeInputs.find(field => field.key === i.key)?.required)} value={values[i.key] ?? ''} onChange={(e) => setField(i.key, e.target.value)}>
                    <option value="">—</option>
                    {(i.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : i.type === 'textarea' ? (
                  <textarea
                    data-ai-field={i.key}
                    disabled={loading || sourceRecords.loading}
                    required={Boolean(nativeInputs.find(field => field.key === i.key)?.required)}
                    placeholder={i.placeholder || ''}
                    value={values[i.key] ?? ''}
                    onChange={(e) => setField(i.key, e.target.value)}
                  />
                ) : (
                  <input data-ai-field={i.key} disabled={loading || sourceRecords.loading} required={Boolean(nativeInputs.find(field => field.key === i.key)?.required)}
                    type={i.type || 'text'}
                    min={nativeInputs.find(field => field.key === i.key)?.min}
                    max={nativeInputs.find(field => field.key === i.key)?.max}
                    step={i.type === 'number' ? 'any' : undefined}
                    placeholder={i.placeholder || ''}
                    value={values[i.key] ?? ''}
                    onChange={(e) =>
                      setField(i.key, i.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <AIResultDisplay
        result={result}
        loading={loading}
        error={error}
        feature={feature}
        title={title}
      />

      {historyOpen && (
        <div className="modal-overlay" onClick={closeHistory}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 900 }}>
            <div className="modal-header">
              <h3>{title} · History</h3>
              <button className="modal-close" onClick={closeHistory}>×</button>
            </div>
            <div className="modal-body">
              {historyLoading && <div className="empty-state">Loading history...</div>}
              {historyError && <div className="ai-error">{historyError}</div>}
              {!historyLoading && !historyError && historyRows.length === 0 && (
                <div className="empty-state">No past results for this feature yet.</div>
              )}
              {historyRows.map((row) => (
                <div key={row.id} className="history-entry">
                  <div className="history-entry-meta">
                    <span className="history-entry-id">#{row.id}</span>
                    <span className="history-entry-time">
                      {row.created_at ? new Date(row.created_at).toLocaleString() : ''}
                    </span>
                  </div>
                  {row.input && Object.keys(row.input).length > 0 && (
                    <details>
                      <summary>Input parameters</summary>
                      <div style={{ marginTop: 8 }}>
                        <AIResultDisplay result={row.input} feature={`${feature}-input`} title="Input" />
                      </div>
                    </details>
                  )}
                  <div style={{ marginTop: 10 }}>
                    <AIResultDisplay result={row.output} feature={feature} title={title} />
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn secondary" onClick={closeHistory}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
