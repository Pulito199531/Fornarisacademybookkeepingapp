require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { v4: uuid } = require('uuid');
const multer = require('multer');
const db = require('./db');
const { getDefaultAccounts, getAllStandardAccounts, ENTITY_TYPE_LABELS } = require('./defaultAccounts');
const { parseStatementText, parseStatementCsv, parseStatementPdf } = require('./parseStatement');
const { categorizeTransactions } = require('./categorize');
const { calculateEstimate, quarterlyDueDates } = require('./taxEstimate');
const plaid = require('./plaid');
const { renderInvoicePdf, invoicePdfBuffer } = require('./invoicePdf');
const email = require('./email');
const auth = require('./auth');

const app = express();
app.set('trust proxy', 1); // needed so secure cookies work behind a hosting platform's proxy (Render, Railway, etc.)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(auth.attachUser);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ---------- Auth ----------
app.post('/api/auth/signup', (req, res) => {
  const { email: userEmail, password, name } = req.body;
  if (!userEmail || !password) return res.status(400).json({ error: 'email and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(userEmail.toLowerCase());
  if (existing) return res.status(400).json({ error: 'An account with that email already exists' });

  const id = uuid();
  const hash = auth.bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?,?,?,?)')
    .run(id, userEmail.toLowerCase(), hash, name || null);
  const user = { id, email: userEmail.toLowerCase(), name };
  const token = auth.signToken(user);
  res.cookie(auth.COOKIE_NAME, token, { httpOnly: true, maxAge: 30 * 24 * 3600 * 1000, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  res.json({ user });
});

app.post('/api/auth/login', (req, res) => {
  const { email: userEmail, password } = req.body;
  if (!userEmail || !password) return res.status(400).json({ error: 'email and password required' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(userEmail.toLowerCase());
  if (!user || !auth.bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = auth.signToken(user);
  res.cookie(auth.COOKIE_NAME, token, { httpOnly: true, maxAge: 30 * 24 * 3600 * 1000, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(auth.COOKIE_NAME);
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.user || null });
});

// Everything below requires a signed-in user.
app.use('/api', auth.requireAuth);

// ---------- Businesses ----------
app.get('/api/businesses', (req, res) => {
  const rows = db.prepare(`
    SELECT b.*, bm.role AS my_role FROM businesses b
    JOIN business_members bm ON bm.business_id = b.id
    WHERE bm.user_id = ? ORDER BY b.created_at
  `).all(req.user.id);
  res.json(rows);
});

app.post('/api/businesses', (req, res) => {
  const { name, entity_type, industry } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const id = uuid();
  db.prepare('INSERT INTO businesses (id, name, entity_type, industry) VALUES (?,?,?,?)')
    .run(id, name, entity_type || null, industry || null);

  db.prepare('INSERT INTO business_members (id, business_id, user_id, role) VALUES (?,?,?,?)')
    .run(uuid(), id, req.user.id, 'owner');

  const insertAccount = db.prepare(`
    INSERT INTO accounts (id, business_id, name, type, subtype, schedule_c_line)
    VALUES (?,?,?,?,?,?)
  `);
  const seed = db.transaction(() => {
    for (const a of getDefaultAccounts(entity_type)) {
      insertAccount.run(uuid(), id, a.name, a.type, a.subtype || null, a.schedule_c_line || null);
    }
  });
  seed();

  res.json(db.prepare('SELECT * FROM businesses WHERE id = ?').get(id));
});

function businessIdForBusinessParam(req) { return req.params.id; }

app.patch('/api/businesses/:id', auth.requireBusinessAccess(businessIdForBusinessParam), auth.requireWriteAccess, (req, res) => {
  const { name, entity_type, industry, filing_status, state } = req.body;
  db.prepare(`
    UPDATE businesses SET
      name = COALESCE(?, name),
      entity_type = COALESCE(?, entity_type),
      industry = COALESCE(?, industry),
      filing_status = COALESCE(?, filing_status),
      state = COALESCE(?, state)
    WHERE id = ?
  `).run(name || null, entity_type || null, industry || null, filing_status || null, state || null, req.params.id);
  res.json(db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.params.id));
});

app.get('/api/entity-types', (req, res) => {
  res.json(ENTITY_TYPE_LABELS);
});

// Retroactively adds any of the standard accounts for a given entity type that
// this business doesn't already have (matched by name) — lets an existing
// business pick up the right equity accounts (Shareholder Distributions, etc.)
// without having to recreate the business from scratch.
app.post('/api/businesses/:id/seed-entity-accounts', auth.requireBusinessAccess(businessIdForBusinessParam), auth.requireWriteAccess, (req, res) => {
  const { entity_type } = req.body;
  if (!entity_type) return res.status(400).json({ error: 'entity_type required' });

  const existingNames = new Set(
    db.prepare('SELECT name FROM accounts WHERE business_id = ?').all(req.params.id).map(a => a.name)
  );
  const toAdd = getDefaultAccounts(entity_type).filter(a => !existingNames.has(a.name));

  const insertAccount = db.prepare(`
    INSERT INTO accounts (id, business_id, name, type, subtype, schedule_c_line)
    VALUES (?,?,?,?,?,?)
  `);
  const run = db.transaction(() => {
    for (const a of toAdd) {
      insertAccount.run(uuid(), req.params.id, a.name, a.type, a.subtype || null, a.schedule_c_line || null);
    }
  });
  run();

  res.json({ added: toAdd.map(a => a.name) });
});

// ---------- Business members (multi-user access) ----------
app.get('/api/businesses/:id/members', auth.requireBusinessAccess(businessIdForBusinessParam), (req, res) => {
  const members = db.prepare(`
    SELECT bm.id, bm.role, bm.created_at, u.id AS user_id, u.email, u.name
    FROM business_members bm JOIN users u ON u.id = bm.user_id
    WHERE bm.business_id = ? ORDER BY bm.created_at
  `).all(req.params.id);
  res.json(members);
});

// Invite an existing user by email. Owners only. Does not create accounts for
// people who haven't signed up yet — they need to sign up first, then get invited.
app.post('/api/businesses/:id/members', auth.requireBusinessAccess(businessIdForBusinessParam), (req, res) => {
  if (req.membership.role !== 'owner') return res.status(403).json({ error: 'Only the business owner can invite members' });
  const { email: inviteEmail, role } = req.body;
  if (!inviteEmail || !role) return res.status(400).json({ error: 'email and role required' });
  if (!['owner', 'member', 'client'].includes(role)) return res.status(400).json({ error: 'invalid role' });

  const invitedUser = db.prepare('SELECT * FROM users WHERE email = ?').get(inviteEmail.toLowerCase());
  if (!invitedUser) return res.status(404).json({ error: 'No account found with that email. Ask them to sign up first, then invite them.' });

  const existing = db.prepare('SELECT * FROM business_members WHERE business_id = ? AND user_id = ?').get(req.params.id, invitedUser.id);
  if (existing) {
    db.prepare('UPDATE business_members SET role = ? WHERE id = ?').run(role, existing.id);
  } else {
    db.prepare('INSERT INTO business_members (id, business_id, user_id, role) VALUES (?,?,?,?)').run(uuid(), req.params.id, invitedUser.id, role);
  }
  res.json({ ok: true });
});

app.delete('/api/businesses/:id/members/:memberId', auth.requireBusinessAccess(businessIdForBusinessParam), (req, res) => {
  if (req.membership.role !== 'owner') return res.status(403).json({ error: 'Only the business owner can remove members' });
  db.prepare('DELETE FROM business_members WHERE id = ? AND business_id = ?').run(req.params.memberId, req.params.id);
  res.json({ ok: true });
});

// Flips sent/partial invoices past their due date to 'overdue'. Cheap enough to
// run on every read rather than needing a cron job for this MVP.
function markOverdueInvoices(businessId) {
  const today = new Date().toISOString().slice(0, 10);
  db.prepare(`
    UPDATE invoices SET status = 'overdue', updated_at = datetime('now')
    WHERE business_id = ? AND status IN ('sent','partial') AND due_date IS NOT NULL AND due_date < ?
  `).run(businessId, today);
}

// ---------- Chart of Accounts ----------
app.get('/api/accounts', auth.requireBusinessAccess(), (req, res) => {
  const { business_id } = req.query;
  res.json(db.prepare('SELECT * FROM accounts WHERE business_id = ? AND is_active = 1 ORDER BY type, name').all(business_id));
});

// The full master catalog of standard accounts across every entity type, for
// a "browse and pick" UI — doesn't require a business_id, it's just reference data.
app.get('/api/accounts/standard-list', (req, res) => {
  res.json(getAllStandardAccounts());
});

app.post('/api/accounts', auth.requireBusinessAccess(), auth.requireWriteAccess, (req, res) => {
  const { business_id, name, type, subtype, schedule_c_line } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name and type required' });
  const id = uuid();
  try {
    db.prepare(`INSERT INTO accounts (id, business_id, name, type, subtype, schedule_c_line) VALUES (?,?,?,?,?,?)`)
      .run(id, business_id, name, type, subtype || null, schedule_c_line || null);
    res.json(db.prepare('SELECT * FROM accounts WHERE id = ?').get(id));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Adds several accounts at once from the standard list, skipping any the
// business already has (matched by name). Used by the "add from list" picker.
app.post('/api/accounts/bulk', auth.requireBusinessAccess(), auth.requireWriteAccess, (req, res) => {
  const { business_id, accounts } = req.body;
  if (!Array.isArray(accounts) || !accounts.length) return res.status(400).json({ error: 'accounts array required' });

  const existingNames = new Set(
    db.prepare('SELECT name FROM accounts WHERE business_id = ?').all(business_id).map(a => a.name)
  );
  const insertAccount = db.prepare(`
    INSERT INTO accounts (id, business_id, name, type, subtype, schedule_c_line) VALUES (?,?,?,?,?,?)
  `);
  const added = [];
  const run = db.transaction(() => {
    for (const a of accounts) {
      if (!a.name || !a.type || existingNames.has(a.name)) continue;
      insertAccount.run(uuid(), business_id, a.name, a.type, a.subtype || null, a.schedule_c_line || null);
      added.push(a.name);
      existingNames.add(a.name);
    }
  });
  run();
  res.json({ added });
});

// Deletes several accounts at once (soft delete, same as the single-account route).
app.post('/api/accounts/bulk-delete', auth.requireBusinessAccess(), auth.requireWriteAccess, (req, res) => {
  const { business_id, account_ids } = req.body;
  if (!Array.isArray(account_ids) || !account_ids.length) return res.status(400).json({ error: 'account_ids array required' });

  // Only deactivate accounts that actually belong to this business.
  const placeholders = account_ids.map(() => '?').join(',');
  db.prepare(`UPDATE accounts SET is_active = 0 WHERE business_id = ? AND id IN (${placeholders})`)
    .run(business_id, ...account_ids);
  res.json({ ok: true });
});

function businessIdForAccount(req) { return db.prepare('SELECT business_id FROM accounts WHERE id = ?').get(req.params.id)?.business_id; }
app.delete('/api/accounts/:id', auth.requireBusinessAccess(businessIdForAccount), auth.requireWriteAccess, (req, res) => {
  db.prepare('UPDATE accounts SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Statement upload (paste text) + AI categorization ----------
// Shared logic: takes already-parsed {rows, skipped}, categorizes and saves them
// as a new statement + transactions. Used by both the paste-text and file-upload routes.
async function ingestStatementRows(business_id, source_name, statement_ending_balance, rows, skipped, res) {
  if (rows.length === 0) {
    return res.status(400).json({ error: 'Could not find any transactions in that statement', skipped });
  }

  const statementId = uuid();
  const dates = rows.map(r => r.date).sort();
  db.prepare(`
    INSERT INTO statements (id, business_id, source_name, period_start, period_end, statement_ending_balance)
    VALUES (?,?,?,?,?,?)
  `).run(statementId, business_id, source_name || null, dates[0], dates[dates.length - 1], statement_ending_balance || null);

  const accounts = db.prepare('SELECT * FROM accounts WHERE business_id = ? AND is_active = 1').all(business_id);
  const categorized = await categorizeTransactions(business_id, rows, accounts);

  const accountsByName = {};
  accounts.forEach(a => { accountsByName[a.name] = a; });

  const insertTx = db.prepare(`
    INSERT INTO transactions
      (id, business_id, statement_id, date, description, amount, account_id, ai_suggested_account_id, ai_confidence, ai_reasoning)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `);

  const insertAll = db.transaction(() => {
    for (const t of categorized) {
      const acct = accountsByName[t.account_name] || accountsByName['Uncategorized'];
      insertTx.run(uuid(), business_id, statementId, t.date, t.description, t.amount, acct.id, acct.id, t.confidence, t.reasoning);
    }
  });
  insertAll();

  const txns = db.prepare(`
    SELECT t.*, a.name AS account_name, a.type AS account_type
    FROM transactions t LEFT JOIN accounts a ON a.id = t.account_id
    WHERE t.statement_id = ?
    ORDER BY t.date
  `).all(statementId);

  res.json({
    statement: db.prepare('SELECT * FROM statements WHERE id = ?').get(statementId),
    transactions: txns,
    skipped_lines: skipped,
  });
}

app.post('/api/statements', auth.requireBusinessAccess(), auth.requireWriteAccess, async (req, res) => {
  const { business_id, source_name, statement_text, statement_ending_balance } = req.body;
  if (!statement_text) {
    return res.status(400).json({ error: 'statement_text required' });
  }
  const { rows, skipped } = parseStatementText(statement_text);
  await ingestStatementRows(business_id, source_name, statement_ending_balance, rows, skipped, res);
});

// File upload version: accepts a .csv or .pdf bank statement export.
// upload.single runs first so multer has parsed req.body.business_id out of the
// multipart form before the access-check middleware needs to read it.
app.post('/api/statements/upload', upload.single('file'), auth.requireBusinessAccess(), auth.requireWriteAccess, async (req, res) => {
  const { business_id, source_name, statement_ending_balance } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const filename = req.file.originalname.toLowerCase();
  let parsed;
  try {
    if (filename.endsWith('.pdf')) {
      parsed = await parseStatementPdf(req.file.buffer);
    } else if (filename.endsWith('.csv') || filename.endsWith('.txt')) {
      parsed = parseStatementCsv(req.file.buffer.toString('utf8'));
    } else {
      return res.status(400).json({ error: 'Please upload a .csv, .txt, or .pdf file' });
    }
  } catch (err) {
    return res.status(400).json({ error: 'Could not read that file: ' + err.message });
  }

  await ingestStatementRows(business_id, source_name, statement_ending_balance, parsed.rows, parsed.skipped, res);
});

// ---------- Transactions ----------
app.get('/api/transactions', auth.requireBusinessAccess(), (req, res) => {
  const { business_id, statement_id, reconciled } = req.query;
  let query = `
    SELECT t.*, a.name AS account_name, a.type AS account_type
    FROM transactions t LEFT JOIN accounts a ON a.id = t.account_id
    WHERE t.business_id = ?
  `;
  const params = [business_id];
  if (statement_id) { query += ' AND t.statement_id = ?'; params.push(statement_id); }
  if (reconciled !== undefined) { query += ' AND t.is_reconciled = ?'; params.push(reconciled === 'true' ? 1 : 0); }
  query += ' ORDER BY t.date DESC';
  res.json(db.prepare(query).all(...params));
});

app.post('/api/transactions', auth.requireBusinessAccess(), auth.requireWriteAccess, (req, res) => {
  const { business_id, date, description, amount, account_id } = req.body;
  if (!date || !description || amount === undefined) {
    return res.status(400).json({ error: 'date, description, amount required' });
  }
  const id = uuid();
  db.prepare(`
    INSERT INTO transactions (id, business_id, date, description, amount, account_id)
    VALUES (?,?,?,?,?,?)
  `).run(id, business_id, date, description, amount, account_id || null);
  res.json(db.prepare('SELECT * FROM transactions WHERE id = ?').get(id));
});

function businessIdForTransaction(req) { return db.prepare('SELECT business_id FROM transactions WHERE id = ?').get(req.params.id)?.business_id; }

// Correct a categorization -- logs the correction for future AI few-shot learning
app.patch('/api/transactions/:id', auth.requireBusinessAccess(businessIdForTransaction), auth.requireWriteAccess, (req, res) => {
  const { account_id } = req.body;
  const txn = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  if (!txn) return res.status(404).json({ error: 'not found' });

  if (account_id && account_id !== txn.account_id) {
    db.prepare(`
      INSERT INTO categorization_corrections (id, transaction_id, original_account_id, corrected_account_id, description_snapshot)
      VALUES (?,?,?,?,?)
    `).run(uuid(), txn.id, txn.account_id, account_id, txn.description);
  }

  db.prepare(`UPDATE transactions SET account_id = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(account_id || txn.account_id, req.params.id);
  res.json(db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id));
});

app.delete('/api/transactions/:id', auth.requireBusinessAccess(businessIdForTransaction), auth.requireWriteAccess, (req, res) => {
  db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Reconciliation ----------
function businessIdForStatement(req) { return db.prepare('SELECT business_id FROM statements WHERE id = ?').get(req.params.id)?.business_id; }

// Sets/edits the beginning and ending balance for a statement — the two
// numbers a QuickBooks-style reconciliation checks transactions against.
app.patch('/api/statements/:id', auth.requireBusinessAccess(businessIdForStatement), auth.requireWriteAccess, (req, res) => {
  const { statement_beginning_balance, statement_ending_balance, source_name } = req.body;
  db.prepare(`
    UPDATE statements SET
      statement_beginning_balance = COALESCE(?, statement_beginning_balance),
      statement_ending_balance = COALESCE(?, statement_ending_balance),
      source_name = COALESCE(?, source_name)
    WHERE id = ?
  `).run(
    statement_beginning_balance !== undefined ? statement_beginning_balance : null,
    statement_ending_balance !== undefined ? statement_ending_balance : null,
    source_name || null,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM statements WHERE id = ?').get(req.params.id));
});

app.get('/api/reconciliation/summary', auth.requireBusinessAccess(), (req, res) => {
  const { statement_id } = req.query;
  if (!statement_id) return res.status(400).json({ error: 'statement_id required' });

  const statement = db.prepare('SELECT * FROM statements WHERE id = ?').get(statement_id);
  const txns = db.prepare('SELECT * FROM transactions WHERE statement_id = ? ORDER BY date').all(statement_id);
  const clearedTotal = txns.filter(t => t.is_reconciled).reduce((sum, t) => sum + t.amount, 0);

  const beginningBalance = statement.statement_beginning_balance;
  const endingBalance = statement.statement_ending_balance;
  const hasBothBalances = beginningBalance !== null && endingBalance !== null;
  const targetChange = hasBothBalances ? endingBalance - beginningBalance : null;
  const difference = hasBothBalances ? Math.round((targetChange - clearedTotal) * 100) / 100 : null;

  const lockedPeriod = db.prepare('SELECT * FROM reconciliation_periods WHERE statement_id = ? ORDER BY locked_at DESC LIMIT 1').get(statement_id);

  res.json({
    statement,
    transactions: txns,
    transaction_count: txns.length,
    cleared_count: txns.filter(t => t.is_reconciled).length,
    cleared_total: clearedTotal,
    beginning_balance: beginningBalance,
    ending_balance: endingBalance,
    difference,
    is_balanced: difference !== null && Math.abs(difference) < 0.005,
    is_locked: !!(lockedPeriod && lockedPeriod.is_locked),
  });
});

// Checks/unchecks a single transaction as "cleared" during reconciliation —
// the checkbox click. Doesn't finalize anything; that happens on lock.
app.patch('/api/transactions/:id/clear', auth.requireBusinessAccess(businessIdForTransaction), auth.requireWriteAccess, (req, res) => {
  const { is_reconciled } = req.body;
  const txn = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  if (!txn) return res.status(404).json({ error: 'not found' });

  const lockedPeriod = db.prepare('SELECT * FROM reconciliation_periods WHERE statement_id = ? AND is_locked = 1').get(txn.statement_id);
  if (lockedPeriod) return res.status(400).json({ error: 'This period is already locked. Unlock it first to make changes.' });

  db.prepare(`UPDATE transactions SET is_reconciled = ?, reconciled_at = ? WHERE id = ?`)
    .run(is_reconciled ? 1 : 0, is_reconciled ? new Date().toISOString() : null, req.params.id);
  res.json(db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id));
});

app.post('/api/reconciliation/lock', auth.requireBusinessAccess(), auth.requireWriteAccess, (req, res) => {
  const { business_id, statement_id } = req.body;
  if (!statement_id) return res.status(400).json({ error: 'statement_id required' });

  const statement = db.prepare('SELECT * FROM statements WHERE id = ?').get(statement_id);

  const id = uuid();
  db.prepare(`
    INSERT INTO reconciliation_periods (id, business_id, statement_id, period_start, period_end, starting_balance, ending_balance, is_locked, locked_at)
    VALUES (?,?,?,?,?,?,?,1,datetime('now'))
  `).run(id, business_id, statement_id, statement.period_start, statement.period_end, statement.statement_beginning_balance, statement.statement_ending_balance);

  res.json(db.prepare('SELECT * FROM reconciliation_periods WHERE id = ?').get(id));
});

// Reopens a locked period so transactions can be un-checked/re-checked again.
app.post('/api/reconciliation/unlock', auth.requireBusinessAccess(), auth.requireWriteAccess, (req, res) => {
  const { statement_id } = req.body;
  if (!statement_id) return res.status(400).json({ error: 'statement_id required' });
  db.prepare(`UPDATE reconciliation_periods SET is_locked = 0 WHERE statement_id = ?`).run(statement_id);
  res.json({ ok: true });
});

app.get('/api/statements', auth.requireBusinessAccess(), (req, res) => {
  const { business_id } = req.query;
  res.json(db.prepare('SELECT * FROM statements WHERE business_id = ? ORDER BY period_start DESC').all(business_id));
});

// ---------- Reports ----------
app.get('/api/reports/pl', auth.requireBusinessAccess(), (req, res) => {
  const { business_id, start, end } = req.query;

  let query = `
    SELECT a.type, a.name AS account_name, SUM(t.amount) AS total
    FROM transactions t JOIN accounts a ON a.id = t.account_id
    WHERE t.business_id = ? AND a.type IN ('income','expense')
  `;
  const params = [business_id];
  if (start) { query += ' AND t.date >= ?'; params.push(start); }
  if (end) { query += ' AND t.date <= ?'; params.push(end); }
  query += ' GROUP BY a.type, a.name ORDER BY a.type, a.name';

  const rows = db.prepare(query).all(...params);
  const income = rows.filter(r => r.type === 'income');
  const expenses = rows.filter(r => r.type === 'expense');
  const totalIncome = income.reduce((s, r) => s + r.total, 0);
  const totalExpenses = expenses.reduce((s, r) => s + Math.abs(r.total), 0);

  res.json({
    income,
    expenses,
    total_income: totalIncome,
    total_expenses: totalExpenses,
    net_profit: totalIncome - totalExpenses,
  });
});

app.get('/api/reports/balance-sheet', auth.requireBusinessAccess(), (req, res) => {
  const { business_id, as_of } = req.query;

  let query = `
    SELECT a.type, a.name AS account_name, SUM(t.amount) AS total
    FROM transactions t JOIN accounts a ON a.id = t.account_id
    WHERE t.business_id = ? AND a.type IN ('asset','liability','equity')
  `;
  const params = [business_id];
  if (as_of) { query += ' AND t.date <= ?'; params.push(as_of); }
  query += ' GROUP BY a.type, a.name ORDER BY a.type, a.name';

  const rows = db.prepare(query).all(...params);
  const assets = rows.filter(r => r.type === 'asset');
  const liabilities = rows.filter(r => r.type === 'liability');
  const equity = rows.filter(r => r.type === 'equity');

  res.json({
    assets,
    liabilities,
    equity,
    total_assets: assets.reduce((s, r) => s + r.total, 0),
    total_liabilities: liabilities.reduce((s, r) => s + r.total, 0),
    total_equity: equity.reduce((s, r) => s + r.total, 0),
  });
});

// ---------- Clients ----------
app.get('/api/clients', auth.requireBusinessAccess(), (req, res) => {
  const { business_id } = req.query;
  res.json(db.prepare('SELECT * FROM clients WHERE business_id = ? ORDER BY name').all(business_id));
});

app.post('/api/clients', auth.requireBusinessAccess(), auth.requireWriteAccess, (req, res) => {
  const { business_id, name, email, address, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const id = uuid();
  db.prepare('INSERT INTO clients (id, business_id, name, email, address, notes) VALUES (?,?,?,?,?,?)')
    .run(id, business_id, name, email || null, address || null, notes || null);
  res.json(db.prepare('SELECT * FROM clients WHERE id = ?').get(id));
});

function businessIdForClient(req) { return db.prepare('SELECT business_id FROM clients WHERE id = ?').get(req.params.id)?.business_id; }
app.delete('/api/clients/:id', auth.requireBusinessAccess(businessIdForClient), auth.requireWriteAccess, (req, res) => {
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Invoices ----------
function invoiceTotal(invoiceId) {
  const items = db.prepare('SELECT * FROM invoice_line_items WHERE invoice_id = ?').all(invoiceId);
  return items.reduce((sum, i) => sum + i.quantity * i.rate, 0);
}
function invoicePaid(invoiceId) {
  const payments = db.prepare('SELECT * FROM invoice_payments WHERE invoice_id = ?').all(invoiceId);
  return payments.reduce((sum, p) => sum + p.amount, 0);
}
function nextInvoiceNumber(businessId) {
  const count = db.prepare('SELECT COUNT(*) AS c FROM invoices WHERE business_id = ?').get(businessId).c;
  return String(1001 + count);
}
function hydrateInvoice(inv) {
  const line_items = db.prepare('SELECT * FROM invoice_line_items WHERE invoice_id = ? ORDER BY sort_order').all(inv.id);
  const payments = db.prepare('SELECT * FROM invoice_payments WHERE invoice_id = ? ORDER BY date').all(inv.id);
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(inv.client_id);
  const total = line_items.reduce((s, i) => s + i.quantity * i.rate, 0);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  return { ...inv, client, line_items, payments, total, balance_due: total - paid };
}

function businessIdForInvoice(req) { return db.prepare('SELECT business_id FROM invoices WHERE id = ?').get(req.params.id)?.business_id; }

app.get('/api/invoices', auth.requireBusinessAccess(), (req, res) => {
  const { business_id, status } = req.query;
  markOverdueInvoices(business_id);
  let query = 'SELECT * FROM invoices WHERE business_id = ?';
  const params = [business_id];
  if (status) { query += ' AND status = ?'; params.push(status); }
  query += ' ORDER BY issue_date DESC';
  const invoices = db.prepare(query).all(...params).map(hydrateInvoice);
  res.json(invoices);
});

app.get('/api/invoices/:id', auth.requireBusinessAccess(businessIdForInvoice), (req, res) => {
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'not found' });
  res.json(hydrateInvoice(inv));
});

app.post('/api/invoices', auth.requireBusinessAccess(), auth.requireWriteAccess, (req, res) => {
  const { business_id, client_id, issue_date, due_date, notes, revenue_account_id, line_items } = req.body;
  if (!client_id || !issue_date || !line_items || !line_items.length) {
    return res.status(400).json({ error: 'client_id, issue_date, and at least one line item are required' });
  }
  const id = uuid();
  const invoice_number = nextInvoiceNumber(business_id);

  const createAll = db.transaction(() => {
    db.prepare(`
      INSERT INTO invoices (id, business_id, client_id, invoice_number, issue_date, due_date, notes, revenue_account_id)
      VALUES (?,?,?,?,?,?,?,?)
    `).run(id, business_id, client_id, invoice_number, issue_date, due_date || null, notes || null, revenue_account_id || null);

    const insertItem = db.prepare(`
      INSERT INTO invoice_line_items (id, invoice_id, description, quantity, rate, sort_order)
      VALUES (?,?,?,?,?,?)
    `);
    line_items.forEach((item, idx) => {
      insertItem.run(uuid(), id, item.description, item.quantity || 1, item.rate || 0, idx);
    });
  });
  createAll();

  res.json(hydrateInvoice(db.prepare('SELECT * FROM invoices WHERE id = ?').get(id)));
});

app.patch('/api/invoices/:id', auth.requireBusinessAccess(businessIdForInvoice), auth.requireWriteAccess, (req, res) => {
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'not found' });
  const { status, notes, due_date } = req.body;
  db.prepare(`
    UPDATE invoices SET
      status = COALESCE(?, status),
      notes = COALESCE(?, notes),
      due_date = COALESCE(?, due_date),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(status || null, notes || null, due_date || null, req.params.id);
  res.json(hydrateInvoice(db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id)));
});

app.delete('/api/invoices/:id', auth.requireBusinessAccess(businessIdForInvoice), auth.requireWriteAccess, (req, res) => {
  const del = db.transaction(() => {
    db.prepare('DELETE FROM invoice_payments WHERE invoice_id = ?').run(req.params.id);
    db.prepare('DELETE FROM invoice_line_items WHERE invoice_id = ?').run(req.params.id);
    db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
  });
  del();
  res.json({ ok: true });
});

// Record a payment against an invoice. Optionally posts a matching transaction
// to the ledger (categorized to the invoice's revenue account, or Client Revenue by default)
// so paid invoices flow straight into the P&L without double entry.
app.post('/api/invoices/:id/payments', auth.requireBusinessAccess(businessIdForInvoice), auth.requireWriteAccess, (req, res) => {
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'not found' });
  const { date, amount, method, post_to_ledger } = req.body;
  if (!date || !amount) return res.status(400).json({ error: 'date and amount required' });

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(inv.client_id);
  let transactionId = null;

  const run = db.transaction(() => {
    if (post_to_ledger) {
      let accountId = inv.revenue_account_id;
      if (!accountId) {
        const revAcct = db.prepare(`SELECT id FROM accounts WHERE business_id = ? AND name = 'Client Revenue'`).get(inv.business_id);
        accountId = revAcct ? revAcct.id : null;
      }
      transactionId = uuid();
      db.prepare(`
        INSERT INTO transactions (id, business_id, date, description, amount, account_id, notes)
        VALUES (?,?,?,?,?,?,?)
      `).run(transactionId, inv.business_id, date, `Invoice ${inv.invoice_number} payment - ${client ? client.name : ''}`, Math.abs(amount), accountId, `Payment for invoice ${inv.invoice_number}`);
    }

    db.prepare(`
      INSERT INTO invoice_payments (id, invoice_id, date, amount, method, transaction_id)
      VALUES (?,?,?,?,?,?)
    `).run(uuid(), req.params.id, date, amount, method || null, transactionId);

    const total = invoiceTotal(req.params.id);
    const paid = invoicePaid(req.params.id);
    const newStatus = paid >= total ? 'paid' : (paid > 0 ? 'partial' : inv.status);
    db.prepare(`UPDATE invoices SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(newStatus, req.params.id);
  });
  run();

  res.json(hydrateInvoice(db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id)));
});

app.get('/api/reports/ar-aging', auth.requireBusinessAccess(), (req, res) => {
  const { business_id } = req.query;
  markOverdueInvoices(business_id);
  const invoices = db.prepare(`SELECT * FROM invoices WHERE business_id = ? AND status NOT IN ('paid','void','draft')`).all(business_id)
    .map(hydrateInvoice)
    .filter(i => i.balance_due > 0.001);

  const today = new Date();
  const buckets = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
  const detail = invoices.map(inv => {
    const due = inv.due_date ? new Date(inv.due_date) : null;
    const daysOverdue = due ? Math.floor((today - due) / 86400000) : 0;
    let bucket = 'current';
    if (daysOverdue > 90) bucket = '90+';
    else if (daysOverdue > 60) bucket = '61-90';
    else if (daysOverdue > 30) bucket = '31-60';
    else if (daysOverdue > 0) bucket = '1-30';
    buckets[bucket] += inv.balance_due;
    return { invoice_number: inv.invoice_number, client_name: inv.client ? inv.client.name : '', balance_due: inv.balance_due, due_date: inv.due_date, bucket };
  });

  res.json({ buckets, detail, total_outstanding: detail.reduce((s, d) => s + d.balance_due, 0) });
});

// PDF and email delivery for a single invoice
app.get('/api/invoices/:id/pdf', auth.requireBusinessAccess(businessIdForInvoice), (req, res) => {
  const inv = hydrateInvoice(db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id));
  if (!inv) return res.status(404).json({ error: 'not found' });
  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(inv.business_id);
  renderInvoicePdf(res, { business, client: inv.client, invoice: inv });
});

app.post('/api/invoices/:id/email', auth.requireBusinessAccess(businessIdForInvoice), auth.requireWriteAccess, async (req, res) => {
  if (!email.configured) return res.status(400).json({ error: 'Email is not configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASS to .env.' });
  const inv = hydrateInvoice(db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id));
  if (!inv) return res.status(404).json({ error: 'not found' });
  if (!inv.client || !inv.client.email) return res.status(400).json({ error: 'This client has no email on file.' });
  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(inv.business_id);
  const pdfBuffer = await invoicePdfBuffer({ business, client: inv.client, invoice: inv });

  try {
    await email.sendInvoiceEmail({
      to: inv.client.email,
      subject: `Invoice ${inv.invoice_number} from ${business.name}`,
      text: `Hi ${inv.client.name},\n\nPlease find invoice ${inv.invoice_number} attached, for a total of $${inv.total.toFixed(2)} (balance due: $${inv.balance_due.toFixed(2)}).\n\nThanks,\n${business.name}`,
      pdfBuffer,
      pdfFilename: `invoice-${inv.invoice_number}.pdf`,
    });
    if (inv.status === 'draft') {
      db.prepare(`UPDATE invoices SET status = 'sent', updated_at = datetime('now') WHERE id = ?`).run(inv.id);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- CSV Exports ----------
function toCsv(rows, columns) {
  const escape = v => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map(c => c.label).join(',');
  const body = rows.map(r => columns.map(c => escape(r[c.key])).join(',')).join('\n');
  return header + '\n' + body;
}

app.get('/api/exports/transactions.csv', auth.requireBusinessAccess(), (req, res) => {
  const { business_id } = req.query;
  const txns = db.prepare(`
    SELECT t.date, t.description, t.amount, a.name AS account_name, t.is_reconciled
    FROM transactions t LEFT JOIN accounts a ON a.id = t.account_id
    WHERE t.business_id = ? ORDER BY t.date
  `).all(business_id);
  const csv = toCsv(txns, [
    { key: 'date', label: 'Date' }, { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount' }, { key: 'account_name', label: 'Category' },
    { key: 'is_reconciled', label: 'Reconciled' },
  ]);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
  res.send(csv);
});

app.get('/api/exports/invoices.csv', auth.requireBusinessAccess(), (req, res) => {
  const { business_id } = req.query;
  markOverdueInvoices(business_id);
  const invoices = db.prepare('SELECT * FROM invoices WHERE business_id = ? ORDER BY issue_date').all(business_id).map(hydrateInvoice);
  const rows = invoices.map(i => ({
    invoice_number: i.invoice_number, client_name: i.client ? i.client.name : '',
    issue_date: i.issue_date, due_date: i.due_date, status: i.status,
    total: i.total, balance_due: i.balance_due,
  }));
  const csv = toCsv(rows, [
    { key: 'invoice_number', label: 'Invoice #' }, { key: 'client_name', label: 'Client' },
    { key: 'issue_date', label: 'Issued' }, { key: 'due_date', label: 'Due' },
    { key: 'status', label: 'Status' }, { key: 'total', label: 'Total' }, { key: 'balance_due', label: 'Balance Due' },
  ]);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="invoices.csv"');
  res.send(csv);
});

app.get('/api/exports/pl.csv', auth.requireBusinessAccess(), (req, res) => {
  const { business_id, start, end } = req.query;
  let query = `
    SELECT a.type, a.name AS account_name, SUM(t.amount) AS total
    FROM transactions t JOIN accounts a ON a.id = t.account_id
    WHERE t.business_id = ? AND a.type IN ('income','expense')
  `;
  const params = [business_id];
  if (start) { query += ' AND t.date >= ?'; params.push(start); }
  if (end) { query += ' AND t.date <= ?'; params.push(end); }
  query += ' GROUP BY a.type, a.name ORDER BY a.type, a.name';
  const rows = db.prepare(query).all(...params);
  const csv = toCsv(rows, [
    { key: 'type', label: 'Type' }, { key: 'account_name', label: 'Account' }, { key: 'total', label: 'Total' },
  ]);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="profit-and-loss.csv"');
  res.send(csv);
});

// ---------- Quarterly Estimated Tax ----------
app.get('/api/reports/tax-estimate', auth.requireBusinessAccess(), (req, res) => {
  const { business_id, year } = req.query;
  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(business_id);
  if (!business) return res.status(404).json({ error: 'business not found' });

  const yr = year || String(new Date().getFullYear());
  const rows = db.prepare(`
    SELECT a.type, SUM(t.amount) AS total
    FROM transactions t JOIN accounts a ON a.id = t.account_id
    WHERE t.business_id = ? AND a.type IN ('income','expense') AND t.date LIKE ?
    GROUP BY a.type
  `).all(business_id, `${yr}-%`);

  const income = rows.find(r => r.type === 'income')?.total || 0;
  const expenses = Math.abs(rows.find(r => r.type === 'expense')?.total || 0);
  const netProfit = income - expenses;

  const filingStatus = business.filing_status || 'single';
  const estimate = calculateEstimate({ netProfit, filingStatus, state: business.state });
  const dueDates = quarterlyDueDates(parseInt(yr, 10));

  res.json({
    year: yr,
    filing_status: filingStatus,
    state: business.state || null,
    net_profit_ytd: netProfit,
    ...estimate,
    quarters: dueDates.map(d => ({ ...d, amount: estimate.quarterly_payment })),
    disclaimer: 'This is a simplified planning estimate, not tax advice. It ignores credits, other income, and QBI. Consult a tax professional before making payments.',
  });
});

// ---------- Practice overview (multi-client dashboard) ----------
app.get('/api/practice/overview', (req, res) => {
  const businesses = db.prepare(`
    SELECT b.* FROM businesses b
    JOIN business_members bm ON bm.business_id = b.id
    WHERE bm.user_id = ? ORDER BY b.name
  `).all(req.user.id);
  const overview = businesses.map(b => {
    markOverdueInvoices(b.id);
    const pl = db.prepare(`
      SELECT a.type, SUM(t.amount) AS total FROM transactions t JOIN accounts a ON a.id = t.account_id
      WHERE t.business_id = ? AND a.type IN ('income','expense') GROUP BY a.type
    `).all(b.id);
    const income = pl.find(r => r.type === 'income')?.total || 0;
    const expenses = Math.abs(pl.find(r => r.type === 'expense')?.total || 0);

    const uncategorized = db.prepare(`
      SELECT COUNT(*) AS c FROM transactions t JOIN accounts a ON a.id = t.account_id
      WHERE t.business_id = ? AND a.name = 'Uncategorized'
    `).get(b.id).c;
    const unreconciled = db.prepare(`SELECT COUNT(*) AS c FROM transactions WHERE business_id = ? AND is_reconciled = 0`).get(b.id).c;
    const arOutstanding = db.prepare(`SELECT id FROM invoices WHERE business_id = ? AND status NOT IN ('paid','void','draft')`).all(b.id)
      .map(i => hydrateInvoice(db.prepare('SELECT * FROM invoices WHERE id = ?').get(i.id)))
      .reduce((s, i) => s + i.balance_due, 0);
    const overdueInvoices = db.prepare(`SELECT COUNT(*) AS c FROM invoices WHERE business_id = ? AND status = 'overdue'`).get(b.id).c;

    return {
      id: b.id, name: b.name, entity_type: b.entity_type,
      net_profit: income - expenses, uncategorized_count: uncategorized,
      unreconciled_count: unreconciled, ar_outstanding: arOutstanding, overdue_invoice_count: overdueInvoices,
      needs_attention: uncategorized + unreconciled + overdueInvoices,
    };
  });
  res.json(overview);
});

// ---------- Plaid (bank connection) ----------
app.get('/api/plaid/status', (req, res) => {
  res.json({ configured: plaid.configured });
});

app.post('/api/plaid/link-token', auth.requireBusinessAccess(), auth.requireWriteAccess, async (req, res) => {
  if (!plaid.configured) return res.status(400).json({ error: 'Plaid is not configured. Add PLAID_CLIENT_ID and PLAID_SECRET to .env (sandbox keys work for testing).' });
  const { business_id } = req.body;
  try {
    const response = await plaid.client.linkTokenCreate({
      user: { client_user_id: business_id },
      client_name: 'Ledgerline',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    });
    res.json({ link_token: response.data.link_token });
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.error_message || err.message });
  }
});

app.post('/api/plaid/exchange-token', auth.requireBusinessAccess(), auth.requireWriteAccess, async (req, res) => {
  if (!plaid.configured) return res.status(400).json({ error: 'Plaid is not configured.' });
  const { business_id, public_token, institution_name } = req.body;
  if (!public_token) return res.status(400).json({ error: 'public_token required' });
  try {
    const exchange = await plaid.client.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = exchange.data;
    const id = uuid();
    db.prepare(`
      INSERT INTO plaid_items (id, business_id, access_token, item_id, institution_name)
      VALUES (?,?,?,?,?)
    `).run(id, business_id, access_token, item_id, institution_name || null);
    res.json({ ok: true, item_id });
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.error_message || err.message });
  }
});

app.get('/api/plaid/items', auth.requireBusinessAccess(), (req, res) => {
  const { business_id } = req.query;
  if (!business_id) return res.status(400).json({ error: 'business_id required' });
  const items = db.prepare('SELECT id, institution_name, created_at FROM plaid_items WHERE business_id = ?').all(business_id);
  res.json(items);
});

// Pulls new transactions since the stored cursor and runs them through the
// same categorization + statement pipeline as a manual paste import.
app.post('/api/plaid/sync', auth.requireBusinessAccess(), auth.requireWriteAccess, async (req, res) => {
  if (!plaid.configured) return res.status(400).json({ error: 'Plaid is not configured.' });
  const { business_id, item_id } = req.body;
  const item = db.prepare('SELECT * FROM plaid_items WHERE id = ?').get(item_id);
  if (!item) return res.status(404).json({ error: 'Plaid item not found' });

  try {
    let cursor = item.cursor;
    let added = [];
    let hasMore = true;
    while (hasMore) {
      const response = await plaid.client.transactionsSync({ access_token: item.access_token, cursor: cursor || undefined });
      added = added.concat(response.data.added);
      hasMore = response.data.has_more;
      cursor = response.data.next_cursor;
    }
    db.prepare('UPDATE plaid_items SET cursor = ? WHERE id = ?').run(cursor, item_id);

    if (added.length === 0) return res.json({ imported: 0, transactions: [] });

    const rows = added.map(t => ({ date: t.date, description: t.merchant_name || t.name, amount: -t.amount }));
    const accounts = db.prepare('SELECT * FROM accounts WHERE business_id = ? AND is_active = 1').all(business_id);
    const categorized = await categorizeTransactions(business_id, rows, accounts);
    const accountsByName = {};
    accounts.forEach(a => { accountsByName[a.name] = a; });

    const statementId = uuid();
    db.prepare(`INSERT INTO statements (id, business_id, source_name, period_start, period_end) VALUES (?,?,?,?,?)`)
      .run(statementId, business_id, item.institution_name || 'Bank sync', rows[0].date, rows[rows.length - 1].date);

    const insertTx = db.prepare(`
      INSERT INTO transactions (id, business_id, statement_id, date, description, amount, account_id, ai_suggested_account_id, ai_confidence, ai_reasoning)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `);
    const insertAll = db.transaction(() => {
      for (const t of categorized) {
        const acct = accountsByName[t.account_name] || accountsByName['Uncategorized'];
        insertTx.run(uuid(), business_id, statementId, t.date, t.description, t.amount, acct.id, acct.id, t.confidence, t.reasoning);
      }
    });
    insertAll();

    res.json({ imported: categorized.length, statement_id: statementId });
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.error_message || err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bookkeeping app running on http://localhost:${PORT}`));
