const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const JWT_SECRET = process.env.JWT_SECRET;

// Role mapping for the MRF domain → reuses the underlying RBAC tiers:
//   admin  → commander (full write + user mgmt)
//   ops    → analyst   (write)
//   viewer → viewer    (read-only)

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    if ((JWT_SECRET || '').length < 32) return res.status(503).json({ error: 'Secure authentication is not configured' });
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (!decoded.tenantId || !decoded.role) throw new Error('missing authorization context');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Role hierarchy: commander > analyst > viewer
// commander: full write access
// analyst:   write access (no user mgmt)
// viewer:    read-only
const ROLES = ['viewer', 'analyst', 'commander'];

function requireRole(...allowed) {
  return (req, res, next) => {
    const role = req.user?.role || 'viewer';
    if (!allowed.includes(role)) {
      return res.status(403).json({
        error: `Forbidden: requires one of [${allowed.join(', ')}], got '${role}'`,
      });
    }
    next();
  };
}

// Convenience: any non-viewer write (admin/ops or legacy commander/analyst)
const requireWriter = requireRole('commander', 'analyst', 'admin', 'ops');
// Convenience: admin-only (commander legacy alias)
const requireCommander = requireRole('commander', 'admin');

// Mounts auto-guards onto a CRUD router so GET stays open to all authenticated
// users while POST/PUT/DELETE require writer role. Use INSTEAD of writing
// per-route guards inside each routes/<name>.js file.
function withCrudRbac(router) {
  router.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return requireWriter(req, res, next);
    }
    return next();
  });
  return router;
}

module.exports = {
  authenticateToken,
  JWT_SECRET,
  ROLES,
  requireRole,
  requireWriter,
  requireCommander,
  withCrudRbac,
};
