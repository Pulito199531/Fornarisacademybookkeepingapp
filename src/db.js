const Database = require('better-sqlite3');
const path = require('path');

// DB_PATH lets you point at a persistent disk mount when deploying (e.g. Render's
// persistent disks). Defaults to a local file for development.
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'bookkeeping.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  entity_type TEXT,
  industry TEXT,
  filing_status TEXT,
  state TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset','liability','equity','income','expense')),
  subtype TEXT,
  code TEXT,
  schedule_c_line TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(business_id, name)
);

CREATE TABLE IF NOT EXISTS statements (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  source_name TEXT,
  period_start TEXT,
  period_end TEXT,
  statement_ending_balance REAL,
  uploaded_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  statement_id TEXT REFERENCES statements(id),
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  account_id TEXT REFERENCES accounts(id),
  ai_suggested_account_id TEXT REFERENCES accounts(id),
  ai_confidence REAL,
  ai_reasoning TEXT,
  is_reconciled INTEGER DEFAULT 0,
  reconciled_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categorization_corrections (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES transactions(id),
  original_account_id TEXT REFERENCES accounts(id),
  corrected_account_id TEXT NOT NULL REFERENCES accounts(id),
  description_snapshot TEXT,
  corrected_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reconciliation_periods (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  statement_id TEXT REFERENCES statements(id),
  period_start TEXT,
  period_end TEXT,
  starting_balance REAL,
  ending_balance REAL,
  is_locked INTEGER DEFAULT 0,
  locked_at TEXT
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  name TEXT NOT NULL,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  client_id TEXT NOT NULL REFERENCES clients(id),
  invoice_number TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','partial','paid','overdue','void')),
  notes TEXT,
  revenue_account_id TEXT REFERENCES accounts(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(business_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  rate REAL NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS invoice_payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  method TEXT,
  transaction_id TEXT REFERENCES transactions(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS plaid_items (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  access_token TEXT NOT NULL,
  item_id TEXT NOT NULL,
  institution_name TEXT,
  cursor TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS business_members (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member','client')),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(business_id, user_id)
);
`);

// --- lightweight migrations for columns added after initial release ---
function ensureColumn(table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  if (!cols.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}
ensureColumn('businesses', 'filing_status', 'filing_status TEXT');
ensureColumn('businesses', 'state', 'state TEXT');

module.exports = db;
