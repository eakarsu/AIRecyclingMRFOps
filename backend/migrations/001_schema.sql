-- AIRecyclingMRFOps schema — Materials Recovery Facility operations
-- 18 domain entities + RBAC users + notifications + attachments + webhooks
-- + webhook_deliveries + ai_results

-- ─────────────────────────────────────────────
-- RBAC
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  email           VARCHAR(150) UNIQUE NOT NULL,
  password        VARCHAR(120) NOT NULL,
  name            VARCHAR(120),
  role            VARCHAR(20) DEFAULT 'viewer',  -- admin | ops | viewer
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Cross-cutting (notifications + attachments + webhooks)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER,
  title           VARCHAR(200),
  body            TEXT,
  severity        VARCHAR(20) DEFAULT 'info',
  source          VARCHAR(80),
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, read_at);

CREATE TABLE IF NOT EXISTS attachments (
  id              SERIAL PRIMARY KEY,
  resource_type   VARCHAR(60),
  resource_id     INTEGER,
  filename        VARCHAR(255),
  original_name   VARCHAR(255),
  mimetype        VARCHAR(120),
  size_bytes      INTEGER,
  uploaded_by     VARCHAR(150),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attachments_resource
  ON attachments (resource_type, resource_id);

CREATE TABLE IF NOT EXISTS webhooks (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(120),
  url             VARCHAR(500),
  secret          VARCHAR(120),
  events          TEXT,
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id              SERIAL PRIMARY KEY,
  webhook_id      INTEGER,
  event           VARCHAR(120),
  payload         JSONB,
  status_code     INTEGER,
  response_body   TEXT,
  attempted_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook
  ON webhook_deliveries (webhook_id, attempted_at DESC);

CREATE TABLE IF NOT EXISTS ai_results (
  id              SERIAL PRIMARY KEY,
  feature         VARCHAR(80) NOT NULL,
  input           JSONB,
  output          JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_results_feature_created
  ON ai_results (feature, created_at DESC);

-- ─────────────────────────────────────────────
-- 18 MRF domain entities
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bales (
  id              SERIAL PRIMARY KEY,
  bale_id         VARCHAR(50) UNIQUE,
  commodity       VARCHAR(60),
  weight_kg       INTEGER DEFAULT 0,
  baled_at        TIMESTAMPTZ,
  grade           VARCHAR(20),
  status          VARCHAR(30) DEFAULT 'staged',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loads_in (
  id              SERIAL PRIMARY KEY,
  load_id         VARCHAR(50) UNIQUE,
  hauler          VARCHAR(120),
  weight_tons     NUMERIC(10,2) DEFAULT 0,
  contamination_pct NUMERIC(5,2) DEFAULT 0,
  arrived_at      TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'accepted',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loads_out (
  id              SERIAL PRIMARY KEY,
  out_id          VARCHAR(50) UNIQUE,
  bale_id         VARCHAR(50),
  customer_id     VARCHAR(50),
  weight_kg       INTEGER DEFAULT 0,
  shipped_at      TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'scheduled',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contamination_logs (
  id              SERIAL PRIMARY KEY,
  log_id          VARCHAR(50) UNIQUE,
  load_id         VARCHAR(50),
  type            VARCHAR(60),
  severity        VARCHAR(20),
  found_by        VARCHAR(120),
  ts              TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commodities (
  id              SERIAL PRIMARY KEY,
  comm_id         VARCHAR(50) UNIQUE,
  name            VARCHAR(120),
  current_price_usd_ton NUMERIC(10,2) DEFAULT 0,
  currency        VARCHAR(10) DEFAULT 'USD',
  last_updated    TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'tracked',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prices (
  id              SERIAL PRIMARY KEY,
  price_id        VARCHAR(50) UNIQUE,
  comm_id         VARCHAR(50),
  market          VARCHAR(80),
  value_usd_ton   NUMERIC(10,2) DEFAULT 0,
  ts              TIMESTAMPTZ,
  source          VARCHAR(120),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id              SERIAL PRIMARY KEY,
  customer_id     VARCHAR(50) UNIQUE,
  name            VARCHAR(150),
  country         VARCHAR(80),
  commodity       VARCHAR(60),
  contract_id     VARCHAR(50),
  status          VARCHAR(30) DEFAULT 'active',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drivers (
  id              SERIAL PRIMARY KEY,
  driver_id       VARCHAR(50) UNIQUE,
  name            VARCHAR(150),
  license         VARCHAR(50),
  base            VARCHAR(120),
  last_run        TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'available',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id              SERIAL PRIMARY KEY,
  vehicle_id      VARCHAR(50) UNIQUE,
  type            VARCHAR(60),
  plate           VARCHAR(20),
  fuel_status     VARCHAR(20),
  location        VARCHAR(120),
  status          VARCHAR(30) DEFAULT 'ready',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment (
  id              SERIAL PRIMARY KEY,
  eq_id           VARCHAR(50) UNIQUE,
  name            VARCHAR(150),
  line_id         VARCHAR(50),
  vendor          VARCHAR(120),
  last_service    DATE,
  status          VARCHAR(30) DEFAULT 'operational',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sortation_lines (
  id              SERIAL PRIMARY KEY,
  line_id         VARCHAR(50) UNIQUE,
  name            VARCHAR(120),
  throughput_tph  NUMERIC(8,2) DEFAULT 0,
  status          VARCHAR(30) DEFAULT 'running',
  last_event      TIMESTAMPTZ,
  operator        VARCHAR(120),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS downtime_events (
  id              SERIAL PRIMARY KEY,
  event_id        VARCHAR(50) UNIQUE,
  line_id         VARCHAR(50),
  reason          VARCHAR(200),
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'open',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operators (
  id              SERIAL PRIMARY KEY,
  op_id           VARCHAR(50) UNIQUE,
  name            VARCHAR(150),
  shift           VARCHAR(20),
  line_id         VARCHAR(50),
  status          VARCHAR(30) DEFAULT 'active',
  contact         VARCHAR(120),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS safety_incidents (
  id              SERIAL PRIMARY KEY,
  incident_id     VARCHAR(50) UNIQUE,
  location        VARCHAR(150),
  type            VARCHAR(60),
  severity        VARCHAR(20),
  opened_at       TIMESTAMPTZ,
  status          VARCHAR(30) DEFAULT 'open',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_records (
  id              SERIAL PRIMARY KEY,
  record_id       VARCHAR(50) UNIQUE,
  op_id           VARCHAR(50),
  topic           VARCHAR(150),
  completed_at    DATE,
  score           NUMERIC(5,2),
  status          VARCHAR(30) DEFAULT 'complete',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendors (
  id              SERIAL PRIMARY KEY,
  vendor_id       VARCHAR(50) UNIQUE,
  name            VARCHAR(150),
  service         VARCHAR(200),
  country         VARCHAR(80),
  rating          NUMERIC(3,1) DEFAULT 0,
  status          VARCHAR(30) DEFAULT 'approved',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contracts (
  id              SERIAL PRIMARY KEY,
  contract_id     VARCHAR(50) UNIQUE,
  customer_id     VARCHAR(50),
  commodity       VARCHAR(60),
  term_months     INTEGER DEFAULT 12,
  status          VARCHAR(30) DEFAULT 'active',
  value_usd       BIGINT DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id              SERIAL PRIMARY KEY,
  entry_id        VARCHAR(50) UNIQUE,
  actor           VARCHAR(150),
  target          VARCHAR(200),
  action          VARCHAR(120),
  result          VARCHAR(60),
  ts              TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
