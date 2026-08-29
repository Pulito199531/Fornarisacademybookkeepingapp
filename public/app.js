const state = {
  currentUser: null,
  businesses: [],
  currentBusinessId: null,
  accounts: [],
  statements: [],
  tab: 'dashboard',
};

const $ = sel => document.querySelector(sel);
const main = $('#main');

function fmt(n) {
  const v = Number(n || 0);
  const sign = v < 0 ? '-' : '';
  return sign + '$' + Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toast(msg, isError) {
  const el = document.createElement('div');
  el.className = 'toast' + (isError ? ' error' : '');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

async function api(path, opts = {}) {
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ---------- Auth gate ----------
async function init() {
  const { user } = await api('/auth/me');
  if (!user) return renderAuthScreen();
  state.currentUser = user;
  document.getElementById('app').style.display = 'grid';
  await initApp();
}

function renderAuthScreen(mode = 'login') {
  document.getElementById('app').style.display = 'none';
  let existing = document.getElementById('authScreen');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = 'authScreen';
  el.style.cssText = 'min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--paper);';
  el.innerHTML = `
    <div class="card" style="width:360px;">
      <div class="brand" style="margin-bottom:18px;">Ledgerline <span class="mark">MVP</span></div>
      <h2>${mode === 'login' ? 'Sign in' : 'Create an account'}</h2>
      ${mode === 'signup' ? `<div class="field"><label class="field-label">Name</label><input type="text" id="authName"></div>` : ''}
      <div class="field"><label class="field-label">Email</label><input type="text" id="authEmail"></div>
      <div class="field"><label class="field-label">Password</label><input type="text" id="authPassword" placeholder="${mode === 'signup' ? 'At least 8 characters' : ''}"></div>
      <button class="btn" id="authSubmitBtn" style="width:100%;">${mode === 'login' ? 'Sign in' : 'Create account'}</button>
      <p style="font-size:12.5px; color:var(--ink-soft); margin-top:14px; text-align:center;">
        ${mode === 'login' ? `New here? <a href="#" id="authSwitch" style="color:var(--ledger-green);">Create an account</a>` : `Already have an account? <a href="#" id="authSwitch" style="color:var(--ledger-green);">Sign in</a>`}
      </p>
    </div>
  `;
  document.body.appendChild(el);

  document.getElementById('authSwitch').onclick = (e) => { e.preventDefault(); renderAuthScreen(mode === 'login' ? 'signup' : 'login'); };
  document.getElementById('authSubmitBtn').onclick = async () => {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/signup';
      const body = mode === 'login' ? { email, password } : { email, password, name: document.getElementById('authName').value.trim() };
      const { user } = await api(path, { method: 'POST', body: JSON.stringify(body) });
      state.currentUser = user;
      document.getElementById('authScreen').remove();
      document.getElementById('app').style.display = 'grid';
      await initApp();
    } catch (e) { toast(e.message, true); }
  };
}

async function logout() {
  await api('/auth/logout', { method: 'POST' });
  location.reload();
}

// ---------- Bootstrap ----------
async function initApp() {
  document.getElementById('userEmail').textContent = state.currentUser.name || state.currentUser.email;
  document.getElementById('logoutLink').onclick = (e) => { e.preventDefault(); logout(); };

  state.businesses = await api('/businesses');
  if (state.businesses.length === 0) {
    return renderNoBusiness();
  }
  if (!state.currentBusinessId) state.currentBusinessId = state.businesses[0].id;
  renderBusinessSelect();
  await loadBusinessData();
  render();
}

function renderBusinessSelect() {
  const sel = $('#businessSelect');
  sel.innerHTML = state.businesses.map(b =>
    `<option value="${b.id}" ${b.id === state.currentBusinessId ? 'selected' : ''}>${escapeHtml(b.name)}</option>`
  ).join('');
  sel.onchange = async () => {
    state.currentBusinessId = sel.value;
    await loadBusinessData();
    render();
  };
}

async function loadBusinessData() {
  state.accounts = await api('/accounts?business_id=' + state.currentBusinessId);
  state.statements = await api('/statements?business_id=' + state.currentBusinessId);
}

$('#newBusinessBtn').onclick = async () => {
  const name = prompt('Business name:');
  if (!name) return;
  const entity_type = prompt('Entity type (sole_prop / llc / s_corp) — optional:') || null;
  const b = await api('/businesses', { method: 'POST', body: JSON.stringify({ name, entity_type }) });
  state.businesses.push(b);
  state.currentBusinessId = b.id;
  renderBusinessSelect();
  await loadBusinessData();
  render();
};

$('#practiceBtn').onclick = renderPracticeOverview;

async function renderPracticeOverview() {
  document.querySelectorAll('#tabs button').forEach(b => b.classList.remove('active'));
  main.innerHTML = `<h1 class="page-title">All Clients</h1><p class="page-sub">Loading…</p>`;
  const overview = await api('/practice/overview');

  main.innerHTML = `
    <h1 class="page-title">All Clients</h1>
    <p class="page-sub">A practice-wide view across every business you manage.</p>
    <div class="card">
      ${overview.length ? `
        <table class="ledger">
          <thead><tr><th>Client</th><th>Entity</th><th class="amount">Net Profit</th><th class="amount">A/R Outstanding</th><th class="amount">Uncategorized</th><th class="amount">Unreconciled</th><th class="amount">Overdue Invoices</th><th></th></tr></thead>
          <tbody>
            ${overview.map(b => `
              <tr>
                <td style="font-weight:500;">${escapeHtml(b.name)} ${b.needs_attention > 0 ? `<span class="badge uncertain" style="margin-left:6px;">${b.needs_attention} to review</span>` : ''}</td>
                <td style="color:var(--ink-soft); font-size:12.5px;">${b.entity_type || '—'}</td>
                <td class="amount ${b.net_profit >= 0 ? 'positive' : 'negative'}">${fmt(b.net_profit)}</td>
                <td class="amount">${fmt(b.ar_outstanding)}</td>
                <td class="amount">${b.uncategorized_count}</td>
                <td class="amount">${b.unreconciled_count}</td>
                <td class="amount">${b.overdue_invoice_count}</td>
                <td style="text-align:right;"><button class="btn secondary" style="padding:4px 10px; font-size:12px;" onclick="switchToBusiness('${b.id}')">Open →</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `<div class="empty-state"><div class="glyph">§</div>No clients yet.</div>`}
    </div>
  `;
}

async function switchToBusiness(id) {
  state.currentBusinessId = id;
  renderBusinessSelect();
  await loadBusinessData();
  document.querySelectorAll('#tabs button').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-tab=dashboard]').classList.add('active');
  state.tab = 'dashboard';
  render();
}

document.querySelectorAll('#tabs button').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('#tabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.tab = btn.dataset.tab;
    render();
  };
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderNoBusiness() {
  main.innerHTML = `
    <h1 class="page-title">Welcome to Ledgerline</h1>
    <p class="page-sub">Create your first business to start bookkeeping.</p>
    <div class="card">
      <button class="btn" onclick="document.getElementById('newBusinessBtn').click()">+ Create a business</button>
    </div>`;
}

// ---------- Router ----------
function render() {
  if (!state.currentBusinessId) return renderNoBusiness();
  const renderers = {
    dashboard: renderDashboard,
    accounts: renderAccounts,
    invoicing: renderInvoicing,
    import: renderImport,
    transactions: renderTransactions,
    reconciliation: renderReconciliation,
    reports: renderReports,
    taxes: renderTaxes,
    team: renderTeam,
  };
  renderers[state.tab]();
}

// ---------- Dashboard ----------
async function renderDashboard() {
  main.innerHTML = `<h1 class="page-title">Dashboard</h1><p class="page-sub">Loading…</p>`;
  const pl = await api(`/reports/pl?business_id=${state.currentBusinessId}`);
  const txns = await api(`/transactions?business_id=${state.currentBusinessId}`);
  const unreconciled = txns.filter(t => !t.is_reconciled).length;
  const uncategorized = txns.filter(t => t.account_name === 'Uncategorized').length;

  main.innerHTML = `
    <h1 class="page-title">Dashboard</h1>
    <p class="page-sub">${escapeHtml(state.businesses.find(b => b.id === state.currentBusinessId).name)}</p>

    <div class="card">
      <div class="stat-grid">
        <div class="stat"><div class="label">Net Profit (all time)</div><div class="value">${fmt(pl.net_profit)}</div></div>
        <div class="stat"><div class="label">Income</div><div class="value">${fmt(pl.total_income)}</div></div>
        <div class="stat negative"><div class="label">Expenses</div><div class="value">${fmt(pl.total_expenses)}</div></div>
      </div>
    </div>

    <div class="card-row">
      <div class="card">
        <h2>Needs attention</h2>
        <div class="pl-line"><span>Unreconciled transactions</span><span class="amt">${unreconciled}</span></div>
        <div class="pl-line"><span>Uncategorized transactions</span><span class="amt">${uncategorized}</span></div>
        <div class="pl-line"><span>Statements imported</span><span class="amt">${state.statements.length}</span></div>
      </div>
      <div class="card">
        <h2>Quick start</h2>
        <p style="color:var(--ink-soft); font-size:13px;">Paste a bank statement to get transactions auto-categorized, then review and reconcile.</p>
        <button class="btn" onclick="state.tab='import'; document.querySelector('[data-tab=import]').click()">Import a statement</button>
      </div>
    </div>
  `;
}

// ---------- Chart of Accounts ----------
function renderAccounts() {
  const byType = { asset: [], liability: [], equity: [], income: [], expense: [] };
  state.accounts.forEach(a => byType[a.type].push(a));
  const typeLabels = { asset: 'Assets', liability: 'Liabilities', equity: 'Equity', income: 'Income', expense: 'Expenses' };

  main.innerHTML = `
    <h1 class="page-title">Chart of Accounts</h1>
    <p class="page-sub">The categories every transaction gets sorted into.</p>

    <div class="card">
      <h2>Add account</h2>
      <div class="field-row">
        <div class="field"><label class="field-label">Name</label><input type="text" id="acctName" placeholder="e.g. Client Revenue"></div>
        <div class="field" style="max-width:180px;">
          <label class="field-label">Type</label>
          <select class="form-input" id="acctType">
            <option value="asset">Asset</option>
            <option value="liability">Liability</option>
            <option value="equity">Equity</option>
            <option value="income">Income</option>
            <option value="expense" selected>Expense</option>
          </select>
        </div>
        <div class="field" style="max-width:120px; align-self:flex-end;">
          <button class="btn" id="addAcctBtn">Add</button>
        </div>
      </div>
    </div>

    ${Object.keys(typeLabels).map(type => `
      <div class="card">
        <h2>${typeLabels[type]}</h2>
        ${byType[type].length ? `
          <table class="ledger">
            <thead><tr><th>Name</th><th>Schedule C</th><th></th></tr></thead>
            <tbody>
              ${byType[type].map(a => `
                <tr>
                  <td>${escapeHtml(a.name)}</td>
                  <td style="color:var(--ink-soft); font-family:var(--font-mono); font-size:12px;">${a.schedule_c_line || '—'}</td>
                  <td style="text-align:right;"><button class="btn secondary" style="padding:4px 10px; font-size:12px;" onclick="deleteAccount('${a.id}')">Remove</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `<p style="color:var(--ink-soft); font-size:13px;">No accounts yet.</p>`}
      </div>
    `).join('')}
  `;

  $('#addAcctBtn').onclick = async () => {
    const name = $('#acctName').value.trim();
    const type = $('#acctType').value;
    if (!name) return toast('Enter an account name', true);
    try {
      await api('/accounts', { method: 'POST', body: JSON.stringify({ business_id: state.currentBusinessId, name, type }) });
      state.accounts = await api('/accounts?business_id=' + state.currentBusinessId);
      toast('Account added');
      renderAccounts();
    } catch (e) { toast(e.message, true); }
  };
}

async function deleteAccount(id) {
  if (!confirm('Remove this account? Existing transactions keep their category.')) return;
  await api('/accounts/' + id, { method: 'DELETE' });
  state.accounts = await api('/accounts?business_id=' + state.currentBusinessId);
  renderAccounts();
}

// ---------- Team & Access ----------
async function renderTeam() {
  main.innerHTML = `<h1 class="page-title">Team &amp; Access</h1><p class="page-sub">Loading…</p>`;
  const members = await api(`/businesses/${state.currentBusinessId}/members`);
  const myMembership = members.find(m => m.user_id === state.currentUser.id);
  const isOwner = myMembership && myMembership.role === 'owner';

  const roleNote = {
    owner: 'Full control, including inviting/removing people.',
    member: 'Full read/write access to this business.',
    client: 'View-only — can see dashboards, invoices, and reports, but cannot edit anything.',
  };

  main.innerHTML = `
    <h1 class="page-title">Team &amp; Access</h1>
    <p class="page-sub">Who can see and edit ${escapeHtml(state.businesses.find(b => b.id === state.currentBusinessId).name)}.</p>

    <div class="card">
      <h2>Members</h2>
      <table class="ledger">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead>
        <tbody>
          ${members.map(m => `
            <tr>
              <td>${escapeHtml(m.name || '—')}</td>
              <td>${escapeHtml(m.email)}</td>
              <td><span class="badge" style="background:var(--ledger-green-tint); color:var(--ledger-green-dark); padding:4px 8px;">${m.role}</span></td>
              <td style="text-align:right;">
                ${isOwner && m.user_id !== state.currentUser.id ? `<button class="btn secondary" style="padding:4px 10px; font-size:12px;" onclick="removeMember('${m.id}')">Remove</button>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    ${isOwner ? `
    <div class="card">
      <h2>Invite someone</h2>
      <p style="font-size:12.5px; color:var(--ink-soft); margin-bottom:12px;">They need a Ledgerline account already — ask them to sign up first, then invite by email.</p>
      <div class="field-row">
        <div class="field"><label class="field-label">Email</label><input type="text" id="inviteEmail" placeholder="colleague@example.com"></div>
        <div class="field" style="max-width:180px;">
          <label class="field-label">Role</label>
          <select class="form-input" id="inviteRole">
            <option value="member">Member (full access)</option>
            <option value="client">Client (view-only)</option>
            <option value="owner">Owner (full control)</option>
          </select>
        </div>
        <div class="field" style="align-self:flex-end;"><button class="btn" id="inviteBtn">Invite</button></div>
      </div>
    </div>
    ` : ''}

    <div class="card">
      <h2>What each role can do</h2>
      ${Object.entries(roleNote).map(([role, note]) => `<div class="pl-line"><span style="text-transform:capitalize;">${role}</span><span class="amt" style="font-family:var(--font-body); font-size:12.5px; text-align:right; max-width:340px;">${note}</span></div>`).join('')}
    </div>
  `;

  if (isOwner) {
    $('#inviteBtn').onclick = async () => {
      const email = $('#inviteEmail').value.trim();
      const role = $('#inviteRole').value;
      if (!email) return toast('Enter an email', true);
      try {
        await api(`/businesses/${state.currentBusinessId}/members`, { method: 'POST', body: JSON.stringify({ email, role }) });
        toast('Invited');
        renderTeam();
      } catch (e) { toast(e.message, true); }
    };
  }
}

async function removeMember(memberId) {
  if (!confirm('Remove this person\'s access?')) return;
  await api(`/businesses/${state.currentBusinessId}/members/${memberId}`, { method: 'DELETE' });
  toast('Removed');
  renderTeam();
}

// ---------- Estimated Taxes ----------
async function renderTaxes() {
  main.innerHTML = `<h1 class="page-title">Estimated Taxes</h1><p class="page-sub">Loading…</p>`;
  const business = state.businesses.find(b => b.id === state.currentBusinessId);
  const year = new Date().getFullYear();

  if (!business.filing_status) {
    return renderTaxSettingsForm(business, year);
  }

  const est = await api(`/reports/tax-estimate?business_id=${state.currentBusinessId}&year=${year}`);

  main.innerHTML = `
    <h1 class="page-title">Estimated Taxes</h1>
    <p class="page-sub">${year} quarterly estimate for ${escapeHtml(business.name)} — ${est.filing_status.replace('_',' ')}${est.state ? ', ' + est.state : ''}
      <a href="#" onclick="renderTaxSettingsForm(state.businesses.find(b=>b.id===state.currentBusinessId), ${year}); return false;" style="color:var(--ledger-green); margin-left:8px;">(edit)</a>
    </p>

    <div class="card">
      <div class="stat-grid">
        <div class="stat"><div class="label">Net Profit YTD</div><div class="value">${fmt(est.net_profit_ytd)}</div></div>
        <div class="stat negative"><div class="label">Total Est. Tax</div><div class="value">${fmt(est.total_estimated_tax)}</div></div>
        <div class="stat"><div class="label">Effective Rate</div><div class="value">${est.effective_rate}%</div></div>
      </div>
    </div>

    <div class="card-row">
      <div class="card">
        <h2>Breakdown</h2>
        <div class="pl-line"><span>Self-employment tax</span><span class="amt">${fmt(est.self_employment_tax)}</span></div>
        <div class="pl-line"><span>Federal income tax</span><span class="amt">${fmt(est.federal_income_tax)}</span></div>
        ${est.state ? `<div class="pl-line"><span>State income tax (${est.state})</span><span class="amt">${est.state_tax_available ? fmt(est.state_income_tax) : 'not available for this state'}</span></div>` : ''}
        <div class="pl-total"><span>Total</span><span>${fmt(est.total_estimated_tax)}</span></div>
      </div>
      <div class="card">
        <h2>Quarterly payments</h2>
        ${est.quarters.map(q => `<div class="pl-line"><span>${q.quarter} — due ${q.due}</span><span class="amt">${fmt(q.amount)}</span></div>`).join('')}
      </div>
    </div>

    <p style="font-size:11.5px; color:var(--ink-soft); max-width:640px;">${est.disclaimer}</p>
  `;
}

function renderTaxSettingsForm(business, year) {
  main.innerHTML = `
    <h1 class="page-title">Estimated Taxes</h1>
    <p class="page-sub">Set filing status to calculate ${year} quarterly estimates for ${escapeHtml(business.name)}.</p>
    <div class="card">
      <div class="field-row">
        <div class="field">
          <label class="field-label">Filing status</label>
          <select class="form-input" id="taxFilingStatus">
            <option value="single">Single</option>
            <option value="married_joint">Married filing jointly</option>
            <option value="head_of_household">Head of household</option>
          </select>
        </div>
        <div class="field"><label class="field-label">State (optional)</label><input type="text" id="taxState" placeholder="e.g. CA" maxlength="2"></div>
      </div>
      <button class="btn" id="saveTaxSettingsBtn">Save &amp; calculate</button>
    </div>
  `;
  $('#saveTaxSettingsBtn').onclick = async () => {
    const updated = await api('/businesses/' + business.id, {
      method: 'PATCH',
      body: JSON.stringify({ filing_status: $('#taxFilingStatus').value, state: $('#taxState').value.trim().toUpperCase() || null }),
    });
    const idx = state.businesses.findIndex(b => b.id === business.id);
    state.businesses[idx] = updated;
    renderTaxes();
  };
}

// ---------- Invoicing / AR ----------
state.invoiceView = { mode: 'list' }; // {mode:'list'} | {mode:'new'} | {mode:'detail', id}
let clientsCache = [];

async function renderInvoicing() {
  main.innerHTML = `<h1 class="page-title">Invoicing</h1><p class="page-sub">Loading…</p>`;
  clientsCache = await api('/clients?business_id=' + state.currentBusinessId);

  if (state.invoiceView.mode === 'new') return renderInvoiceForm();
  if (state.invoiceView.mode === 'detail') return renderInvoiceDetail(state.invoiceView.id);
  return renderInvoiceList();
}

async function renderInvoiceList() {
  const invoices = await api('/invoices?business_id=' + state.currentBusinessId);
  const aging = await api('/reports/ar-aging?business_id=' + state.currentBusinessId);

  const statusColor = s => ({
    draft: 'var(--ink-soft)', sent: 'var(--ochre)', partial: 'var(--ochre)',
    paid: 'var(--ledger-green)', overdue: 'var(--brick)', void: 'var(--ink-soft)',
  }[s] || 'var(--ink-soft)');

  main.innerHTML = `
    <h1 class="page-title">Invoicing</h1>
    <p class="page-sub">Bill clients and track what's owed.</p>

    <div class="card-row">
      <div class="card">
        <h2>Outstanding (A/R)</h2>
        <div class="stat"><div class="label">Total unpaid</div><div class="value">${fmt(aging.total_outstanding)}</div></div>
      </div>
      <div class="card">
        <h2>Aging</h2>
        ${Object.entries(aging.buckets).map(([b, v]) => `<div class="pl-line"><span>${b} days</span><span class="amt">${fmt(v)}</span></div>`).join('')}
      </div>
    </div>

    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h2 style="margin:0;">Invoices</h2>
        <div style="display:flex; gap:8px;">
          <a class="btn secondary" style="padding:8px 14px; font-size:12.5px; text-decoration:none; display:inline-block;" href="/api/exports/invoices.csv?business_id=${state.currentBusinessId}">Export CSV</a>
          <button class="btn secondary" id="manageClientsBtn">Manage clients</button>
          <button class="btn" id="newInvoiceBtn">+ New invoice</button>
        </div>
      </div>
      ${invoices.length ? `
        <table class="ledger">
          <thead><tr><th>#</th><th>Client</th><th>Issued</th><th>Due</th><th class="amount">Total</th><th class="amount">Balance</th><th>Status</th></tr></thead>
          <tbody>
            ${invoices.map(inv => `
              <tr style="cursor:pointer;" onclick="openInvoice('${inv.id}')">
                <td class="date">${inv.invoice_number}</td>
                <td>${escapeHtml(inv.client ? inv.client.name : '—')}</td>
                <td class="date">${inv.issue_date}</td>
                <td class="date">${inv.due_date || '—'}</td>
                <td class="amount">${fmt(inv.total)}</td>
                <td class="amount ${inv.balance_due > 0 ? 'negative' : 'positive'}">${fmt(inv.balance_due)}</td>
                <td><span class="badge" style="background:transparent; border:1px solid ${statusColor(inv.status)}; color:${statusColor(inv.status)};">${inv.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `<div class="empty-state"><div class="glyph">§</div>No invoices yet.</div>`}
    </div>
  `;

  $('#newInvoiceBtn').onclick = () => { state.invoiceView = { mode: 'new' }; renderInvoicing(); };
  $('#manageClientsBtn').onclick = openClientManager;
}

function openInvoice(id) {
  state.invoiceView = { mode: 'detail', id };
  renderInvoicing();
}

async function openClientManager() {
  const name = prompt('New client name (leave blank to cancel):');
  if (!name) return;
  const email = prompt('Client email (optional):') || null;
  try {
    await api('/clients', { method: 'POST', body: JSON.stringify({ business_id: state.currentBusinessId, name, email }) });
    toast('Client added');
    renderInvoicing();
  } catch (e) { toast(e.message, true); }
}

function renderInvoiceForm() {
  const revenueAccounts = state.accounts.filter(a => a.type === 'income');
  main.innerHTML = `
    <h1 class="page-title">New Invoice</h1>
    <p class="page-sub"><a href="#" onclick="state.invoiceView={mode:'list'}; renderInvoicing(); return false;" style="color:var(--ledger-green);">← Back to invoices</a></p>

    <div class="card">
      <div class="field-row">
        <div class="field">
          <label class="field-label">Client</label>
          <select class="form-input" id="invClient">
            <option value="">— select —</option>
            ${clientsCache.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label class="field-label">Issue date</label><input type="date" id="invIssueDate" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="field"><label class="field-label">Due date</label><input type="date" id="invDueDate"></div>
        <div class="field">
          <label class="field-label">Revenue account</label>
          <select class="form-input" id="invRevenueAccount">
            ${revenueAccounts.map(a => `<option value="${a.id}" ${a.name === 'Client Revenue' ? 'selected' : ''}>${escapeHtml(a.name)}</option>`).join('')}
          </select>
        </div>
      </div>

      ${clientsCache.length === 0 ? `<p style="font-size:12.5px; color:var(--ochre);">No clients yet — <a href="#" onclick="openClientManager(); return false;" style="color:var(--ledger-green);">add one first</a>.</p>` : ''}

      <label class="field-label" style="margin-top:10px;">Line items</label>
      <table class="ledger" id="lineItemsTable">
        <thead><tr><th>Description</th><th style="width:90px;">Qty</th><th style="width:110px;">Rate</th><th class="amount" style="width:110px;">Amount</th><th></th></tr></thead>
        <tbody id="lineItemsBody"></tbody>
      </table>
      <button class="btn secondary" id="addLineBtn" style="margin-top:8px; padding:6px 12px; font-size:12.5px;">+ Add line</button>

      <div style="text-align:right; margin-top:16px; font-family:var(--font-display); font-size:20px; font-weight:600;">
        Total: <span id="invTotalDisplay">$0.00</span>
      </div>

      <div class="field" style="margin-top:14px;">
        <label class="field-label">Notes (optional)</label>
        <input type="text" id="invNotes" placeholder="Payment terms, thank-you note, etc.">
      </div>

      <button class="btn" id="saveInvoiceBtn" style="margin-top:6px;">Create invoice</button>
    </div>
  `;

  const body = $('#lineItemsBody');
  function addLine(desc = '', qty = 1, rate = 0) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" class="li-desc" value="${escapeHtml(desc)}" placeholder="Consulting services"></td>
      <td><input type="number" class="li-qty" value="${qty}" step="0.01" style="width:100%;"></td>
      <td><input type="number" class="li-rate" value="${rate}" step="0.01" style="width:100%;"></td>
      <td class="amount li-amount">$0.00</td>
      <td><button class="btn secondary" style="padding:3px 8px; font-size:11px;" onclick="this.closest('tr').remove(); recalcInvoiceTotal();">✕</button></td>
    `;
    body.appendChild(row);
    row.querySelectorAll('.li-qty, .li-rate').forEach(inp => inp.addEventListener('input', recalcInvoiceTotal));
    recalcInvoiceTotal();
  }
  window.recalcInvoiceTotal = function () {
    let total = 0;
    body.querySelectorAll('tr').forEach(row => {
      const qty = parseFloat(row.querySelector('.li-qty').value) || 0;
      const rate = parseFloat(row.querySelector('.li-rate').value) || 0;
      const amt = qty * rate;
      row.querySelector('.li-amount').textContent = fmt(amt);
      total += amt;
    });
    $('#invTotalDisplay').textContent = fmt(total);
  };
  addLine();
  $('#addLineBtn').onclick = () => addLine();

  $('#saveInvoiceBtn').onclick = async () => {
    const client_id = $('#invClient').value;
    if (!client_id) return toast('Select a client', true);
    const line_items = Array.from(body.querySelectorAll('tr')).map(row => ({
      description: row.querySelector('.li-desc').value.trim(),
      quantity: parseFloat(row.querySelector('.li-qty').value) || 0,
      rate: parseFloat(row.querySelector('.li-rate').value) || 0,
    })).filter(li => li.description);
    if (!line_items.length) return toast('Add at least one line item', true);

    try {
      const inv = await api('/invoices', {
        method: 'POST',
        body: JSON.stringify({
          business_id: state.currentBusinessId,
          client_id,
          issue_date: $('#invIssueDate').value,
          due_date: $('#invDueDate').value || null,
          revenue_account_id: $('#invRevenueAccount').value || null,
          notes: $('#invNotes').value.trim() || null,
          line_items,
        }),
      });
      toast('Invoice created');
      state.invoiceView = { mode: 'detail', id: inv.id };
      renderInvoicing();
    } catch (e) { toast(e.message, true); }
  };
}

async function renderInvoiceDetail(id) {
  const inv = await api('/invoices/' + id);
  main.innerHTML = `
    <h1 class="page-title">Invoice ${inv.invoice_number}</h1>
    <p class="page-sub"><a href="#" onclick="state.invoiceView={mode:'list'}; renderInvoicing(); return false;" style="color:var(--ledger-green);">← Back to invoices</a></p>

    <div class="card-row">
      <div class="card">
        <h2>Bill to</h2>
        <p style="margin:0 0 4px; font-weight:500;">${escapeHtml(inv.client ? inv.client.name : '—')}</p>
        <p style="margin:0; color:var(--ink-soft); font-size:12.5px;">${escapeHtml(inv.client && inv.client.email || '')}</p>
      </div>
      <div class="card">
        <h2>Details</h2>
        <div class="pl-line"><span>Issued</span><span class="amt">${inv.issue_date}</span></div>
        <div class="pl-line"><span>Due</span><span class="amt">${inv.due_date || '—'}</span></div>
        <div class="pl-line"><span>Status</span><span class="amt">
          <select class="form-input" id="statusSelect" style="width:auto; padding:4px 8px;">
            ${['draft','sent','partial','paid','overdue','void'].map(s => `<option value="${s}" ${s === inv.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </span></div>
      </div>
    </div>

    <div class="card">
      <h2>Line items</h2>
      <table class="ledger">
        <thead><tr><th>Description</th><th class="amount">Qty</th><th class="amount">Rate</th><th class="amount">Amount</th></tr></thead>
        <tbody>
          ${inv.line_items.map(li => `
            <tr><td>${escapeHtml(li.description)}</td><td class="amount">${li.quantity}</td><td class="amount">${fmt(li.rate)}</td><td class="amount">${fmt(li.quantity * li.rate)}</td></tr>
          `).join('')}
        </tbody>
      </table>
      <div class="pl-total"><span>Total</span><span>${fmt(inv.total)}</span></div>
      <div class="pl-line"><span>Paid</span><span class="amt">${fmt(inv.total - inv.balance_due)}</span></div>
      <div class="pl-line" style="font-weight:600;"><span>Balance due</span><span class="amt">${fmt(inv.balance_due)}</span></div>
    </div>

    <div class="card-row">
      <div class="card">
        <h2>Payments</h2>
        ${inv.payments.length ? inv.payments.map(p => `<div class="pl-line"><span>${p.date}${p.method ? ' — ' + escapeHtml(p.method) : ''}</span><span class="amt">${fmt(p.amount)}</span></div>`).join('') : '<p style="color:var(--ink-soft); font-size:13px;">No payments recorded.</p>'}
      </div>
      ${inv.balance_due > 0.001 ? `
      <div class="card">
        <h2>Record payment</h2>
        <div class="field"><label class="field-label">Date</label><input type="date" id="payDate" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="field"><label class="field-label">Amount</label><input type="number" step="0.01" id="payAmount" value="${inv.balance_due.toFixed(2)}"></div>
        <div class="field"><label class="field-label">Method (optional)</label><input type="text" id="payMethod" placeholder="ACH, check, card…"></div>
        <label style="display:flex; align-items:center; gap:6px; font-size:12.5px; margin-bottom:10px;">
          <input type="checkbox" id="payPostLedger" checked> Also post to the ledger as Client Revenue
        </label>
        <button class="btn" id="recordPayBtn">Record payment</button>
      </div>` : ''}
    </div>

    <div class="card">
      <h2>Send to client</h2>
      <div style="display:flex; gap:10px;">
        <a class="btn secondary" style="text-decoration:none;" href="/api/invoices/${inv.id}/pdf" target="_blank">Download PDF</a>
        <button class="btn" id="emailInvoiceBtn">Email to ${inv.client && inv.client.email ? escapeHtml(inv.client.email) : 'client'}</button>
      </div>
    </div>
  `;

  $('#statusSelect').onchange = async (e) => {
    await api('/invoices/' + id, { method: 'PATCH', body: JSON.stringify({ status: e.target.value }) });
    toast('Status updated');
  };

  const payBtn = $('#recordPayBtn');
  if (payBtn) {
    payBtn.onclick = async () => {
      const amount = parseFloat($('#payAmount').value);
      if (!amount) return toast('Enter a payment amount', true);
      try {
        await api(`/invoices/${id}/payments`, {
          method: 'POST',
          body: JSON.stringify({
            date: $('#payDate').value,
            amount,
            method: $('#payMethod').value.trim() || null,
            post_to_ledger: $('#payPostLedger').checked,
          }),
        });
        toast('Payment recorded');
        renderInvoiceDetail(id);
      } catch (e) { toast(e.message, true); }
    };
  }
}

// ---------- Import Statement ----------
function renderImport() {
  main.innerHTML = `
    <h1 class="page-title">Import Statement</h1>
    <p class="page-sub">Upload a file from your bank, or paste transactions directly. The AI will sort each into your Chart of Accounts.</p>

    <div class="card" id="plaidCard">
      <h2>Connect a bank (live sync)</h2>
      <p style="font-size:13px; color:var(--ink-soft);">Loading…</p>
    </div>

    <div class="card">
      <h2>Upload a file</h2>
      <p style="font-size:12.5px; color:var(--ink-soft); margin-bottom:12px;">Accepts a .csv export from your bank, or a .pdf statement.</p>
      <div class="field-row">
        <div class="field"><label class="field-label">Statement label</label><input type="text" id="fileStmtName" placeholder="e.g. Chase Checking — August 2026"></div>
        <div class="field"><label class="field-label">Statement ending balance (optional)</label><input type="number" step="0.01" id="fileStmtBalance" placeholder="e.g. 4210.55"></div>
      </div>
      <div class="field">
        <label class="field-label">File</label>
        <input type="file" id="stmtFile" accept=".csv,.txt,.pdf">
      </div>
      <button class="btn" id="uploadBtn">Upload &amp; categorize</button>
    </div>

    <div class="card">
      <h2>Or paste statement text</h2>
      <div class="field">
        <label class="field-label">Statement label</label>
        <input type="text" id="stmtName" placeholder="e.g. Chase Checking — August 2026">
      </div>
      <div class="field-row">
        <div class="field"><label class="field-label">Statement ending balance (optional, for reconciliation)</label><input type="number" step="0.01" id="stmtBalance" placeholder="e.g. 4210.55"></div>
      </div>
      <div class="field">
        <label class="field-label">Paste statement text</label>
        <textarea id="stmtText" placeholder="08/03/2026  AMAZON MKTPLACE PMTS   -42.19
08/04/2026  Client Payment - Acme LLC   1500.00
08/05/2026  STARBUCKS #4021   -6.75"></textarea>
      </div>
      <button class="btn" id="importBtn">Import &amp; categorize</button>
    </div>

    <div id="importResult"></div>
  `;

  renderPlaidCard();

  $('#uploadBtn').onclick = async () => {
    const fileInput = $('#stmtFile');
    if (!fileInput.files.length) return toast('Choose a file first', true);
    const btn = $('#uploadBtn');
    btn.disabled = true; btn.textContent = 'Categorizing…';
    try {
      const formData = new FormData();
      formData.append('file', fileInput.files[0]);
      formData.append('business_id', state.currentBusinessId);
      if ($('#fileStmtName').value.trim()) formData.append('source_name', $('#fileStmtName').value.trim());
      if ($('#fileStmtBalance').value) formData.append('statement_ending_balance', $('#fileStmtBalance').value);

      const res = await fetch('/api/statements/upload', { method: 'POST', credentials: 'include', body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Upload failed');

      state.statements = await api('/statements?business_id=' + state.currentBusinessId);
      renderImportResult(result);
      toast(`Imported ${result.transactions.length} transactions`);
    } catch (e) {
      toast(e.message, true);
    } finally {
      btn.disabled = false; btn.textContent = 'Upload & categorize';
    }
  };

  $('#importBtn').onclick = async () => {
    const statement_text = $('#stmtText').value.trim();
    if (!statement_text) return toast('Paste some transactions first', true);
    const btn = $('#importBtn');
    btn.disabled = true; btn.textContent = 'Categorizing…';
    try {
      const result = await api('/statements', {
        method: 'POST',
        body: JSON.stringify({
          business_id: state.currentBusinessId,
          source_name: $('#stmtName').value.trim() || null,
          statement_text,
          statement_ending_balance: $('#stmtBalance').value ? parseFloat($('#stmtBalance').value) : null,
        }),
      });
      state.statements = await api('/statements?business_id=' + state.currentBusinessId);
      renderImportResult(result);
      toast(`Imported ${result.transactions.length} transactions`);
    } catch (e) {
      toast(e.message, true);
    } finally {
      btn.disabled = false; btn.textContent = 'Import & categorize';
    }
  };
}

async function renderPlaidCard() {
  const status = await api('/plaid/status');
  const card = $('#plaidCard');

  if (!status.configured) {
    card.innerHTML = `
      <h2>Connect a bank (live sync)</h2>
      <p style="font-size:13px; color:var(--ink-soft);">
        Not set up yet — add <code>PLAID_CLIENT_ID</code> and <code>PLAID_SECRET</code> to your <code>.env</code>
        (Plaid's free sandbox keys work for testing) to enable one-click bank sync. Until then, paste statements below.
      </p>`;
    return;
  }

  const items = await api('/plaid/items?business_id=' + state.currentBusinessId);
  card.innerHTML = `
    <h2>Connect a bank (live sync)</h2>
    ${items.length ? items.map(i => `
      <div class="pl-line">
        <span>${escapeHtml(i.institution_name || 'Connected account')}</span>
        <button class="btn secondary" style="padding:4px 10px; font-size:12px;" onclick="syncPlaidItem('${i.id}')">Sync now</button>
      </div>
    `).join('') : `<p style="font-size:13px; color:var(--ink-soft);">No bank connected yet.</p>`}
    <button class="btn" id="plaidConnectBtn" style="margin-top:10px;">+ Connect a bank account</button>
  `;

  $('#plaidConnectBtn').onclick = async () => {
    try {
      const { link_token } = await api('/plaid/link-token', { method: 'POST', body: JSON.stringify({ business_id: state.currentBusinessId }) });
      const handler = Plaid.create({
        token: link_token,
        onSuccess: async (public_token, metadata) => {
          await api('/plaid/exchange-token', {
            method: 'POST',
            body: JSON.stringify({ business_id: state.currentBusinessId, public_token, institution_name: metadata.institution?.name }),
          });
          toast('Bank connected');
          renderPlaidCard();
        },
      });
      handler.open();
    } catch (e) { toast(e.message, true); }
  };
}

async function syncPlaidItem(itemId) {
  try {
    const result = await api('/plaid/sync', { method: 'POST', body: JSON.stringify({ business_id: state.currentBusinessId, item_id: itemId }) });
    toast(`Synced ${result.imported} new transactions`);
  } catch (e) { toast(e.message, true); }
}

function renderImportResult(result) {
  const rows = result.transactions;
  $('#importResult').innerHTML = `
    <div class="card">
      <h2>Review categorization</h2>
      ${result.skipped_lines.length ? `<p style="font-size:12px;color:var(--ochre);">${result.skipped_lines.length} line(s) couldn't be parsed and were skipped.</p>` : ''}
      <table class="ledger">
        <thead><tr><th>Date</th><th>Description</th><th class="amount">Amount</th><th>Category</th><th>AI confidence</th></tr></thead>
        <tbody>
          ${rows.map(t => `
            <tr>
              <td class="date">${t.date}</td>
              <td>${escapeHtml(t.description)}</td>
              <td class="amount ${t.amount >= 0 ? 'positive' : 'negative'}">${fmt(t.amount)}</td>
              <td>${accountSelectHtml(t)}</td>
              <td>${confidenceBadge(t.ai_confidence)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
  bindAccountSelects();
}

function confidenceBadge(c) {
  if (c === null || c === undefined) return '';
  if (c >= 0.75) return `<span class="badge confident">${Math.round(c * 100)}%</span>`;
  return `<span class="badge uncertain">${Math.round(c * 100)}% — check</span>`;
}

function accountSelectHtml(t) {
  const cls = t.account_name === 'Uncategorized' ? 'uncategorized' : (t.ai_confidence !== null && t.ai_confidence < 0.75 ? 'ai-low' : '');
  return `<select class="account-select ${cls}" data-txn-id="${t.id}">
    ${state.accounts.filter(a => ['income','expense'].includes(a.type) || a.id === t.account_id).map(a =>
      `<option value="${a.id}" ${a.id === t.account_id ? 'selected' : ''}>${escapeHtml(a.name)}</option>`
    ).join('')}
  </select>`;
}

function bindAccountSelects() {
  document.querySelectorAll('.account-select').forEach(sel => {
    sel.onchange = async () => {
      try {
        await api('/transactions/' + sel.dataset.txnId, { method: 'PATCH', body: JSON.stringify({ account_id: sel.value }) });
        sel.classList.remove('ai-low', 'uncategorized');
        toast('Category updated');
      } catch (e) { toast(e.message, true); }
    };
  });
}

// ---------- Transactions ----------
async function renderTransactions() {
  main.innerHTML = `<h1 class="page-title">Transactions</h1><p class="page-sub">Loading…</p>`;
  const txns = await api(`/transactions?business_id=${state.currentBusinessId}`);

  main.innerHTML = `
    <h1 class="page-title">Transactions</h1>
    <p class="page-sub">${txns.length} transactions across all statements. <a href="/api/exports/transactions.csv?business_id=${state.currentBusinessId}" style="color:var(--ledger-green);">Export CSV</a></p>

    <div class="card">
      <h2>Add manual entry</h2>
      <div class="field-row">
        <div class="field"><label class="field-label">Date</label><input type="date" id="manDate"></div>
        <div class="field" style="flex:2;"><label class="field-label">Description</label><input type="text" id="manDesc"></div>
        <div class="field"><label class="field-label">Amount</label><input type="number" step="0.01" id="manAmount" placeholder="-42.19 or 1500.00"></div>
        <div class="field" style="flex:1.4;">
          <label class="field-label">Category</label>
          <select class="form-input" id="manAccount">
            ${state.accounts.map(a => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field" style="align-self:flex-end;"><button class="btn" id="manAddBtn">Add</button></div>
      </div>
    </div>

    <div class="card">
      ${txns.length ? `
        <table class="ledger">
          <thead><tr><th>Date</th><th>Description</th><th class="amount">Amount</th><th>Category</th><th>Reconciled</th><th></th></tr></thead>
          <tbody>
            ${txns.map(t => `
              <tr>
                <td class="date">${t.date}</td>
                <td>${escapeHtml(t.description)}</td>
                <td class="amount ${t.amount >= 0 ? 'positive' : 'negative'}">${fmt(t.amount)}</td>
                <td>${accountSelectHtml(t)}</td>
                <td style="text-align:center;">${t.is_reconciled ? '✓' : '—'}</td>
                <td style="text-align:right;"><button class="btn secondary" style="padding:4px 10px; font-size:12px;" onclick="deleteTxn('${t.id}')">Delete</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `<div class="empty-state"><div class="glyph">§</div>No transactions yet. Import a statement or add one manually.</div>`}
    </div>
  `;
  bindAccountSelects();

  $('#manAddBtn').onclick = async () => {
    const date = $('#manDate').value, description = $('#manDesc').value.trim(), amount = $('#manAmount').value;
    if (!date || !description || !amount) return toast('Fill in date, description, and amount', true);
    try {
      await api('/transactions', {
        method: 'POST',
        body: JSON.stringify({ business_id: state.currentBusinessId, date, description, amount: parseFloat(amount), account_id: $('#manAccount').value }),
      });
      toast('Transaction added');
      renderTransactions();
    } catch (e) { toast(e.message, true); }
  };
}

async function deleteTxn(id) {
  if (!confirm('Delete this transaction?')) return;
  await api('/transactions/' + id, { method: 'DELETE' });
  renderTransactions();
}

// ---------- Reconciliation ----------
async function renderReconciliation() {
  main.innerHTML = `<h1 class="page-title">Reconciliation</h1><p class="page-sub">Loading…</p>`;

  if (state.statements.length === 0) {
    main.innerHTML = `
      <h1 class="page-title">Reconciliation</h1>
      <div class="empty-state"><div class="glyph">§</div>Import a statement first to reconcile it.</div>`;
    return;
  }

  main.innerHTML = `
    <h1 class="page-title">Reconciliation</h1>
    <p class="page-sub">Match each imported statement's transactions against its ending balance, then lock the period.</p>
    <div class="field" style="max-width:360px;">
      <label class="field-label">Statement</label>
      <select class="form-input" id="reconStmtSelect">
        ${state.statements.map(s => `<option value="${s.id}">${escapeHtml(s.source_name || 'Statement')} (${s.period_start} → ${s.period_end})</option>`).join('')}
      </select>
    </div>
    <div id="reconBody"></div>
  `;

  $('#reconStmtSelect').onchange = loadReconciliation;
  await loadReconciliation();
}

async function loadReconciliation() {
  const statementId = $('#reconStmtSelect').value;
  const summary = await api(`/reconciliation/summary?business_id=${state.currentBusinessId}&statement_id=${statementId}`);
  const txns = await api(`/transactions?business_id=${state.currentBusinessId}&statement_id=${statementId}`);
  const isLocked = txns.length && txns[0].is_reconciled;

  const statusHtml = summary.matches_statement === null
    ? `<div class="recon-strip">No ending balance was entered for this statement — add one on import to auto-check the match.</div>`
    : summary.matches_statement
      ? `<div class="recon-strip match">✓ Transactions net to ${fmt(summary.net_change)}, matching the statement ending balance.</div>`
      : `<div class="recon-strip mismatch">⚠ Transactions net to ${fmt(summary.net_change)}, statement says ${fmt(summary.statement.statement_ending_balance)}. Review before locking.</div>`;

  $('#reconBody').innerHTML = `
    <div class="card">
      <div class="stat-grid">
        <div class="stat"><div class="label">Transactions</div><div class="value">${summary.transaction_count}</div></div>
        <div class="stat"><div class="label">Net change</div><div class="value">${fmt(summary.net_change)}</div></div>
        <div class="stat"><div class="label">Status</div><div class="value" style="font-size:18px;">${isLocked ? 'Locked' : 'Open'}</div></div>
      </div>
      ${statusHtml}
      ${isLocked
        ? `<p style="color:var(--ink-soft); font-size:13px;">This period is reconciled and locked.</p>`
        : `<button class="btn" id="lockBtn">Lock &amp; mark reconciled</button>`}
    </div>
    <div class="card">
      <table class="ledger">
        <thead><tr><th>Date</th><th>Description</th><th class="amount">Amount</th><th>Category</th></tr></thead>
        <tbody>
          ${txns.map(t => `
            <tr>
              <td class="date">${t.date}</td>
              <td>${escapeHtml(t.description)}</td>
              <td class="amount ${t.amount >= 0 ? 'positive' : 'negative'}">${fmt(t.amount)}</td>
              <td>${escapeHtml(t.account_name || 'Uncategorized')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  if (!isLocked) {
    $('#lockBtn').onclick = async () => {
      if (!confirm('Lock this period? Transactions will be marked reconciled.')) return;
      await api('/reconciliation/lock', { method: 'POST', body: JSON.stringify({ business_id: state.currentBusinessId, statement_id: statementId }) });
      toast('Period locked');
      loadReconciliation();
    };
  }
}

// ---------- Reports ----------
async function renderReports() {
  main.innerHTML = `<h1 class="page-title">Reports</h1><p class="page-sub">Loading…</p>`;
  const pl = await api(`/reports/pl?business_id=${state.currentBusinessId}`);
  const bs = await api(`/reports/balance-sheet?business_id=${state.currentBusinessId}`);

  main.innerHTML = `
    <h1 class="page-title">Reports</h1>
    <p class="page-sub">All-time figures. <a href="/api/exports/pl.csv?business_id=${state.currentBusinessId}" style="color:var(--ledger-green);">Export P&amp;L CSV</a></p>

    <div class="card-row">
      <div class="card">
        <h2>Profit &amp; Loss</h2>
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:var(--ink-soft); margin-bottom:6px;">Income</div>
        ${pl.income.map(r => `<div class="pl-line"><span>${escapeHtml(r.account_name)}</span><span class="amt">${fmt(r.total)}</span></div>`).join('') || '<div class="pl-line"><span>—</span><span class="amt">$0.00</span></div>'}
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:var(--ink-soft); margin:14px 0 6px;">Expenses</div>
        ${pl.expenses.map(r => `<div class="pl-line"><span>${escapeHtml(r.account_name)}</span><span class="amt">${fmt(Math.abs(r.total))}</span></div>`).join('') || '<div class="pl-line"><span>—</span><span class="amt">$0.00</span></div>'}
        <div class="pl-total"><span>Net Profit</span><span>${fmt(pl.net_profit)}</span></div>
      </div>

      <div class="card">
        <h2>Balance Sheet</h2>
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:var(--ink-soft); margin-bottom:6px;">Assets</div>
        ${bs.assets.map(r => `<div class="pl-line"><span>${escapeHtml(r.account_name)}</span><span class="amt">${fmt(r.total)}</span></div>`).join('') || '<div class="pl-line"><span>—</span><span class="amt">$0.00</span></div>'}
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:var(--ink-soft); margin:14px 0 6px;">Liabilities</div>
        ${bs.liabilities.map(r => `<div class="pl-line"><span>${escapeHtml(r.account_name)}</span><span class="amt">${fmt(r.total)}</span></div>`).join('') || '<div class="pl-line"><span>—</span><span class="amt">$0.00</span></div>'}
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:var(--ink-soft); margin:14px 0 6px;">Equity</div>
        ${bs.equity.map(r => `<div class="pl-line"><span>${escapeHtml(r.account_name)}</span><span class="amt">${fmt(r.total)}</span></div>`).join('') || '<div class="pl-line"><span>—</span><span class="amt">$0.00</span></div>'}
        <div class="pl-total"><span>Total Assets</span><span>${fmt(bs.total_assets)}</span></div>
      </div>
    </div>
  `;
}

init();
