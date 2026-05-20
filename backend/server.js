const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { authenticateToken } = require('./middleware/auth');
const pool = require('./config/database');
const { fireWebhook } = require('./services/webhooks');

// Convenience: notify when a critical contamination log is created
async function onContaminationCreated(row) {
  const sev = String(row.severity || '').toLowerCase();
  if (['critical', 'high'].includes(sev)) {
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, title, body, severity, source)
         VALUES (NULL, $1, $2, $3, $4)`,
        [`Contamination — ${row.type || 'event'}`,
         `Load ${row.load_id || '?'} — ${row.notes || ''}`.slice(0, 1000),
         sev,
         'contamination_logs']
      );
    } catch (e) { console.warn('[notify] contamination insert failed:', e.message); }
    fireWebhook(`contamination.${sev}`, { row }).catch(() => {});
  }
}

const app = express();
const PORT = process.env.BACKEND_PORT || 3083;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3082,http://localhost:3083,http://localhost:3000')
  .split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health check (public)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth (public)
app.use('/api/auth', require('./routes/auth'));

// Everything below this line requires a Bearer token.
app.use('/api', authenticateToken);

// ─────────────────────────────────────────────
// 18 CRUD entities (all via _crudFactory, mounted directly)
// ─────────────────────────────────────────────
app.use('/api/bales',              require('./routes/bales'));
app.use('/api/loads-in',           require('./routes/loadsIn'));
app.use('/api/loads-out',          require('./routes/loadsOut'));
app.use('/api/contamination-logs', require('./routes/contaminationLogs'));
app.use('/api/commodities',        require('./routes/commodities'));
app.use('/api/prices',             require('./routes/prices'));
app.use('/api/customers',          require('./routes/customers'));
app.use('/api/drivers',            require('./routes/drivers'));
app.use('/api/vehicles',           require('./routes/vehicles'));
app.use('/api/equipment',          require('./routes/equipment'));
app.use('/api/sortation-lines',    require('./routes/sortationLines'));
app.use('/api/downtime-events',    require('./routes/downtimeEvents'));
app.use('/api/operators',          require('./routes/operators'));
app.use('/api/safety-incidents',   require('./routes/safetyIncidents'));
app.use('/api/training-records',   require('./routes/trainingRecords'));
app.use('/api/vendors',            require('./routes/vendors'));
app.use('/api/contracts',          require('./routes/contracts'));
app.use('/api/audit-log',          require('./routes/auditLog'));

// AI routes (16 sub-endpoints + history under /api/ai)
app.use('/api/ai', require('./routes/ai'));

// Cross-cutting
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/attachments',   require('./routes/attachments'));
app.use('/api/webhooks',      require('./routes/webhooks'));

// Dashboard stats
app.use('/api/dashboard', require('./routes/dashboard'));

// Custom analytics views
app.use('/api/custom-views', require('./routes/customViews'));

app.listen(PORT, () => {
  console.log(`\nAI Recycling MRF Ops API running on http://localhost:${PORT}\n`);
});
