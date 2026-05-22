-- AIRecyclingMRFOps — Pass 7 backlog implementation
-- Adds:
--   - municipality dimension on contamination_logs (per-municipality report cards)
--   - producers / sku_obligations / epr_filings (EPR reporting module)
--   - scale_tickets (dedicated scale-house ticket model)
--   - routes / route_stops (persisted hauler route data model)
--   - buyers / buyer_specs (end-market matchmaker)
-- All additions are non-breaking (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

-- ─────────────────────────────────────────────
-- Per-municipality contamination report card support
-- ─────────────────────────────────────────────
ALTER TABLE contamination_logs
  ADD COLUMN IF NOT EXISTS municipality VARCHAR(120);

CREATE INDEX IF NOT EXISTS idx_contamination_logs_municipality
  ON contamination_logs (municipality);

-- ─────────────────────────────────────────────
-- EPR (Extended Producer Responsibility)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS producers (
  id              SERIAL PRIMARY KEY,
  producer_id     VARCHAR(50) UNIQUE,
  name            VARCHAR(150),
  jurisdiction    VARCHAR(120),
  contact         VARCHAR(150),
  status          VARCHAR(30) DEFAULT 'active',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sku_obligations (
  id                SERIAL PRIMARY KEY,
  sku_id            VARCHAR(50) UNIQUE,
  producer_id       VARCHAR(50),
  sku_description   VARCHAR(200),
  material_category VARCHAR(80),
  unit_weight_g     NUMERIC(10,2) DEFAULT 0,
  fee_usd_unit      NUMERIC(10,4) DEFAULT 0,
  jurisdiction      VARCHAR(120),
  status            VARCHAR(30) DEFAULT 'active',
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS epr_filings (
  id              SERIAL PRIMARY KEY,
  filing_id       VARCHAR(50) UNIQUE,
  producer_id     VARCHAR(50),
  period          VARCHAR(40),
  jurisdiction    VARCHAR(120),
  total_units     BIGINT DEFAULT 0,
  total_kg        NUMERIC(14,2) DEFAULT 0,
  fee_total_usd   NUMERIC(14,2) DEFAULT 0,
  submitted_at    TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'draft',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Scale-house ticket model
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scale_tickets (
  id              SERIAL PRIMARY KEY,
  ticket_id       VARCHAR(50) UNIQUE,
  load_id         VARCHAR(50),
  direction       VARCHAR(10) DEFAULT 'in', -- in | out
  hauler          VARCHAR(120),
  vehicle_plate   VARCHAR(20),
  gross_kg        NUMERIC(12,2) DEFAULT 0,
  tare_kg         NUMERIC(12,2) DEFAULT 0,
  net_kg          NUMERIC(12,2) DEFAULT 0,
  weighed_at      TIMESTAMPTZ,
  scale_house     VARCHAR(80),
  operator        VARCHAR(120),
  status          VARCHAR(30) DEFAULT 'open',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scale_tickets_load ON scale_tickets (load_id);

-- ─────────────────────────────────────────────
-- Hauler route persistence
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routes (
  id              SERIAL PRIMARY KEY,
  route_id        VARCHAR(50) UNIQUE,
  name            VARCHAR(150),
  driver_id       VARCHAR(50),
  vehicle_id      VARCHAR(50),
  scheduled_date  DATE,
  distance_km     NUMERIC(10,2) DEFAULT 0,
  duration_hours  NUMERIC(8,2) DEFAULT 0,
  fill_pct        NUMERIC(5,2) DEFAULT 0,
  status          VARCHAR(30) DEFAULT 'planned',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS route_stops (
  id              SERIAL PRIMARY KEY,
  stop_id         VARCHAR(50) UNIQUE,
  route_id        VARCHAR(50),
  sequence        INTEGER DEFAULT 0,
  address         VARCHAR(250),
  client          VARCHAR(150),
  est_tons        NUMERIC(8,2) DEFAULT 0,
  arrival_eta     TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'pending',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_route_stops_route ON route_stops (route_id, sequence);

-- ─────────────────────────────────────────────
-- End-market matchmaker — buyers + buyer specs
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS buyers (
  id              SERIAL PRIMARY KEY,
  buyer_id        VARCHAR(50) UNIQUE,
  name            VARCHAR(150),
  country         VARCHAR(80),
  region          VARCHAR(80),
  contact         VARCHAR(150),
  certifications  VARCHAR(200),
  status          VARCHAR(30) DEFAULT 'active',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS buyer_specs (
  id                  SERIAL PRIMARY KEY,
  spec_id             VARCHAR(50) UNIQUE,
  buyer_id            VARCHAR(50),
  commodity           VARCHAR(80),
  isri_grade          VARCHAR(40),
  max_contamination_pct NUMERIC(5,2) DEFAULT 0,
  min_density_kg_m3   NUMERIC(8,2) DEFAULT 0,
  min_bale_weight_kg  NUMERIC(8,2) DEFAULT 0,
  price_usd_ton       NUMERIC(10,2) DEFAULT 0,
  monthly_demand_tons NUMERIC(10,2) DEFAULT 0,
  status              VARCHAR(30) DEFAULT 'active',
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_buyer_specs_commodity ON buyer_specs (commodity);
