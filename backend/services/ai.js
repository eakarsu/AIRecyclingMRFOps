// AI helper service for AIRecyclingMRFOps
// Reads OPENROUTER_API_KEY and OPENROUTER_MODEL from:
//   1. this project's .env (already loaded by server.js)
//   2. fallback: /Users/erolakarsu/projects/beauty-wellness-ai/.env (canonical source)
// Never overwrites or wipes credentials.

const fs = require('fs');
const path = require('path');

const FALLBACK_ENV = '/Users/erolakarsu/projects/beauty-wellness-ai/.env';

function readFallbackEnv() {
  try {
    if (!fs.existsSync(FALLBACK_ENV)) return {};
    const raw = fs.readFileSync(FALLBACK_ENV, 'utf8');
    const out = {};
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2];
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      out[m[1]] = val;
    }
    return out;
  } catch (e) {
    console.warn('[ai] fallback env read failed:', e.message);
    return {};
  }
}

function getOpenRouterCreds() {
  const fb = readFallbackEnv();
  const key = process.env.OPENROUTER_API_KEY || fb.OPENROUTER_API_KEY || '';
  const model = process.env.OPENROUTER_MODEL || fb.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
  return { key, model };
}

const SYSTEM_PROMPT =
  'You are a senior Materials Recovery Facility (MRF) operations and recycling-commodities analyst. ' +
  'You support a unified MRF command center spanning inbound loads, contamination, sortation lines, ' +
  'baling, downtime, commodity pricing, customer fulfillment, safety, vendors, and regulatory reporting. ' +
  'Always return strict JSON in the exact schema requested. Use realistic ISRI / Resource-Recycling-style ' +
  'commodity grades and pricing context. Never invent specific people or claim certainty about live markets — ' +
  'treat all inputs as tabletop scenarios.';

function callOpenRouter(systemPrompt, userPrompt) {
  return new Promise((resolve, reject) => {
    const { key, model } = getOpenRouterCreds();
    if (!key) {
      return resolve({ error: 'OPENROUTER_API_KEY not configured' });
    }
    const https = require('https');
    const payload = JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 2000,
    });

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': 'http://localhost:3082',
        'X-Title': 'AI Recycling MRF Ops',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) {
            return resolve({ error: parsed.error.message || 'OpenRouter error', raw: body });
          }
          const content = parsed.choices?.[0]?.message?.content || '';
          resolve(content);
        } catch (e) {
          resolve({ error: 'AI response parse failed', raw: body });
        }
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(payload);
    req.end();
  });
}

function safeJsonParse(response, fallback) {
  if (response && typeof response === 'object' && response.error) {
    return { ...fallback, error: response.error };
  }
  if (response == null) return { ...fallback, summary: '' };
  if (typeof response === 'object') return response;
  const text = String(response).trim();
  try { return JSON.parse(text); } catch (_) {}
  try {
    const start = text.indexOf('{');
    if (start !== -1) {
      let depth = 0, inStr = false, esc = false;
      for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (esc) { esc = false; continue; }
        if (ch === '\\') { esc = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (depth === 0) return JSON.parse(text.slice(start, i + 1)); }
      }
    }
  } catch (_) {}
  try {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced && fenced[1]) return JSON.parse(fenced[1].trim());
  } catch (_) {}
  return { ...fallback, summary: text };
}

// ──────────────────────────────────────────────────────────────
// AI 1: Contamination Vision Score (from a description of an inbound load)
// ──────────────────────────────────────────────────────────────
async function contaminationVisionScore(loadDescription, sampleNotes = '') {
  const sys = `${SYSTEM_PROMPT} Score contamination risk for an inbound MRF load. Return strict JSON:
{
  "contamination_pct_estimate": number,
  "verdict": "accept"|"flag"|"reject",
  "top_contaminants": [{ "type": string, "share_pct": number, "hazard": "low"|"medium"|"high"|"critical" }],
  "downstream_risk": [{ "line_id": string, "risk": string, "severity": "low"|"medium"|"high" }],
  "actions": [string],
  "confidence": number,
  "summary": string
}`;
  const usr = `Load description: ${loadDescription}\nSample / inspector notes: ${sampleNotes}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', top_contaminants: [] });
}

// ──────────────────────────────────────────────────────────────
// AI 2: Commodity Price Forecast
// ──────────────────────────────────────────────────────────────
async function commodityPriceForecast(commodity, recentPrices = [], horizonDays = 30) {
  const sys = `${SYSTEM_PROMPT} Forecast secondary-commodity bale pricing. Return strict JSON:
{
  "commodity": string,
  "horizon_days": number,
  "current_price_usd_ton": number,
  "forecast": [{ "day_offset": number, "price_usd_ton": number, "confidence": number }],
  "drivers": [{ "driver": string, "direction": "up"|"down"|"neutral", "narrative": string }],
  "hedging_recommendation": string,
  "summary": string
}`;
  const usr = `Commodity: ${commodity}\nHorizon: ${horizonDays} days\nRecent prices:\n${JSON.stringify(recentPrices, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', forecast: [] });
}

// ──────────────────────────────────────────────────────────────
// AI 3: Sortation Line Balance
// ──────────────────────────────────────────────────────────────
async function sortationLineBalance(lines = [], inboundMix = {}) {
  const sys = `${SYSTEM_PROMPT} Balance throughput across sortation lines. Return strict JSON:
{
  "rebalance_actions": [{ "line_id": string, "current_tph": number, "target_tph": number, "action": string }],
  "operator_moves": [{ "from_line": string, "to_line": string, "reason": string }],
  "expected_throughput_gain_tph": number,
  "risks": [string],
  "summary": string
}`;
  const usr = `Sortation lines:\n${JSON.stringify(lines, null, 2)}\n\nInbound mix:\n${JSON.stringify(inboundMix, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', rebalance_actions: [] });
}

// ──────────────────────────────────────────────────────────────
// AI 4: Downtime Root Cause Analysis
// ──────────────────────────────────────────────────────────────
async function downtimeRCA(events = [], context = {}) {
  const sys = `${SYSTEM_PROMPT} Perform a downtime root-cause analysis. Return strict JSON:
{
  "top_causes": [{ "cause": string, "events_attributed": number, "downtime_hours": number, "fix": string, "priority": "low"|"medium"|"high" }],
  "chronic_offenders": [{ "line_id": string, "narrative": string }],
  "preventive_actions": [string],
  "estimated_hours_saved_next_30d": number,
  "summary": string
}`;
  const usr = `Downtime events:\n${JSON.stringify(events, null, 2)}\n\nContext:\n${JSON.stringify(context, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', top_causes: [] });
}

// ──────────────────────────────────────────────────────────────
// AI 5: Executive Brief
// ──────────────────────────────────────────────────────────────
async function executiveBrief(snapshot = {}) {
  const sys = `${SYSTEM_PROMPT} Produce a plant-manager executive brief. Return strict JSON:
{
  "headline": string,
  "operational_picture": string,
  "throughput": { "tph_total": number, "uptime_pct": number, "narrative": string },
  "quality": { "avg_contamination_pct": number, "bales_rejected": number, "narrative": string },
  "commercial": { "open_loads_out": number, "top_commodity": string, "narrative": string },
  "top_risks": [{ "risk": string, "severity": "low"|"medium"|"high"|"critical", "owner": string }],
  "decisions_required": [{ "decision": string, "deadline": string, "recommendation": string }],
  "next_24h_outlook": string,
  "summary": string
}`;
  const usr = `Plant snapshot:\n${JSON.stringify(snapshot, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response' });
}

// ──────────────────────────────────────────────────────────────
// AI 6: Customer Quality Feedback
// ──────────────────────────────────────────────────────────────
async function customerQualityFeedback(customer, recentBales = [], complaintText = '') {
  const sys = `${SYSTEM_PROMPT} Draft a customer-facing quality response with corrective actions. Return strict JSON:
{
  "customer": string,
  "issue_summary": string,
  "root_causes": [{ "cause": string, "evidence": string }],
  "corrective_actions": [{ "action": string, "owner": string, "eta_days": number }],
  "credit_recommendation_usd": number,
  "outbound_message": string,
  "summary": string
}`;
  const usr = `Customer: ${JSON.stringify(customer)}\nRecent bales shipped:\n${JSON.stringify(recentBales, null, 2)}\nComplaint text:\n${complaintText}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', corrective_actions: [] });
}

// ──────────────────────────────────────────────────────────────
// AI 7: Vendor Quote Compare
// ──────────────────────────────────────────────────────────────
async function vendorQuoteCompare(quotes = [], requirement = '') {
  const sys = `${SYSTEM_PROMPT} Compare vendor quotes for an MRF capex/opex purchase. Return strict JSON:
{
  "ranked": [{ "vendor": string, "score": number, "price_usd": number, "lead_time_weeks": number, "rationale": string, "risks": [string] }],
  "best_value": string,
  "negotiation_points": [string],
  "summary": string
}`;
  const usr = `Requirement: ${requirement}\nQuotes:\n${JSON.stringify(quotes, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', ranked: [] });
}

// ──────────────────────────────────────────────────────────────
// AI 8: Route / Pickup Optimize
// ──────────────────────────────────────────────────────────────
async function routePickupOptimize(stops = [], constraints = {}) {
  const sys = `${SYSTEM_PROMPT} Optimize hauler pickup routes for an MRF fleet. Return strict JSON:
{
  "routes": [{ "route_id": string, "driver_id": string, "vehicle_id": string, "stops": [string], "distance_km": number, "duration_hours": number, "fill_pct": number }],
  "unassigned_stops": [string],
  "fuel_savings_pct": number,
  "summary": string
}`;
  const usr = `Stops:\n${JSON.stringify(stops, null, 2)}\nConstraints:\n${JSON.stringify(constraints, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', routes: [] });
}

// ──────────────────────────────────────────────────────────────
// AI 9: Safety Incident Summary
// ──────────────────────────────────────────────────────────────
async function safetyIncidentSummary(incidents = []) {
  const sys = `${SYSTEM_PROMPT} Summarize safety incidents for a stand-up. Return strict JSON:
{
  "headline": string,
  "incidents_by_type": [{ "type": string, "count": number }],
  "trending": [{ "trend": string, "direction": "up"|"down"|"flat" }],
  "open_actions": [{ "incident_id": string, "action": string, "owner": string }],
  "osha_recordables": number,
  "summary": string
}`;
  const usr = `Incidents:\n${JSON.stringify(incidents, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', incidents_by_type: [] });
}

// ──────────────────────────────────────────────────────────────
// AI 10: Training Needs
// ──────────────────────────────────────────────────────────────
async function trainingNeeds(operators = [], recentTraining = []) {
  const sys = `${SYSTEM_PROMPT} Identify training gaps and propose a curriculum. Return strict JSON:
{
  "gaps": [{ "topic": string, "affected_operators": [string], "priority": "low"|"medium"|"high" }],
  "curriculum": [{ "module": string, "duration_minutes": number, "delivery": string }],
  "compliance_risk": "low"|"medium"|"high",
  "summary": string
}`;
  const usr = `Operators:\n${JSON.stringify(operators, null, 2)}\nRecent training records:\n${JSON.stringify(recentTraining, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', gaps: [] });
}

// ──────────────────────────────────────────────────────────────
// AI 11: Hauler Payment Reconciliation
// ──────────────────────────────────────────────────────────────
async function haulerPaymentRecon(loads = [], invoiceText = '') {
  const sys = `${SYSTEM_PROMPT} Reconcile a hauler invoice against load tickets. Return strict JSON:
{
  "summary": string,
  "line_items": [{ "load_id": string, "ticketed_tons": number, "invoiced_tons": number, "delta_tons": number, "verdict": "match"|"underbill"|"overbill" }],
  "total_invoiced_usd": number,
  "total_ticketed_usd": number,
  "disputed_amount_usd": number,
  "recommended_payment_usd": number
}`;
  const usr = `Tickets:\n${JSON.stringify(loads, null, 2)}\n\nInvoice text:\n${invoiceText}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', line_items: [] });
}

// ──────────────────────────────────────────────────────────────
// AI 12: Capacity Utilization Brief
// ──────────────────────────────────────────────────────────────
async function capacityUtilizationBrief(lines = [], targets = {}) {
  const sys = `${SYSTEM_PROMPT} Brief on plant capacity utilization. Return strict JSON:
{
  "overall_utilization_pct": number,
  "by_line": [{ "line_id": string, "utilization_pct": number, "narrative": string }],
  "bottlenecks": [{ "line_id": string, "issue": string }],
  "headroom_actions": [string],
  "summary": string
}`;
  const usr = `Lines:\n${JSON.stringify(lines, null, 2)}\nTargets:\n${JSON.stringify(targets, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', by_line: [] });
}

// ──────────────────────────────────────────────────────────────
// AI 13: Equipment Prognostic
// ──────────────────────────────────────────────────────────────
async function equipmentPrognostic(equipment = []) {
  const sys = `${SYSTEM_PROMPT} Predict component failures for MRF equipment. Return strict JSON:
{
  "predictions": [{
    "eq_id": string,
    "component_at_risk": string,
    "failure_window_hours": number,
    "failure_probability": number,
    "recommended_action": string,
    "urgency": "routine"|"urgent"|"critical"
  }],
  "spare_parts_to_order": [{ "part": string, "qty": number, "vendor": string }],
  "fleet_health_score": number,
  "summary": string
}`;
  const usr = `Equipment:\n${JSON.stringify(equipment, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', predictions: [] });
}

// ──────────────────────────────────────────────────────────────
// AI 14: Bale Quality Grade
// ──────────────────────────────────────────────────────────────
async function baleQualityGrade(bale, inspectionNotes = '') {
  const sys = `${SYSTEM_PROMPT} Grade a finished bale against ISRI specs. Return strict JSON:
{
  "bale_id": string,
  "commodity": string,
  "assigned_grade": "A"|"B"|"C"|"reject",
  "isri_spec_match": string,
  "non_conformities": [{ "issue": string, "share_pct": number, "spec_threshold_pct": number }],
  "recoverable_with_rework": boolean,
  "ship_recommendation": "ship"|"hold"|"re-sort"|"reject",
  "summary": string
}`;
  const usr = `Bale: ${JSON.stringify(bale)}\nInspection notes:\n${inspectionNotes}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', non_conformities: [] });
}

// ──────────────────────────────────────────────────────────────
// AI 15: Regulatory Reporting
// ──────────────────────────────────────────────────────────────
async function regulatoryReporting(period, snapshot = {}) {
  const sys = `${SYSTEM_PROMPT} Generate a regulatory MRF report (state EPA / municipal). Return strict JSON:
{
  "period": string,
  "tonnage_inbound": number,
  "tonnage_recovered": number,
  "recovery_rate_pct": number,
  "residual_to_landfill_tons": number,
  "contamination_avg_pct": number,
  "by_commodity": [{ "commodity": string, "tons": number }],
  "compliance_flags": [{ "regulation": string, "status": "ok"|"watch"|"violation", "narrative": string }],
  "narrative": string,
  "summary": string
}`;
  const usr = `Reporting period: ${period}\nSnapshot:\n${JSON.stringify(snapshot, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', by_commodity: [] });
}

// ──────────────────────────────────────────────────────────────
// AI 16: Scrap Market Brief
// ──────────────────────────────────────────────────────────────
async function scrapMarketBrief(focus = '', recentPrices = []) {
  const sys = `${SYSTEM_PROMPT} Produce a weekly secondary-commodity scrap market brief. Return strict JSON:
{
  "headline": string,
  "movers": [{ "commodity": string, "direction": "up"|"down", "magnitude_pct": number, "driver": string }],
  "regional_notes": [{ "region": string, "narrative": string }],
  "supply_demand_outlook": string,
  "actions_for_mrf": [string],
  "summary": string
}`;
  const usr = `Focus: ${focus}\nRecent prices observed:\n${JSON.stringify(recentPrices, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', movers: [] });
}

// ──────────────────────────────────────────────────────────────
// AI 17: Line-Camera Anomaly Narrator (frame batch → narrative + severity)
// ──────────────────────────────────────────────────────────────
async function lineCameraAnomalyNarrate(lineId = '', frameEvents = [], operatorNotes = '') {
  const sys = `${SYSTEM_PROMPT} You are narrating an anomaly burst captured by an MRF sortation-line camera (NIR / vision AI). ` +
    `Frames are pre-labelled events from the vision system. Return strict JSON:
{
  "line_id": string,
  "headline": string,
  "narrative": string,
  "anomalies": [{ "timestamp": string, "object": string, "hazard": "low"|"medium"|"high"|"critical", "share_of_window_pct": number, "narrative": string }],
  "overall_severity": "low"|"medium"|"high"|"critical",
  "recommended_actions": [string],
  "operator_alert_message": string,
  "downstream_impact": string,
  "summary": string
}`;
  const usr = `Line: ${lineId}\nFrame events:\n${JSON.stringify(frameEvents, null, 2)}\nOperator notes: ${operatorNotes}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', anomalies: [] });
}

// ──────────────────────────────────────────────────────────────
// AI 18: Throughput Forecast (dedicated time-series predictor)
// ──────────────────────────────────────────────────────────────
async function throughputForecast(lineId = '', shiftHistory = [], horizonHours = 24, contextNotes = '') {
  const sys = `${SYSTEM_PROMPT} Forecast hourly throughput (tons-per-hour) for a sortation line. Return strict JSON:
{
  "line_id": string,
  "horizon_hours": number,
  "baseline_tph": number,
  "forecast": [{ "hour_offset": number, "tph": number, "confidence": number, "shift": string }],
  "expected_total_tons": number,
  "drivers": [{ "driver": string, "direction": "up"|"down"|"neutral", "narrative": string }],
  "bottleneck_risk": "low"|"medium"|"high",
  "staffing_recommendation": string,
  "summary": string
}`;
  const usr = `Line: ${lineId}\nHorizon (hours): ${horizonHours}\nShift / historical throughput:\n${JSON.stringify(shiftHistory, null, 2)}\nContext: ${contextNotes}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', forecast: [] });
}

// ──────────────────────────────────────────────────────────────
// AI 19: End-Market Matchmaker (bale → buyer/mill)
// ──────────────────────────────────────────────────────────────
async function endMarketMatch(bale = {}, buyerSpecs = [], constraintsNotes = '') {
  const sys = `${SYSTEM_PROMPT} Match a finished MRF bale to its best downstream buyer/mill based on spec fit and economics. Return strict JSON:
{
  "bale_id": string,
  "commodity": string,
  "ranked_matches": [{
    "buyer": string,
    "buyer_id": string,
    "fit_score": number,
    "spec_match_pct": number,
    "expected_price_usd_ton": number,
    "logistics_note": string,
    "risks": [string],
    "rationale": string
  }],
  "best_match": string,
  "expected_revenue_usd": number,
  "negotiation_points": [string],
  "summary": string
}`;
  const usr = `Bale:\n${JSON.stringify(bale, null, 2)}\nCandidate buyer specs:\n${JSON.stringify(buyerSpecs, null, 2)}\nConstraints/notes: ${constraintsNotes}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', ranked_matches: [] });
}

module.exports = {
  callOpenRouter,
  safeJsonParse,
  contaminationVisionScore,
  commodityPriceForecast,
  sortationLineBalance,
  downtimeRCA,
  executiveBrief,
  customerQualityFeedback,
  vendorQuoteCompare,
  routePickupOptimize,
  safetyIncidentSummary,
  trainingNeeds,
  haulerPaymentRecon,
  capacityUtilizationBrief,
  equipmentPrognostic,
  baleQualityGrade,
  regulatoryReporting,
  scrapMarketBrief,
  lineCameraAnomalyNarrate,
  throughputForecast,
  endMarketMatch,
};
