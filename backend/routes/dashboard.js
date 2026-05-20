const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const [
      bales, loadsIn, loadsOut, contam, commodities, prices, customers, drivers, vehicles,
      equipment, lines, downtime, operators, safety, training, vendors, contracts, audit,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='staged') AS staged, COUNT(*) FILTER (WHERE status='shipped') AS shipped, COUNT(*) FILTER (WHERE status='rejected') AS rejected, COALESCE(SUM(weight_kg),0) AS total_kg FROM bales"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='accepted') AS accepted, COUNT(*) FILTER (WHERE status='flagged') AS flagged, COUNT(*) FILTER (WHERE status='rejected') AS rejected, COALESCE(SUM(weight_tons),0)::numeric(10,2) AS total_tons, COALESCE(AVG(contamination_pct),0)::numeric(8,2) AS avg_contam FROM loads_in"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='scheduled') AS scheduled, COUNT(*) FILTER (WHERE status='in_transit') AS in_transit, COUNT(*) FILTER (WHERE status='delivered') AS delivered FROM loads_out"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE severity='critical') AS critical, COUNT(*) FILTER (WHERE severity='high') AS high FROM contamination_logs"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='tracked') AS tracked, COUNT(*) FILTER (WHERE status='low_demand') AS low_demand FROM commodities"),
      pool.query("SELECT COUNT(*) AS total FROM prices"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active, COUNT(*) FILTER (WHERE status='suspended') AS suspended FROM customers"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='available') AS available, COUNT(*) FILTER (WHERE status='on_route') AS on_route FROM drivers"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='ready') AS ready, COUNT(*) FILTER (WHERE status='in_service') AS in_service, COUNT(*) FILTER (WHERE status='maintenance') AS maintenance FROM vehicles"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='operational') AS operational, COUNT(*) FILTER (WHERE status='fault') AS fault, COUNT(*) FILTER (WHERE status='maintenance') AS maintenance FROM equipment"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='running') AS running, COUNT(*) FILTER (WHERE status='idle') AS idle, COUNT(*) FILTER (WHERE status='maintenance') AS maintenance FROM sortation_lines"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='open') AS open FROM downtime_events"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active FROM operators"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='open') AS open, COUNT(*) FILTER (WHERE severity='critical') AS critical FROM safety_incidents"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='complete') AS complete, COUNT(*) FILTER (WHERE status='recheck_required') AS recheck FROM training_records"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='approved') AS approved, COUNT(*) FILTER (WHERE status='under_review') AS under_review FROM vendors"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active, COUNT(*) FILTER (WHERE status='pending') AS pending FROM contracts"),
      pool.query("SELECT COUNT(*) AS total FROM audit_log"),
    ]);
    res.json({
      bales: bales.rows[0],
      loads_in: loadsIn.rows[0],
      loads_out: loadsOut.rows[0],
      contamination_logs: contam.rows[0],
      commodities: commodities.rows[0],
      prices: prices.rows[0],
      customers: customers.rows[0],
      drivers: drivers.rows[0],
      vehicles: vehicles.rows[0],
      equipment: equipment.rows[0],
      sortation_lines: lines.rows[0],
      downtime_events: downtime.rows[0],
      operators: operators.rows[0],
      safety_incidents: safety.rows[0],
      training_records: training.rows[0],
      vendors: vendors.rows[0],
      contracts: contracts.rows[0],
      audit_log: audit.rows[0],
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
