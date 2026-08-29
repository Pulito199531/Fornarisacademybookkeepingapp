const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';
const COOKIE_NAME = 'ledgerline_session';

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
}

// Reads the session cookie (if any) and attaches req.user. Does not block the request.
function attachUser(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(payload.id);
      if (user) req.user = user;
    } catch (e) { /* invalid/expired token — treat as logged out */ }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not signed in' });
  next();
}

function membershipFor(userId, businessId) {
  return db.prepare('SELECT * FROM business_members WHERE user_id = ? AND business_id = ?').get(userId, businessId);
}

// Blocks access to a business a user isn't a member of. Looks for business_id in
// query or body first; for id-based routes (e.g. /invoices/:id) pass a resolver.
function requireBusinessAccess(resolveBusinessId) {
  return (req, res, next) => {
    const businessId = resolveBusinessId ? resolveBusinessId(req) : (req.query.business_id || req.body.business_id);
    if (!businessId) return res.status(400).json({ error: 'business_id required' });
    const membership = membershipFor(req.user.id, businessId);
    if (!membership) return res.status(403).json({ error: 'You do not have access to this business' });
    req.membership = membership;
    next();
  };
}

// Blocks write access for 'client' role members (view-only).
function requireWriteAccess(req, res, next) {
  if (req.membership && req.membership.role === 'client') {
    return res.status(403).json({ error: 'Client accounts have view-only access' });
  }
  next();
}

module.exports = {
  bcrypt, signToken, attachUser, requireAuth, requireBusinessAccess, requireWriteAccess,
  membershipFor, COOKIE_NAME,
};
