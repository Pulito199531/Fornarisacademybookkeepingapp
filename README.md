# Ledgerline — Bookkeeping MVP

A QuickBooks-style bookkeeping app for self-employed people and small business owners:
paste a bank statement, get transactions auto-categorized against a Chart of Accounts,
review/correct, reconcile against your statement balance, and pull P&L / Balance Sheet reports.

## Setup

```bash
npm install
cp .env.example .env   # add JWT_SECRET at minimum; other keys are optional (see below)
npm start
```

Open http://localhost:3000 and create an account (sign up screen appears automatically).

## Deploying this as a live website (for selling to customers)

The easiest path is [Render](https://render.com) — it hosts the app, gives you a real URL,
and includes a persistent disk so the database survives restarts. No command line needed.

1. Put this code on GitHub: create a new repository at github.com, then use GitHub's
   "Add file → Upload files" button in the browser to upload everything in this folder
   (you don't need git installed for this).
2. Go to render.com, sign up, and click **New → Blueprint**.
3. Connect the GitHub repository you just created. Render will read `render.yaml`
   (included in this project) and set up the web service, persistent disk, and a random
   `JWT_SECRET` automatically.
4. Render will ask for a few optional keys (OpenAI, Plaid, SMTP) — you can leave these
   blank and add them later from the Render dashboard under your service's "Environment" tab.
5. Click **Apply**. In a few minutes you'll get a live URL like `ledgerline.onrender.com`
   that you can send directly to customers — they sign up, no install required.

A few things worth doing before you actually sell access to this:
- **Custom domain**: Render lets you point your own domain (e.g. `app.yourbusiness.com`)
  at the service for free, under Settings → Custom Domain.
- **Terms of Service / Privacy Policy**: since this handles people's financial and tax data,
  have a lawyer (or a service like Termly) draft these before charging customers.
- **Payments**: this app doesn't include billing/subscriptions yet — you'd need to add
  Stripe (or handle payment manually and just create accounts for people who've paid).
- **Backups**: Render's persistent disk isn't automatically backed up on the free/starter
  tier — for real customer data, either upgrade the disk plan or add a scheduled export.

## Notes

- **No OpenAI key?** The app falls back to keyword-based rule matching for categorization —
  fully functional, just less smart than the AI version. Add `OPENAI_API_KEY` to `.env` to
  switch on GPT-4o-mini categorization, which also learns from your corrections over time
  (recent corrections are fed back in as few-shot examples per business).
- **Database**: SQLite file (`bookkeeping.db`), created automatically on first run.
  Swap `better-sqlite3` for a Postgres client in `src/db.js` when you're ready to deploy —
  the schema and queries are close to drop-in compatible.
- **Multi-client ready**: every table is scoped by `business_id`, so adding more businesses/clients
  under one account needs no schema changes — just more rows.

## What's built (MVP scope)

1. Chart of Accounts (seeded with a sensible default set mapped to Schedule C lines)
2. Paste-a-statement import with AI/rule-based categorization
3. Transaction review, manual correction (feeds a correction log for future AI learning), manual entry
4. Reconciliation: net change vs. statement ending balance, lock a period
5. Reports: Profit & Loss, Balance Sheet, CSV export
6. Invoicing / Accounts Receivable — clients, invoices with line items, partial/full payments,
   AR aging report, CSV export. Recording a payment can auto-post a matching transaction to the
   ledger so paid invoices flow into the P&L with no double entry. Invoices past due date
   auto-flip to "overdue" status.
7. Quarterly estimated taxes — self-employment tax + simplified federal income tax estimate
   per business, based on filing status, split into four IRS-dated quarterly payments.
   Planning estimate only, not tax advice.
8. Multi-client practice dashboard — "All clients overview" aggregates net profit, AR
   outstanding, and items needing review (uncategorized transactions, unreconciled
   transactions, overdue invoices) across every business, with one click into any client.
9. Live bank connection (Plaid Link) — connect a real (or sandbox) bank account and sync
   transactions straight into the same categorization pipeline as a pasted statement.
   Requires free Plaid sandbox credentials in `.env`; without them the app just shows
   the paste-a-statement flow.
10. Multi-user accounts & permissions — email/password login, JWT sessions, and per-business
    roles (owner / member / client). Owners can invite other signed-up users to a business;
    "client" role is view-only and gets a 403 on any write. Every route is scoped to the
    signed-in user's actual memberships, including the practice-wide overview.
11. PDF invoices — download a clean, branded PDF of any invoice.
12. Email invoices — send an invoice PDF straight to the client's email. Requires SMTP
    credentials in `.env`; without them the button returns a clear "not configured" error.
13. State income tax estimate — the quarterly tax calculator now includes an approximate
    state tax line for states in a small built-in table (no-income-tax states, several flat-rate
    states, and marginal brackets for CA and NY). States outside that table show "not available"
    rather than a wrong number.

## Not yet built (natural next steps)

- Full 50-state tax coverage (currently ~16 states have real calculations)
- Password reset / "forgot password" flow
- Signup invitations for people who don't have an account yet (currently invites only work
  for users who've already signed up)
- Audit log of who changed what (useful once multiple people share access to a business)

