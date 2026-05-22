const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const ai = require('../services/ai');

// Persist every AI result so the frontend history viewer can show it later.
async function record(feature, input, output) {
  try {
    await pool.query(
      'INSERT INTO ai_results (feature, input, output) VALUES ($1, $2, $3)',
      [feature, input || {}, output || {}]
    );
  } catch (e) {
    console.warn(`[ai] failed to record ${feature}:`, e.message);
  }
}

// ──────────────────────────────────────────────────────────────
// Sample fills — realistic MRF scenarios (5 per verb)
// Field keys map 1:1 to frontend AI page inputs
// ──────────────────────────────────────────────────────────────
const SAMPLES = {
  'contamination-vision-score': [
    {
      label: 'Suspect single-stream — film + glass',
      values: {
        load_description: '22 t curbside single-stream from WM Commercial Route 3, dumped 07:15. Heavy black film bags concealing glass shards and a paint can; pre-sort cabin reports 4 picks/min spike.',
        sample_notes: 'Inspector A: visible CRT screen fragment; aerosol can ejected by detector at infeed.',
      },
    },
    {
      label: 'Clean residential PET-rich load',
      values: {
        load_description: '12.4 t residential single-stream from Republic Services Route 7, mostly beverage containers with some OCC. Visual estimate <9% contamination.',
        sample_notes: 'No hazards spotted; minor liquid residue in PET bottles.',
      },
    },
    {
      label: 'Critical — lithium battery + propane',
      values: {
        load_description: '4.2 t side-load from Independent Hauler #7. Operator hears thermal pop on tipping floor; AMP camera tags Li-ion cell and BBQ propane cylinder.',
        sample_notes: 'EVACUATE protocol triggered; fire watch posted; recommend reject + hazmat hauler.',
      },
    },
    {
      label: 'Commercial OCC-heavy (clean)',
      values: {
        load_description: '20.5 t cardboard-heavy commercial load from WM Route 14. Looks like a downtown retail purge.',
        sample_notes: 'Some shrink wrap and pallet wood mixed in (5-8%).',
      },
    },
    {
      label: 'Municipal MRF audit sample',
      values: {
        load_description: '16.8 t City of Riverside MUN load with mixed residential + small commercial. Visible food residue, textiles, shredded paper.',
        sample_notes: 'QC manager rates 13-15% contamination; recommend flag and re-sort.',
      },
    },
  ],

  'commodity-price-forecast': [
    {
      label: 'PET — 30-day forecast',
      values: { commodity: 'PET', horizon_days: 30, recent_prices_json: JSON.stringify([
        { day: -7, usd_ton: 332 }, { day: -3, usd_ton: 334 }, { day: 0, usd_ton: 335 },
      ], null, 2) },
    },
    {
      label: 'HDPE-Natural — 60-day forecast',
      values: { commodity: 'HDPE-Natural', horizon_days: 60, recent_prices_json: JSON.stringify([
        { day: -14, usd_ton: 910 }, { day: -7, usd_ton: 915 }, { day: 0, usd_ton: 920 },
      ], null, 2) },
    },
    {
      label: 'Aluminum UBC — 90-day forecast',
      values: { commodity: 'Aluminum UBC', horizon_days: 90, recent_prices_json: JSON.stringify([
        { day: -30, usd_ton: 1445 }, { day: -14, usd_ton: 1465 }, { day: 0, usd_ton: 1480 },
      ], null, 2) },
    },
    {
      label: 'OCC — 30-day forecast (Gulf market)',
      values: { commodity: 'OCC', horizon_days: 30, recent_prices_json: JSON.stringify([
        { day: -7, usd_ton: 112 }, { day: -3, usd_ton: 114 }, { day: 0, usd_ton: 115 },
      ], null, 2) },
    },
    {
      label: 'Mixed Plastic — 30-day (low-demand)',
      values: { commodity: 'Mixed Plastic', horizon_days: 30, recent_prices_json: JSON.stringify([
        { day: -14, usd_ton: 55 }, { day: -7, usd_ton: 42 }, { day: 0, usd_ton: 35 },
      ], null, 2) },
    },
  ],

  'sortation-line-balance': [
    { label: 'Use current line state (default)', values: { inbound_mix_json: '{"PET":0.18,"HDPE":0.07,"OCC":0.42,"MP":0.14,"Aluminum":0.03,"Steel":0.05,"Residual":0.11}' } },
    { label: 'OCC surge (commercial heavy)', values: { inbound_mix_json: '{"OCC":0.62,"MP":0.18,"PET":0.08,"HDPE":0.04,"Residual":0.08}' } },
    { label: 'Residential PET/HDPE heavy', values: { inbound_mix_json: '{"PET":0.31,"HDPE":0.14,"OCC":0.20,"MP":0.18,"Aluminum":0.05,"Steel":0.04,"Residual":0.08}' } },
    { label: 'Holiday surge (mixed glass/paper)', values: { inbound_mix_json: '{"Glass":0.22,"OCC":0.30,"MP":0.20,"PET":0.12,"HDPE":0.06,"Residual":0.10}' } },
    { label: 'After contamination event (downgraded)', values: { inbound_mix_json: '{"Residual":0.34,"OCC":0.24,"MP":0.20,"PET":0.10,"HDPE":0.05,"Other":0.07}' } },
  ],

  'downtime-rca': [
    { label: 'Use last 30 days of downtime events (default)', values: { context_notes: '' } },
    { label: 'Focus on LINE-02 (Fiber line)', values: { context_notes: 'Weight analysis toward LINE-02 — conveyor #14 belt is the recurring offender, plus OCC screen overload.' } },
    { label: 'Focus on optical-sort / NIR drift', values: { context_notes: 'Focus on TOMRA NIR calibration drift and Pellenc Mistral+ ejector misfires across LINE-01.' } },
    { label: 'Focus on robotics (LINE-03)', values: { context_notes: 'Look at AMP Cortex / Machinex SamurAI uptime, network outages, and recovery rates on residual pick line.' } },
    { label: 'Cabin-driven downtime (operator pulls)', values: { context_notes: 'Focus on cabin HVAC faults and operator pulls; correlate with shift handoff and heat indices.' } },
  ],

  'executive-brief': [
    { label: 'Default snapshot — no bias', values: { notes: '' } },
    { label: 'Bias toward quality / customer risk', values: { notes: 'Lean the brief into bale-quality risk after recent Pacific Rim Plastic Brokers suspension and CUS-008 dispute.' } },
    { label: 'Bias toward downtime / throughput', values: { notes: 'Focus on LINE-02 conveyor #14 replacement and any throughput recovery options for fiber line.' } },
    { label: 'Bias toward safety', values: { notes: 'Lead with safety: propane tank find, lockout breach on LINE-03, and lithium battery fire on tipping floor.' } },
    { label: 'Bias toward commercial / margins', values: { notes: 'Focus on commodity prices, customer mix, and margin pressure from low-demand mixed plastic.' } },
  ],

  'customer-quality-feedback': [
    {
      label: 'Indorama Ventures PET moisture complaint',
      values: {
        customer_name: 'Indorama Ventures',
        customer_commodity: 'PET',
        complaint_text: 'Last three PET bales delivered (BAL-2026-0001, 0006, 0012) showed >2% moisture and color-mixed PET; flake yield dropped to 91%.',
      },
    },
    {
      label: 'WestRock OCC outthrows',
      values: {
        customer_name: 'WestRock Container Mill',
        customer_commodity: 'OCC',
        complaint_text: 'OCC bale BAL-2026-0008 had visible wax-coated cartons and shrink wrap; outthrow ratio above ISRI #11 spec.',
      },
    },
    {
      label: 'Envision Plastics HDPE color contamination',
      values: {
        customer_name: 'Envision Plastics',
        customer_commodity: 'HDPE-Natural',
        complaint_text: 'BAL-2026-0014 contained color HDPE bottles mixed into natural HDPE; visual >3%, pellet yield off-spec.',
      },
    },
    {
      label: 'Novelis Aluminum UBC density issue',
      values: {
        customer_name: 'Novelis Recycling',
        customer_commodity: 'Aluminum UBC',
        complaint_text: 'Last shipment density 360 kg/m³ — below 480 kg/m³ minimum. Suspect densifier issue or steel can contamination.',
      },
    },
    {
      label: 'Pratt Industries Mixed Paper sorting',
      values: {
        customer_name: 'Pratt Industries',
        customer_commodity: 'Mixed Paper',
        complaint_text: 'BAL-2026-0004 had cardboard mixed in (>15%) and unacceptable level of SOP fines. Want a quality plan within 7 days.',
      },
    },
  ],

  'vendor-quote-compare': [
    {
      label: 'Optical sorter replacement',
      values: {
        requirement: 'Replace aging optical sorter on LINE-01 (container line). 18 tph throughput, capable of PET / HDPE / PP / clear-from-color separation. Need install within 12 weeks.',
        quotes_json: JSON.stringify([
          { vendor: 'TOMRA',        price_usd: 685000, lead_time_weeks: 14, model: 'AUTOSORT Speedair', warranty_years: 3 },
          { vendor: 'Pellenc ST',   price_usd: 612000, lead_time_weeks: 10, model: 'Mistral+ COMPACT',  warranty_years: 2 },
          { vendor: 'Machinex',     price_usd: 598000, lead_time_weeks: 16, model: 'MACH Hyspec',       warranty_years: 3 },
        ], null, 2),
      },
    },
    {
      label: 'AI robotic pick station',
      values: {
        requirement: 'Add 2-arm AI robotic pick station on LINE-03 residual line. Target 60 picks/min/arm on PET, alu cans, HDPE.',
        quotes_json: JSON.stringify([
          { vendor: 'AMP Robotics', price_usd: 425000, lead_time_weeks: 12, model: 'Cortex dual', perf_picks_min: 65 },
          { vendor: 'Machinex',     price_usd: 380000, lead_time_weeks: 14, model: 'SamurAI dual', perf_picks_min: 55 },
          { vendor: 'Greyparrot',   price_usd: 240000, lead_time_weeks: 8,  model: 'Vision-only',  perf_picks_min: 0 },
        ], null, 2),
      },
    },
    {
      label: 'Baler — backup unit',
      values: {
        requirement: 'Backup baler to relieve Bollegraaf HBC-120 during PM. Two-ram preferred, 30 t/h capacity, 76 cm × 109 cm bale size.',
        quotes_json: JSON.stringify([
          { vendor: 'Bollegraaf',  price_usd: 520000, lead_time_weeks: 22, model: 'HBC-80',  type: 'two-ram' },
          { vendor: 'Krause Mfg.', price_usd: 430000, lead_time_weeks: 18, model: 'K-200',   type: 'two-ram' },
          { vendor: 'Marathon',    price_usd: 470000, lead_time_weeks: 20, model: 'V2-2R',   type: 'two-ram' },
        ], null, 2),
      },
    },
    {
      label: 'Hauler RFP — commercial route',
      values: {
        requirement: 'Award a 12-month commercial cardboard route covering 38 stops, 240 t/week. Walking-floor trailers required.',
        quotes_json: JSON.stringify([
          { vendor: 'Republic Services',  price_usd: 38.50, unit: 'per ton',  service_level: '99.5% on-time' },
          { vendor: 'Waste Management',   price_usd: 36.75, unit: 'per ton',  service_level: '98.5% on-time' },
          { vendor: 'GFL Environmental',  price_usd: 39.20, unit: 'per ton',  service_level: '99.0% on-time' },
        ], null, 2),
      },
    },
    {
      label: 'eWaste downstream processor',
      values: {
        requirement: 'Downstream processor for separated PCB boards from eWaste cell (LINE-05). Need R2v3 certified, monthly volume ~24 t.',
        quotes_json: JSON.stringify([
          { vendor: 'Continental e-Materials', price_usd: 2400, unit: 'per ton (rebate)', cert: 'R2v3' },
          { vendor: 'Sims Lifecycle',          price_usd: 2280, unit: 'per ton (rebate)', cert: 'R2v3' },
          { vendor: 'ERI Recycling',           price_usd: 2350, unit: 'per ton (rebate)', cert: 'R2v3' },
        ], null, 2),
      },
    },
  ],

  'route-pickup-optimize': [
    {
      label: 'Monday residential routes (28 stops)',
      values: {
        constraints: 'Two roll-off trucks + one front loader available. Yard A start. 10-hour driver shift cap. Avoid school zones 07:30-08:30.',
        stops_json: JSON.stringify([
          { id: 'S-01', address: '1200 Lakeshore Dr', est_tons: 1.2 },
          { id: 'S-02', address: '550 Industrial Pkwy', est_tons: 2.8 },
          { id: 'S-03', address: '2200 Heights Blvd', est_tons: 0.9 },
          { id: 'S-04', address: '78 Westmoor St', est_tons: 1.5 },
          { id: 'S-05', address: '900 Commerce Way', est_tons: 3.2 },
        ], null, 2),
      },
    },
    {
      label: 'Commercial OCC sweep',
      values: {
        constraints: 'Walking-floor trailers only. Yard B start. Target full loads (~22 t each). No back-hauls past 17:00.',
        stops_json: JSON.stringify([
          { id: 'C-01', client: 'Target Distribution', est_tons: 7.5 },
          { id: 'C-02', client: 'Costco WH 412',       est_tons: 8.4 },
          { id: 'C-03', client: 'Amazon FC ATX-3',     est_tons: 11.2 },
          { id: 'C-04', client: 'IKEA Frisco',          est_tons: 5.1 },
        ], null, 2),
      },
    },
    {
      label: 'Customer outbound — single-day',
      values: {
        constraints: 'Outbound only: deliver to 4 customers in same metro. Trailer pool: 3 walking-floor.',
        stops_json: JSON.stringify([
          { id: 'O-01', customer: 'Indorama Ventures',  load: 'BAL-2026-0006', tons: 0.49 },
          { id: 'O-02', customer: 'WestRock',            load: 'BAL-2026-0013', tons: 0.71 },
          { id: 'O-03', customer: 'Envision Plastics',   load: 'BAL-2026-0002', tons: 0.51 },
          { id: 'O-04', customer: 'KW Plastics',         load: 'BAL-2026-0009', tons: 0.43 },
        ], null, 2),
      },
    },
    {
      label: 'Hurricane-pre staging',
      values: {
        constraints: 'Storm forecast in 36h. Top off all customer pickups before landfall; allow 30% slack for delays.',
        stops_json: JSON.stringify([
          { id: 'H-01', client: 'Coastal Mall',     est_tons: 6 },
          { id: 'H-02', client: 'Beach Hotel Row',  est_tons: 4 },
          { id: 'H-03', client: 'Industrial Park',  est_tons: 9 },
          { id: 'H-04', client: 'Marina Plaza',     est_tons: 3 },
        ], null, 2),
      },
    },
    {
      label: 'Night-shift transfer station sweep',
      values: {
        constraints: 'Use yard tractors only; 4 transfer stations within 30 km. Stations close at 04:00.',
        stops_json: JSON.stringify([
          { id: 'T-01', station: 'TS-North',  est_tons: 18 },
          { id: 'T-02', station: 'TS-East',   est_tons: 22 },
          { id: 'T-03', station: 'TS-West',   est_tons: 16 },
          { id: 'T-04', station: 'TS-South',  est_tons: 20 },
        ], null, 2),
      },
    },
  ],

  'safety-incident-summary': [
    { label: 'Default — pull recent incidents', values: {} },
    { label: 'Default — pull recent incidents', values: {} },
    { label: 'Default — pull recent incidents', values: {} },
    { label: 'Default — pull recent incidents', values: {} },
    { label: 'Default — pull recent incidents', values: {} },
  ],

  'training-needs': [
    { label: 'Plant-wide gap analysis (default)', values: {} },
    { label: 'Plant-wide gap analysis (default)', values: {} },
    { label: 'Plant-wide gap analysis (default)', values: {} },
    { label: 'Plant-wide gap analysis (default)', values: {} },
    { label: 'Plant-wide gap analysis (default)', values: {} },
  ],

  'hauler-payment-recon': [
    {
      label: 'WM invoice (May week 3)',
      values: {
        invoice_text: 'Waste Management — Invoice #WM-2026-0518\nWeek of 05/13-05/17\nLoads delivered: 3 × commercial OCC routes\nTickets: LIN-2026-0002 (18.2 t), LIN-2026-0007 (20.5 t), LIN-2026-0012 (22.1 t)\nInvoice claims: 19.5 t, 21.0 t, 24.8 t @ $38.50/t = $2,517.40 + $250 fuel surcharge = $2,767.40',
      },
    },
    {
      label: 'Republic Services residential',
      values: {
        invoice_text: 'Republic Services — INV-RS-29881\nLoads: LIN-2026-0001 (12.4 t), LIN-2026-0006 (13.1 t), LIN-2026-0011 (12.9 t)\nInvoice: 38.4 t total @ $42/t = $1,612.80',
      },
    },
    {
      label: 'GFL — disputed contamination credit',
      values: {
        invoice_text: 'GFL Environmental — INV-2026-04421\nLoads accepted: LIN-2026-0003, 0008, 0014 (totaling 31.3 t)\nGross: $1,283.30; Credit owed back to MRF for previously rejected LIN-2026-0005: -$340; Net due: $943.30',
      },
    },
    {
      label: 'Casella — fuel surcharge dispute',
      values: {
        invoice_text: 'Casella Waste — Invoice CW-08812\nDelivered: LIN-2026-0004 (15.6 t), LIN-2026-0010 (14.4 t), LIN-2026-0015 (15.0 t)\nFuel surcharge: $890 (claim disputed — index dropped 4% this week)',
      },
    },
    {
      label: 'Independent hauler — short-load',
      values: {
        invoice_text: 'Indep. Hauler #2 — Invoice 0517-2\nLoad LIN-2026-0013 (6.4 t actual; ticket marked rejected)\nClaimed: 12 t × $45/t = $540',
      },
    },
  ],

  'capacity-utilization-brief': [
    { label: 'Default — last 7 days', values: { targets_notes: 'Target plant utilization 78%; LINE-02 fiber line bottlenecked by conveyor #14.' } },
    { label: 'Holiday capacity check', values: { targets_notes: 'Project utilization through next 14 days; account for Memorial Day weekend volume drop and post-holiday surge.' } },
    { label: 'Capacity vs. customer commit', values: { targets_notes: 'Compare current throughput to customer-committed tons in CON-2026-001 through 005; flag any short-falls.' } },
    { label: 'Bottleneck deep-dive', values: { targets_notes: 'Focus on LINE-02 (fiber) and LINE-04 (glass) — both running below 60% of nameplate.' } },
    { label: 'Robotics ROI utilization', values: { targets_notes: 'Specifically rate AMP Cortex and Machinex SamurAI utilization on LINE-03; both quoted for added arms.' } },
  ],

  'equipment-prognostic': [
    { label: 'Use current equipment fleet (default)', values: {} },
    { label: 'Use current equipment fleet (default)', values: {} },
    { label: 'Use current equipment fleet (default)', values: {} },
    { label: 'Use current equipment fleet (default)', values: {} },
    { label: 'Use current equipment fleet (default)', values: {} },
  ],

  'bale-quality-grade': [
    {
      label: 'PET bale — visible moisture',
      values: {
        bale_id: 'BAL-2026-0006',
        commodity: 'PET',
        weight_kg: 490,
        inspection_notes: 'Visible bottle moisture; ~2% color PET mixed into clear; metal cap residue.',
      },
    },
    {
      label: 'OCC bale — small wax-coated content',
      values: {
        bale_id: 'BAL-2026-0013',
        commodity: 'OCC',
        weight_kg: 710,
        inspection_notes: 'Tight bale, ~3% wax-coated produce boxes, minimal shrink wrap; ISRI #11 likely.',
      },
    },
    {
      label: 'HDPE-Natural — color contamination',
      values: {
        bale_id: 'BAL-2026-0002',
        commodity: 'HDPE-Natural',
        weight_kg: 510,
        inspection_notes: '~4% color HDPE visible (laundry detergent jugs); pinholes from baler wire.',
      },
    },
    {
      label: 'Aluminum UBC — densifier underperform',
      values: {
        bale_id: 'BAL-2026-0015',
        commodity: 'Aluminum UBC',
        weight_kg: 390,
        inspection_notes: 'Density 380 kg/m³ (below 480 spec); a few steel can sneak-throughs (1-2%).',
      },
    },
    {
      label: 'Mixed paper — rejected, propose re-sort',
      values: {
        bale_id: 'BAL-2026-0004',
        commodity: 'Mixed Paper',
        weight_kg: 650,
        inspection_notes: '~18% OCC mixed in (should be in separate bale); also film plastic and shredded paper.',
      },
    },
  ],

  'regulatory-reporting': [
    { label: 'Monthly — May 2026', values: { period: 'May 2026', narrative_notes: 'Highlight diversion rate, contamination trend, and the lithium battery fire incident remediation.' } },
    { label: 'Quarterly — Q1 2026', values: { period: 'Q1 2026', narrative_notes: 'Aggregate Jan-Mar; mention CONUS export restrictions affecting mixed plastic.' } },
    { label: 'EPA Form — annual draft', values: { period: '2025 calendar year', narrative_notes: 'Pull totals for state EPA annual report; include downstream certifications (R2v3).' } },
    { label: 'Municipal — city contract', values: { period: 'May 2026', narrative_notes: 'City of Riverside reporting: tons diverted, residual to landfill, contamination feedback for haulers.' } },
    { label: 'Producer responsibility (EPR)', values: { period: 'Q2 2026 estimate', narrative_notes: 'Pre-populate EPR fee report — focus on PET, HDPE, PP, paperboard categories.' } },
  ],

  'scrap-market-brief': [
    { label: 'Weekly — all commodities', values: { focus: 'all', recent_prices_notes: 'Use current commodities table; flag movers >5%.' } },
    { label: 'Paper / fiber focus', values: { focus: 'paper', recent_prices_notes: 'OCC, mixed paper, newsprint, SOP — emphasize Gulf export prices.' } },
    { label: 'Plastics focus', values: { focus: 'plastics', recent_prices_notes: 'PET, HDPE, PP, mixed plastic — emphasize bottle-grade flake pricing.' } },
    { label: 'Metals focus', values: { focus: 'metals', recent_prices_notes: 'Aluminum UBC, steel cans — LME spot context.' } },
    { label: 'Export / Asia channel', values: { focus: 'export', recent_prices_notes: 'Focus on Asia export markets and impact of any National Sword-style restrictions.' } },
  ],

  // ─────────────── Pass 7 additions ───────────────
  'line-camera-anomaly-narrate': [
    {
      label: 'LINE-01 — lithium battery + propane burst',
      values: {
        line_id: 'LINE-01',
        operator_notes: 'Operator reports thermal pop near infeed; AMP vision tagged Li-ion cell at 07:14:32.',
        frame_events_json: JSON.stringify([
          { ts: '07:14:30', object: 'lithium_ion_cell', confidence: 0.96 },
          { ts: '07:14:31', object: 'propane_cylinder', confidence: 0.89 },
          { ts: '07:14:32', object: 'thermal_event', confidence: 0.74 },
        ], null, 2),
      },
    },
    {
      label: 'LINE-02 — film + plastic bag burst (fiber line)',
      values: {
        line_id: 'LINE-02',
        operator_notes: 'OCC screen jamming; high film count from commercial route.',
        frame_events_json: JSON.stringify([
          { ts: '11:02:10', object: 'plastic_film', confidence: 0.94, share: 0.18 },
          { ts: '11:02:12', object: 'plastic_film', confidence: 0.93, share: 0.21 },
          { ts: '11:02:15', object: 'shrink_wrap',  confidence: 0.88, share: 0.09 },
        ], null, 2),
      },
    },
    {
      label: 'LINE-03 — robotics misfire window',
      values: {
        line_id: 'LINE-03',
        operator_notes: 'AMP Cortex arm B underpicking residual; suspect calibration drift.',
        frame_events_json: JSON.stringify([
          { ts: '14:30:05', object: 'pet_bottle_missed', confidence: 0.81 },
          { ts: '14:30:09', object: 'pet_bottle_missed', confidence: 0.78 },
          { ts: '14:30:14', object: 'alu_can_missed',    confidence: 0.83 },
        ], null, 2),
      },
    },
    {
      label: 'LINE-04 — glass breakage spike',
      values: {
        line_id: 'LINE-04',
        operator_notes: 'Glass cleanup system overflowing; high small-cullet share.',
        frame_events_json: JSON.stringify([
          { ts: '09:11:00', object: 'glass_fines',  confidence: 0.92, share: 0.34 },
          { ts: '09:11:05', object: 'ceramic',      confidence: 0.71 },
          { ts: '09:11:10', object: 'mixed_paper_contaminated', confidence: 0.66 },
        ], null, 2),
      },
    },
    {
      label: 'LINE-05 — eWaste hazard',
      values: {
        line_id: 'LINE-05',
        operator_notes: 'PCB cell handling; suspect leaking CRT.',
        frame_events_json: JSON.stringify([
          { ts: '15:40:02', object: 'crt_screen',    confidence: 0.95 },
          { ts: '15:40:08', object: 'mercury_lamp',  confidence: 0.73 },
          { ts: '15:40:11', object: 'pcb_board',     confidence: 0.91 },
        ], null, 2),
      },
    },
  ],

  'throughput-forecast': [
    {
      label: 'LINE-01 — next 24 h container line',
      values: {
        line_id: 'LINE-01',
        horizon_hours: 24,
        context_notes: 'Two AM shifts staffed; commercial-heavy inbound forecast 78%.',
        shift_history_json: JSON.stringify([
          { hour_offset: -24, tph: 17.4, shift: 'A' }, { hour_offset: -16, tph: 16.9, shift: 'B' },
          { hour_offset: -8,  tph: 18.1, shift: 'C' }, { hour_offset: 0,   tph: 17.8, shift: 'A' },
        ], null, 2),
      },
    },
    {
      label: 'LINE-02 — fiber line, conveyor #14 limited',
      values: {
        line_id: 'LINE-02',
        horizon_hours: 12,
        context_notes: 'Conveyor #14 derated 30%; PM scheduled in 8h.',
        shift_history_json: JSON.stringify([
          { hour_offset: -8, tph: 14.1, shift: 'A' }, { hour_offset: 0, tph: 13.4, shift: 'B' },
        ], null, 2),
      },
    },
    {
      label: 'LINE-03 — robotics arm headroom',
      values: {
        line_id: 'LINE-03',
        horizon_hours: 24,
        context_notes: 'Both arms running; spike expected during evening shift.',
        shift_history_json: JSON.stringify([
          { hour_offset: -24, tph: 9.2 }, { hour_offset: -16, tph: 10.4 },
          { hour_offset: -8,  tph: 11.1 }, { hour_offset: 0,   tph: 10.7 },
        ], null, 2),
      },
    },
    {
      label: 'Plant-wide weekend dip',
      values: {
        line_id: 'PLANT',
        horizon_hours: 48,
        context_notes: 'Saturday + Sunday volumes drop ~40%; only LINE-01 + LINE-03 run.',
        shift_history_json: JSON.stringify([
          { hour_offset: -48, tph: 42 }, { hour_offset: -24, tph: 38 }, { hour_offset: 0, tph: 24 },
        ], null, 2),
      },
    },
    {
      label: 'Post-holiday surge',
      values: {
        line_id: 'PLANT',
        horizon_hours: 36,
        context_notes: 'First Monday after Memorial Day; expect 1.6× normal residential inbound.',
        shift_history_json: JSON.stringify([
          { hour_offset: -24, tph: 41 }, { hour_offset: -12, tph: 39 }, { hour_offset: 0, tph: 44 },
        ], null, 2),
      },
    },
  ],

  'end-market-match': [
    {
      label: 'PET bale → bottle-grade flake mills',
      values: {
        bale_id: 'BAL-2026-0006',
        commodity: 'PET',
        weight_kg: 490,
        grade: 'A',
        contamination_pct: 2.1,
        constraints_notes: 'Avoid export to Asia this month; rail logistics preferred.',
      },
    },
    {
      label: 'OCC bale → North American container mills',
      values: {
        bale_id: 'BAL-2026-0013',
        commodity: 'OCC',
        weight_kg: 710,
        grade: 'A',
        contamination_pct: 3.0,
        constraints_notes: 'Need offtake within 7 days; truckload economics.',
      },
    },
    {
      label: 'HDPE-Natural bale → recycled HDPE pelletizers',
      values: {
        bale_id: 'BAL-2026-0002',
        commodity: 'HDPE-Natural',
        weight_kg: 510,
        grade: 'A',
        contamination_pct: 4.2,
        constraints_notes: 'Buyer must accept ~4% color HDPE mixed in.',
      },
    },
    {
      label: 'Aluminum UBC bale → smelters / Novelis',
      values: {
        bale_id: 'BAL-2026-0015',
        commodity: 'Aluminum UBC',
        weight_kg: 390,
        grade: 'B',
        contamination_pct: 1.5,
        constraints_notes: 'Density under 480 kg/m³ — needs buyer willing to accept low-density.',
      },
    },
    {
      label: 'Mixed Paper bale → flexible buyers (downgraded)',
      values: {
        bale_id: 'BAL-2026-0004',
        commodity: 'Mixed Paper',
        weight_kg: 650,
        grade: 'C',
        contamination_pct: 18,
        constraints_notes: 'High OCC mix-in; only flexible recovered-fiber buyers fit.',
      },
    },
  ],

  'contamination-report-card': [
    { label: 'City of Riverside — May 2026',  values: { municipality: 'City of Riverside',  period_days: 30, narrative_notes: 'Compare to last month; flag any hazardous spikes.' } },
    { label: 'Town of Westmoor — May 2026',   values: { municipality: 'Town of Westmoor',   period_days: 30, narrative_notes: '' } },
    { label: 'Lakeshore County — Q2 2026',    values: { municipality: 'Lakeshore County',   period_days: 90, narrative_notes: 'Aggregate quarter to date.' } },
    { label: 'Coastal Region — 7 days',       values: { municipality: 'Coastal Region',     period_days: 7,  narrative_notes: 'Storm-week incident focus.' } },
    { label: 'All municipalities — 30 days',  values: { municipality: '',                   period_days: 30, narrative_notes: 'Plant-wide rollup; rank by avg severity.' } },
  ],
};

// GET /api/ai/samples?feature=<verb>
router.get('/samples', (req, res) => {
  try {
    const feature = (req.query.feature || '').toString();
    if (!feature) {
      return res.json({ features: Object.keys(SAMPLES) });
    }
    const samples = SAMPLES[feature];
    if (!samples) {
      return res.status(404).json({ error: `unknown feature: ${feature}` });
    }
    res.json({ feature, samples });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/ai/history?feature=<name>&limit=<n>
router.get('/history', async (req, res) => {
  try {
    const feature = (req.query.feature || '').toString();
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 200);
    let r;
    if (feature) {
      r = await pool.query(
        'SELECT id, feature, input, output, created_at FROM ai_results WHERE feature = $1 ORDER BY created_at DESC LIMIT $2',
        [feature, limit]
      );
    } else {
      r = await pool.query(
        'SELECT id, feature, input, output, created_at FROM ai_results ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
    }
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ──────────────────────────────────────────────────────────────
// 16 AI endpoints
// ──────────────────────────────────────────────────────────────

router.post('/contamination-vision-score', async (req, res) => {
  try {
    const { load_description, sample_notes } = req.body || {};
    const desc = load_description || 'Default mixed single-stream load — 14 t curbside, no specific notes.';
    const result = await ai.contaminationVisionScore(desc, sample_notes || '');
    await record('contamination-vision-score', { load_description: desc, sample_notes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/commodity-price-forecast', async (req, res) => {
  try {
    let { commodity, horizon_days, recent_prices_json, recent_prices } = req.body || {};
    if (!commodity) commodity = 'PET';
    if (!horizon_days) horizon_days = 30;
    let prices = recent_prices;
    if (!prices && recent_prices_json) {
      try { prices = JSON.parse(recent_prices_json); } catch (_) { prices = []; }
    }
    if (!prices || !Array.isArray(prices) || prices.length === 0) {
      const r = await pool.query(
        `SELECT * FROM prices p
         JOIN commodities c ON c.comm_id = p.comm_id
         WHERE c.name = $1 ORDER BY p.ts DESC LIMIT 30`,
        [commodity]
      );
      prices = r.rows;
    }
    const result = await ai.commodityPriceForecast(commodity, prices, Number(horizon_days));
    await record('commodity-price-forecast', { commodity, horizon_days, prices_count: prices.length }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/sortation-line-balance', async (req, res) => {
  try {
    let { lines, inbound_mix_json, inbound_mix } = req.body || {};
    if (!lines) {
      const r = await pool.query('SELECT * FROM sortation_lines ORDER BY line_id ASC');
      lines = r.rows;
    }
    let mix = inbound_mix;
    if (!mix && inbound_mix_json) {
      try { mix = JSON.parse(inbound_mix_json); } catch (_) { mix = {}; }
    }
    const result = await ai.sortationLineBalance(lines, mix || {});
    await record('sortation-line-balance', { lines_count: lines.length, mix }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/downtime-rca', async (req, res) => {
  try {
    let { events, context_notes } = req.body || {};
    if (!events) {
      const r = await pool.query('SELECT * FROM downtime_events ORDER BY started_at DESC LIMIT 60');
      events = r.rows;
    }
    const result = await ai.downtimeRCA(events, { notes: context_notes || '' });
    await record('downtime-rca', { events_count: events.length, context_notes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/executive-brief', async (req, res) => {
  try {
    const [bales, loadsIn, loadsOut, downtime, lines, safety, contam] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='staged') AS staged, COUNT(*) FILTER (WHERE status='shipped') AS shipped, COUNT(*) FILTER (WHERE status='rejected') AS rejected FROM bales"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='flagged') AS flagged, COUNT(*) FILTER (WHERE status='rejected') AS rejected, COALESCE(AVG(contamination_pct),0)::numeric(8,2) AS avg_contam FROM loads_in"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='scheduled') AS scheduled, COUNT(*) FILTER (WHERE status='in_transit') AS in_transit FROM loads_out"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='open') AS open FROM downtime_events"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='running') AS running, COUNT(*) FILTER (WHERE status='maintenance') AS maintenance FROM sortation_lines"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='open') AS open, COUNT(*) FILTER (WHERE severity='critical') AS critical FROM safety_incidents"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE severity='critical') AS critical, COUNT(*) FILTER (WHERE severity='high') AS high FROM contamination_logs"),
    ]);
    const snapshot = {
      bales: bales.rows[0],
      loads_in: loadsIn.rows[0],
      loads_out: loadsOut.rows[0],
      downtime: downtime.rows[0],
      sortation_lines: lines.rows[0],
      safety: safety.rows[0],
      contamination: contam.rows[0],
      ...(req.body?.notes ? { notes: req.body.notes } : {}),
    };
    const result = await ai.executiveBrief(snapshot);
    const out = { snapshot, brief: result };
    await record('executive-brief', { notes: req.body?.notes || null }, out);
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/customer-quality-feedback', async (req, res) => {
  try {
    const { customer_name, customer_commodity, complaint_text } = req.body || {};
    if (!customer_name) return res.status(400).json({ error: 'customer_name is required' });
    const customer = { name: customer_name, commodity: customer_commodity || 'unknown' };
    const bales = await pool.query(
      'SELECT * FROM bales WHERE commodity ILIKE $1 ORDER BY baled_at DESC LIMIT 10',
      [`%${customer_commodity || ''}%`]
    );
    const result = await ai.customerQualityFeedback(customer, bales.rows, complaint_text || '');
    await record('customer-quality-feedback', { customer_name, customer_commodity }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/vendor-quote-compare', async (req, res) => {
  try {
    let { requirement, quotes, quotes_json } = req.body || {};
    if (!requirement) return res.status(400).json({ error: 'requirement is required' });
    let q = quotes;
    if (!q && quotes_json) {
      try { q = JSON.parse(quotes_json); } catch (_) { q = []; }
    }
    const result = await ai.vendorQuoteCompare(q || [], requirement);
    await record('vendor-quote-compare', { requirement, quotes_count: (q || []).length }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/route-pickup-optimize', async (req, res) => {
  try {
    let { stops, stops_json, constraints } = req.body || {};
    let s = stops;
    if (!s && stops_json) {
      try { s = JSON.parse(stops_json); } catch (_) { s = []; }
    }
    if (!s || !Array.isArray(s)) s = [];
    const result = await ai.routePickupOptimize(s, { notes: constraints || '' });
    await record('route-pickup-optimize', { stops_count: s.length, constraints }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/safety-incident-summary', async (req, res) => {
  try {
    let incidents = req.body?.incidents;
    if (!incidents) {
      const r = await pool.query('SELECT * FROM safety_incidents ORDER BY opened_at DESC LIMIT 30');
      incidents = r.rows;
    }
    const result = await ai.safetyIncidentSummary(incidents);
    await record('safety-incident-summary', { incidents_count: incidents.length }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/training-needs', async (req, res) => {
  try {
    let { operators, training } = req.body || {};
    if (!operators) {
      const r = await pool.query('SELECT * FROM operators ORDER BY op_id ASC');
      operators = r.rows;
    }
    if (!training) {
      const r = await pool.query('SELECT * FROM training_records ORDER BY completed_at DESC LIMIT 30');
      training = r.rows;
    }
    const result = await ai.trainingNeeds(operators, training);
    await record('training-needs', { operators_count: operators.length, training_count: training.length }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/hauler-payment-recon', async (req, res) => {
  try {
    const { invoice_text, loads } = req.body || {};
    let l = loads;
    if (!l) {
      const r = await pool.query('SELECT * FROM loads_in ORDER BY arrived_at DESC LIMIT 30');
      l = r.rows;
    }
    const result = await ai.haulerPaymentRecon(l, invoice_text || '');
    await record('hauler-payment-recon', { loads_count: l.length }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/capacity-utilization-brief', async (req, res) => {
  try {
    let { lines, targets_notes } = req.body || {};
    if (!lines) {
      const r = await pool.query('SELECT * FROM sortation_lines ORDER BY line_id ASC');
      lines = r.rows;
    }
    const result = await ai.capacityUtilizationBrief(lines, { notes: targets_notes || '' });
    await record('capacity-utilization-brief', { lines_count: lines.length, targets_notes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/equipment-prognostic', async (req, res) => {
  try {
    let equipment = req.body?.equipment;
    if (!equipment) {
      const r = await pool.query('SELECT * FROM equipment ORDER BY eq_id ASC');
      equipment = r.rows;
    }
    const result = await ai.equipmentPrognostic(equipment);
    await record('equipment-prognostic', { equipment_count: equipment.length }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/bale-quality-grade', async (req, res) => {
  try {
    const { bale_id, commodity, weight_kg, inspection_notes } = req.body || {};
    const bale = { bale_id: bale_id || 'BAL-UNKNOWN', commodity: commodity || 'unknown', weight_kg: weight_kg || 0 };
    const result = await ai.baleQualityGrade(bale, inspection_notes || '');
    await record('bale-quality-grade', { bale_id, commodity, weight_kg }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/regulatory-reporting', async (req, res) => {
  try {
    const { period, narrative_notes } = req.body || {};
    const [bales, loadsIn, contam] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total, COALESCE(SUM(weight_kg),0) AS total_kg FROM bales"),
      pool.query("SELECT COALESCE(SUM(weight_tons),0) AS total_tons, COALESCE(AVG(contamination_pct),0)::numeric(8,2) AS avg_contam FROM loads_in"),
      pool.query("SELECT COUNT(*) AS total FROM contamination_logs"),
    ]);
    const snapshot = {
      period: period || 'current period',
      total_bales: Number(bales.rows[0].total),
      total_baled_kg: Number(bales.rows[0].total_kg),
      total_inbound_tons: Number(loadsIn.rows[0].total_tons),
      avg_inbound_contamination_pct: Number(loadsIn.rows[0].avg_contam),
      contamination_events: Number(contam.rows[0].total),
      narrative_notes: narrative_notes || '',
    };
    const result = await ai.regulatoryReporting(period || 'current period', snapshot);
    const out = { snapshot, report: result };
    await record('regulatory-reporting', { period }, out);
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/scrap-market-brief', async (req, res) => {
  try {
    const { focus, recent_prices_notes } = req.body || {};
    const r = await pool.query(
      `SELECT c.name AS commodity, p.market, p.value_usd_ton, p.ts, p.source
       FROM prices p JOIN commodities c ON c.comm_id = p.comm_id
       ORDER BY p.ts DESC LIMIT 50`
    );
    const result = await ai.scrapMarketBrief(focus || 'all', r.rows);
    await record('scrap-market-brief', { focus, prices_count: r.rows.length, recent_prices_notes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ──────────────────────────────────────────────────────────────
// Pass 7 — backlog AI verbs
// ──────────────────────────────────────────────────────────────

// AI 17: Line-Camera Anomaly Narrator
router.post('/line-camera-anomaly-narrate', async (req, res) => {
  try {
    let { line_id, frame_events, frame_events_json, operator_notes } = req.body || {};
    let frames = frame_events;
    if (!frames && frame_events_json) {
      try { frames = JSON.parse(frame_events_json); } catch (_) { frames = []; }
    }
    if (!Array.isArray(frames)) frames = [];
    const result = await ai.lineCameraAnomalyNarrate(line_id || '', frames, operator_notes || '');
    await record('line-camera-anomaly-narrate', { line_id, frames_count: frames.length, operator_notes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// AI 18: Throughput Forecast (dedicated time-series)
router.post('/throughput-forecast', async (req, res) => {
  try {
    let { line_id, horizon_hours, shift_history, shift_history_json, context_notes } = req.body || {};
    let hist = shift_history;
    if (!hist && shift_history_json) {
      try { hist = JSON.parse(shift_history_json); } catch (_) { hist = []; }
    }
    if (!hist || !Array.isArray(hist) || hist.length === 0) {
      const r = await pool.query(
        `SELECT line_id, throughput_tph, last_event, status FROM sortation_lines
         WHERE ($1 = '' OR line_id = $1) ORDER BY line_id ASC LIMIT 20`,
        [line_id || '']
      );
      hist = r.rows.map((row, i) => ({ hour_offset: -i * 4, tph: Number(row.throughput_tph || 0), source_line: row.line_id }));
    }
    const result = await ai.throughputForecast(line_id || 'PLANT', hist, Number(horizon_hours || 24), context_notes || '');
    await record('throughput-forecast', { line_id, horizon_hours, history_count: hist.length, context_notes }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// AI 19: End-Market Matchmaker
router.post('/end-market-match', async (req, res) => {
  try {
    const { bale_id, commodity, weight_kg, grade, contamination_pct, constraints_notes } = req.body || {};
    const bale = {
      bale_id: bale_id || 'BAL-UNKNOWN',
      commodity: commodity || 'unknown',
      weight_kg: weight_kg || 0,
      grade: grade || '',
      contamination_pct: contamination_pct || 0,
    };
    // Pull candidate buyer specs matching the commodity (or any if commodity is empty).
    let specs = [];
    try {
      const r = await pool.query(
        `SELECT bs.*, b.name AS buyer_name, b.country AS buyer_country, b.region AS buyer_region, b.certifications
         FROM buyer_specs bs LEFT JOIN buyers b ON b.buyer_id = bs.buyer_id
         WHERE ($1 = '' OR bs.commodity ILIKE $1)
         ORDER BY bs.price_usd_ton DESC NULLS LAST LIMIT 20`,
        [commodity ? `%${commodity}%` : '']
      );
      specs = r.rows;
    } catch (_) { specs = []; }
    const result = await ai.endMarketMatch(bale, specs, constraints_notes || '');
    await record('end-market-match', { bale_id, commodity, specs_count: specs.length }, result);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Per-municipality contamination report card (aggregation + AI narrative)
router.post('/contamination-report-card', async (req, res) => {
  try {
    const { municipality, period_days, narrative_notes } = req.body || {};
    const days = Math.max(1, Math.min(365, Number(period_days || 30)));
    const muniFilter = municipality && String(municipality).trim() ? String(municipality).trim() : null;
    const params = [days];
    let where = `created_at >= NOW() - ($1 || ' days')::interval`;
    if (muniFilter) {
      params.push(muniFilter);
      where += ` AND municipality = $${params.length}`;
    }
    const agg = await pool.query(
      `SELECT
         COALESCE(municipality, 'Unspecified') AS municipality,
         COUNT(*) AS events,
         COUNT(*) FILTER (WHERE severity = 'critical') AS critical,
         COUNT(*) FILTER (WHERE severity = 'high')     AS high,
         COUNT(*) FILTER (WHERE severity = 'medium')   AS medium,
         COUNT(*) FILTER (WHERE severity = 'low')      AS low
       FROM contamination_logs
       WHERE ${where}
       GROUP BY COALESCE(municipality, 'Unspecified')
       ORDER BY events DESC`,
      params
    );
    const topTypes = await pool.query(
      `SELECT type, COUNT(*) AS cnt FROM contamination_logs
       WHERE ${where} GROUP BY type ORDER BY cnt DESC LIMIT 10`,
      params
    );
    const snapshot = {
      scope: muniFilter || 'all municipalities',
      period_days: days,
      by_municipality: agg.rows,
      top_contaminant_types: topTypes.rows,
      narrative_notes: narrative_notes || '',
    };
    const result = await ai.executiveBrief(snapshot);
    const out = { snapshot, report: result };
    await record('contamination-report-card', { municipality: muniFilter, period_days: days }, out);
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
