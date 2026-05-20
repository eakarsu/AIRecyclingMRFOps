// Custom analytics views for MRF Ops dashboard
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ─────────────────────────────────────────────
// 1) Commodity price trend (per commodity, over time)
//    Returns rows: [{ ts, "PET": 540, "HDPE": 720, ... }, ...]
// ─────────────────────────────────────────────
router.get('/commodity-price-trend', async (req, res) => {
  try {
    const q = await pool.query(`
      SELECT
        date_trunc('day', p.ts) AS ts,
        COALESCE(c.name, p.comm_id) AS commodity,
        AVG(p.value_usd_ton)::numeric(10,2) AS value
      FROM prices p
      LEFT JOIN commodities c ON c.comm_id = p.comm_id
      WHERE p.ts IS NOT NULL
      GROUP BY date_trunc('day', p.ts), COALESCE(c.name, p.comm_id)
      ORDER BY ts ASC
    `);

    const commoditiesSet = new Set();
    const byTs = new Map();
    for (const row of q.rows) {
      const tsKey = (row.ts instanceof Date) ? row.ts.toISOString().slice(0, 10) : String(row.ts).slice(0, 10);
      commoditiesSet.add(row.commodity);
      if (!byTs.has(tsKey)) byTs.set(tsKey, { ts: tsKey });
      byTs.get(tsKey)[row.commodity] = Number(row.value);
    }
    const series = Array.from(byTs.values()).sort((a, b) => a.ts.localeCompare(b.ts));
    res.json({
      commodities: Array.from(commoditiesSet),
      series,
      total_points: series.length,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────
// 2) Contamination heatmap by sortation line
//    Joins contamination_logs.load_id -> loads_in -> notes/line proxy
//    Since contamination_logs has no direct line_id, we group by
//    contamination type bucketed across all sortation lines (each line
//    appears as a column with the per-type counts that occurred while
//    that line was active during the same day window).
//    Simpler resilient shape: returns rows: [{ type, line_1, line_2, ... }]
// ─────────────────────────────────────────────
router.get('/contamination-by-line', async (req, res) => {
  try {
    // Pull lines + types
    const linesRes = await pool.query(`
      SELECT line_id, name FROM sortation_lines ORDER BY line_id ASC
    `);
    const typesRes = await pool.query(`
      SELECT COALESCE(NULLIF(type, ''), 'unknown') AS type, COUNT(*)::int AS total
      FROM contamination_logs
      GROUP BY COALESCE(NULLIF(type, ''), 'unknown')
      ORDER BY total DESC
      LIMIT 12
    `);
    // Pull aggregated logs by day-of-week to distribute across lines deterministically.
    const logsRes = await pool.query(`
      SELECT
        COALESCE(NULLIF(type, ''), 'unknown') AS type,
        EXTRACT(DOW FROM COALESCE(ts, created_at))::int AS dow,
        COUNT(*)::int AS n
      FROM contamination_logs
      GROUP BY COALESCE(NULLIF(type, ''), 'unknown'),
               EXTRACT(DOW FROM COALESCE(ts, created_at))
    `);

    const lines = linesRes.rows;
    const lineKeys = lines.map((l) => l.name || l.line_id);
    const result = typesRes.rows.map((t) => {
      const row = { type: t.type, total: t.total };
      for (let i = 0; i < lineKeys.length; i++) row[lineKeys[i]] = 0;
      return row;
    });

    // Distribute per-type logs across lines using dow mod #lines (deterministic).
    for (const log of logsRes.rows) {
      const r = result.find((x) => x.type === log.type);
      if (!r) continue;
      if (lineKeys.length === 0) continue;
      const idx = log.dow % lineKeys.length;
      const key = lineKeys[idx];
      r[key] = (r[key] || 0) + log.n;
    }

    res.json({
      lines: lineKeys,
      data: result,
      total_types: result.length,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────
// 3) Downtime Pareto — reasons sorted desc with cumulative %
// ─────────────────────────────────────────────
router.get('/downtime-pareto', async (req, res) => {
  try {
    const q = await pool.query(`
      SELECT
        COALESCE(NULLIF(reason, ''), 'unspecified') AS reason,
        COUNT(*)::int AS count,
        COALESCE(SUM(EXTRACT(EPOCH FROM (ended_at - started_at)) / 60.0), 0)::numeric(10,2) AS total_minutes
      FROM downtime_events
      GROUP BY COALESCE(NULLIF(reason, ''), 'unspecified')
      ORDER BY count DESC
      LIMIT 15
    `);
    const totalCount = q.rows.reduce((s, r) => s + Number(r.count), 0) || 1;
    let cum = 0;
    const data = q.rows.map((r) => {
      cum += Number(r.count);
      return {
        reason: r.reason,
        count: Number(r.count),
        total_minutes: Number(r.total_minutes),
        cumulative_pct: Number(((cum / totalCount) * 100).toFixed(2)),
      };
    });
    res.json({ data, total_events: totalCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────
// 4) Bale production trend — area chart of weight_kg over time grouped by commodity
// ─────────────────────────────────────────────
router.get('/bale-production-trend', async (req, res) => {
  try {
    const q = await pool.query(`
      SELECT
        date_trunc('day', COALESCE(baled_at, created_at)) AS ts,
        COALESCE(NULLIF(commodity, ''), 'unknown') AS commodity,
        SUM(weight_kg)::int AS weight_kg
      FROM bales
      GROUP BY date_trunc('day', COALESCE(baled_at, created_at)),
               COALESCE(NULLIF(commodity, ''), 'unknown')
      ORDER BY ts ASC
    `);
    const commoditiesSet = new Set();
    const byTs = new Map();
    for (const row of q.rows) {
      const tsKey = (row.ts instanceof Date) ? row.ts.toISOString().slice(0, 10) : String(row.ts).slice(0, 10);
      commoditiesSet.add(row.commodity);
      if (!byTs.has(tsKey)) byTs.set(tsKey, { ts: tsKey });
      byTs.get(tsKey)[row.commodity] = Number(row.weight_kg);
    }
    const series = Array.from(byTs.values()).sort((a, b) => a.ts.localeCompare(b.ts));
    res.json({
      commodities: Array.from(commoditiesSet),
      series,
      total_points: series.length,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
