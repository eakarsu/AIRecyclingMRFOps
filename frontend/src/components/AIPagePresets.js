import requiredReferences from './AIPageContracts.json';
const parse = value => { try { return typeof value === 'string' ? JSON.parse(value) : value; } catch { return undefined; } };
const source = key => /(?:^|_)(?:id|ids)$/i.test(key) || /[a-z](?:Id|Ids)(?:[A-Z]\w*|$)/.test(key) || /file|upload|image|photo|audio|video|recording|transcript|(?:^|_)(?:url|uri)(?:_|$)|consent|approval|approved|attest|source_hash|signature|provenance|evidence/i.test(key);
const sourceInside = value => value && typeof value === 'object' && Object.entries(value).some(([key, item]) => source(key) || sourceInside(item));
const nonempty = value => value !== undefined && value !== null && (typeof value === 'object' || String(value).trim() !== '');

export function nativeAIFields(fields = [], feature = '') {
  return fields.map(field => {
    const structured = /(?:^|_)json$/i.test(field.key || '') || /JSON(?:\s|,|\)|$)/i.test(field.label || '');
    return { ...field, required: Boolean(field.required || requiredReferences[feature]?.includes(field.key)), ...(structured ? { type: 'json', jsonShape: /array/i.test(field.label || '') || /prices|quotes|events|stops/i.test(field.key) ? 'array' : undefined } : {}), ...(source(field.key || '') ? { requiresExistingRecord: true } : {}) };
  });
}
export function safeAIExamples(fields, sample, current) {
  const values = { ...(sample.values || sample.data || sample) };
  for (const field of fields) {
    if (field.requiresExistingRecord) { delete values[field.key]; continue; }
    if (field.type === 'json') {
      const provided = parse(values[field.key]);
      const placeholder = parse(String(field.placeholder || '').replace(/,\s*\.\.\.\s*/g, '').replace(/\.\.\.\s*,?/g, ''));
      if (sourceInside(provided) || sourceInside(placeholder)) delete values[field.key];
    }
  }
  return { ...sample, values };
}
export function mergeReviewedSources(fields, filled, current, previousDemo = {}) {
  for (const field of fields) {
    if (field.requiresExistingRecord) {
      const options = (field.options || []).map(option => typeof option === 'object' ? option.value : option);
      if (!options.length || options.some(option => String(option) === String(current[field.key]))) filled[field.key] = current[field.key] ?? '';
    }
    if (field.type === 'json') {
      const existing = parse(current[field.key]);
      const candidate = parse(filled[field.key]);
      if (sourceInside(candidate)) filled[field.key] = nonempty(current[field.key]) ? current[field.key] : field.jsonShape === 'array' ? '[]' : '{}';
      // Explicitly supplied structured source facts remain authoritative, including
      // zero, false and empty arrays. Demo choices cannot overwrite their context.
      if (existing !== undefined && current[field.key] !== previousDemo[field.key]) {
        filled[field.key] = current[field.key];
        delete previousDemo[field.key];
      } else previousDemo[field.key] = filled[field.key];
    }
  }
  return filled;
}
