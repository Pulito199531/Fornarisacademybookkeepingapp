const state = {
  currentUser: null,
  businesses: [],
  currentBusinessId: null,
  accounts: [],
  statements: [],
  tab: 'dashboard',
  lang: localStorage.getItem('lang') || 'en',
};

const $ = sel => document.querySelector(sel);
const main = $('#main');

// ---------- i18n ----------
// t(str) looks up the Spanish translation for the given English source string.
// If no translation exists, or the language is English, it returns the string
// unchanged — so wrapping any literal with t("...") is always safe.
const ES = {
  "Sign in": "Iniciar sesión", "Create an account": "Crear una cuenta",
  "Name": "Nombre", "Email": "Correo electrónico", "Password": "Contraseña",
  "At least 8 characters": "Al menos 8 caracteres",
  "New here? ": "¿Nuevo aquí? ", "Already have an account? ": "¿Ya tienes una cuenta? ",
  "Sign out": "Cerrar sesión", "All clients overview": "Resumen de todos los clientes",
  "Business": "Negocio", "New business": "Nuevo negocio",
  "Dashboard": "Panel", "Chart of Accounts": "Plan de Cuentas", "Invoicing": "Facturación",
  "Import Statement": "Importar Estado de Cuenta", "Transactions": "Transacciones",
  "Reconciliation": "Conciliación", "Reports": "Reportes", "Estimated Taxes": "Impuestos Estimados",
  "Team &amp; Access": "Equipo y Acceso",
  "Welcome to Fornaris Ledger Academy": "Bienvenido a Fornaris Ledger Academy",
  "Create your first business to start bookkeeping.": "Crea tu primer negocio para comenzar la contabilidad.",
  "+ Create a business": "+ Crear un negocio",
  "All Clients": "Todos los Clientes",
  "A practice-wide view across every business you manage.": "Una vista general de cada negocio que administras.",
  "Client": "Cliente", "Entity": "Entidad", "Net Profit": "Ganancia Neta",
  "A/R Outstanding": "Cuentas por Cobrar Pendientes", "Uncategorized": "Sin categorizar",
  "Unreconciled": "No conciliado", "Overdue Invoices": "Facturas Vencidas",
  " to review": " por revisar", "No clients yet.": "Aún no hay clientes.", "Open →": "Abrir →",
  "Loading…": "Cargando…",
  "Net Profit (all time)": "Ganancia Neta (total)", "Income": "Ingresos", "Expenses": "Gastos",
  "Needs attention": "Requiere atención", "Unreconciled transactions": "Transacciones no conciliadas",
  "Uncategorized transactions": "Transacciones sin categorizar", "Statements imported": "Estados de cuenta importados",
  "Quick start": "Inicio rápido",
  "Paste a bank statement to get transactions auto-categorized, then review and reconcile.": "Pega un estado de cuenta bancario para categorizar automáticamente las transacciones, luego revisa y concilia.",
  "Import a statement": "Importar un estado de cuenta",
  "The categories every transaction gets sorted into.": "Las categorías en las que se clasifica cada transacción.",
  "Add account": "Agregar cuenta", "e.g. Client Revenue": "ej. Ingresos de Clientes",
  "Type": "Tipo", "Asset": "Activo", "Liability": "Pasivo", "Equity": "Capital",
  "Expense": "Gasto", "Add": "Agregar", "Schedule C": "Anexo C", "Remove": "Eliminar",
  "No accounts yet.": "Aún no hay cuentas.",
  "Assets": "Activos", "Liabilities": "Pasivos", "Income ": "Ingresos ",
  "Who can see and edit ": "Quién puede ver y editar ", "Members": "Miembros", "Role": "Rol",
  "Invite someone": "Invitar a alguien",
  "They need a Fornaris Ledger Academy account already — ask them to sign up first, then invite by email.": "Ya necesitan tener una cuenta de Fornaris Ledger Academy — pídeles que se registren primero, luego invítalos por correo electrónico.",
  "Member (full access)": "Miembro (acceso completo)", "Client (view-only)": "Cliente (solo lectura)",
  "Owner (full control)": "Propietario (control total)", "Invite": "Invitar",
  "What each role can do": "Qué puede hacer cada rol",
  "Full control, including inviting/removing people.": "Control total, incluyendo invitar/eliminar personas.",
  "Full read/write access to this business.": "Acceso completo de lectura y escritura a este negocio.",
  "View-only — can see dashboards, invoices, and reports, but cannot edit anything.": "Solo lectura — puede ver paneles, facturas y reportes, pero no puede editar nada.",
  "owner": "propietario", "member": "miembro", "client": "cliente",
  "quarterly estimate for ": "estimado trimestral para ", "(edit)": "(editar)",
  "Net Profit YTD": "Ganancia Neta del Año", "Total Est. Tax": "Impuesto Estimado Total",
  "Effective Rate": "Tasa Efectiva", "Breakdown": "Desglose",
  "Self-employment tax": "Impuesto de trabajo por cuenta propia",
  "Federal income tax": "Impuesto federal sobre la renta",
  "State income tax (": "Impuesto estatal sobre la renta (",
  "not available for this state": "no disponible para este estado", "Total": "Total",
  "Quarterly payments": "Pagos trimestrales", " — due ": " — vence ",
  "single": "soltero(a)", "married_joint": "casado(a) declaración conjunta", "head_of_household": "cabeza de familia",
  "Set filing status to calculate ": "Establece el estado civil para calcular ",
  " quarterly estimates for ": " los estimados trimestrales para ",
  "Filing status": "Estado civil", "Single": "Soltero(a)",
  "Married filing jointly": "Casado(a) declaración conjunta", "Head of household": "Cabeza de familia",
  "State (optional)": "Estado (opcional)", "Save &amp; calculate": "Guardar y calcular",
  "Bill clients and track what's owed.": "Factura a tus clientes y da seguimiento a lo que te deben.",
  "Outstanding (A/R)": "Pendiente (Cuentas por Cobrar)", "Total unpaid": "Total sin pagar",
  "Aging": "Antigüedad", " days": " días", "Invoices": "Facturas", "Export CSV": "Exportar CSV",
  "Manage clients": "Gestionar clientes", "+ New invoice": "+ Nueva factura",
  "Issued": "Emitida", "Due": "Vence", "Balance": "Saldo", "Status": "Estado",
  "No invoices yet.": "Aún no hay facturas.",
  "New Invoice": "Nueva Factura", "← Back to invoices": "← Volver a facturas",
  "— select —": "— seleccionar —", "Issue date": "Fecha de emisión", "Due date": "Fecha de vencimiento",
  "Revenue account": "Cuenta de ingresos",
  "No clients yet — ": "Aún no hay clientes — ", "add one first": "agrega uno primero",
  "Line items": "Conceptos", "Description": "Descripción", "Qty": "Cant.", "Rate": "Precio",
  "Amount": "Monto", "+ Add line": "+ Agregar línea", "Total: ": "Total: ",
  "Notes (optional)": "Notas (opcional)",
  "Payment terms, thank-you note, etc.": "Términos de pago, nota de agradecimiento, etc.",
  "Create invoice": "Crear factura", "Consulting services": "Servicios de consultoría",
  "Select a client": "Selecciona un cliente", "Add at least one line item": "Agrega al menos un concepto",
  "Invoice created": "Factura creada",
  "Bill to": "Facturar a", "Details": "Detalles",
  "draft": "borrador", "sent": "enviada", "partial": "parcial", "paid": "pagada", "overdue": "vencida", "void": "anulada",
  "Paid": "Pagado", "Balance due": "Saldo pendiente", "Payments": "Pagos",
  "No payments recorded.": "No hay pagos registrados.", "Record payment": "Registrar pago",
  "Date": "Fecha", "Method (optional)": "Método (opcional)",
  "ACH, check, card…": "ACH, cheque, tarjeta…",
  "Also post to the ledger as Client Revenue": "También registrar en el libro mayor como Ingresos de Clientes",
  "Send to client": "Enviar al cliente", "Download PDF": "Descargar PDF",
  "Email to ": "Enviar por correo a ", "client ": "cliente ",
  "Status updated": "Estado actualizado", "Enter a payment amount": "Ingresa un monto de pago",
  "Payment recorded": "Pago registrado",
  "Upload a file from your bank, or paste transactions directly. The AI will sort each into your Chart of Accounts.": "Sube un archivo de tu banco, o pega las transacciones directamente. La IA clasificará cada una en tu Plan de Cuentas.",
  "Connect a bank (live sync)": "Conectar un banco (sincronización en vivo)",
  "Upload a file": "Subir un archivo",
  "Accepts a .csv export from your bank, or a .pdf statement.": "Acepta una exportación .csv de tu banco, o un estado de cuenta .pdf.",
  "Statement label": "Etiqueta del estado de cuenta",
  "Statement ending balance (optional)": "Saldo final del estado de cuenta (opcional)",
  "File": "Archivo", "Upload &amp; categorize": "Subir y categorizar",
  "Or paste statement text": "O pega el texto del estado de cuenta",
  "Statement ending balance (optional, for reconciliation)": "Saldo final del estado de cuenta (opcional, para conciliación)",
  "Paste statement text": "Pega el texto del estado de cuenta",
  "Import &amp; categorize": "Importar y categorizar",
  "Choose a file first": "Elige un archivo primero", "Categorizing…": "Categorizando…",
  "Upload failed": "Error al subir", "Upload & categorize": "Subir y categorizar",
  "Paste some transactions first": "Pega algunas transacciones primero",
  "Not set up yet — add ": "Aún no está configurado — agrega ",
  " and ": " y ",
  " to your .env (Plaid's free sandbox keys work for testing) to enable one-click bank sync. Until then, paste statements below.": " a tu .env (las claves de prueba gratuitas de Plaid funcionan para pruebas) para habilitar la sincronización bancaria con un clic. Mientras tanto, pega los estados de cuenta abajo.",
  "Connected account": "Cuenta conectada", "Sync now": "Sincronizar ahora",
  "No bank connected yet.": "Aún no hay un banco conectado.",
  "+ Connect a bank account": "+ Conectar una cuenta bancaria", "Bank connected": "Banco conectado",
  "Review categorization": "Revisar categorización", "Category": "Categoría",
  "AI confidence": "Confianza de la IA", " — check": " — revisar",
  "Category updated": "Categoría actualizada",
  "Add manual entry": "Agregar entrada manual",
  "Reconciled": "Conciliado", "Delete": "Eliminar",
  "No transactions yet. Import a statement or add one manually.": "Aún no hay transacciones. Importa un estado de cuenta o agrega una manualmente.",
  "Fill in date, description, and amount": "Completa la fecha, descripción y monto",
  "Transaction added": "Transacción agregada",
  "Import a statement first to reconcile it.": "Primero importa un estado de cuenta para conciliarlo.",
  "Match each imported statement's transactions against its ending balance, then lock the period.": "Compara las transacciones de cada estado de cuenta importado con su saldo final, luego bloquea el período.",
  "Statement": "Estado de cuenta",
  "No ending balance was entered for this statement — add one on import to auto-check the match.": "No se ingresó un saldo final para este estado de cuenta — agrega uno al importar para verificar automáticamente.",
  "Net change": "Cambio neto", "Locked": "Bloqueado", "Open": "Abierto",
  "This period is reconciled and locked.": "Este período está conciliado y bloqueado.",
  "Lock &amp; mark reconciled": "Bloquear y marcar como conciliado",
  "All-time figures. ": "Cifras totales. ",
  "Export P&amp;L CSV": "Exportar CSV de Pérdidas y Ganancias",
  "Profit &amp; Loss": "Estado de Resultados", "Balance Sheet": "Balance General",
  "Total Assets": "Total de Activos",
  "Business name:": "Nombre del negocio:",
  "Entity type (sole_prop / llc / s_corp) — optional:": "Tipo de entidad (sole_prop / llc / s_corp) — opcional:",
  "Enter an account name": "Ingresa un nombre de cuenta", "Account added": "Cuenta agregada",
  "Remove this account? Existing transactions keep their category.": "¿Eliminar esta cuenta? Las transacciones existentes mantendrán su categoría.",
  "Enter an email": "Ingresa un correo electrónico", "Invited": "Invitado", "Removed": "Eliminado",
  "New client name (leave blank to cancel):": "Nombre del nuevo cliente (deja en blanco para cancelar):",
  "Client email (optional):": "Correo electrónico del cliente (opcional):", "Client added": "Cliente agregado",
  "Invoice ": "Factura ", "transactions imported": "transacciones importadas",
  "Import & categorize": "Importar y categorizar", "new transactions synced": "transacciones nuevas sincronizadas",
  "transactions across all statements": "transacciones en todos los estados de cuenta",
  "Delete this transaction?": "¿Eliminar esta transacción?",
  "Transactions net to": "Las transacciones suman", "matching the statement ending balance.": "coincidiendo con el saldo final del estado de cuenta.",
  "statement says": "el estado de cuenta indica", "Review before locking.": "Revisa antes de bloquear.",
  "Lock this period? Transactions will be marked reconciled.": "¿Bloquear este período? Las transacciones se marcarán como conciliadas.",
  "Period locked": "Período bloqueado",
  "Business type": "Tipo de negocio",
  "This determines the right equity accounts (owner draws, shareholder distributions, partner capital, etc.) for how this business is legally structured.": "Esto determina las cuentas de capital correctas (retiros del propietario, distribuciones a accionistas, capital de socios, etc.) según cómo esté estructurado legalmente este negocio.",
  "Entity type": "Tipo de entidad", "— not set —": "— sin definir —",
  "Add missing accounts for this type": "Agregar cuentas faltantes para este tipo",
  "Pick an entity type first": "Elige primero un tipo de entidad",
  "Added": "Agregado", "All accounts for this type already exist": "Todas las cuentas para este tipo ya existen",
  "Sole Proprietor": "Propietario Único", "Single-Member LLC": "LLC de un solo miembro",
  "LLC (multi-member)": "LLC (varios miembros)", "Partnership": "Sociedad",
  "S Corporation": "Corporación S", "C Corporation": "Corporación C",
};

let currentLang = state.lang;
function t(str) {
  return (currentLang === 'es' && ES[str]) ? ES[str] : str;
}
function setLang(lang) {
  currentLang = lang;
  state.lang = lang;
  localStorage.setItem('lang', lang);
  document.getElementById('langEnBtn').classList.toggle('active', lang === 'en');
  document.getElementById('langEsBtn').classList.toggle('active', lang === 'es');
  translateStaticDOM();
  if (state.currentUser) render();
}
function translateStaticDOM() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    if (!el.dataset.en) el.dataset.en = el.innerHTML; // cache original English once
    el.innerHTML = t(el.dataset.en);
  });
}
document.getElementById('langEnBtn').onclick = () => setLang('en');
document.getElementById('langEsBtn').onclick = () => setLang('es');
document.getElementById(currentLang === 'es' ? 'langEsBtn' : 'langEnBtn').classList.add('active');
translateStaticDOM();

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
      <div class="brand" style="margin-bottom:18px;">Fornaris Ledger Academy</div>
      <h2>${mode === 'login' ? t('Sign in') : t('Create an account')}</h2>
      ${mode === 'signup' ? `<div class="field"><label class="field-label">${t('Name')}</label><input type="text" id="authName"></div>` : ''}
      <div class="field"><label class="field-label">${t('Email')}</label><input type="text" id="authEmail"></div>
      <div class="field"><label class="field-label">${t('Password')}</label><input type="text" id="authPassword" placeholder="${mode === 'signup' ? t('At least 8 characters') : ''}"></div>
      <button class="btn" id="authSubmitBtn" style="width:100%;">${mode === 'login' ? t('Sign in') : t('Create an account')}</button>
      <p style="font-size:12.5px; color:var(--ink-soft); margin-top:14px; text-align:center;">
        ${mode === 'login' ? `${t('New here? ')}<a href="#" id="authSwitch" style="color:var(--ledger-green);">${t('Create an account')}</a>` : `${t('Already have an account? ')}<a href="#" id="authSwitch" style="color:var(--ledger-green);">${t('Sign in')}</a>`}
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
  const name = prompt(t('Business name:'));
  if (!name) return;
  const entity_type = prompt(t('Entity type (sole_prop / llc / s_corp) — optional:')) || null;
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
  main.innerHTML = `<h1 class="page-title">${t('All Clients')}</h1><p class="page-sub">${t('Loading…')}</p>`;
  const overview = await api('/practice/overview');

  main.innerHTML = `
    <h1 class="page-title">${t('All Clients')}</h1>
    <p class="page-sub">${t('A practice-wide view across every business you manage.')}</p>
    <div class="card">
      ${overview.length ? `
        <table class="ledger">
          <thead><tr><th>${t('Client')}</th><th>${t('Entity')}</th><th class="amount">${t('Net Profit')}</th><th class="amount">${t('A/R Outstanding')}</th><th class="amount">${t('Uncategorized')}</th><th class="amount">${t('Unreconciled')}</th><th class="amount">${t('Overdue Invoices')}</th><th></th></tr></thead>
          <tbody>
            ${overview.map(b => `
              <tr>
                <td style="font-weight:500;">${escapeHtml(b.name)} ${b.needs_attention > 0 ? `<span class="badge uncertain" style="margin-left:6px;">${b.needs_attention}${t(' to review')}</span>` : ''}</td>
                <td style="color:var(--ink-soft); font-size:12.5px;">${b.entity_type || '—'}</td>
                <td class="amount ${b.net_profit >= 0 ? 'positive' : 'negative'}">${fmt(b.net_profit)}</td>
                <td class="amount">${fmt(b.ar_outstanding)}</td>
                <td class="amount">${b.uncategorized_count}</td>
                <td class="amount">${b.unreconciled_count}</td>
                <td class="amount">${b.overdue_invoice_count}</td>
                <td style="text-align:right;"><button class="btn secondary" style="padding:4px 10px; font-size:12px;" onclick="switchToBusiness('${b.id}')">${t('Open →')}</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `<div class="empty-state"><div class="glyph">§</div>${t('No clients yet.')}</div>`}
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
    <h1 class="page-title">${t('Welcome to Fornaris Ledger Academy')}</h1>
    <p class="page-sub">${t('Create your first business to start bookkeeping.')}</p>
    <div class="card">
      <button class="btn" onclick="document.getElementById('newBusinessBtn').click()">${t('+ Create a business')}</button>
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
  main.innerHTML = `<h1 class="page-title">${t('Dashboard')}</h1><p class="page-sub">${t('Loading…')}</p>`;
  const pl = await api(`/reports/pl?business_id=${state.currentBusinessId}`);
  const txns = await api(`/transactions?business_id=${state.currentBusinessId}`);
  const unreconciled = txns.filter(t => !t.is_reconciled).length;
  const uncategorized = txns.filter(t => t.account_name === 'Uncategorized').length;

  main.innerHTML = `
    <h1 class="page-title">${t('Dashboard')}</h1>
    <p class="page-sub">${escapeHtml(state.businesses.find(b => b.id === state.currentBusinessId).name)}</p>

    <div class="card">
      <div class="stat-grid">
        <div class="stat"><div class="label">${t('Net Profit (all time)')}</div><div class="value">${fmt(pl.net_profit)}</div></div>
        <div class="stat"><div class="label">${t('Income')}</div><div class="value">${fmt(pl.total_income)}</div></div>
        <div class="stat negative"><div class="label">${t('Expenses')}</div><div class="value">${fmt(pl.total_expenses)}</div></div>
      </div>
    </div>

    <div class="card-row">
      <div class="card">
        <h2>${t('Needs attention')}</h2>
        <div class="pl-line"><span>${t('Unreconciled transactions')}</span><span class="amt">${unreconciled}</span></div>
        <div class="pl-line"><span>${t('Uncategorized transactions')}</span><span class="amt">${uncategorized}</span></div>
        <div class="pl-line"><span>${t('Statements imported')}</span><span class="amt">${state.statements.length}</span></div>
      </div>
      <div class="card">
        <h2>${t('Quick start')}</h2>
        <p style="color:var(--ink-soft); font-size:13px;">${t('Paste a bank statement to get transactions auto-categorized, then review and reconcile.')}</p>
        <button class="btn" onclick="state.tab='import'; document.querySelector('[data-tab=import]').click()">${t('Import a statement')}</button>
      </div>
    </div>
  `;
}

// ---------- Chart of Accounts ----------
async function renderAccounts() {
  const byType = { asset: [], liability: [], equity: [], income: [], expense: [] };
  state.accounts.forEach(a => byType[a.type].push(a));
  const typeLabels = { asset: t('Assets'), liability: t('Liabilities'), equity: t('Equity'), income: t('Income '), expense: t('Expenses') };
  const entityTypes = await api('/entity-types');
  const business = state.businesses.find(b => b.id === state.currentBusinessId);

  main.innerHTML = `
    <h1 class="page-title">${t('Chart of Accounts')}</h1>
    <p class="page-sub">${t('The categories every transaction gets sorted into.')}</p>

    <div class="card">
      <h2>${t('Business type')}</h2>
      <p style="font-size:12.5px; color:var(--ink-soft); margin-bottom:12px;">${t('This determines the right equity accounts (owner draws, shareholder distributions, partner capital, etc.) for how this business is legally structured.')}</p>
      <div class="field-row">
        <div class="field" style="max-width:260px;">
          <label class="field-label">${t('Entity type')}</label>
          <select class="form-input" id="entityTypeSelect">
            <option value="">${t('— not set —')}</option>
            ${Object.entries(entityTypes).map(([val, label]) => `<option value="${val}" ${business.entity_type === val ? 'selected' : ''}>${t(label)}</option>`).join('')}
          </select>
        </div>
        <div class="field" style="align-self:flex-end;"><button class="btn" id="addEntityAcctsBtn">${t('Add missing accounts for this type')}</button></div>
      </div>
    </div>

    <div class="card">
      <h2>${t('Add account')}</h2>
      <div class="field-row">
        <div class="field"><label class="field-label">${t('Name')}</label><input type="text" id="acctName" placeholder="${t('e.g. Client Revenue')}"></div>
        <div class="field" style="max-width:180px;">
          <label class="field-label">${t('Type')}</label>
          <select class="form-input" id="acctType">
            <option value="asset">${t('Asset')}</option>
            <option value="liability">${t('Liability')}</option>
            <option value="equity">${t('Equity')}</option>
            <option value="income">${t('Income ')}</option>
            <option value="expense" selected>${t('Expense')}</option>
          </select>
        </div>
        <div class="field" style="max-width:120px; align-self:flex-end;">
          <button class="btn" id="addAcctBtn">${t('Add')}</button>
        </div>
      </div>
    </div>

    ${Object.keys(typeLabels).map(type => `
      <div class="card">
        <h2>${typeLabels[type]}</h2>
        ${byType[type].length ? `
          <table class="ledger">
            <thead><tr><th>${t('Name')}</th><th>${t('Schedule C')}</th><th></th></tr></thead>
            <tbody>
              ${byType[type].map(a => `
                <tr>
                  <td>${escapeHtml(a.name)}</td>
                  <td style="color:var(--ink-soft); font-family:var(--font-mono); font-size:12px;">${a.schedule_c_line || '—'}</td>
                  <td style="text-align:right;"><button class="btn secondary" style="padding:4px 10px; font-size:12px;" onclick="deleteAccount('${a.id}')">${t('Remove')}</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `<p style="color:var(--ink-soft); font-size:13px;">${t('No accounts yet.')}</p>`}
      </div>
    `).join('')}
  `;

  $('#addEntityAcctsBtn').onclick = async () => {
    const entityType = $('#entityTypeSelect').value;
    if (!entityType) return toast(t('Pick an entity type first'), true);
    try {
      if (business.entity_type !== entityType) {
        const updated = await api('/businesses/' + state.currentBusinessId, { method: 'PATCH', body: JSON.stringify({ entity_type: entityType }) });
        const idx = state.businesses.findIndex(b => b.id === state.currentBusinessId);
        state.businesses[idx] = updated;
      }
      const result = await api(`/businesses/${state.currentBusinessId}/seed-entity-accounts`, { method: 'POST', body: JSON.stringify({ entity_type: entityType }) });
      state.accounts = await api('/accounts?business_id=' + state.currentBusinessId);
      toast(result.added.length ? `${t('Added')}: ${result.added.join(', ')}` : t('All accounts for this type already exist'));
      renderAccounts();
    } catch (e) { toast(e.message, true); }
  };

  $('#addAcctBtn').onclick = async () => {
    const name = $('#acctName').value.trim();
    const type = $('#acctType').value;
    if (!name) return toast(t('Enter an account name'), true);
    try {
      await api('/accounts', { method: 'POST', body: JSON.stringify({ business_id: state.currentBusinessId, name, type }) });
      state.accounts = await api('/accounts?business_id=' + state.currentBusinessId);
      toast(t('Account added'));
      renderAccounts();
    } catch (e) { toast(e.message, true); }
  };
}

async function deleteAccount(id) {
  if (!confirm(t('Remove this account? Existing transactions keep their category.'))) return;
  await api('/accounts/' + id, { method: 'DELETE' });
  state.accounts = await api('/accounts?business_id=' + state.currentBusinessId);
  renderAccounts();
}

// ---------- Team & Access ----------
async function renderTeam() {
  main.innerHTML = `<h1 class="page-title">${t('Team &amp; Access')}</h1><p class="page-sub">${t('Loading…')}</p>`;
  const members = await api(`/businesses/${state.currentBusinessId}/members`);
  const myMembership = members.find(m => m.user_id === state.currentUser.id);
  const isOwner = myMembership && myMembership.role === 'owner';

  const roleNote = {
    owner: t('Full control, including inviting/removing people.'),
    member: t('Full read/write access to this business.'),
    client: t('View-only — can see dashboards, invoices, and reports, but cannot edit anything.'),
  };

  main.innerHTML = `
    <h1 class="page-title">${t('Team &amp; Access')}</h1>
    <p class="page-sub">${t('Who can see and edit ')}${escapeHtml(state.businesses.find(b => b.id === state.currentBusinessId).name)}.</p>

    <div class="card">
      <h2>${t('Members')}</h2>
      <table class="ledger">
        <thead><tr><th>${t('Name')}</th><th>${t('Email')}</th><th>${t('Role')}</th><th></th></tr></thead>
        <tbody>
          ${members.map(m => `
            <tr>
              <td>${escapeHtml(m.name || '—')}</td>
              <td>${escapeHtml(m.email)}</td>
              <td><span class="badge" style="background:var(--ledger-green-tint); color:var(--ledger-green-dark); padding:4px 8px;">${t(m.role)}</span></td>
              <td style="text-align:right;">
                ${isOwner && m.user_id !== state.currentUser.id ? `<button class="btn secondary" style="padding:4px 10px; font-size:12px;" onclick="removeMember('${m.id}')">${t('Remove')}</button>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    ${isOwner ? `
    <div class="card">
      <h2>${t('Invite someone')}</h2>
      <p style="font-size:12.5px; color:var(--ink-soft); margin-bottom:12px;">${t('They need a Fornaris Ledger Academy account already — ask them to sign up first, then invite by email.')}</p>
      <div class="field-row">
        <div class="field"><label class="field-label">${t('Email')}</label><input type="text" id="inviteEmail" placeholder="colleague@example.com"></div>
        <div class="field" style="max-width:180px;">
          <label class="field-label">${t('Role')}</label>
          <select class="form-input" id="inviteRole">
            <option value="member">${t('Member (full access)')}</option>
            <option value="client">${t('Client (view-only)')}</option>
            <option value="owner">${t('Owner (full control)')}</option>
          </select>
        </div>
        <div class="field" style="align-self:flex-end;"><button class="btn" id="inviteBtn">${t('Invite')}</button></div>
      </div>
    </div>
    ` : ''}

    <div class="card">
      <h2>${t('What each role can do')}</h2>
      ${Object.entries(roleNote).map(([role, note]) => `<div class="pl-line"><span style="text-transform:capitalize;">${t(role)}</span><span class="amt" style="font-family:var(--font-body); font-size:12.5px; text-align:right; max-width:340px;">${note}</span></div>`).join('')}
    </div>
  `;

  if (isOwner) {
    $('#inviteBtn').onclick = async () => {
      const email = $('#inviteEmail').value.trim();
      const role = $('#inviteRole').value;
      if (!email) return toast(t('Enter an email'), true);
      try {
        await api(`/businesses/${state.currentBusinessId}/members`, { method: 'POST', body: JSON.stringify({ email, role }) });
        toast(t('Invited'));
        renderTeam();
      } catch (e) { toast(e.message, true); }
    };
  }
}

async function removeMember(memberId) {
  if (!confirm(t("Remove this person's access?"))) return;
  await api(`/businesses/${state.currentBusinessId}/members/${memberId}`, { method: 'DELETE' });
  toast(t('Removed'));
  renderTeam();
}

// ---------- Estimated Taxes ----------
async function renderTaxes() {
  main.innerHTML = `<h1 class="page-title">${t('Estimated Taxes')}</h1><p class="page-sub">${t('Loading…')}</p>`;
  const business = state.businesses.find(b => b.id === state.currentBusinessId);
  const year = new Date().getFullYear();

  if (!business.filing_status) {
    return renderTaxSettingsForm(business, year);
  }

  const est = await api(`/reports/tax-estimate?business_id=${state.currentBusinessId}&year=${year}`);

  main.innerHTML = `
    <h1 class="page-title">${t('Estimated Taxes')}</h1>
    <p class="page-sub">${year} ${t('quarterly estimate for ')}${escapeHtml(business.name)} — ${t(est.filing_status)}${est.state ? ', ' + est.state : ''}
      <a href="#" onclick="renderTaxSettingsForm(state.businesses.find(b=>b.id===state.currentBusinessId), ${year}); return false;" style="color:var(--ledger-green); margin-left:8px;">${t('(edit)')}</a>
    </p>

    <div class="card">
      <div class="stat-grid">
        <div class="stat"><div class="label">${t('Net Profit YTD')}</div><div class="value">${fmt(est.net_profit_ytd)}</div></div>
        <div class="stat negative"><div class="label">${t('Total Est. Tax')}</div><div class="value">${fmt(est.total_estimated_tax)}</div></div>
        <div class="stat"><div class="label">${t('Effective Rate')}</div><div class="value">${est.effective_rate}%</div></div>
      </div>
    </div>

    <div class="card-row">
      <div class="card">
        <h2>${t('Breakdown')}</h2>
        <div class="pl-line"><span>${t('Self-employment tax')}</span><span class="amt">${fmt(est.self_employment_tax)}</span></div>
        <div class="pl-line"><span>${t('Federal income tax')}</span><span class="amt">${fmt(est.federal_income_tax)}</span></div>
        ${est.state ? `<div class="pl-line"><span>${t('State income tax (')}${est.state})</span><span class="amt">${est.state_tax_available ? fmt(est.state_income_tax) : t('not available for this state')}</span></div>` : ''}
        <div class="pl-total"><span>${t('Total')}</span><span>${fmt(est.total_estimated_tax)}</span></div>
      </div>
      <div class="card">
        <h2>${t('Quarterly payments')}</h2>
        ${est.quarters.map(q => `<div class="pl-line"><span>${q.quarter}${t(' — due ')}${q.due}</span><span class="amt">${fmt(q.amount)}</span></div>`).join('')}
      </div>
    </div>

    <p style="font-size:11.5px; color:var(--ink-soft); max-width:640px;">${est.disclaimer}</p>
  `;
}

function renderTaxSettingsForm(business, year) {
  main.innerHTML = `
    <h1 class="page-title">${t('Estimated Taxes')}</h1>
    <p class="page-sub">${t('Set filing status to calculate ')}${year}${t(' quarterly estimates for ')}${escapeHtml(business.name)}.</p>
    <div class="card">
      <div class="field-row">
        <div class="field">
          <label class="field-label">${t('Filing status')}</label>
          <select class="form-input" id="taxFilingStatus">
            <option value="single">${t('Single')}</option>
            <option value="married_joint">${t('Married filing jointly')}</option>
            <option value="head_of_household">${t('Head of household')}</option>
          </select>
        </div>
        <div class="field"><label class="field-label">${t('State (optional)')}</label><input type="text" id="taxState" placeholder="e.g. CA" maxlength="2"></div>
      </div>
      <button class="btn" id="saveTaxSettingsBtn">${t('Save &amp; calculate')}</button>
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
  main.innerHTML = `<h1 class="page-title">${t('Invoicing')}</h1><p class="page-sub">${t('Loading…')}</p>`;
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
    <h1 class="page-title">${t('Invoicing')}</h1>
    <p class="page-sub">${t("Bill clients and track what's owed.")}</p>

    <div class="card-row">
      <div class="card">
        <h2>${t('Outstanding (A/R)')}</h2>
        <div class="stat"><div class="label">${t('Total unpaid')}</div><div class="value">${fmt(aging.total_outstanding)}</div></div>
      </div>
      <div class="card">
        <h2>${t('Aging')}</h2>
        ${Object.entries(aging.buckets).map(([b, v]) => `<div class="pl-line"><span>${b}${t(' days')}</span><span class="amt">${fmt(v)}</span></div>`).join('')}
      </div>
    </div>

    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h2 style="margin:0;">${t('Invoices')}</h2>
        <div style="display:flex; gap:8px;">
          <a class="btn secondary" style="padding:8px 14px; font-size:12.5px; text-decoration:none; display:inline-block;" href="/api/exports/invoices.csv?business_id=${state.currentBusinessId}">${t('Export CSV')}</a>
          <button class="btn secondary" id="manageClientsBtn">${t('Manage clients')}</button>
          <button class="btn" id="newInvoiceBtn">${t('+ New invoice')}</button>
        </div>
      </div>
      ${invoices.length ? `
        <table class="ledger">
          <thead><tr><th>#</th><th>${t('Client')}</th><th>${t('Issued')}</th><th>${t('Due')}</th><th class="amount">${t('Total')}</th><th class="amount">${t('Balance')}</th><th>${t('Status')}</th></tr></thead>
          <tbody>
            ${invoices.map(inv => `
              <tr style="cursor:pointer;" onclick="openInvoice('${inv.id}')">
                <td class="date">${inv.invoice_number}</td>
                <td>${escapeHtml(inv.client ? inv.client.name : '—')}</td>
                <td class="date">${inv.issue_date}</td>
                <td class="date">${inv.due_date || '—'}</td>
                <td class="amount">${fmt(inv.total)}</td>
                <td class="amount ${inv.balance_due > 0 ? 'negative' : 'positive'}">${fmt(inv.balance_due)}</td>
                <td><span class="badge" style="background:transparent; border:1px solid ${statusColor(inv.status)}; color:${statusColor(inv.status)};">${t(inv.status)}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `<div class="empty-state"><div class="glyph">§</div>${t('No invoices yet.')}</div>`}
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
  const name = prompt(t('New client name (leave blank to cancel):'));
  if (!name) return;
  const email = prompt(t('Client email (optional):')) || null;
  try {
    await api('/clients', { method: 'POST', body: JSON.stringify({ business_id: state.currentBusinessId, name, email }) });
    toast(t('Client added'));
    renderInvoicing();
  } catch (e) { toast(e.message, true); }
}

function renderInvoiceForm() {
  const revenueAccounts = state.accounts.filter(a => a.type === 'income');
  main.innerHTML = `
    <h1 class="page-title">${t('New Invoice')}</h1>
    <p class="page-sub"><a href="#" onclick="state.invoiceView={mode:'list'}; renderInvoicing(); return false;" style="color:var(--ledger-green);">${t('← Back to invoices')}</a></p>

    <div class="card">
      <div class="field-row">
        <div class="field">
          <label class="field-label">${t('Client')}</label>
          <select class="form-input" id="invClient">
            <option value="">${t('— select —')}</option>
            ${clientsCache.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label class="field-label">${t('Issue date')}</label><input type="date" id="invIssueDate" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="field"><label class="field-label">${t('Due date')}</label><input type="date" id="invDueDate"></div>
        <div class="field">
          <label class="field-label">${t('Revenue account')}</label>
          <select class="form-input" id="invRevenueAccount">
            ${revenueAccounts.map(a => `<option value="${a.id}" ${a.name === 'Client Revenue' ? 'selected' : ''}>${escapeHtml(a.name)}</option>`).join('')}
          </select>
        </div>
      </div>

      ${clientsCache.length === 0 ? `<p style="font-size:12.5px; color:var(--ochre);">${t('No clients yet — ')}<a href="#" onclick="openClientManager(); return false;" style="color:var(--ledger-green);">${t('add one first')}</a>.</p>` : ''}

      <label class="field-label" style="margin-top:10px;">${t('Line items')}</label>
      <table class="ledger" id="lineItemsTable">
        <thead><tr><th>${t('Description')}</th><th style="width:90px;">${t('Qty')}</th><th style="width:110px;">${t('Rate')}</th><th class="amount" style="width:110px;">${t('Amount')}</th><th></th></tr></thead>
        <tbody id="lineItemsBody"></tbody>
      </table>
      <button class="btn secondary" id="addLineBtn" style="margin-top:8px; padding:6px 12px; font-size:12.5px;">${t('+ Add line')}</button>

      <div style="text-align:right; margin-top:16px; font-family:var(--font-display); font-size:20px; font-weight:600;">
        ${t('Total: ')}<span id="invTotalDisplay">$0.00</span>
      </div>

      <div class="field" style="margin-top:14px;">
        <label class="field-label">${t('Notes (optional)')}</label>
        <input type="text" id="invNotes" placeholder="${t('Payment terms, thank-you note, etc.')}">
      </div>

      <button class="btn" id="saveInvoiceBtn" style="margin-top:6px;">${t('Create invoice')}</button>
    </div>
  `;

  const body = $('#lineItemsBody');
  function addLine(desc = '', qty = 1, rate = 0) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" class="li-desc" value="${escapeHtml(desc)}" placeholder="${t('Consulting services')}"></td>
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
    if (!client_id) return toast(t('Select a client'), true);
    const line_items = Array.from(body.querySelectorAll('tr')).map(row => ({
      description: row.querySelector('.li-desc').value.trim(),
      quantity: parseFloat(row.querySelector('.li-qty').value) || 0,
      rate: parseFloat(row.querySelector('.li-rate').value) || 0,
    })).filter(li => li.description);
    if (!line_items.length) return toast(t('Add at least one line item'), true);

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
      toast(t('Invoice created'));
      state.invoiceView = { mode: 'detail', id: inv.id };
      renderInvoicing();
    } catch (e) { toast(e.message, true); }
  };
}

async function renderInvoiceDetail(id) {
  const inv = await api('/invoices/' + id);
  main.innerHTML = `
    <h1 class="page-title">${t('Invoice ')}${inv.invoice_number}</h1>
    <p class="page-sub"><a href="#" onclick="state.invoiceView={mode:'list'}; renderInvoicing(); return false;" style="color:var(--ledger-green);">${t('← Back to invoices')}</a></p>

    <div class="card-row">
      <div class="card">
        <h2>${t('Bill to')}</h2>
        <p style="margin:0 0 4px; font-weight:500;">${escapeHtml(inv.client ? inv.client.name : '—')}</p>
        <p style="margin:0; color:var(--ink-soft); font-size:12.5px;">${escapeHtml(inv.client && inv.client.email || '')}</p>
      </div>
      <div class="card">
        <h2>${t('Details')}</h2>
        <div class="pl-line"><span>${t('Issued')}</span><span class="amt">${inv.issue_date}</span></div>
        <div class="pl-line"><span>${t('Due')}</span><span class="amt">${inv.due_date || '—'}</span></div>
        <div class="pl-line"><span>${t('Status')}</span><span class="amt">
          <select class="form-input" id="statusSelect" style="width:auto; padding:4px 8px;">
            ${['draft','sent','partial','paid','overdue','void'].map(s => `<option value="${s}" ${s === inv.status ? 'selected' : ''}>${t(s)}</option>`).join('')}
          </select>
        </span></div>
      </div>
    </div>

    <div class="card">
      <h2>${t('Line items')}</h2>
      <table class="ledger">
        <thead><tr><th>${t('Description')}</th><th class="amount">${t('Qty')}</th><th class="amount">${t('Rate')}</th><th class="amount">${t('Amount')}</th></tr></thead>
        <tbody>
          ${inv.line_items.map(li => `
            <tr><td>${escapeHtml(li.description)}</td><td class="amount">${li.quantity}</td><td class="amount">${fmt(li.rate)}</td><td class="amount">${fmt(li.quantity * li.rate)}</td></tr>
          `).join('')}
        </tbody>
      </table>
      <div class="pl-total"><span>${t('Total')}</span><span>${fmt(inv.total)}</span></div>
      <div class="pl-line"><span>${t('Paid')}</span><span class="amt">${fmt(inv.total - inv.balance_due)}</span></div>
      <div class="pl-line" style="font-weight:600;"><span>${t('Balance due')}</span><span class="amt">${fmt(inv.balance_due)}</span></div>
    </div>

    <div class="card-row">
      <div class="card">
        <h2>${t('Payments')}</h2>
        ${inv.payments.length ? inv.payments.map(p => `<div class="pl-line"><span>${p.date}${p.method ? ' — ' + escapeHtml(p.method) : ''}</span><span class="amt">${fmt(p.amount)}</span></div>`).join('') : `<p style="color:var(--ink-soft); font-size:13px;">${t('No payments recorded.')}</p>`}
      </div>
      ${inv.balance_due > 0.001 ? `
      <div class="card">
        <h2>${t('Record payment')}</h2>
        <div class="field"><label class="field-label">${t('Date')}</label><input type="date" id="payDate" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="field"><label class="field-label">${t('Amount')}</label><input type="number" step="0.01" id="payAmount" value="${inv.balance_due.toFixed(2)}"></div>
        <div class="field"><label class="field-label">${t('Method (optional)')}</label><input type="text" id="payMethod" placeholder="${t('ACH, check, card…')}"></div>
        <label style="display:flex; align-items:center; gap:6px; font-size:12.5px; margin-bottom:10px;">
          <input type="checkbox" id="payPostLedger" checked> ${t('Also post to the ledger as Client Revenue')}
        </label>
        <button class="btn" id="recordPayBtn">${t('Record payment')}</button>
      </div>` : ''}
    </div>

    <div class="card">
      <h2>${t('Send to client')}</h2>
      <div style="display:flex; gap:10px;">
        <a class="btn secondary" style="text-decoration:none;" href="/api/invoices/${inv.id}/pdf" target="_blank">${t('Download PDF')}</a>
        <button class="btn" id="emailInvoiceBtn">${t('Email to ')}${inv.client && inv.client.email ? escapeHtml(inv.client.email) : t('client ')}</button>
      </div>
    </div>
  `;

  $('#statusSelect').onchange = async (e) => {
    await api('/invoices/' + id, { method: 'PATCH', body: JSON.stringify({ status: e.target.value }) });
    toast(t('Status updated'));
  };

  const payBtn = $('#recordPayBtn');
  if (payBtn) {
    payBtn.onclick = async () => {
      const amount = parseFloat($('#payAmount').value);
      if (!amount) return toast(t('Enter a payment amount'), true);
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
        toast(t('Payment recorded'));
        renderInvoiceDetail(id);
      } catch (e) { toast(e.message, true); }
    };
  }
}

// ---------- Import Statement ----------
function renderImport() {
  main.innerHTML = `
    <h1 class="page-title">${t('Import Statement')}</h1>
    <p class="page-sub">${t('Upload a file from your bank, or paste transactions directly. The AI will sort each into your Chart of Accounts.')}</p>

    <div class="card" id="plaidCard">
      <h2>${t('Connect a bank (live sync)')}</h2>
      <p style="font-size:13px; color:var(--ink-soft);">${t('Loading…')}</p>
    </div>

    <div class="card">
      <h2>${t('Upload a file')}</h2>
      <p style="font-size:12.5px; color:var(--ink-soft); margin-bottom:12px;">${t('Accepts a .csv export from your bank, or a .pdf statement.')}</p>
      <div class="field-row">
        <div class="field"><label class="field-label">${t('Statement label')}</label><input type="text" id="fileStmtName" placeholder="e.g. Chase Checking — August 2026"></div>
        <div class="field"><label class="field-label">${t('Statement ending balance (optional)')}</label><input type="number" step="0.01" id="fileStmtBalance" placeholder="e.g. 4210.55"></div>
      </div>
      <div class="field">
        <label class="field-label">${t('File')}</label>
        <input type="file" id="stmtFile" accept=".csv,.txt,.pdf">
      </div>
      <button class="btn" id="uploadBtn">${t('Upload &amp; categorize')}</button>
    </div>

    <div class="card">
      <h2>${t('Or paste statement text')}</h2>
      <div class="field">
        <label class="field-label">${t('Statement label')}</label>
        <input type="text" id="stmtName" placeholder="e.g. Chase Checking — August 2026">
      </div>
      <div class="field-row">
        <div class="field"><label class="field-label">${t('Statement ending balance (optional, for reconciliation)')}</label><input type="number" step="0.01" id="stmtBalance" placeholder="e.g. 4210.55"></div>
      </div>
      <div class="field">
        <label class="field-label">${t('Paste statement text')}</label>
        <textarea id="stmtText" placeholder="08/03/2026  AMAZON MKTPLACE PMTS   -42.19
08/04/2026  Client Payment - Acme LLC   1500.00
08/05/2026  STARBUCKS #4021   -6.75"></textarea>
      </div>
      <button class="btn" id="importBtn">${t('Import &amp; categorize')}</button>
    </div>

    <div id="importResult"></div>
  `;

  renderPlaidCard();

  $('#uploadBtn').onclick = async () => {
    const fileInput = $('#stmtFile');
    if (!fileInput.files.length) return toast(t('Choose a file first'), true);
    const btn = $('#uploadBtn');
    btn.disabled = true; btn.textContent = t('Categorizing…');
    try {
      const formData = new FormData();
      formData.append('file', fileInput.files[0]);
      formData.append('business_id', state.currentBusinessId);
      if ($('#fileStmtName').value.trim()) formData.append('source_name', $('#fileStmtName').value.trim());
      if ($('#fileStmtBalance').value) formData.append('statement_ending_balance', $('#fileStmtBalance').value);

      const res = await fetch('/api/statements/upload', { method: 'POST', credentials: 'include', body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || t('Upload failed'));

      state.statements = await api('/statements?business_id=' + state.currentBusinessId);
      renderImportResult(result);
      toast(`${result.transactions.length} ${t('transactions imported')}`);
    } catch (e) {
      toast(e.message, true);
    } finally {
      btn.disabled = false; btn.textContent = t('Upload & categorize');
    }
  };

  $('#importBtn').onclick = async () => {
    const statement_text = $('#stmtText').value.trim();
    if (!statement_text) return toast(t('Paste some transactions first'), true);
    const btn = $('#importBtn');
    btn.disabled = true; btn.textContent = t('Categorizing…');
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
      toast(`${result.transactions.length} ${t('transactions imported')}`);
    } catch (e) {
      toast(e.message, true);
    } finally {
      btn.disabled = false; btn.textContent = t('Import & categorize');
    }
  };
}

async function renderPlaidCard() {
  const status = await api('/plaid/status');
  const card = $('#plaidCard');

  if (!status.configured) {
    card.innerHTML = `
      <h2>${t('Connect a bank (live sync)')}</h2>
      <p style="font-size:13px; color:var(--ink-soft);">
        ${t('Not set up yet — add ')}<code>PLAID_CLIENT_ID</code>${t(' and ')}<code>PLAID_SECRET</code>${t(" to your .env (Plaid's free sandbox keys work for testing) to enable one-click bank sync. Until then, paste statements below.")}
      </p>`;
    return;
  }

  const items = await api('/plaid/items?business_id=' + state.currentBusinessId);
  card.innerHTML = `
    <h2>${t('Connect a bank (live sync)')}</h2>
    ${items.length ? items.map(i => `
      <div class="pl-line">
        <span>${escapeHtml(i.institution_name || t('Connected account'))}</span>
        <button class="btn secondary" style="padding:4px 10px; font-size:12px;" onclick="syncPlaidItem('${i.id}')">${t('Sync now')}</button>
      </div>
    `).join('') : `<p style="font-size:13px; color:var(--ink-soft);">${t('No bank connected yet.')}</p>`}
    <button class="btn" id="plaidConnectBtn" style="margin-top:10px;">${t('+ Connect a bank account')}</button>
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
          toast(t('Bank connected'));
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
    toast(`${result.imported} ${t('new transactions synced')}`);
  } catch (e) { toast(e.message, true); }
}

function renderImportResult(result) {
  const rows = result.transactions;
  $('#importResult').innerHTML = `
    <div class="card">
      <h2>${t('Review categorization')}</h2>
      ${result.skipped_lines.length ? `<p style="font-size:12px;color:var(--ochre);">${result.skipped_lines.length} ${t("line(s) couldn't be parsed and were skipped.")}</p>` : ''}
      <table class="ledger">
        <thead><tr><th>${t('Date')}</th><th>${t('Description')}</th><th class="amount">${t('Amount')}</th><th>${t('Category')}</th><th>${t('AI confidence')}</th></tr></thead>
        <tbody>
          ${rows.map(t2 => `
            <tr>
              <td class="date">${t2.date}</td>
              <td>${escapeHtml(t2.description)}</td>
              <td class="amount ${t2.amount >= 0 ? 'positive' : 'negative'}">${fmt(t2.amount)}</td>
              <td>${accountSelectHtml(t2)}</td>
              <td>${confidenceBadge(t2.ai_confidence)}</td>
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
  return `<span class="badge uncertain">${Math.round(c * 100)}%${t(' — check')}</span>`;
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
  main.innerHTML = `<h1 class="page-title">${t('Transactions')}</h1><p class="page-sub">${t('Loading…')}</p>`;
  const txns = await api(`/transactions?business_id=${state.currentBusinessId}`);

  main.innerHTML = `
    <h1 class="page-title">${t('Transactions')}</h1>
    <p class="page-sub">${txns.length} ${t('transactions across all statements')}. <a href="/api/exports/transactions.csv?business_id=${state.currentBusinessId}" style="color:var(--ledger-green);">${t('Export CSV')}</a></p>

    <div class="card">
      <h2>${t('Add manual entry')}</h2>
      <div class="field-row">
        <div class="field"><label class="field-label">${t('Date')}</label><input type="date" id="manDate"></div>
        <div class="field" style="flex:2;"><label class="field-label">${t('Description')}</label><input type="text" id="manDesc"></div>
        <div class="field"><label class="field-label">${t('Amount')}</label><input type="number" step="0.01" id="manAmount" placeholder="-42.19 or 1500.00"></div>
        <div class="field" style="flex:1.4;">
          <label class="field-label">${t('Category')}</label>
          <select class="form-input" id="manAccount">
            ${state.accounts.map(a => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field" style="align-self:flex-end;"><button class="btn" id="manAddBtn">${t('Add')}</button></div>
      </div>
    </div>

    <div class="card">
      ${txns.length ? `
        <table class="ledger">
          <thead><tr><th>${t('Date')}</th><th>${t('Description')}</th><th class="amount">${t('Amount')}</th><th>${t('Category')}</th><th>${t('Reconciled')}</th><th></th></tr></thead>
          <tbody>
            ${txns.map(tx => `
              <tr>
                <td class="date">${tx.date}</td>
                <td>${escapeHtml(tx.description)}</td>
                <td class="amount ${tx.amount >= 0 ? 'positive' : 'negative'}">${fmt(tx.amount)}</td>
                <td>${accountSelectHtml(tx)}</td>
                <td style="text-align:center;">${tx.is_reconciled ? '✓' : '—'}</td>
                <td style="text-align:right;"><button class="btn secondary" style="padding:4px 10px; font-size:12px;" onclick="deleteTxn('${tx.id}')">${t('Delete')}</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `<div class="empty-state"><div class="glyph">§</div>${t('No transactions yet. Import a statement or add one manually.')}</div>`}
    </div>
  `;
  bindAccountSelects();

  $('#manAddBtn').onclick = async () => {
    const date = $('#manDate').value, description = $('#manDesc').value.trim(), amount = $('#manAmount').value;
    if (!date || !description || !amount) return toast(t('Fill in date, description, and amount'), true);
    try {
      await api('/transactions', {
        method: 'POST',
        body: JSON.stringify({ business_id: state.currentBusinessId, date, description, amount: parseFloat(amount), account_id: $('#manAccount').value }),
      });
      toast(t('Transaction added'));
      renderTransactions();
    } catch (e) { toast(e.message, true); }
  };
}

async function deleteTxn(id) {
  if (!confirm(t('Delete this transaction?'))) return;
  await api('/transactions/' + id, { method: 'DELETE' });
  renderTransactions();
}

// ---------- Reconciliation ----------
async function renderReconciliation() {
  main.innerHTML = `<h1 class="page-title">${t('Reconciliation')}</h1><p class="page-sub">${t('Loading…')}</p>`;

  if (state.statements.length === 0) {
    main.innerHTML = `
      <h1 class="page-title">${t('Reconciliation')}</h1>
      <div class="empty-state"><div class="glyph">§</div>${t('Import a statement first to reconcile it.')}</div>`;
    return;
  }

  main.innerHTML = `
    <h1 class="page-title">${t('Reconciliation')}</h1>
    <p class="page-sub">${t("Match each imported statement's transactions against its ending balance, then lock the period.")}</p>
    <div class="field" style="max-width:360px;">
      <label class="field-label">${t('Statement')}</label>
      <select class="form-input" id="reconStmtSelect">
        ${state.statements.map(s => `<option value="${s.id}">${escapeHtml(s.source_name || t('Statement'))} (${s.period_start} → ${s.period_end})</option>`).join('')}
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
    ? `<div class="recon-strip">${t('No ending balance was entered for this statement — add one on import to auto-check the match.')}</div>`
    : summary.matches_statement
      ? `<div class="recon-strip match">✓ ${t('Transactions net to')} ${fmt(summary.net_change)}, ${t('matching the statement ending balance.')}</div>`
      : `<div class="recon-strip mismatch">⚠ ${t('Transactions net to')} ${fmt(summary.net_change)}, ${t('statement says')} ${fmt(summary.statement.statement_ending_balance)}. ${t('Review before locking.')}</div>`;

  $('#reconBody').innerHTML = `
    <div class="card">
      <div class="stat-grid">
        <div class="stat"><div class="label">${t('Transactions')}</div><div class="value">${summary.transaction_count}</div></div>
        <div class="stat"><div class="label">${t('Net change')}</div><div class="value">${fmt(summary.net_change)}</div></div>
        <div class="stat"><div class="label">${t('Status')}</div><div class="value" style="font-size:18px;">${isLocked ? t('Locked') : t('Open')}</div></div>
      </div>
      ${statusHtml}
      ${isLocked
        ? `<p style="color:var(--ink-soft); font-size:13px;">${t('This period is reconciled and locked.')}</p>`
        : `<button class="btn" id="lockBtn">${t('Lock &amp; mark reconciled')}</button>`}
    </div>
    <div class="card">
      <table class="ledger">
        <thead><tr><th>${t('Date')}</th><th>${t('Description')}</th><th class="amount">${t('Amount')}</th><th>${t('Category')}</th></tr></thead>
        <tbody>
          ${txns.map(tx => `
            <tr>
              <td class="date">${tx.date}</td>
              <td>${escapeHtml(tx.description)}</td>
              <td class="amount ${tx.amount >= 0 ? 'positive' : 'negative'}">${fmt(tx.amount)}</td>
              <td>${escapeHtml(tx.account_name || t('Uncategorized'))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  if (!isLocked) {
    $('#lockBtn').onclick = async () => {
      if (!confirm(t('Lock this period? Transactions will be marked reconciled.'))) return;
      await api('/reconciliation/lock', { method: 'POST', body: JSON.stringify({ business_id: state.currentBusinessId, statement_id: statementId }) });
      toast(t('Period locked'));
      loadReconciliation();
    };
  }
}

// ---------- Reports ----------
async function renderReports() {
  main.innerHTML = `<h1 class="page-title">${t('Reports')}</h1><p class="page-sub">${t('Loading…')}</p>`;
  const pl = await api(`/reports/pl?business_id=${state.currentBusinessId}`);
  const bs = await api(`/reports/balance-sheet?business_id=${state.currentBusinessId}`);

  main.innerHTML = `
    <h1 class="page-title">${t('Reports')}</h1>
    <p class="page-sub">${t('All-time figures. ')}<a href="/api/exports/pl.csv?business_id=${state.currentBusinessId}" style="color:var(--ledger-green);">${t('Export P&amp;L CSV')}</a></p>

    <div class="card-row">
      <div class="card">
        <h2>${t('Profit &amp; Loss')}</h2>
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:var(--ink-soft); margin-bottom:6px;">${t('Income')}</div>
        ${pl.income.map(r => `<div class="pl-line"><span>${escapeHtml(r.account_name)}</span><span class="amt">${fmt(r.total)}</span></div>`).join('') || '<div class="pl-line"><span>—</span><span class="amt">$0.00</span></div>'}
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:var(--ink-soft); margin:14px 0 6px;">${t('Expenses')}</div>
        ${pl.expenses.map(r => `<div class="pl-line"><span>${escapeHtml(r.account_name)}</span><span class="amt">${fmt(Math.abs(r.total))}</span></div>`).join('') || '<div class="pl-line"><span>—</span><span class="amt">$0.00</span></div>'}
        <div class="pl-total"><span>${t('Net Profit')}</span><span>${fmt(pl.net_profit)}</span></div>
      </div>

      <div class="card">
        <h2>${t('Balance Sheet')}</h2>
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:var(--ink-soft); margin-bottom:6px;">${t('Assets')}</div>
        ${bs.assets.map(r => `<div class="pl-line"><span>${escapeHtml(r.account_name)}</span><span class="amt">${fmt(r.total)}</span></div>`).join('') || '<div class="pl-line"><span>—</span><span class="amt">$0.00</span></div>'}
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:var(--ink-soft); margin:14px 0 6px;">${t('Liabilities')}</div>
        ${bs.liabilities.map(r => `<div class="pl-line"><span>${escapeHtml(r.account_name)}</span><span class="amt">${fmt(r.total)}</span></div>`).join('') || '<div class="pl-line"><span>—</span><span class="amt">$0.00</span></div>'}
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:var(--ink-soft); margin:14px 0 6px;">${t('Equity')}</div>
        ${bs.equity.map(r => `<div class="pl-line"><span>${escapeHtml(r.account_name)}</span><span class="amt">${fmt(r.total)}</span></div>`).join('') || '<div class="pl-line"><span>—</span><span class="amt">$0.00</span></div>'}
        <div class="pl-total"><span>${t('Total Assets')}</span><span>${fmt(bs.total_assets)}</span></div>
      </div>
    </div>
  `;
}

init();
