const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'recycling_mrf',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('[seed] resetting tables...');
    await client.query(`
      DROP TABLE IF EXISTS bales              CASCADE;
      DROP TABLE IF EXISTS loads_in           CASCADE;
      DROP TABLE IF EXISTS loads_out          CASCADE;
      DROP TABLE IF EXISTS contamination_logs CASCADE;
      DROP TABLE IF EXISTS commodities        CASCADE;
      DROP TABLE IF EXISTS prices             CASCADE;
      DROP TABLE IF EXISTS customers          CASCADE;
      DROP TABLE IF EXISTS drivers            CASCADE;
      DROP TABLE IF EXISTS vehicles           CASCADE;
      DROP TABLE IF EXISTS equipment          CASCADE;
      DROP TABLE IF EXISTS sortation_lines    CASCADE;
      DROP TABLE IF EXISTS downtime_events    CASCADE;
      DROP TABLE IF EXISTS operators          CASCADE;
      DROP TABLE IF EXISTS safety_incidents   CASCADE;
      DROP TABLE IF EXISTS training_records   CASCADE;
      DROP TABLE IF EXISTS vendors            CASCADE;
      DROP TABLE IF EXISTS contracts          CASCADE;
      DROP TABLE IF EXISTS audit_log          CASCADE;

      DROP TABLE IF EXISTS users              CASCADE;
      DROP TABLE IF EXISTS notifications      CASCADE;
      DROP TABLE IF EXISTS attachments        CASCADE;
      DROP TABLE IF EXISTS webhooks           CASCADE;
      DROP TABLE IF EXISTS webhook_deliveries CASCADE;
      DROP TABLE IF EXISTS ai_results         CASCADE;
    `);

    console.log('[seed] applying migrations...');
    const schema = fs.readFileSync(path.join(__dirname, '..', 'migrations', '001_schema.sql'), 'utf8');
    await client.query(schema);

    // ─────────────────────────────────────────────
    // RBAC users (3)
    // ─────────────────────────────────────────────
    console.log('[seed] inserting users...');
    const users = [
      ['admin@mrf.io',   'admin123',  'MRF Administrator', 'admin'],
      ['ops@mrf.io',     'ops123',    'Operations Lead',   'ops'],
      ['viewer@mrf.io',  'viewer123', 'Read-only Viewer',  'viewer'],
    ];
    for (const u of users) {
      await client.query(
        `INSERT INTO users (email,password,name,role) VALUES ($1,$2,$3,$4)`, u);
    }

    console.log('[seed] inserting bales...');
    const bales = [
      ['BAL-2026-0001', 'PET',          480, '2026-05-15 08:00+00', 'A',  'shipped'],
      ['BAL-2026-0002', 'HDPE-Natural', 510, '2026-05-15 09:30+00', 'A',  'staged'],
      ['BAL-2026-0003', 'OCC',          720, '2026-05-15 11:00+00', 'A',  'staged'],
      ['BAL-2026-0004', 'Mixed Paper',  650, '2026-05-15 13:00+00', 'B',  'staged'],
      ['BAL-2026-0005', 'Aluminum UBC', 380, '2026-05-15 15:00+00', 'A',  'shipped'],
      ['BAL-2026-0006', 'PET',          490, '2026-05-16 08:30+00', 'A',  'staged'],
      ['BAL-2026-0007', 'HDPE-Color',   470, '2026-05-16 10:00+00', 'B',  'staged'],
      ['BAL-2026-0008', 'OCC',          740, '2026-05-16 12:00+00', 'A',  'shipped'],
      ['BAL-2026-0009', 'PP',           430, '2026-05-16 14:00+00', 'B',  'staged'],
      ['BAL-2026-0010', 'Mixed Plastic',590, '2026-05-16 16:00+00', 'C',  'rejected'],
      ['BAL-2026-0011', 'Steel Cans',   880, '2026-05-17 08:00+00', 'A',  'staged'],
      ['BAL-2026-0012', 'PET',          500, '2026-05-17 09:30+00', 'A',  'staged'],
      ['BAL-2026-0013', 'OCC',          710, '2026-05-17 11:00+00', 'A',  'staged'],
      ['BAL-2026-0014', 'HDPE-Natural', 520, '2026-05-17 12:30+00', 'A',  'shipped'],
      ['BAL-2026-0015', 'Aluminum UBC', 390, '2026-05-17 14:00+00', 'A',  'staged'],
    ];
    for (const b of bales) {
      await client.query(
        `INSERT INTO bales (bale_id,commodity,weight_kg,baled_at,grade,status) VALUES ($1,$2,$3,$4,$5,$6)`, b);
    }

    console.log('[seed] inserting loads_in...');
    const loadsIn = [
      ['LIN-2026-0001', 'Republic Services',     12.4, 8.5,  '2026-05-15 06:30+00', 'accepted'],
      ['LIN-2026-0002', 'Waste Management',      18.2, 14.2, '2026-05-15 07:15+00', 'flagged'],
      ['LIN-2026-0003', 'GFL Environmental',     9.8,  6.1,  '2026-05-15 08:00+00', 'accepted'],
      ['LIN-2026-0004', 'Casella Waste',         15.6, 11.8, '2026-05-15 09:30+00', 'accepted'],
      ['LIN-2026-0005', 'Independent Hauler #7', 4.2,  22.1, '2026-05-15 11:00+00', 'rejected'],
      ['LIN-2026-0006', 'Republic Services',     13.1, 9.0,  '2026-05-16 06:45+00', 'accepted'],
      ['LIN-2026-0007', 'WM Curbside Route 14',  20.5, 12.5, '2026-05-16 07:30+00', 'flagged'],
      ['LIN-2026-0008', 'GFL Environmental',     10.3, 7.2,  '2026-05-16 08:30+00', 'accepted'],
      ['LIN-2026-0009', 'City of Riverside MUN', 16.8, 13.6, '2026-05-16 10:00+00', 'flagged'],
      ['LIN-2026-0010', 'Casella Waste',         14.4, 9.5,  '2026-05-16 11:30+00', 'accepted'],
      ['LIN-2026-0011', 'Republic Services',     12.9, 8.7,  '2026-05-17 06:30+00', 'accepted'],
      ['LIN-2026-0012', 'WM Commercial Route 3', 22.1, 15.5, '2026-05-17 07:15+00', 'flagged'],
      ['LIN-2026-0013', 'Independent Hauler #2', 6.4,  18.4, '2026-05-17 08:30+00', 'rejected'],
      ['LIN-2026-0014', 'GFL Environmental',     11.2, 6.9,  '2026-05-17 09:30+00', 'accepted'],
      ['LIN-2026-0015', 'Casella Waste',         15.0, 10.4, '2026-05-17 11:00+00', 'accepted'],
    ];
    for (const l of loadsIn) {
      await client.query(
        `INSERT INTO loads_in (load_id,hauler,weight_tons,contamination_pct,arrived_at,status) VALUES ($1,$2,$3,$4,$5,$6)`, l);
    }

    console.log('[seed] inserting loads_out...');
    const loadsOut = [
      ['LOU-2026-0001', 'BAL-2026-0001', 'CUS-001', 480,  '2026-05-15 16:00+00', 'delivered'],
      ['LOU-2026-0002', 'BAL-2026-0005', 'CUS-004', 380,  '2026-05-15 17:30+00', 'delivered'],
      ['LOU-2026-0003', 'BAL-2026-0008', 'CUS-002', 740,  '2026-05-16 15:00+00', 'in_transit'],
      ['LOU-2026-0004', 'BAL-2026-0014', 'CUS-003', 520,  '2026-05-17 16:00+00', 'in_transit'],
      ['LOU-2026-0005', 'BAL-2026-0011', 'CUS-005', 880,  '2026-05-18 08:00+00', 'scheduled'],
      ['LOU-2026-0006', 'BAL-2026-0006', 'CUS-001', 490,  '2026-05-18 10:00+00', 'scheduled'],
      ['LOU-2026-0007', 'BAL-2026-0002', 'CUS-003', 510,  '2026-05-18 13:00+00', 'scheduled'],
      ['LOU-2026-0008', 'BAL-2026-0013', 'CUS-002', 710,  '2026-05-19 08:00+00', 'scheduled'],
      ['LOU-2026-0009', 'BAL-2026-0003', 'CUS-002', 720,  '2026-05-19 10:00+00', 'scheduled'],
      ['LOU-2026-0010', 'BAL-2026-0015', 'CUS-004', 390,  '2026-05-19 13:00+00', 'scheduled'],
      ['LOU-2026-0011', 'BAL-2026-0009', 'CUS-006', 430,  '2026-05-20 08:00+00', 'scheduled'],
      ['LOU-2026-0012', 'BAL-2026-0012', 'CUS-001', 500,  '2026-05-20 10:00+00', 'scheduled'],
      ['LOU-2026-0013', 'BAL-2026-0007', 'CUS-003', 470,  '2026-05-20 13:00+00', 'scheduled'],
      ['LOU-2026-0014', 'BAL-2026-0004', 'CUS-007', 650,  '2026-05-21 08:00+00', 'scheduled'],
      ['LOU-2026-0015', 'BAL-2026-0010', 'CUS-008', 590,  '2026-05-21 10:00+00', 'cancelled'],
    ];
    for (const o of loadsOut) {
      await client.query(
        `INSERT INTO loads_out (out_id,bale_id,customer_id,weight_kg,shipped_at,status) VALUES ($1,$2,$3,$4,$5,$6)`, o);
    }

    console.log('[seed] inserting contamination_logs...');
    const contam = [
      ['CTL-2026-0001', 'LIN-2026-0002', 'tanglers',      'medium', 'Inbound Inspector A', '2026-05-15 07:30+00'],
      ['CTL-2026-0002', 'LIN-2026-0005', 'lithium batt',  'high',   'Inbound Inspector B', '2026-05-15 11:10+00'],
      ['CTL-2026-0003', 'LIN-2026-0007', 'glass shards',  'medium', 'Inbound Inspector A', '2026-05-16 07:40+00'],
      ['CTL-2026-0004', 'LIN-2026-0009', 'food residue',  'low',    'Inbound Inspector C', '2026-05-16 10:15+00'],
      ['CTL-2026-0005', 'LIN-2026-0012', 'tanglers',      'medium', 'Inbound Inspector A', '2026-05-17 07:25+00'],
      ['CTL-2026-0006', 'LIN-2026-0013', 'propane tank',  'critical','Inbound Inspector B','2026-05-17 08:40+00'],
      ['CTL-2026-0007', 'LIN-2026-0002', 'film plastic',  'low',    'Sort-line Lead',      '2026-05-15 09:00+00'],
      ['CTL-2026-0008', 'LIN-2026-0007', 'styrofoam',     'low',    'Sort-line Lead',      '2026-05-16 09:15+00'],
      ['CTL-2026-0009', 'LIN-2026-0009', 'shredded paper','low',    'QC Manager',          '2026-05-16 11:00+00'],
      ['CTL-2026-0010', 'LIN-2026-0012', 'paint can',     'high',   'QC Manager',          '2026-05-17 09:30+00'],
      ['CTL-2026-0011', 'LIN-2026-0005', 'wire harness',  'medium', 'Inbound Inspector B', '2026-05-15 11:20+00'],
      ['CTL-2026-0012', 'LIN-2026-0009', 'textiles',      'low',    'QC Manager',          '2026-05-16 12:00+00'],
      ['CTL-2026-0013', 'LIN-2026-0013', 'hypodermic',    'critical','Safety Officer',     '2026-05-17 08:55+00'],
      ['CTL-2026-0014', 'LIN-2026-0007', 'CRT glass',     'high',   'Inbound Inspector A', '2026-05-16 08:10+00'],
      ['CTL-2026-0015', 'LIN-2026-0002', 'aerosol can',   'medium', 'Sort-line Lead',      '2026-05-15 09:30+00'],
    ];
    for (const c of contam) {
      await client.query(
        `INSERT INTO contamination_logs (log_id,load_id,type,severity,found_by,ts) VALUES ($1,$2,$3,$4,$5,$6)`, c);
    }

    console.log('[seed] inserting commodities...');
    const commodities = [
      ['COM-001', 'PET',           335.00, 'USD', '2026-05-17 12:00+00', 'tracked'],
      ['COM-002', 'HDPE-Natural',  920.00, 'USD', '2026-05-17 12:00+00', 'tracked'],
      ['COM-003', 'HDPE-Color',    410.00, 'USD', '2026-05-17 12:00+00', 'tracked'],
      ['COM-004', 'PP',            290.00, 'USD', '2026-05-17 12:00+00', 'tracked'],
      ['COM-005', 'OCC',           115.00, 'USD', '2026-05-17 12:00+00', 'tracked'],
      ['COM-006', 'Mixed Paper',    55.00, 'USD', '2026-05-17 12:00+00', 'tracked'],
      ['COM-007', 'SOP',           195.00, 'USD', '2026-05-17 12:00+00', 'tracked'],
      ['COM-008', 'Newsprint',      75.00, 'USD', '2026-05-17 12:00+00', 'tracked'],
      ['COM-009', 'Aluminum UBC', 1480.00, 'USD', '2026-05-17 12:00+00', 'tracked'],
      ['COM-010', 'Steel Cans',    195.00, 'USD', '2026-05-17 12:00+00', 'tracked'],
      ['COM-011', 'Mixed Plastic',  35.00, 'USD', '2026-05-17 12:00+00', 'low_demand'],
      ['COM-012', 'Glass — Clear',  18.00, 'USD', '2026-05-17 12:00+00', 'tracked'],
      ['COM-013', 'Glass — Mixed',  -8.00, 'USD', '2026-05-17 12:00+00', 'negative_value'],
      ['COM-014', 'Film Plastic',   45.00, 'USD', '2026-05-17 12:00+00', 'low_demand'],
      ['COM-015', 'eWaste boards',2400.00, 'USD', '2026-05-17 12:00+00', 'tracked'],
    ];
    for (const c of commodities) {
      await client.query(
        `INSERT INTO commodities (comm_id,name,current_price_usd_ton,currency,last_updated,status) VALUES ($1,$2,$3,$4,$5,$6)`, c);
    }

    console.log('[seed] inserting prices...');
    const prices = [
      ['PRC-2026-0001', 'COM-001', 'ISRI West',  332.00, '2026-05-15 12:00+00', 'RecyclingMarkets.net'],
      ['PRC-2026-0002', 'COM-001', 'ISRI East',  338.00, '2026-05-15 12:00+00', 'Resource-Recycling'],
      ['PRC-2026-0003', 'COM-002', 'ISRI West',  915.00, '2026-05-15 12:00+00', 'RecyclingMarkets.net'],
      ['PRC-2026-0004', 'COM-005', 'ISRI Gulf',  112.00, '2026-05-15 12:00+00', 'OBM-FastMarkets'],
      ['PRC-2026-0005', 'COM-009', 'LME spot',  1465.00, '2026-05-15 12:00+00', 'LME'],
      ['PRC-2026-0006', 'COM-001', 'ISRI West',  334.00, '2026-05-16 12:00+00', 'RecyclingMarkets.net'],
      ['PRC-2026-0007', 'COM-002', 'ISRI West',  918.00, '2026-05-16 12:00+00', 'RecyclingMarkets.net'],
      ['PRC-2026-0008', 'COM-005', 'ISRI Gulf',  114.00, '2026-05-16 12:00+00', 'OBM-FastMarkets'],
      ['PRC-2026-0009', 'COM-009', 'LME spot',  1472.00, '2026-05-16 12:00+00', 'LME'],
      ['PRC-2026-0010', 'COM-013', 'Regional',   -10.00, '2026-05-16 12:00+00', 'Regional broker'],
      ['PRC-2026-0011', 'COM-001', 'ISRI West',  335.00, '2026-05-17 12:00+00', 'RecyclingMarkets.net'],
      ['PRC-2026-0012', 'COM-002', 'ISRI West',  920.00, '2026-05-17 12:00+00', 'RecyclingMarkets.net'],
      ['PRC-2026-0013', 'COM-005', 'ISRI Gulf',  115.00, '2026-05-17 12:00+00', 'OBM-FastMarkets'],
      ['PRC-2026-0014', 'COM-009', 'LME spot',  1480.00, '2026-05-17 12:00+00', 'LME'],
      ['PRC-2026-0015', 'COM-015', 'Export Asia',2380.00, '2026-05-17 12:00+00', 'Bloomberg-NEF'],
    ];
    for (const p of prices) {
      await client.query(
        `INSERT INTO prices (price_id,comm_id,market,value_usd_ton,ts,source) VALUES ($1,$2,$3,$4,$5,$6)`, p);
    }

    console.log('[seed] inserting customers...');
    const customers = [
      ['CUS-001', 'Indorama Ventures',          'USA', 'PET',          'CON-2026-001', 'active'],
      ['CUS-002', 'WestRock Container Mill',    'USA', 'OCC',          'CON-2026-002', 'active'],
      ['CUS-003', 'Envision Plastics',          'USA', 'HDPE-Natural', 'CON-2026-003', 'active'],
      ['CUS-004', 'Novelis Recycling',          'USA', 'Aluminum UBC', 'CON-2026-004', 'active'],
      ['CUS-005', 'Nucor Steel',                'USA', 'Steel Cans',   'CON-2026-005', 'active'],
      ['CUS-006', 'KW Plastics',                'USA', 'PP',           'CON-2026-006', 'active'],
      ['CUS-007', 'Pratt Industries',           'USA', 'Mixed Paper',  'CON-2026-007', 'active'],
      ['CUS-008', 'Pacific Rim Plastic Brokers','CHN', 'Mixed Plastic','CON-2026-008', 'suspended'],
      ['CUS-009', 'Ace Glass Recycling',        'USA', 'Glass — Clear','CON-2026-009', 'active'],
      ['CUS-010', 'GreenMantra Polymers',       'CAN', 'PP',           'CON-2026-010', 'active'],
      ['CUS-011', 'Sims Metal Management',      'USA', 'Steel Cans',   'CON-2026-011', 'active'],
      ['CUS-012', 'Verde Industries Asia',      'VNM', 'PET',          'CON-2026-012', 'pending'],
      ['CUS-013', 'EcoFiber Mill',              'USA', 'Newsprint',    'CON-2026-013', 'active'],
      ['CUS-014', 'Continental e-Materials',    'USA', 'eWaste boards','CON-2026-014', 'active'],
      ['CUS-015', 'Atlas Films & Resins',       'MEX', 'Film Plastic', 'CON-2026-015', 'active'],
    ];
    for (const c of customers) {
      await client.query(
        `INSERT INTO customers (customer_id,name,country,commodity,contract_id,status) VALUES ($1,$2,$3,$4,$5,$6)`, c);
    }

    console.log('[seed] inserting drivers...');
    const drivers = [
      ['DRV-001', 'Manuel Ortega',  'CDL-A-TX', 'MRF Yard A', '2026-05-17 14:00+00', 'available'],
      ['DRV-002', 'Tasha Williams', 'CDL-A-CA', 'MRF Yard A', '2026-05-17 12:30+00', 'on_route'],
      ['DRV-003', 'Hector Ramirez', 'CDL-A-TX', 'MRF Yard B', '2026-05-17 10:00+00', 'available'],
      ['DRV-004', 'Aimee Park',     'CDL-A-WA', 'MRF Yard A', '2026-05-17 09:00+00', 'available'],
      ['DRV-005', 'Devon Brooks',   'CDL-A-NY', 'MRF Yard B', '2026-05-17 11:00+00', 'on_route'],
      ['DRV-006', 'Liam OConnell',  'CDL-A-IL', 'MRF Yard A', '2026-05-16 19:00+00', 'off_duty'],
      ['DRV-007', 'Priya Shah',     'CDL-A-NJ', 'MRF Yard B', '2026-05-17 13:00+00', 'available'],
      ['DRV-008', 'Wendell Carter', 'CDL-A-GA', 'MRF Yard A', '2026-05-15 16:00+00', 'medical_hold'],
      ['DRV-009', 'Anika Patel',    'CDL-A-AZ', 'MRF Yard A', '2026-05-17 08:00+00', 'available'],
      ['DRV-010', 'Carlos Mendes',  'CDL-A-FL', 'MRF Yard B', '2026-05-17 12:00+00', 'on_route'],
      ['DRV-011', 'Faith Okonkwo',  'CDL-A-NV', 'MRF Yard A', '2026-05-17 07:30+00', 'available'],
      ['DRV-012', 'Yusuf Demir',    'CDL-A-MI', 'MRF Yard B', '2026-05-17 10:30+00', 'available'],
      ['DRV-013', 'Sandra Lee',     'CDL-A-OR', 'MRF Yard A', '2026-05-16 22:00+00', 'off_duty'],
      ['DRV-014', 'Marcus Hill',    'CDL-A-PA', 'MRF Yard A', '2026-05-17 11:30+00', 'on_route'],
      ['DRV-015', 'Theresa Nguyen', 'CDL-A-CA', 'MRF Yard B', '2026-05-17 09:30+00', 'available'],
    ];
    for (const d of drivers) {
      await client.query(
        `INSERT INTO drivers (driver_id,name,license,base,last_run,status) VALUES ($1,$2,$3,$4,$5,$6)`, d);
    }

    console.log('[seed] inserting vehicles...');
    const vehicles = [
      ['VEH-001', 'Roll-off truck',       'TX-9821', 'full',     'MRF Yard A',       'ready'],
      ['VEH-002', 'Front loader',         'TX-9822', 'half',     'On Route 14',      'in_service'],
      ['VEH-003', 'Rear loader',          'TX-9823', 'full',     'MRF Yard A',       'ready'],
      ['VEH-004', 'Walking-floor trailer','TX-9824', 'full',     'MRF Yard B',       'ready'],
      ['VEH-005', 'Container truck',      'TX-9825', 'low',      'Customer CUS-002', 'in_service'],
      ['VEH-006', 'Skid steer',           'YARD-01', 'full',     'Tipping Floor',    'ready'],
      ['VEH-007', 'Forklift (electric)',  'YARD-02', 'charging', 'Bale Storage',     'ready'],
      ['VEH-008', 'Roll-off truck',       'TX-9826', 'full',     'MRF Yard B',       'ready'],
      ['VEH-009', 'Front loader',         'TX-9827', 'half',     'On Route 7',       'in_service'],
      ['VEH-010', 'Yard tractor',         'YARD-03', 'full',     'MRF Yard A',       'ready'],
      ['VEH-011', 'Container truck',      'TX-9828', 'low',      'En route Yard A',  'in_service'],
      ['VEH-012', 'Forklift (LPG)',       'YARD-04', 'half',     'Bale Storage',     'ready'],
      ['VEH-013', 'Roll-off truck',       'TX-9829', 'empty',    'Repair Bay',       'maintenance'],
      ['VEH-014', 'Walking-floor trailer','TX-9830', 'full',     'Customer CUS-001', 'in_service'],
      ['VEH-015', 'Rear loader',          'TX-9831', 'half',     'On Route 3',       'in_service'],
    ];
    for (const v of vehicles) {
      await client.query(
        `INSERT INTO vehicles (vehicle_id,type,plate,fuel_status,location,status) VALUES ($1,$2,$3,$4,$5,$6)`, v);
    }

    console.log('[seed] inserting equipment...');
    const equipment = [
      ['EQ-001', 'Bollegraaf HBC-120 baler',      'LINE-01', 'Bollegraaf',          '2026-04-12', 'operational'],
      ['EQ-002', 'TOMRA AUTOSORT NIR',            'LINE-01', 'TOMRA',               '2026-04-20', 'operational'],
      ['EQ-003', 'Bulk Handling Star screen',     'LINE-02', 'Bulk Handling Sys.',  '2026-03-28', 'operational'],
      ['EQ-004', 'Pellenc Mistral+ optical sort', 'LINE-01', 'Pellenc ST',          '2026-05-02', 'operational'],
      ['EQ-005', 'CP MSS Eddy current separator', 'LINE-02', 'CP Group',            '2026-04-05', 'operational'],
      ['EQ-006', 'Lubo OCC screen',               'LINE-02', 'Bulk Handling Sys.',  '2026-04-18', 'operational'],
      ['EQ-007', 'Krause baler (backup)',         'LINE-03', 'Krause Mfg.',         '2026-03-10', 'standby'],
      ['EQ-008', 'Steinert magnet ferrous A',     'LINE-01', 'Steinert',            '2026-04-25', 'operational'],
      ['EQ-009', 'Steinert magnet ferrous B',     'LINE-02', 'Steinert',            '2026-04-25', 'operational'],
      ['EQ-010', 'Van Dyk pre-sort cabin HVAC',   'LINE-01', 'Van Dyk Recycling',   '2026-04-30', 'maintenance'],
      ['EQ-011', 'Machinex SamurAI robot sorter', 'LINE-03', 'Machinex',            '2026-05-05', 'operational'],
      ['EQ-012', 'AMP Robotics Cortex AI',        'LINE-03', 'AMP Robotics',        '2026-05-08', 'operational'],
      ['EQ-013', 'Conveyor #14 belt',             'LINE-02', 'In-house fab',        '2026-02-22', 'fault'],
      ['EQ-014', 'Glass breaker screen',          'LINE-02', 'Bulk Handling Sys.',  '2026-04-02', 'operational'],
      ['EQ-015', 'IFE finger screen',             'LINE-01', 'IFE Aufbereitungs',   '2026-03-15', 'operational'],
    ];
    for (const e of equipment) {
      await client.query(
        `INSERT INTO equipment (eq_id,name,line_id,vendor,last_service,status) VALUES ($1,$2,$3,$4,$5,$6)`, e);
    }

    console.log('[seed] inserting sortation_lines...');
    const lines = [
      ['LINE-01', 'Container Line (PET/HDPE/PP/Metal)', 18.0, 'running',     '2026-05-17 14:00+00', 'Tasha Williams'],
      ['LINE-02', 'Fiber Line (OCC/MP/News)',           24.0, 'running',     '2026-05-17 14:00+00', 'Devon Brooks'],
      ['LINE-03', 'Residual / AI Pick Line',            8.0,  'running',     '2026-05-17 14:00+00', 'Anika Patel'],
      ['LINE-04', 'Glass Cleaning Line',                6.0,  'maintenance', '2026-05-17 11:00+00', '—'],
      ['LINE-05', 'eWaste / CRT Cell',                  3.0,  'idle',        '2026-05-16 16:00+00', 'Yusuf Demir'],
      ['LINE-06', 'Film / Plastic Bag Cell',            2.5,  'running',     '2026-05-17 13:00+00', 'Faith Okonkwo'],
      ['LINE-07', 'Pre-sort Picking Cabin A',           14.0, 'running',     '2026-05-17 14:00+00', 'Manuel Ortega'],
      ['LINE-08', 'Pre-sort Picking Cabin B',           14.0, 'running',     '2026-05-17 14:00+00', 'Aimee Park'],
      ['LINE-09', 'Bulky / Overs Handling',             4.0,  'idle',        '2026-05-17 09:00+00', '—'],
      ['LINE-10', 'Aluminum UBC densifier cell',        2.0,  'running',     '2026-05-17 14:00+00', 'Hector Ramirez'],
      ['LINE-11', 'Mixed Plastic Re-sort',              3.5,  'idle',        '2026-05-16 18:00+00', '—'],
      ['LINE-12', 'Tipping Floor staging',              0.0,  'running',     '2026-05-17 14:00+00', 'Priya Shah'],
      ['LINE-13', 'Compactor / Residual to landfill',   5.0,  'running',     '2026-05-17 14:00+00', 'Marcus Hill'],
      ['LINE-14', 'Recovery audit station',             0.5,  'running',     '2026-05-17 14:00+00', 'Theresa Nguyen'],
      ['LINE-15', 'CDL truck wash bay',                 0.0,  'idle',        '2026-05-17 06:00+00', '—'],
    ];
    for (const l of lines) {
      await client.query(
        `INSERT INTO sortation_lines (line_id,name,throughput_tph,status,last_event,operator) VALUES ($1,$2,$3,$4,$5,$6)`, l);
    }

    console.log('[seed] inserting downtime_events...');
    const downtime = [
      ['DWN-2026-0001', 'LINE-01', 'NIR optical sort calibration drift',      '2026-05-15 09:30+00', '2026-05-15 10:15+00', 'closed'],
      ['DWN-2026-0002', 'LINE-02', 'Conveyor #14 belt slippage',              '2026-05-15 13:00+00', '2026-05-15 14:20+00', 'closed'],
      ['DWN-2026-0003', 'LINE-01', 'Baler wire feed jam',                     '2026-05-16 08:45+00', '2026-05-16 09:10+00', 'closed'],
      ['DWN-2026-0004', 'LINE-04', 'Glass crusher rotor wear (planned PM)',   '2026-05-16 14:00+00', null,                   'open'],
      ['DWN-2026-0005', 'LINE-02', 'Conveyor #14 belt full replacement',      '2026-05-17 06:00+00', null,                   'open'],
      ['DWN-2026-0006', 'LINE-03', 'AMP Cortex network outage',               '2026-05-15 16:00+00', '2026-05-15 16:25+00', 'closed'],
      ['DWN-2026-0007', 'LINE-05', 'No eWaste feedstock — idle',              '2026-05-16 16:00+00', null,                   'open'],
      ['DWN-2026-0008', 'LINE-01', 'Tagger arm pneumatic line leak',          '2026-05-16 11:00+00', '2026-05-16 12:00+00', 'closed'],
      ['DWN-2026-0009', 'LINE-02', 'OCC screen overload — bulk surge',        '2026-05-15 10:30+00', '2026-05-15 10:50+00', 'closed'],
      ['DWN-2026-0010', 'LINE-01', 'Cabin HVAC fault — operator pulled off',  '2026-05-17 07:45+00', '2026-05-17 09:00+00', 'closed'],
      ['DWN-2026-0011', 'LINE-09', 'Bulky overflow — yard tractor unavail.',  '2026-05-17 09:00+00', null,                   'open'],
      ['DWN-2026-0012', 'LINE-11', 'No mixed plastic feedstock — paused',     '2026-05-16 18:00+00', null,                   'open'],
      ['DWN-2026-0013', 'LINE-13', 'Compactor seal leak',                     '2026-05-15 21:00+00', '2026-05-15 22:00+00', 'closed'],
      ['DWN-2026-0014', 'LINE-02', 'Lubo OCC screen bearing replacement',     '2026-05-14 06:00+00', '2026-05-14 11:30+00', 'closed'],
      ['DWN-2026-0015', 'LINE-01', 'Ferrous magnet drum re-tension',          '2026-05-17 13:00+00', '2026-05-17 13:40+00', 'closed'],
    ];
    for (const d of downtime) {
      await client.query(
        `INSERT INTO downtime_events (event_id,line_id,reason,started_at,ended_at,status) VALUES ($1,$2,$3,$4,$5,$6)`, d);
    }

    console.log('[seed] inserting operators...');
    const operators = [
      ['OP-001', 'Tasha Williams',     'day',     'LINE-01', 'active',  'tasha.w@mrf.io'],
      ['OP-002', 'Devon Brooks',       'day',     'LINE-02', 'active',  'devon.b@mrf.io'],
      ['OP-003', 'Anika Patel',        'day',     'LINE-03', 'active',  'anika.p@mrf.io'],
      ['OP-004', 'Manuel Ortega',      'day',     'LINE-07', 'active',  'manuel.o@mrf.io'],
      ['OP-005', 'Aimee Park',         'day',     'LINE-08', 'active',  'aimee.p@mrf.io'],
      ['OP-006', 'Hector Ramirez',     'day',     'LINE-10', 'active',  'hector.r@mrf.io'],
      ['OP-007', 'Priya Shah',         'day',     'LINE-12', 'active',  'priya.s@mrf.io'],
      ['OP-008', 'Marcus Hill',        'day',     'LINE-13', 'active',  'marcus.h@mrf.io'],
      ['OP-009', 'Theresa Nguyen',     'day',     'LINE-14', 'active',  'theresa.n@mrf.io'],
      ['OP-010', 'Faith Okonkwo',      'day',     'LINE-06', 'active',  'faith.o@mrf.io'],
      ['OP-011', 'Yusuf Demir',        'day',     'LINE-05', 'on_break','yusuf.d@mrf.io'],
      ['OP-012', 'Liam OConnell',      'night',   'LINE-01', 'active',  'liam.oc@mrf.io'],
      ['OP-013', 'Sandra Lee',         'night',   'LINE-02', 'active',  'sandra.l@mrf.io'],
      ['OP-014', 'Wendell Carter',     'night',   'LINE-07', 'medical', 'wendell.c@mrf.io'],
      ['OP-015', 'Carlos Mendes',      'swing',   'LINE-08', 'active',  'carlos.m@mrf.io'],
    ];
    for (const o of operators) {
      await client.query(
        `INSERT INTO operators (op_id,name,shift,line_id,status,contact) VALUES ($1,$2,$3,$4,$5,$6)`, o);
    }

    console.log('[seed] inserting safety_incidents...');
    const safety = [
      ['INC-2026-0001', 'LINE-01 cabin',     'pinch_point',         'low',      '2026-05-15 09:00+00', 'closed'],
      ['INC-2026-0002', 'Bale storage',      'slip_trip_fall',      'medium',   '2026-05-15 13:30+00', 'closed'],
      ['INC-2026-0003', 'Tipping floor',     'lithium_battery_fire','high',     '2026-05-15 11:30+00', 'closed'],
      ['INC-2026-0004', 'LINE-02',           'hand_laceration',     'medium',   '2026-05-16 10:00+00', 'open'],
      ['INC-2026-0005', 'Yard A',            'vehicle_near_miss',   'low',      '2026-05-16 14:00+00', 'closed'],
      ['INC-2026-0006', 'LINE-03 robot pen', 'lockout_breach',      'high',     '2026-05-17 08:00+00', 'open'],
      ['INC-2026-0007', 'Tipping floor',     'aerosol_explosion',   'high',     '2026-05-15 09:45+00', 'closed'],
      ['INC-2026-0008', 'Yard B',            'forklift_tipover',    'medium',   '2026-05-15 17:00+00', 'closed'],
      ['INC-2026-0009', 'Maintenance bay',   'arc_flash',           'critical', '2026-05-14 11:00+00', 'closed'],
      ['INC-2026-0010', 'LINE-04',           'glass_cut',           'low',      '2026-05-16 12:00+00', 'closed'],
      ['INC-2026-0011', 'Office',            'ergonomic_strain',    'low',      '2026-05-15 15:00+00', 'closed'],
      ['INC-2026-0012', 'LINE-01',           'noise_exposure',      'low',      '2026-05-16 09:00+00', 'closed'],
      ['INC-2026-0013', 'Tipping floor',     'propane_tank_find',   'critical', '2026-05-17 08:50+00', 'open'],
      ['INC-2026-0014', 'Bale storage',      'stack_collapse',      'high',     '2026-05-13 16:00+00', 'closed'],
      ['INC-2026-0015', 'Truck wash bay',    'chemical_splash',     'medium',   '2026-05-15 07:00+00', 'closed'],
    ];
    for (const s of safety) {
      await client.query(
        `INSERT INTO safety_incidents (incident_id,location,type,severity,opened_at,status) VALUES ($1,$2,$3,$4,$5,$6)`, s);
    }

    console.log('[seed] inserting training_records...');
    const training = [
      ['TR-2026-0001', 'OP-001', 'Lockout/Tagout refresh',       '2026-04-10', 96.0, 'complete'],
      ['TR-2026-0002', 'OP-002', 'Confined-space entry',         '2026-04-12', 88.0, 'complete'],
      ['TR-2026-0003', 'OP-003', 'AMP robot interaction safety', '2026-05-02', 94.5, 'complete'],
      ['TR-2026-0004', 'OP-004', 'Forklift recert',              '2026-03-20', 92.0, 'complete'],
      ['TR-2026-0005', 'OP-005', 'Hazardous materials (Li-ion)', '2026-04-15', 90.0, 'complete'],
      ['TR-2026-0006', 'OP-006', 'Eddy-current safe distance',   '2026-04-02', 85.0, 'complete'],
      ['TR-2026-0007', 'OP-007', 'Tipping floor traffic plan',   '2026-04-08', 91.0, 'complete'],
      ['TR-2026-0008', 'OP-008', 'Compactor emergency stop',     '2026-03-29', 87.5, 'complete'],
      ['TR-2026-0009', 'OP-009', 'Bale audit / weighbridge',     '2026-04-22', 95.0, 'complete'],
      ['TR-2026-0010', 'OP-010', 'Film cell pinch hazards',      '2026-04-30', 84.0, 'complete'],
      ['TR-2026-0011', 'OP-011', 'eWaste CRT safe handling',     '2026-04-05', 89.0, 'complete'],
      ['TR-2026-0012', 'OP-012', 'Night-shift lighting & PPE',   '2026-03-25', 78.0, 'recheck_required'],
      ['TR-2026-0013', 'OP-013', 'Fiber line dust control',      '2026-04-18', 93.0, 'complete'],
      ['TR-2026-0014', 'OP-014', 'Return-to-duty medical clear', '2026-05-10', null, 'in_progress'],
      ['TR-2026-0015', 'OP-015', 'Swing-shift handoff protocol', '2026-04-28', 91.5, 'complete'],
    ];
    for (const t of training) {
      await client.query(
        `INSERT INTO training_records (record_id,op_id,topic,completed_at,score,status) VALUES ($1,$2,$3,$4,$5,$6)`, t);
    }

    console.log('[seed] inserting vendors...');
    const vendors = [
      ['VEN-001', 'Bollegraaf',           'Balers / OEM service',          'NLD', 4.6, 'approved'],
      ['VEN-002', 'TOMRA',                'Optical sorters / NIR',         'NOR', 4.8, 'approved'],
      ['VEN-003', 'AMP Robotics',         'AI vision robotics',            'USA', 4.5, 'approved'],
      ['VEN-004', 'Machinex',             'Sortation lines / robots',      'CAN', 4.4, 'approved'],
      ['VEN-005', 'Steinert',             'Magnetic separation',           'DEU', 4.6, 'approved'],
      ['VEN-006', 'Bulk Handling Sys.',   'Screens / conveyors',           'USA', 4.3, 'approved'],
      ['VEN-007', 'Pellenc ST',           'Optical sorters',               'FRA', 4.4, 'approved'],
      ['VEN-008', 'CP Group',             'Pre-sort / eddy current',       'USA', 4.2, 'approved'],
      ['VEN-009', 'Van Dyk Recycling',    'Engineering / installation',    'USA', 4.5, 'approved'],
      ['VEN-010', 'IFE Aufbereitungs',    'Finger screens',                'AUT', 4.3, 'approved'],
      ['VEN-011', 'Krause Mfg.',          'Baler service',                 'USA', 4.0, 'approved'],
      ['VEN-012', 'Republic Services',    'Hauler partner',                'USA', 4.1, 'approved'],
      ['VEN-013', 'Waste Management',     'Hauler partner',                'USA', 4.0, 'approved'],
      ['VEN-014', 'GFL Environmental',    'Hauler partner',                'CAN', 4.2, 'approved'],
      ['VEN-015', 'EcoBroker Asia Ltd',   'Export broker (mixed plastic)', 'SGP', 3.4, 'under_review'],
    ];
    for (const v of vendors) {
      await client.query(
        `INSERT INTO vendors (vendor_id,name,service,country,rating,status) VALUES ($1,$2,$3,$4,$5,$6)`, v);
    }

    console.log('[seed] inserting contracts...');
    const contracts = [
      ['CON-2026-001', 'CUS-001', 'PET',           24, 'active',    8400000],
      ['CON-2026-002', 'CUS-002', 'OCC',           36, 'active',    5200000],
      ['CON-2026-003', 'CUS-003', 'HDPE-Natural',  18, 'active',    6900000],
      ['CON-2026-004', 'CUS-004', 'Aluminum UBC',  24, 'active',   11200000],
      ['CON-2026-005', 'CUS-005', 'Steel Cans',    18, 'active',    2800000],
      ['CON-2026-006', 'CUS-006', 'PP',            12, 'active',    1900000],
      ['CON-2026-007', 'CUS-007', 'Mixed Paper',   24, 'active',    1450000],
      ['CON-2026-008', 'CUS-008', 'Mixed Plastic', 12, 'suspended',  640000],
      ['CON-2026-009', 'CUS-009', 'Glass — Clear', 12, 'active',     310000],
      ['CON-2026-010', 'CUS-010', 'PP',            12, 'active',     980000],
      ['CON-2026-011', 'CUS-011', 'Steel Cans',    18, 'active',    2100000],
      ['CON-2026-012', 'CUS-012', 'PET',            6, 'pending',   3200000],
      ['CON-2026-013', 'CUS-013', 'Newsprint',     12, 'active',     720000],
      ['CON-2026-014', 'CUS-014', 'eWaste boards', 24, 'active',    4800000],
      ['CON-2026-015', 'CUS-015', 'Film Plastic',  12, 'active',     410000],
    ];
    for (const c of contracts) {
      await client.query(
        `INSERT INTO contracts (contract_id,customer_id,commodity,term_months,status,value_usd) VALUES ($1,$2,$3,$4,$5,$6)`, c);
    }

    console.log('[seed] inserting audit_log...');
    const audit = [
      ['AUD-2026-0001', 'admin@mrf.io', 'bales/BAL-2026-0001',                'create',          'success', '2026-05-15 08:01+00'],
      ['AUD-2026-0002', 'ops@mrf.io',   'loads_in/LIN-2026-0005',             'reject',          'success', '2026-05-15 11:11+00'],
      ['AUD-2026-0003', 'ops@mrf.io',   'contamination_logs/CTL-2026-0002',   'create',          'success', '2026-05-15 11:12+00'],
      ['AUD-2026-0004', 'admin@mrf.io', 'commodities/COM-001',                'update_price',    'success', '2026-05-15 12:00+00'],
      ['AUD-2026-0005', 'ops@mrf.io',   'loads_out/LOU-2026-0001',            'dispatch',        'success', '2026-05-15 15:30+00'],
      ['AUD-2026-0006', 'ops@mrf.io',   'downtime_events/DWN-2026-0001',      'close',           'success', '2026-05-15 10:16+00'],
      ['AUD-2026-0007', 'admin@mrf.io', 'users/viewer@mrf.io',                'create',          'success', '2026-05-14 18:00+00'],
      ['AUD-2026-0008', 'ops@mrf.io',   'safety_incidents/INC-2026-0003',     'create',          'success', '2026-05-15 11:31+00'],
      ['AUD-2026-0009', 'ops@mrf.io',   'contracts/CON-2026-008',             'suspend',         'success', '2026-05-16 09:00+00'],
      ['AUD-2026-0010', 'admin@mrf.io', 'vendors/VEN-015',                    'set_under_review','success', '2026-05-16 09:30+00'],
      ['AUD-2026-0011', 'ops@mrf.io',   'bales/BAL-2026-0010',                'reject',          'success', '2026-05-16 16:30+00'],
      ['AUD-2026-0012', 'admin@mrf.io', 'webhooks/MRF Ops',                   'create',          'success', '2026-05-13 12:00+00'],
      ['AUD-2026-0013', 'ops@mrf.io',   'loads_in/LIN-2026-0012',             'flag',            'success', '2026-05-17 07:16+00'],
      ['AUD-2026-0014', 'ops@mrf.io',   'safety_incidents/INC-2026-0013',     'create',          'success', '2026-05-17 08:51+00'],
      ['AUD-2026-0015', 'admin@mrf.io', 'commodities/COM-009',                'update_price',    'success', '2026-05-17 12:00+00'],
    ];
    for (const a of audit) {
      await client.query(
        `INSERT INTO audit_log (entry_id,actor,target,action,result,ts) VALUES ($1,$2,$3,$4,$5,$6)`, a);
    }

    // ─────────────────────────────────────────────
    // Notifications (sample seed)
    // ─────────────────────────────────────────────
    console.log('[seed] inserting notifications...');
    const notifications = [
      [1, 'Critical contamination — lithium battery', 'LIN-2026-0005 from Independent Hauler #7 rejected; lithium battery detected.', 'critical', 'contamination_logs'],
      [1, 'Downtime open: LINE-02',                   'Conveyor #14 belt full replacement in progress.',                              'high',     'downtime_events'],
      [1, 'Mixed plastic price drop',                 'COM-011 marker fell to $35/ton; review export contract CUS-008.',              'medium',   'prices'],
      [2, 'Safety incident open',                     'INC-2026-0006 lockout breach on LINE-03 robot pen.',                           'high',     'safety_incidents'],
      [2, 'Propane tank found on tipping floor',      'INC-2026-0013 critical hazard; fire watch posted.',                            'critical', 'safety_incidents'],
    ];
    for (const n of notifications) {
      await client.query(
        `INSERT INTO notifications (user_id,title,body,severity,source) VALUES ($1,$2,$3,$4,$5)`, n);
    }

    // ─────────────────────────────────────────────
    // Webhooks (sample seed)
    // ─────────────────────────────────────────────
    console.log('[seed] inserting webhooks...');
    const webhooks = [
      ['MRF Ops Notifier', 'https://httpbin.org/post', 'sec_mrf_ops_2026',  'load.flagged,contamination.critical,safety.opened', true],
      ['Customer Quality', 'https://httpbin.org/post', 'sec_mrf_cust_2026', 'bale.shipped,bale.rejected',                        true],
    ];
    for (const w of webhooks) {
      await client.query(
        `INSERT INTO webhooks (name,url,secret,events,active) VALUES ($1,$2,$3,$4,$5)`, w);
    }

    console.log('[seed] complete.');
  } catch (e) {
    console.error('[seed] error:', e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
