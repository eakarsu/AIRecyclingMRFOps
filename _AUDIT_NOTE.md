# Audit Note — AIRecyclingMRFOps

Domain: Materials Recovery Facility (MRF) operations — sortation lines, contamination tracking, bale quality, commodity pricing, hauler/route mgmt.
Stack: Node + Express + React + Postgres + OpenRouter. Audit-only pass.

## Existing inventory

**CRUD routes (18):** bales, loads-in, loads-out, contamination-logs, commodities, prices, customers, drivers, vehicles, equipment, sortation-lines, downtime-events, operators, safety-incidents, training-records, vendors, contracts, audit-log. Cross-cutting: notifications, attachments, webhooks, dashboard, custom-views, auth.

**AI endpoints (16)** on `/api/ai`: contamination-vision-score, commodity-price-forecast, sortation-line-balance, downtime-rca, executive-brief, customer-quality-feedback, vendor-quote-compare, route-pickup-optimize, safety-incident-summary, training-needs, hauler-payment-recon, capacity-utilization-brief, equipment-prognostic, bale-quality-grade, regulatory-reporting, scrap-market-brief. Each has dedicated frontend page + `ai_results` persistence.

**DB tables (16 domain + 5 infra):** bales, loads_in/out, contamination_logs, commodities, prices, customers, drivers, vehicles, equipment, sortation_lines, downtime_events, operators, safety_incidents, training_records, vendors, contracts + users, notifications, attachments, webhooks, ai_results, audit_log.

## Gap analysis vs. brief

### AI counterparts
- **COVERED** contamination classifier from image → `contamination-vision-score`.
- **COVERED** bale-quality scorer → `bale-quality-grade`.
- **COVERED** commodity-price forecaster → `commodity-price-forecast`.
- **COVERED (proxy)** sortation-throughput predictor → `sortation-line-balance` + `capacity-utilization-brief` (balance/utilization framing, not a dedicated throughput-time-series predictor).
- **MISSING** Anomaly narrator from line cameras (no live-feed/event-stream narration endpoint; vision route is single-image scoring).

### Non-AI features
- **COVERED (partial)** Scale-house ticketing → `loads-in`/`loads-out` cover gross/tare/net flow but no dedicated scale-ticket/printout/weighbridge integration model.
- **COVERED** Bale inventory CRUD → `bales`.
- **COVERED** Commodity contracts → `contracts` + `commodities` + `prices`.
- **MISSING** EPR (extended producer responsibility) reporting — no producer/SKU/jurisdiction tables or filings module; `regulatory-reporting` AI endpoint exists but no structured EPR data model or submission tracking.

### Custom features
- **MISSING** Per-municipality contamination report card (no municipality dimension on contamination_logs; no scheduled report card generator).
- **COVERED (AI-only)** Hauler-route optimizer → `route-pickup-optimize` AI route exists; no persisted routes/stops/sequencing tables or map UI.
- **MISSING** End-market matchmaker (bale ↔ buyer/mill matching — no marketplace endpoint or buyer-spec/grade-fit model; `vendor-quote-compare` is closest but addresses inbound quotes, not outbound bale placement).

## Categorization summary

| Gap | Category | Notes |
|---|---|---|
| Camera anomaly narrator | MECHANICAL-AI | Add `/api/ai/line-camera-anomaly-narrate` (frame batch → narrative + severity). |
| Sortation-throughput predictor (dedicated) | MECHANICAL-AI | Add `/api/ai/throughput-forecast` using line + shift history. |
| EPR reporting module | MECHANICAL + NEEDS-PRODUCT-DECISION | New tables (producers, sku_obligations, epr_filings) + jurisdiction rule set. |
| Scale-house ticket model | MECHANICAL | Extend loads_in/out or add `scale_tickets` table; printable ticket. |
| Per-municipality contamination report card | MECHANICAL | Add `municipality` FK to contamination_logs + scheduled report generator (AI brief possible via existing executive-brief pattern). |
| Hauler-route optimizer (data model) | MECHANICAL | Add `routes`, `route_stops`, persist optimizer output. |
| End-market matchmaker | MECHANICAL-AI | Add `buyers` + `buyer_specs` tables + `/api/ai/end-market-match` endpoint. |
| External: weighbridge / EPR portals / scale hardware | NEEDS-CREDS | Vendor integrations gated on prod creds. |

## Counts
- CRUD routes: 18
- AI endpoints: 16
- DB domain tables: 16 (+5 infra)
- Frontend AI pages: 16; CRUD pages: 18
- Gaps identified: 7 (3 AI, 4 non-AI/custom) + 1 NEEDS-CREDS bucket

## Status
**Implemented this pass:** None — audit-only.
**Backlog priority order:** 1) camera anomaly narrator, 2) EPR data model + filings, 3) end-market matchmaker, 4) per-municipality contamination report card, 5) dedicated throughput predictor, 6) hauler-route persistence, 7) scale-ticket model.

## Apply pass 7 (full backlog implementation)

All 7 backlog items (3 MECHANICAL-AI + 4 NEEDS-PRODUCT-DECISION) shipped behind feature-flag-free, additive routes/tables. No new npm dependencies, no breaking changes.

### Endpoints added
- `POST /api/ai/line-camera-anomaly-narrate` — frame-event batch → severity + narrative
- `POST /api/ai/throughput-forecast`         — line + shift history → hourly tph forecast
- `POST /api/ai/end-market-match`            — bale + buyer_specs → ranked matches
- `POST /api/ai/contamination-report-card`   — aggregate contamination_logs by `municipality`, then narrate
- CRUD (list / get / create / update / delete / bulk-import / attachments) for:
  - `/api/producers`
  - `/api/sku-obligations`
  - `/api/epr-filings`
  - `/api/scale-tickets`
  - `/api/routes`
  - `/api/route-stops`
  - `/api/buyers`
  - `/api/buyer-specs`

### Frontend pages added
- `/ai/line-camera-anomaly-narrate`, `/ai/throughput-forecast`, `/ai/end-market-match`, `/ai/contamination-report-card`
- `/producers`, `/sku-obligations`, `/epr-filings`, `/scale-tickets`, `/routes`, `/route-stops`, `/buyers`, `/buyer-specs`
- Sidebar groups: Scale House, Hauler Routes, End Markets, EPR, AI Backlog

### DB migration — `backend/migrations/002_pass7_backlog.sql`
- `ALTER TABLE contamination_logs ADD COLUMN IF NOT EXISTS municipality VARCHAR(120)` + index
- New tables: `producers`, `sku_obligations`, `epr_filings`, `scale_tickets`, `routes`, `route_stops`, `buyers`, `buyer_specs` (all with `IF NOT EXISTS`)
- `backend/seed/seed.js` updated: drops new tables in reset block, applies `002_pass7_backlog.sql` after `001_schema.sql`

### Mounting / wiring
- New `app.use()` mounts placed in `backend/server.js` **after** the existing `/api/custom-views` mount and **before** `app.listen(...)` (no explicit 404 handler exists in this codebase)
- Frontend `api.js` extended with 8 CRUD helpers + 4 AI helpers
- AI route file `backend/routes/ai.js` extended in-place with 4 new endpoints + 4 new sample sets

### Sample fills
- 5 realistic samples added per new AI verb (`line-camera-anomaly-narrate`, `throughput-forecast`, `end-market-match`, `contamination-report-card`)
- Frontend `AIPage` auto-loads them via the existing `/api/ai/samples?feature=...` route

### Syntax verification
- `node --check` clean on all modified backend `.js` files:
  - `server.js`, `services/ai.js`, `routes/ai.js`, `seed/seed.js`, and the 8 new route modules
- Babel-parse clean (`@babel/preset-env` + `@babel/preset-react`) on all 14 new/modified frontend `.js` files (App.js, Sidebar.js, 8 CRUD pages, 4 AI pages)

### Skips / out-of-scope
- No external integrations (NEEDS-CREDS bucket) — weighbridge hardware, EPR portal submission APIs, optical-sort camera feeds remain stub-shaped: data models exist, but live vendor pushes are not wired
- No new npm dependencies added (all routes use existing `express` + `pg` + `pg-pool`; AI verbs reuse the `openrouter` HTTPS helper already in `services/ai.js`)
- `route_stops` -> `routes` join is by `route_id` string FK (no PostgreSQL FK constraint) to stay consistent with how the rest of the schema joins by `*_id` codes
- No FE map UI for routes (deferred — out of "data model" scope); CRUD page lists stops in sequence order via standard list view

### Status
**Implemented this pass:** 4 new AI endpoints + 8 new CRUD entities + 1 contamination_logs column + 12 new frontend pages + Sidebar nav. Backlog fully closed except for NEEDS-CREDS vendor integrations.
