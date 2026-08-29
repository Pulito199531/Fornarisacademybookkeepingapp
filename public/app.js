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
  "Or pick from the full standard list": "O elige de la lista estándar completa",
  "Standard accounts": "Cuentas estándar", "Add selected": "Agregar seleccionadas",
  "already added": "ya agregada", "Delete selected": "Eliminar seleccionadas",
  "Nothing new selected": "No hay nada nuevo seleccionado",
  "Select at least one account first": "Selecciona al menos una cuenta primero",
  "Remove the selected accounts? Existing transactions keep their category.": "¿Eliminar las cuentas seleccionadas? Las transacciones existentes mantendrán su categoría.",
  "Accounts removed": "Cuentas eliminadas",
  "Set the beginning and ending balance from your statement, then check off each transaction as it clears — just like reconciling in QuickBooks.": "Ingresa el saldo inicial y final de tu estado de cuenta, luego marca cada transacción a medida que se compensa — igual que conciliar en QuickBooks.",
  "Beginning balance": "Saldo inicial", "Ending balance": "Saldo final", "Save balances": "Guardar saldos",
  "Cleared": "Compensado", "Target change": "Cambio objetivo", "Difference": "Diferencia",
  "Enter a beginning and ending balance above to start reconciling.": "Ingresa un saldo inicial y final arriba para comenzar a conciliar.",
  "Difference is $0.00 — ready to finish.": "La diferencia es $0.00 — listo para finalizar.",
  "Check off transactions until the difference reaches $0.00.": "Marca transacciones hasta que la diferencia llegue a $0.00.",
  "Unlock": "Desbloquear", "Finish now": "Finalizar ahora", "Balances saved": "Saldos guardados",
  "Finish reconciling this period? Checked transactions will be locked.": "¿Finalizar la conciliación de este período? Las transacciones marcadas se bloquearán.",
  "Period unlocked": "Período desbloqueado",
  "+ Add new account…": "+ Agregar nueva cuenta…", "Add new account": "Agregar nueva cuenta",
  "Cancel": "Cancelar", "Account added and applied": "Cuenta agregada y aplicada",
  "Share these statements": "Compartir estos estados", "Email PDF": "Enviar PDF por correo",
  "Email address to send the financial statements to:": "Correo electrónico al que enviar los estados financieros:",
  "Financial statements emailed": "Estados financieros enviados por correo",
  "General Ledger": "Libro Mayor",
  "Every account with its transactions in order and a running balance — scroll to browse, or print/export a copy.": "Cada cuenta con sus transacciones en orden y un saldo acumulado — desplázate para explorar, o imprime/exporta una copia.",
  "Print": "Imprimir", "No transactions yet.": "Aún no hay transacciones.",
  "Ending balance": "Saldo final",
  "Number (optional)": "Número (opcional)", "Number": "Número",
  "Account number updated": "Número de cuenta actualizado",
  "Vendor / Description": "Proveedor / Descripción", "e.g. Staples, Acme LLC": "ej. Staples, Acme LLC",
  "Amount paid": "Monto pagado", "General Ledger Account": "Cuenta del Libro Mayor",
  "uncleared": "sin compensar", "Print reconciliation report": "Imprimir reporte de conciliación",
  "Prior reconciliations": "Conciliaciones anteriores", "Period": "Período",
  "Beginning": "Inicial", "Ending": "Final", "View / Print": "Ver / Imprimir",
  "Shortcuts": "Accesos rápidos", "Enter Invoice": "Nueva Factura", "Receive Payment": "Recibir Pago",
  "Enter Bill": "Registrar Cuenta", "Pay Bills": "Pagar Cuentas", "Create Customer": "Crear Cliente",
  "Create Vendor": "Crear Proveedor", "Journal Entry": "Asiento Contable", "Check Register": "Registro de Cheques",
  "New vendor name (leave blank to cancel):": "Nombre del nuevo proveedor (deja en blanco para cancelar):",
  "Vendor email (optional):": "Correo del proveedor (opcional):", "Vendor added": "Proveedor agregado",
  "From": "De", "Bills (A/P)": "Cuentas por Pagar", "Track what you owe vendors and pay bills.": "Da seguimiento a lo que debes a proveedores y paga cuentas.",
  "Outstanding (A/P)": "Pendiente (Cuentas por Pagar)", "Total owed": "Total adeudado", "Bills": "Cuentas",
  "Manage vendors": "Gestionar proveedores", "+ Enter bill": "+ Registrar cuenta", "Vendor": "Proveedor",
  "No bills yet.": "Aún no hay cuentas.", "← Back to bills": "← Volver a cuentas",
  "Expense account": "Cuenta de gastos", "No vendors yet — ": "Aún no hay proveedores — ",
  "Save bill": "Guardar cuenta", "Select a vendor": "Selecciona un proveedor", "Bill saved": "Cuenta guardada",
  "Bill ": "Cuenta ", "Pay bill": "Pagar cuenta", "Also post to the ledger": "También registrar en el libro mayor",
  "No accounts to show yet.": "Aún no hay cuentas para mostrar.",
  "Every transaction in one account, in order, with a running balance — like a checkbook register.": "Cada transacción de una cuenta, en orden, con saldo acumulado — como un registro de chequera.",
  "Account": "Cuenta", "No transactions in this account yet.": "Aún no hay transacciones en esta cuenta.",
  "Journal Entries": "Asientos Contables", "Manually move amounts between accounts — each entry must balance to zero.": "Mueve montos manualmente entre cuentas — cada asiento debe cuadrar a cero.",
  "New journal entry": "Nuevo asiento contable", "Memo": "Memo",
  "e.g. Purchased equipment with cash": "ej. Compra de equipo en efectivo", "Lines": "Líneas",
  "Amount (+ debit / − credit)": "Monto (+ débito / − crédito)", "Net total: ": "Total neto: ",
  "Save journal entry": "Guardar asiento contable", "Recent entries": "Asientos recientes",
  "Journal entry": "Asiento contable", "No journal entries yet.": "Aún no hay asientos contables.",
  "Add at least two lines": "Agrega al menos dos líneas", "Journal entry saved": "Asiento contable guardado",
  "Delete this journal entry? Both sides will be removed.": "¿Eliminar este asiento contable? Se eliminarán ambos lados.",
  "Journal entry deleted": "Asiento contable eliminado",
  "Accounting method": "Método contable",
  "Cash basis: income and expenses count when money actually moves — creating an invoice or bill does nothing until it's paid. Accrual basis: income and expenses count as soon as you invoice a client or receive a bill, whether or not it's been paid yet, and Accounts Receivable / Accounts Payable track what's still owed.": "Base de efectivo: los ingresos y gastos cuentan cuando el dinero realmente se mueve — crear una factura o cuenta no hace nada hasta que se pague. Base devengada: los ingresos y gastos cuentan tan pronto facturas a un cliente o recibes una cuenta, se haya pagado o no, y las Cuentas por Cobrar / Pagar rastrean lo que aún se debe.",
  "Method": "Método", "Cash basis": "Base de efectivo", "Accrual basis": "Base devengada",
  "Accounting method updated": "Método contable actualizado",
  "Outstanding Invoices": "Facturas Pendientes", "Outstanding Bills": "Cuentas Pendientes",
  "Revenue and Expenses": "Ingresos y Gastos", "Net Profit Trend": "Tendencia de Ganancia Neta",
  "Revenue by Client": "Ingresos por Cliente", "Create an invoice to see this.": "Crea una factura para ver esto.",
  "Spending by Category": "Gastos por Categoría", "No expenses recorded yet.": "Aún no hay gastos registrados.",
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
    bills: renderBills,
    import: renderImport,
    transactions: renderTransactions,
    checkRegister: renderCheckRegister,
    journalEntries: renderJournalEntries,
    reconciliation: renderReconciliation,
    reports: renderReports,
    generalLedger: renderGeneralLedger,
    taxes: renderTaxes,
    team: renderTeam,
  };
  renderers[state.tab]();
}

// ---------- Dashboard ----------
let dashboardCharts = [];
function destroyDashboardCharts() {
  dashboardCharts.forEach(c => c.destroy());
  dashboardCharts = [];
}

async function renderDashboard() {
  main.innerHTML = `<h1 class="page-title">${t('Dashboard')}</h1><p class="page-sub">${t('Loading…')}</p>`;
  const [pl, txns, monthly, revenueByClient, spending, arAging, apAging] = await Promise.all([
    api(`/reports/pl?business_id=${state.currentBusinessId}`),
    api(`/transactions?business_id=${state.currentBusinessId}`),
    api(`/reports/monthly-summary?business_id=${state.currentBusinessId}&months=6`),
    api(`/reports/revenue-by-client?business_id=${state.currentBusinessId}`),
    api(`/reports/spending-by-category?business_id=${state.currentBusinessId}`),
    api(`/reports/ar-aging?business_id=${state.currentBusinessId}`),
    api(`/reports/ap-aging?business_id=${state.currentBusinessId}`),
  ]);
  const unreconciled = txns.filter(t => !t.is_reconciled).length;
  const uncategorized = txns.filter(t => t.account_name === 'Uncategorized').length;
  const monthLabels = monthly.map(m => {
    const [y, mo] = m.month.split('-');
    return new Date(y, mo - 1, 1).toLocaleDateString(currentLang === 'es' ? 'es' : 'en', { month: 'short' });
  });

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

    <div class="card">
      <h2>${t('Shortcuts')}</h2>
      <div class="shortcut-grid">
        <button class="shortcut-btn" onclick="goToShortcut('invoicing','new')"><span class="shortcut-icon">🧾</span>${t('Enter Invoice')}</button>
        <button class="shortcut-btn" onclick="goToShortcut('invoicing','list')"><span class="shortcut-icon">💵</span>${t('Receive Payment')}</button>
        <button class="shortcut-btn" onclick="goToShortcut('bills','new')"><span class="shortcut-icon">📄</span>${t('Enter Bill')}</button>
        <button class="shortcut-btn" onclick="goToShortcut('bills','list')"><span class="shortcut-icon">💳</span>${t('Pay Bills')}</button>
        <button class="shortcut-btn" onclick="quickCreateCustomer()"><span class="shortcut-icon">👤</span>${t('Create Customer')}</button>
        <button class="shortcut-btn" onclick="quickCreateVendor()"><span class="shortcut-icon">🏢</span>${t('Create Vendor')}</button>
        <button class="shortcut-btn" onclick="goToShortcut('journalEntries')"><span class="shortcut-icon">📘</span>${t('Journal Entry')}</button>
        <button class="shortcut-btn" onclick="goToShortcut('checkRegister')"><span class="shortcut-icon">📒</span>${t('Check Register')}</button>
        <button class="shortcut-btn" onclick="window.print()"><span class="shortcut-icon">🖨️</span>${t('Print')}</button>
      </div>
    </div>

    <div class="card-row">
      <div class="card">
        <h2>${t('Outstanding Invoices')}</h2>
        <div class="stat negative"><div class="label">${t('Total unpaid')}</div><div class="value">${fmt(arAging.total_outstanding)}</div></div>
      </div>
      <div class="card">
        <h2>${t('Outstanding Bills')}</h2>
        <div class="stat negative"><div class="label">${t('Total owed')}</div><div class="value">${fmt(apAging.total_outstanding)}</div></div>
      </div>
      <div class="card">
        <h2>${t('Needs attention')}</h2>
        <div class="pl-line"><span>${t('Unreconciled transactions')}</span><span class="amt">${unreconciled}</span></div>
        <div class="pl-line"><span>${t('Uncategorized transactions')}</span><span class="amt">${uncategorized}</span></div>
      </div>
    </div>

    <div class="card">
      <h2>${t('Revenue and Expenses')}</h2>
      <div style="height:260px;"><canvas id="revExpChart"></canvas></div>
    </div>

    <div class="card">
      <h2>${t('Net Profit Trend')}</h2>
      <div style="height:220px;"><canvas id="profitTrendChart"></canvas></div>
    </div>

    <div class="card-row">
      <div class="card">
        <h2>${t('Revenue by Client')}</h2>
        ${revenueByClient.length ? `<div style="height:220px;"><canvas id="revByClientChart"></canvas></div>` : `<p style="color:var(--ink-soft); font-size:13px;">${t('Create an invoice to see this.')}</p>`}
      </div>
      <div class="card">
        <h2>${t('Spending by Category')}</h2>
        ${spending.length ? `<div style="height:220px;"><canvas id="spendingChart"></canvas></div>` : `<p style="color:var(--ink-soft); font-size:13px;">${t('No expenses recorded yet.')}</p>`}
      </div>
    </div>

    <div class="card">
      <h2>${t('Quick start')}</h2>
      <p style="color:var(--ink-soft); font-size:13px;">${t('Paste a bank statement to get transactions auto-categorized, then review and reconcile.')}</p>
      <button class="btn" onclick="state.tab='import'; document.querySelector('[data-tab=import]').click()">${t('Import a statement')}</button>
    </div>
  `;

  destroyDashboardCharts();
  const palette = ['#2F5D50', '#C98A3B', '#7C9885', '#A23B2E', '#5B7A99', '#9B7EAD', '#C4A35A'];

  // Chart.js loads from a CDN — if it's blocked (ad blocker, offline, etc.)
  // the rest of the dashboard should still work fine without it.
  if (typeof Chart === 'undefined') return;
  try {
    dashboardCharts.push(new Chart($('#revExpChart'), {
      type: 'bar',
      data: {
        labels: monthLabels,
        datasets: [
          { label: t('Income'), data: monthly.map(m => m.income), backgroundColor: '#2F5D50' },
          { label: t('Expenses'), data: monthly.map(m => m.expense), backgroundColor: '#A23B2E' },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } },
    }));

    dashboardCharts.push(new Chart($('#profitTrendChart'), {
      type: 'line',
      data: {
        labels: monthLabels,
        datasets: [{ label: t('Net Profit'), data: monthly.map(m => m.net_profit), borderColor: '#2F5D50', backgroundColor: 'rgba(47,93,80,0.15)', fill: true, tension: 0.3 }],
      },
      options: { responsive: true, maintainAspectRatio: false },
    }));

    if (revenueByClient.length) {
      dashboardCharts.push(new Chart($('#revByClientChart'), {
        type: 'pie',
        data: {
          labels: revenueByClient.map(r => r.client_name),
          datasets: [{ data: revenueByClient.map(r => r.total), backgroundColor: palette }],
        },
        options: { responsive: true, maintainAspectRatio: false },
      }));
    }

    if (spending.length) {
      dashboardCharts.push(new Chart($('#spendingChart'), {
        type: 'pie',
        data: {
          labels: spending.map(s => s.category),
          datasets: [{ data: spending.map(s => s.total), backgroundColor: palette }],
        },
        options: { responsive: true, maintainAspectRatio: false },
      }));
    }
  } catch (e) {
    console.error('Chart rendering failed:', e);
  }
}

// Dashboard shortcut handlers — jump to a tab and, for invoicing/bills, straight
// into the "new" sub-view, mirroring QuickBooks' Home screen icons.
function goToShortcut(tabName, subMode) {
  document.querySelectorAll('#tabs button').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  state.tab = tabName;
  if (tabName === 'invoicing') state.invoiceView = { mode: subMode === 'new' ? 'new' : 'list' };
  if (tabName === 'bills') state.billView = { mode: subMode === 'new' ? 'new' : 'list' };
  render();
}

async function quickCreateCustomer() {
  const name = prompt(t('New client name (leave blank to cancel):'));
  if (!name) return;
  const email = prompt(t('Client email (optional):')) || null;
  try {
    await api('/clients', { method: 'POST', body: JSON.stringify({ business_id: state.currentBusinessId, name, email }) });
    toast(t('Client added'));
  } catch (e) { toast(e.message, true); }
}

async function quickCreateVendor() {
  const name = prompt(t('New vendor name (leave blank to cancel):'));
  if (!name) return;
  const email = prompt(t('Vendor email (optional):')) || null;
  try {
    await api('/vendors', { method: 'POST', body: JSON.stringify({ business_id: state.currentBusinessId, name, email }) });
    toast(t('Vendor added'));
  } catch (e) { toast(e.message, true); }
}

// ---------- Chart of Accounts ----------
async function renderAccounts() {
  const byType = { asset: [], liability: [], equity: [], income: [], expense: [] };
  state.accounts.forEach(a => byType[a.type].push(a));
  const typeLabels = { asset: t('Assets'), liability: t('Liabilities'), equity: t('Equity'), income: t('Income '), expense: t('Expenses') };
  const entityTypes = await api('/entity-types');
  const business = state.businesses.find(b => b.id === state.currentBusinessId);
  const standardList = await api('/accounts/standard-list');
  const existingNames = new Set(state.accounts.map(a => a.name));

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
      <h2>${t('Accounting method')}</h2>
      <p style="font-size:12.5px; color:var(--ink-soft); margin-bottom:12px;">${t("Cash basis: income and expenses count when money actually moves — creating an invoice or bill does nothing until it's paid. Accrual basis: income and expenses count as soon as you invoice a client or receive a bill, whether or not it's been paid yet, and Accounts Receivable / Accounts Payable track what's still owed.")}</p>
      <div class="field" style="max-width:280px;">
        <label class="field-label">${t('Method')}</label>
        <select class="form-input" id="accountingMethodSelect">
          <option value="cash" ${(business.accounting_method || 'cash') === 'cash' ? 'selected' : ''}>${t('Cash basis')}</option>
          <option value="accrual" ${business.accounting_method === 'accrual' ? 'selected' : ''}>${t('Accrual basis')}</option>
        </select>
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
        <div class="field" style="max-width:110px;"><label class="field-label">${t('Number (optional)')}</label><input type="text" id="acctCode" placeholder="5210"></div>
        <div class="field" style="max-width:120px; align-self:flex-end;">
          <button class="btn" id="addAcctBtn">${t('Add')}</button>
        </div>
      </div>
      <button class="btn secondary" id="browseStandardBtn" style="margin-top:4px;">${t('Or pick from the full standard list')}</button>
    </div>

    <div class="card" id="standardListCard" style="display:none;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h2 style="margin:0;">${t('Standard accounts')}</h2>
        <button class="btn" id="addSelectedStandardBtn">${t('Add selected')}</button>
      </div>
      ${Object.keys(typeLabels).map(type => {
        const accts = standardList.filter(a => a.type === type);
        if (!accts.length) return '';
        return `
          <div style="margin-bottom:14px;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:var(--ink-soft); margin-bottom:6px;">${typeLabels[type]}</div>
            ${accts.map(a => `
              <label style="display:flex; align-items:center; gap:8px; padding:4px 0; font-size:13px; ${existingNames.has(a.name) ? 'opacity:0.4;' : ''}">
                <input type="checkbox" class="std-acct-check" value="${escapeHtml(a.name)}" data-type="${a.type}" data-subtype="${a.subtype || ''}" data-schedc="${a.schedule_c_line || ''}" data-code="${a.code || ''}" ${existingNames.has(a.name) ? 'disabled checked' : ''}>
                ${a.code ? `<span style="font-family:var(--font-mono); font-size:11px; color:var(--ink-soft);">${escapeHtml(a.code)}</span>` : ''}
                ${escapeHtml(a.name)}
                ${a.entityTypes && a.entityTypes.length ? `<span style="font-family:var(--font-mono); font-size:10px; color:var(--ink-soft);">(${a.entityTypes.join(', ')})</span>` : ''}
                ${existingNames.has(a.name) ? `<span style="font-size:11px; color:var(--ink-soft);">— ${t('already added')}</span>` : ''}
              </label>
            `).join('')}
          </div>
        `;
      }).join('')}
    </div>

    ${Object.keys(typeLabels).map(type => `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h2 style="margin:0;">${typeLabels[type]}</h2>
          ${byType[type].length ? `<button class="btn secondary" style="padding:4px 10px; font-size:12px;" onclick="deleteSelectedAccounts('${type}')">${t('Delete selected')}</button>` : ''}
        </div>
        ${byType[type].length ? `
          <table class="ledger">
            <thead><tr><th style="width:24px;"></th><th>${t('Number')}</th><th>${t('Name')}</th><th>${t('Schedule C')}</th><th></th></tr></thead>
            <tbody>
              ${byType[type].map(a => `
                <tr>
                  <td><input type="checkbox" class="acct-row-check" data-type="${type}" value="${a.id}"></td>
                  <td style="color:var(--ink-soft); font-family:var(--font-mono); font-size:12px;">
                    <input type="text" class="acct-code-edit" data-id="${a.id}" value="${escapeHtml(a.code || '')}" placeholder="—" style="width:60px; border:none; background:transparent; font-family:var(--font-mono); font-size:12px; padding:2px 0;">
                  </td>
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

  $('#accountingMethodSelect').onchange = async (e) => {
    try {
      const updated = await api('/businesses/' + state.currentBusinessId, { method: 'PATCH', body: JSON.stringify({ accounting_method: e.target.value }) });
      const idx = state.businesses.findIndex(b => b.id === state.currentBusinessId);
      state.businesses[idx] = updated;
      toast(t('Accounting method updated'));
    } catch (err) { toast(err.message, true); }
  };

  $('#addAcctBtn').onclick = async () => {
    const name = $('#acctName').value.trim();
    const type = $('#acctType').value;
    const code = $('#acctCode').value.trim();
    if (!name) return toast(t('Enter an account name'), true);
    try {
      await api('/accounts', { method: 'POST', body: JSON.stringify({ business_id: state.currentBusinessId, name, type, code: code || null }) });
      state.accounts = await api('/accounts?business_id=' + state.currentBusinessId);
      toast(t('Account added'));
      renderAccounts();
    } catch (e) { toast(e.message, true); }
  };

  document.querySelectorAll('.acct-code-edit').forEach(input => {
    input.onchange = async () => {
      try {
        await api('/accounts/' + input.dataset.id, { method: 'PATCH', body: JSON.stringify({ code: input.value.trim() || null }) });
        state.accounts = await api('/accounts?business_id=' + state.currentBusinessId);
        toast(t('Account number updated'));
      } catch (e) { toast(e.message, true); }
    };
  });

  $('#browseStandardBtn').onclick = () => {
    const card = $('#standardListCard');
    card.style.display = card.style.display === 'none' ? 'block' : 'none';
  };

  $('#addSelectedStandardBtn').onclick = async () => {
    const checked = [...document.querySelectorAll('.std-acct-check:checked:not(:disabled)')];
    if (!checked.length) return toast(t('Nothing new selected'), true);
    const accounts = checked.map(c => ({
      name: c.value, type: c.dataset.type,
      subtype: c.dataset.subtype || null, schedule_c_line: c.dataset.schedc || null,
      code: c.dataset.code || null,
    }));
    try {
      const result = await api('/accounts/bulk', { method: 'POST', body: JSON.stringify({ business_id: state.currentBusinessId, accounts }) });
      state.accounts = await api('/accounts?business_id=' + state.currentBusinessId);
      toast(`${t('Added')}: ${result.added.join(', ')}`);
      renderAccounts();
    } catch (e) { toast(e.message, true); }
  };
}

async function deleteSelectedAccounts(type) {
  const checked = [...document.querySelectorAll(`.acct-row-check[data-type="${type}"]:checked`)].map(c => c.value);
  if (!checked.length) return toast(t('Select at least one account first'), true);
  if (!confirm(t('Remove the selected accounts? Existing transactions keep their category.'))) return;
  try {
    await api('/accounts/bulk-delete', { method: 'POST', body: JSON.stringify({ business_id: state.currentBusinessId, account_ids: checked }) });
    state.accounts = await api('/accounts?business_id=' + state.currentBusinessId);
    toast(t('Accounts removed'));
    renderAccounts();
  } catch (e) { toast(e.message, true); }
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
  const business = state.businesses.find(b => b.id === state.currentBusinessId);
  main.innerHTML = `
    <h1 class="page-title">${t('Invoice ')}${inv.invoice_number}</h1>
    <p class="page-sub"><a href="#" onclick="state.invoiceView={mode:'list'}; renderInvoicing(); return false;" style="color:var(--ledger-green);">${t('← Back to invoices')}</a></p>

    <div class="card-row">
      <div class="card">
        <h2>${t('From')}</h2>
        <p style="margin:0 0 4px; font-weight:500;">${escapeHtml(business.name)}</p>
      </div>
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

// ---------- Bills / Accounts Payable ----------
state.billView = { mode: 'list' };
let vendorsCache = [];

async function renderBills() {
  main.innerHTML = `<h1 class="page-title">${t('Bills (A/P)')}</h1><p class="page-sub">${t('Loading…')}</p>`;
  vendorsCache = await api('/vendors?business_id=' + state.currentBusinessId);

  if (state.billView.mode === 'new') return renderBillForm();
  if (state.billView.mode === 'detail') return renderBillDetail(state.billView.id);
  return renderBillList();
}

async function renderBillList() {
  const bills = await api('/bills?business_id=' + state.currentBusinessId);
  const aging = await api('/reports/ap-aging?business_id=' + state.currentBusinessId);

  const statusColor = s => ({
    draft: 'var(--ink-soft)', received: 'var(--ochre)', partial: 'var(--ochre)',
    paid: 'var(--ledger-green)', overdue: 'var(--brick)', void: 'var(--ink-soft)',
  }[s] || 'var(--ink-soft)');

  main.innerHTML = `
    <h1 class="page-title">${t('Bills (A/P)')}</h1>
    <p class="page-sub">${t('Track what you owe vendors and pay bills.')}</p>

    <div class="card-row">
      <div class="card">
        <h2>${t('Outstanding (A/P)')}</h2>
        <div class="stat negative"><div class="label">${t('Total owed')}</div><div class="value">${fmt(aging.total_outstanding)}</div></div>
      </div>
      <div class="card">
        <h2>${t('Aging')}</h2>
        ${Object.entries(aging.buckets).map(([b, v]) => `<div class="pl-line"><span>${b}${t(' days')}</span><span class="amt">${fmt(v)}</span></div>`).join('')}
      </div>
    </div>

    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h2 style="margin:0;">${t('Bills')}</h2>
        <div style="display:flex; gap:8px;">
          <button class="btn secondary" id="manageVendorsBtn">${t('Manage vendors')}</button>
          <button class="btn" id="newBillBtn">${t('+ Enter bill')}</button>
        </div>
      </div>
      ${bills.length ? `
        <table class="ledger">
          <thead><tr><th>#</th><th>${t('Vendor')}</th><th>${t('Issued')}</th><th>${t('Due')}</th><th class="amount">${t('Total')}</th><th class="amount">${t('Balance')}</th><th>${t('Status')}</th></tr></thead>
          <tbody>
            ${bills.map(b => `
              <tr style="cursor:pointer;" onclick="openBill('${b.id}')">
                <td class="date">${b.bill_number}</td>
                <td>${escapeHtml(b.vendor ? b.vendor.name : '—')}</td>
                <td class="date">${b.issue_date}</td>
                <td class="date">${b.due_date || '—'}</td>
                <td class="amount">${fmt(b.total)}</td>
                <td class="amount ${b.balance_due > 0 ? 'negative' : 'positive'}">${fmt(b.balance_due)}</td>
                <td><span class="badge" style="background:transparent; border:1px solid ${statusColor(b.status)}; color:${statusColor(b.status)};">${t(b.status)}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `<div class="empty-state"><div class="glyph">§</div>${t('No bills yet.')}</div>`}
    </div>
  `;

  $('#newBillBtn').onclick = () => { state.billView = { mode: 'new' }; renderBills(); };
  $('#manageVendorsBtn').onclick = openVendorManager;
}

function openBill(id) {
  state.billView = { mode: 'detail', id };
  renderBills();
}

async function openVendorManager() {
  const name = prompt(t('New vendor name (leave blank to cancel):'));
  if (!name) return;
  const email = prompt(t('Vendor email (optional):')) || null;
  try {
    await api('/vendors', { method: 'POST', body: JSON.stringify({ business_id: state.currentBusinessId, name, email }) });
    toast(t('Vendor added'));
    renderBills();
  } catch (e) { toast(e.message, true); }
}

function renderBillForm() {
  const expenseAccounts = state.accounts.filter(a => a.type === 'expense');
  main.innerHTML = `
    <h1 class="page-title">${t('Enter Bill')}</h1>
    <p class="page-sub"><a href="#" onclick="state.billView={mode:'list'}; renderBills(); return false;" style="color:var(--ledger-green);">${t('← Back to bills')}</a></p>

    <div class="card">
      <div class="field-row">
        <div class="field">
          <label class="field-label">${t('Vendor')}</label>
          <select class="form-input" id="billVendor">
            <option value="">${t('— select —')}</option>
            ${vendorsCache.map(v => `<option value="${v.id}">${escapeHtml(v.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label class="field-label">${t('Issue date')}</label><input type="date" id="billIssueDate" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="field"><label class="field-label">${t('Due date')}</label><input type="date" id="billDueDate"></div>
        <div class="field">
          <label class="field-label">${t('Expense account')}</label>
          <select class="form-input" id="billExpenseAccount">
            ${expenseAccounts.map(a => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('')}
          </select>
        </div>
      </div>

      ${vendorsCache.length === 0 ? `<p style="font-size:12.5px; color:var(--ochre);">${t('No vendors yet — ')}<a href="#" onclick="openVendorManager(); return false;" style="color:var(--ledger-green);">${t('add one first')}</a>.</p>` : ''}

      <label class="field-label" style="margin-top:10px;">${t('Line items')}</label>
      <table class="ledger" id="billLineItemsTable">
        <thead><tr><th>${t('Description')}</th><th style="width:90px;">${t('Qty')}</th><th style="width:110px;">${t('Rate')}</th><th class="amount" style="width:110px;">${t('Amount')}</th><th></th></tr></thead>
        <tbody id="billLineItemsBody"></tbody>
      </table>
      <button class="btn secondary" id="addBillLineBtn" style="margin-top:8px; padding:6px 12px; font-size:12.5px;">${t('+ Add line')}</button>

      <div style="text-align:right; margin-top:16px; font-family:var(--font-display); font-size:20px; font-weight:600;">
        ${t('Total: ')}<span id="billTotalDisplay">$0.00</span>
      </div>

      <div class="field" style="margin-top:14px;">
        <label class="field-label">${t('Notes (optional)')}</label>
        <input type="text" id="billNotes">
      </div>

      <button class="btn" id="saveBillBtn" style="margin-top:6px;">${t('Save bill')}</button>
    </div>
  `;

  const body = $('#billLineItemsBody');
  function addLine(desc = '', qty = 1, rate = 0) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" class="bli-desc" value="${escapeHtml(desc)}"></td>
      <td><input type="number" class="bli-qty" value="${qty}" step="0.01" style="width:100%;"></td>
      <td><input type="number" class="bli-rate" value="${rate}" step="0.01" style="width:100%;"></td>
      <td class="amount bli-amount">$0.00</td>
      <td><button class="btn secondary" style="padding:3px 8px; font-size:11px;" onclick="this.closest('tr').remove(); recalcBillTotal();">✕</button></td>
    `;
    body.appendChild(row);
    row.querySelectorAll('.bli-qty, .bli-rate').forEach(inp => inp.addEventListener('input', recalcBillTotal));
    recalcBillTotal();
  }
  window.recalcBillTotal = function () {
    let total = 0;
    body.querySelectorAll('tr').forEach(row => {
      const qty = parseFloat(row.querySelector('.bli-qty').value) || 0;
      const rate = parseFloat(row.querySelector('.bli-rate').value) || 0;
      const amt = qty * rate;
      row.querySelector('.bli-amount').textContent = fmt(amt);
      total += amt;
    });
    $('#billTotalDisplay').textContent = fmt(total);
  };
  addLine();
  $('#addBillLineBtn').onclick = () => addLine();

  $('#saveBillBtn').onclick = async () => {
    const vendor_id = $('#billVendor').value;
    if (!vendor_id) return toast(t('Select a vendor'), true);
    const line_items = Array.from(body.querySelectorAll('tr')).map(row => ({
      description: row.querySelector('.bli-desc').value.trim(),
      quantity: parseFloat(row.querySelector('.bli-qty').value) || 0,
      rate: parseFloat(row.querySelector('.bli-rate').value) || 0,
    })).filter(li => li.description);
    if (!line_items.length) return toast(t('Add at least one line item'), true);

    try {
      const bill = await api('/bills', {
        method: 'POST',
        body: JSON.stringify({
          business_id: state.currentBusinessId,
          vendor_id,
          issue_date: $('#billIssueDate').value,
          due_date: $('#billDueDate').value || null,
          expense_account_id: $('#billExpenseAccount').value || null,
          notes: $('#billNotes').value.trim() || null,
          line_items,
        }),
      });
      toast(t('Bill saved'));
      state.billView = { mode: 'detail', id: bill.id };
      renderBills();
    } catch (e) { toast(e.message, true); }
  };
}

async function renderBillDetail(id) {
  const bill = await api('/bills/' + id);
  main.innerHTML = `
    <h1 class="page-title">${t('Bill ')}${bill.bill_number}</h1>
    <p class="page-sub"><a href="#" onclick="state.billView={mode:'list'}; renderBills(); return false;" style="color:var(--ledger-green);">${t('← Back to bills')}</a></p>

    <div class="card-row">
      <div class="card">
        <h2>${t('Vendor')}</h2>
        <p style="margin:0 0 4px; font-weight:500;">${escapeHtml(bill.vendor ? bill.vendor.name : '—')}</p>
        <p style="margin:0; color:var(--ink-soft); font-size:12.5px;">${escapeHtml(bill.vendor && bill.vendor.email || '')}</p>
      </div>
      <div class="card">
        <h2>${t('Details')}</h2>
        <div class="pl-line"><span>${t('Issued')}</span><span class="amt">${bill.issue_date}</span></div>
        <div class="pl-line"><span>${t('Due')}</span><span class="amt">${bill.due_date || '—'}</span></div>
        <div class="pl-line"><span>${t('Status')}</span><span class="amt">
          <select class="form-input" id="billStatusSelect" style="width:auto; padding:4px 8px;">
            ${['draft','received','partial','paid','overdue','void'].map(s => `<option value="${s}" ${s === bill.status ? 'selected' : ''}>${t(s)}</option>`).join('')}
          </select>
        </span></div>
      </div>
    </div>

    <div class="card">
      <h2>${t('Line items')}</h2>
      <table class="ledger">
        <thead><tr><th>${t('Description')}</th><th class="amount">${t('Qty')}</th><th class="amount">${t('Rate')}</th><th class="amount">${t('Amount')}</th></tr></thead>
        <tbody>
          ${bill.line_items.map(li => `
            <tr><td>${escapeHtml(li.description)}</td><td class="amount">${li.quantity}</td><td class="amount">${fmt(li.rate)}</td><td class="amount">${fmt(li.quantity * li.rate)}</td></tr>
          `).join('')}
        </tbody>
      </table>
      <div class="pl-total"><span>${t('Total')}</span><span>${fmt(bill.total)}</span></div>
      <div class="pl-line"><span>${t('Paid')}</span><span class="amt">${fmt(bill.total - bill.balance_due)}</span></div>
      <div class="pl-line" style="font-weight:600;"><span>${t('Balance due')}</span><span class="amt">${fmt(bill.balance_due)}</span></div>
    </div>

    <div class="card-row">
      <div class="card">
        <h2>${t('Payments')}</h2>
        ${bill.payments.length ? bill.payments.map(p => `<div class="pl-line"><span>${p.date}${p.method ? ' — ' + escapeHtml(p.method) : ''}</span><span class="amt">${fmt(p.amount)}</span></div>`).join('') : `<p style="color:var(--ink-soft); font-size:13px;">${t('No payments recorded.')}</p>`}
      </div>
      ${bill.balance_due > 0.001 ? `
      <div class="card">
        <h2>${t('Pay bill')}</h2>
        <div class="field"><label class="field-label">${t('Date')}</label><input type="date" id="billPayDate" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="field"><label class="field-label">${t('Amount')}</label><input type="number" step="0.01" id="billPayAmount" value="${bill.balance_due.toFixed(2)}"></div>
        <div class="field"><label class="field-label">${t('Method (optional)')}</label><input type="text" id="billPayMethod" placeholder="${t('ACH, check, card…')}"></div>
        <label style="display:flex; align-items:center; gap:6px; font-size:12.5px; margin-bottom:10px;">
          <input type="checkbox" id="billPayPostLedger" checked> ${t('Also post to the ledger')}
        </label>
        <button class="btn" id="recordBillPayBtn">${t('Pay bill')}</button>
      </div>` : ''}
    </div>
  `;

  $('#billStatusSelect').onchange = async (e) => {
    await api('/bills/' + id, { method: 'PATCH', body: JSON.stringify({ status: e.target.value }) });
    toast(t('Status updated'));
  };

  const payBtn = $('#recordBillPayBtn');
  if (payBtn) {
    payBtn.onclick = async () => {
      const amount = parseFloat($('#billPayAmount').value);
      if (!amount) return toast(t('Enter a payment amount'), true);
      try {
        await api(`/bills/${id}/payments`, {
          method: 'POST',
          body: JSON.stringify({
            date: $('#billPayDate').value,
            amount,
            method: $('#billPayMethod').value.trim() || null,
            post_to_ledger: $('#billPayPostLedger').checked,
          }),
        });
        toast(t('Payment recorded'));
        renderBillDetail(id);
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

// Groups accounts under <optgroup> by type so the dropdown stays usable with
// 40+ accounts. Bank transactions are often NOT income/expense — an owner
// draw, a loan payment, a transfer to savings, an equipment purchase — so
// every account type needs to be selectable here, not just income/expense.
function accountOptionsGrouped(selectedId) {
  const groups = [
    { type: 'income', label: t('Income ').trim() },
    { type: 'expense', label: t('Expenses') },
    { type: 'equity', label: t('Equity') },
    { type: 'asset', label: t('Assets') },
    { type: 'liability', label: t('Liabilities') },
  ];
  const newOption = `<option value="__new__">${t('+ Add new account…')}</option>`;
  return newOption + groups.map(g => {
    const accts = state.accounts.filter(a => a.type === g.type);
    if (!accts.length) return '';
    return `<optgroup label="${escapeHtml(g.label)}">
      ${accts.map(a => `<option value="${a.id}" ${a.id === selectedId ? 'selected' : ''}>${a.code ? escapeHtml(a.code) + ' — ' : ''}${escapeHtml(a.name)}</option>`).join('')}
    </optgroup>`;
  }).join('');
}

function accountSelectHtml(t) {
  const cls = t.account_name === 'Uncategorized' ? 'uncategorized' : (t.ai_confidence !== null && t.ai_confidence < 0.75 ? 'ai-low' : '');
  return `<select class="account-select ${cls}" data-txn-id="${t.id}">
    ${accountOptionsGrouped(t.account_id)}
  </select>`;
}

// Small inline modal for creating a new GL account without leaving the
// transaction list — used by the "+ Add new account…" option in every
// category dropdown. Calls onCreated(newAccount) on success, onCancel() if
// the user backs out (so the dropdown can revert to its previous value).
function openQuickAddAccountModal(onCreated, onCancel) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:1000;';
  overlay.innerHTML = `
    <div class="card" style="width:360px; margin:0;">
      <h2>${t('Add new account')}</h2>
      <div class="field"><label class="field-label">${t('Name')}</label><input type="text" id="qaAcctName" placeholder="${t('e.g. Client Revenue')}"></div>
      <div class="field-row">
        <div class="field">
          <label class="field-label">${t('Type')}</label>
          <select class="form-input" id="qaAcctType">
            <option value="expense" selected>${t('Expense')}</option>
            <option value="income">${t('Income ').trim()}</option>
            <option value="equity">${t('Equity')}</option>
            <option value="asset">${t('Asset')}</option>
            <option value="liability">${t('Liability')}</option>
          </select>
        </div>
        <div class="field" style="max-width:120px;"><label class="field-label">${t('Number (optional)')}</label><input type="text" id="qaAcctCode" placeholder="5210"></div>
      </div>
      <div style="display:flex; gap:8px; margin-top:6px;">
        <button class="btn" id="qaAcctSaveBtn">${t('Add')}</button>
        <button class="btn secondary" id="qaAcctCancelBtn">${t('Cancel')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('qaAcctName').focus();

  const close = () => overlay.remove();
  document.getElementById('qaAcctCancelBtn').onclick = () => { close(); if (onCancel) onCancel(); };
  overlay.onclick = (e) => { if (e.target === overlay) { close(); if (onCancel) onCancel(); } };

  document.getElementById('qaAcctSaveBtn').onclick = async () => {
    const name = document.getElementById('qaAcctName').value.trim();
    const type = document.getElementById('qaAcctType').value;
    const code = document.getElementById('qaAcctCode').value.trim();
    if (!name) return toast(t('Enter an account name'), true);
    try {
      const newAccount = await api('/accounts', { method: 'POST', body: JSON.stringify({ business_id: state.currentBusinessId, name, type, code: code || null }) });
      state.accounts = await api('/accounts?business_id=' + state.currentBusinessId);
      close();
      onCreated(newAccount);
    } catch (e) { toast(e.message, true); }
  };
}

function bindAccountSelects() {
  document.querySelectorAll('.account-select').forEach(sel => {
    // Track the last real (non-"__new__") value so we can revert on cancel.
    if (!sel.dataset.lastValue) sel.dataset.lastValue = sel.value;

    sel.onchange = async () => {
      if (sel.value === '__new__') {
        openQuickAddAccountModal(
          async (newAccount) => {
            // Refresh every account dropdown on the page so the new account
            // appears everywhere, not just in the one that triggered this.
            document.querySelectorAll('.account-select').forEach(otherSel => {
              const current = otherSel === sel ? newAccount.id : otherSel.value;
              otherSel.innerHTML = accountOptionsGrouped(current);
              otherSel.dataset.lastValue = current;
            });
            try {
              await api('/transactions/' + sel.dataset.txnId, { method: 'PATCH', body: JSON.stringify({ account_id: newAccount.id }) });
              sel.classList.remove('ai-low', 'uncategorized');
              toast(t('Account added and applied'));
            } catch (e) { toast(e.message, true); }
          },
          () => { sel.value = sel.dataset.lastValue; }
        );
        return;
      }

      try {
        await api('/transactions/' + sel.dataset.txnId, { method: 'PATCH', body: JSON.stringify({ account_id: sel.value }) });
        sel.classList.remove('ai-low', 'uncategorized');
        sel.dataset.lastValue = sel.value;
        toast(t('Category updated'));
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
        <div class="field" style="flex:2;"><label class="field-label">${t('Vendor / Description')}</label><input type="text" id="manDesc" placeholder="${t('e.g. Staples, Acme LLC')}"></div>
        <div class="field"><label class="field-label">${t('Amount paid')}</label><input type="number" step="0.01" id="manAmount" placeholder="-42.19 or 1500.00"></div>
        <div class="field" style="flex:1.4;">
          <label class="field-label">${t('General Ledger Account')}</label>
          <select class="form-input" id="manAccount">
            ${accountOptionsGrouped(null)}
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

  const manAccountSel = $('#manAccount');
  manAccountSel.dataset.lastValue = manAccountSel.value;
  manAccountSel.onchange = () => {
    if (manAccountSel.value !== '__new__') { manAccountSel.dataset.lastValue = manAccountSel.value; return; }
    openQuickAddAccountModal(
      (newAccount) => {
        document.querySelectorAll('.account-select, #manAccount').forEach(sel => {
          const current = sel === manAccountSel ? newAccount.id : sel.value;
          sel.innerHTML = accountOptionsGrouped(current);
          sel.dataset.lastValue = current;
        });
      },
      () => { manAccountSel.value = manAccountSel.dataset.lastValue; }
    );
  };

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
    <p class="page-sub">${t('Set the beginning and ending balance from your statement, then check off each transaction as it clears — just like reconciling in QuickBooks.')}</p>
    <div class="field" style="max-width:360px;">
      <label class="field-label">${t('Statement')}</label>
      <select class="form-input" id="reconStmtSelect">
        ${state.statements.map(s => `<option value="${s.id}">${escapeHtml(s.source_name || t('Statement'))} (${s.period_start} → ${s.period_end})</option>`).join('')}
      </select>
    </div>
    <div id="reconBody"></div>
    <div id="reconHistory"></div>
  `;

  $('#reconStmtSelect').onchange = loadReconciliation;
  await loadReconciliation();
  await loadReconciliationHistory();
}

async function loadReconciliation() {
  const statementId = $('#reconStmtSelect').value;
  const summary = await api(`/reconciliation/summary?business_id=${state.currentBusinessId}&statement_id=${statementId}`);
  const txns = summary.transactions;
  const isLocked = summary.is_locked;
  const hasBalances = summary.beginning_balance !== null && summary.ending_balance !== null;
  const unclearedCount = txns.filter(t => !t.is_reconciled).length;

  $('#reconBody').innerHTML = `
    <div class="card">
      <div class="field-row">
        <div class="field"><label class="field-label">${t('Beginning balance')}</label><input type="number" step="0.01" id="beginBalInput" value="${summary.beginning_balance ?? ''}" placeholder="0.00" ${isLocked ? 'disabled' : ''}></div>
        <div class="field"><label class="field-label">${t('Ending balance')}</label><input type="number" step="0.01" id="endBalInput" value="${summary.ending_balance ?? ''}" placeholder="0.00" ${isLocked ? 'disabled' : ''}></div>
        <div class="field" style="align-self:flex-end;"><button class="btn secondary" id="saveBalancesBtn" ${isLocked ? 'disabled' : ''}>${t('Save balances')}</button></div>
      </div>
    </div>

    <div class="card">
      <div class="stat-grid">
        <div class="stat"><div class="label">${t('Cleared')}</div><div class="value">${fmt(summary.cleared_total)}</div></div>
        <div class="stat"><div class="label">${t('Target change')}</div><div class="value">${hasBalances ? fmt(summary.ending_balance - summary.beginning_balance) : '—'}</div></div>
        <div class="stat ${summary.is_balanced ? '' : 'negative'}"><div class="label">${t('Difference')}</div><div class="value" id="differenceValue">${hasBalances ? fmt(summary.difference) : '—'}</div></div>
      </div>
      ${!hasBalances
        ? `<div class="recon-strip">${t('Enter a beginning and ending balance above to start reconciling.')}</div>`
        : summary.is_balanced
          ? `<div class="recon-strip match">✓ ${t('Difference is $0.00 — ready to finish.')}</div>`
          : `<div class="recon-strip mismatch">⚠ ${t('Check off transactions until the difference reaches $0.00.')} ${unclearedCount ? `(${unclearedCount} ${t('uncleared')})` : ''}</div>`}
      <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        ${isLocked
          ? `<p style="color:var(--ink-soft); font-size:13px; margin:0;">${t('This period is reconciled and locked.')}</p>
             <button class="btn secondary" id="unlockBtn" style="padding:6px 14px; font-size:12.5px;">${t('Unlock')}</button>`
          : `<button class="btn" id="finishBtn" ${hasBalances && summary.is_balanced ? '' : 'disabled'}>${t('Finish now')}</button>`}
        <button class="btn secondary" id="printReconBtn">${t('Print reconciliation report')}</button>
        <a class="btn secondary" style="text-decoration:none;" href="/api/reconciliation/report/pdf?business_id=${state.currentBusinessId}&statement_id=${statementId}" target="_blank">${t('Download PDF')}</a>
      </div>
    </div>

    <div class="card">
      <table class="ledger">
        <thead><tr><th style="width:24px;"></th><th>${t('Date')}</th><th>${t('Description')}</th><th class="amount">${t('Amount')}</th><th>${t('Category')}</th></tr></thead>
        <tbody>
          ${txns.map(tx => `
            <tr class="${!tx.is_reconciled ? 'uncleared-row' : ''}">
              <td><input type="checkbox" class="clear-check" data-id="${tx.id}" data-amount="${tx.amount}" ${tx.is_reconciled ? 'checked' : ''} ${isLocked ? 'disabled' : ''}></td>
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

  $('#saveBalancesBtn').onclick = async () => {
    const beginning = $('#beginBalInput').value;
    const ending = $('#endBalInput').value;
    try {
      await api('/statements/' + statementId, {
        method: 'PATCH',
        body: JSON.stringify({
          statement_beginning_balance: beginning !== '' ? parseFloat(beginning) : null,
          statement_ending_balance: ending !== '' ? parseFloat(ending) : null,
        }),
      });
      toast(t('Balances saved'));
      loadReconciliation();
    } catch (e) { toast(e.message, true); }
  };

  $('#printReconBtn').onclick = () => window.print();

  // Live-update the difference as checkboxes are toggled, without waiting on
  // a server round trip each click — same feel as QuickBooks' reconcile screen.
  function recalcDifferenceLocally() {
    if (!hasBalances) return;
    let clearedTotal = 0;
    document.querySelectorAll('.clear-check:checked').forEach(cb => { clearedTotal += parseFloat(cb.dataset.amount); });
    const targetChange = summary.ending_balance - summary.beginning_balance;
    const diff = Math.round((targetChange - clearedTotal) * 100) / 100;
    $('#differenceValue').textContent = fmt(diff);
    const finishBtn = $('#finishBtn');
    if (finishBtn) finishBtn.disabled = Math.abs(diff) >= 0.005;
  }

  document.querySelectorAll('.clear-check').forEach(cb => {
    cb.onchange = async () => {
      recalcDifferenceLocally();
      try {
        await api(`/transactions/${cb.dataset.id}/clear`, { method: 'PATCH', body: JSON.stringify({ is_reconciled: cb.checked }) });
      } catch (e) {
        toast(e.message, true);
        cb.checked = !cb.checked;
        recalcDifferenceLocally();
      }
    };
  });

  const finishBtn = $('#finishBtn');
  if (finishBtn) {
    finishBtn.onclick = async () => {
      if (!confirm(t('Finish reconciling this period? Checked transactions will be locked.'))) return;
      await api('/reconciliation/lock', { method: 'POST', body: JSON.stringify({ business_id: state.currentBusinessId, statement_id: statementId }) });
      toast(t('Period locked'));
      loadReconciliation();
      loadReconciliationHistory();
    };
  }

  const unlockBtn = $('#unlockBtn');
  if (unlockBtn) {
    unlockBtn.onclick = async () => {
      await api('/reconciliation/unlock', { method: 'POST', body: JSON.stringify({ business_id: state.currentBusinessId, statement_id: statementId }) });
      toast(t('Period unlocked'));
      loadReconciliation();
      loadReconciliationHistory();
    };
  }
}

async function loadReconciliationHistory() {
  const periods = await api('/reconciliation/periods?business_id=' + state.currentBusinessId);
  if (!periods.length) { $('#reconHistory').innerHTML = ''; return; }

  $('#reconHistory').innerHTML = `
    <div class="card">
      <h2>${t('Prior reconciliations')}</h2>
      <table class="ledger">
        <thead><tr><th>${t('Statement')}</th><th>${t('Period')}</th><th class="amount">${t('Beginning')}</th><th class="amount">${t('Ending')}</th><th>${t('Locked')}</th><th></th></tr></thead>
        <tbody>
          ${periods.map(p => `
            <tr>
              <td>${escapeHtml(p.source_name || t('Statement'))}</td>
              <td class="date">${p.period_start} → ${p.period_end}</td>
              <td class="amount">${fmt(p.starting_balance)}</td>
              <td class="amount">${fmt(p.ending_balance)}</td>
              <td class="date">${p.locked_at ? p.locked_at.slice(0, 10) : '—'}</td>
              <td style="text-align:right;">
                <a class="btn secondary" style="padding:4px 10px; font-size:12px; text-decoration:none;" href="/api/reconciliation/report/pdf?business_id=${state.currentBusinessId}&statement_id=${p.statement_id}" target="_blank">${t('View / Print')}</a>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
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

    <div class="card">
      <h2>${t('Share these statements')}</h2>
      <div style="display:flex; gap:10px;">
        <a class="btn secondary" style="text-decoration:none;" href="/api/reports/financial-statements/pdf?business_id=${state.currentBusinessId}" target="_blank">${t('Download PDF')}</a>
        <button class="btn" id="emailStatementsBtn">${t('Email PDF')}</button>
      </div>
    </div>
  `;

  $('#emailStatementsBtn').onclick = async () => {
    const to = prompt(t("Email address to send the financial statements to:"));
    if (!to) return;
    try {
      await api('/reports/financial-statements/email', { method: 'POST', body: JSON.stringify({ business_id: state.currentBusinessId, to }) });
      toast(t('Financial statements emailed'));
    } catch (e) { toast(e.message, true); }
  };
}

// ---------- General Ledger ----------
async function renderGeneralLedger() {
  main.innerHTML = `<h1 class="page-title">${t('General Ledger')}</h1><p class="page-sub">${t('Loading…')}</p>`;
  const ledger = await api(`/reports/general-ledger?business_id=${state.currentBusinessId}`);
  const typeLabels = { asset: t('Assets'), liability: t('Liabilities'), equity: t('Equity'), income: t('Income ').trim(), expense: t('Expenses') };
  const byType = { asset: [], liability: [], equity: [], income: [], expense: [] };
  ledger.forEach(a => { if (a.transactions.length) byType[a.account_type].push(a); });
  const anyTransactions = ledger.some(a => a.transactions.length);

  main.innerHTML = `
    <h1 class="page-title">${t('General Ledger')}</h1>
    <p class="page-sub">${t('Every account with its transactions in order and a running balance — scroll to browse, or print/export a copy.')}</p>

    <div class="card">
      <div style="display:flex; gap:10px;">
        <button class="btn secondary" id="printGlBtn">${t('Print')}</button>
        <a class="btn secondary" style="text-decoration:none;" href="/api/reports/general-ledger/pdf?business_id=${state.currentBusinessId}" target="_blank">${t('Download PDF')}</a>
      </div>
    </div>

    ${anyTransactions ? Object.keys(typeLabels).map(type => {
      const accounts = byType[type];
      if (!accounts.length) return '';
      return `
        <div class="card">
          <h2>${typeLabels[type]}</h2>
          ${accounts.map(acct => `
            <div class="gl-account-block">
              <h3>${escapeHtml(acct.account_name)}</h3>
              <table class="ledger">
                <thead><tr><th>${t('Date')}</th><th>${t('Description')}</th><th class="amount">${t('Amount')}</th><th class="amount">${t('Balance')}</th></tr></thead>
                <tbody>
                  ${acct.transactions.map(tx => `
                    <tr>
                      <td class="date">${tx.date}</td>
                      <td>${escapeHtml(tx.description)}</td>
                      <td class="amount ${tx.amount >= 0 ? 'positive' : 'negative'}">${fmt(tx.amount)}</td>
                      <td class="amount">${fmt(tx.running_balance)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="gl-ending-balance"><span>${t('Ending balance')}</span><span>${fmt(acct.total)}</span></div>
            </div>
          `).join('')}
        </div>
      `;
    }).join('') : `<div class="empty-state"><div class="glyph">§</div>${t('No transactions yet.')}</div>`}
  `;

  $('#printGlBtn').onclick = () => window.print();
}

// ---------- Check Register ----------
async function renderCheckRegister() {
  main.innerHTML = `<h1 class="page-title">${t('Check Register')}</h1><p class="page-sub">${t('Loading…')}</p>`;
  const bankAccounts = state.accounts.filter(a => a.type === 'asset');
  if (!bankAccounts.length) {
    main.innerHTML = `<h1 class="page-title">${t('Check Register')}</h1><div class="empty-state"><div class="glyph">§</div>${t('No accounts to show yet.')}</div>`;
    return;
  }
  if (!state.registerAccountId || !bankAccounts.some(a => a.id === state.registerAccountId)) {
    // Prefer an actual checking/cash-style account over whatever sorts first
    // alphabetically (e.g. "Accounts Receivable") — that's what "check register" means.
    const preferred = bankAccounts.find(a => /check|cash|bank/i.test(a.name)) || bankAccounts[0];
    state.registerAccountId = preferred.id;
  }

  main.innerHTML = `
    <h1 class="page-title">${t('Check Register')}</h1>
    <p class="page-sub">${t('Every transaction in one account, in order, with a running balance — like a checkbook register.')}</p>
    <div class="field" style="max-width:320px;">
      <label class="field-label">${t('Account')}</label>
      <select class="form-input" id="registerAccountSelect">
        ${bankAccounts.map(a => `<option value="${a.id}" ${a.id === state.registerAccountId ? 'selected' : ''}>${a.code ? escapeHtml(a.code) + ' — ' : ''}${escapeHtml(a.name)}</option>`).join('')}
      </select>
    </div>
    <div id="registerBody"></div>
  `;

  $('#registerAccountSelect').onchange = (e) => { state.registerAccountId = e.target.value; loadCheckRegister(); };
  await loadCheckRegister();
}

async function loadCheckRegister() {
  const ledger = await api('/reports/general-ledger?business_id=' + state.currentBusinessId);
  const acct = ledger.find(a => a.account_id === state.registerAccountId);
  const txns = acct ? acct.transactions : [];

  $('#registerBody').innerHTML = `
    <div class="card">
      <div style="display:flex; gap:10px; margin-bottom:14px;">
        <button class="btn secondary" id="printRegisterBtn">${t('Print')}</button>
      </div>
      <table class="ledger">
        <thead><tr><th>${t('Date')}</th><th>${t('Description')}</th><th class="amount">${t('Amount')}</th><th class="amount">${t('Balance')}</th></tr></thead>
        <tbody>
          ${txns.length ? txns.map(tx => `
            <tr>
              <td class="date">${tx.date}</td>
              <td>${escapeHtml(tx.description)}</td>
              <td class="amount ${tx.amount >= 0 ? 'positive' : 'negative'}">${fmt(tx.amount)}</td>
              <td class="amount">${fmt(tx.running_balance)}</td>
            </tr>
          `).join('') : `<tr><td colspan="4" style="text-align:center; color:var(--ink-soft); padding:20px;">${t('No transactions in this account yet.')}</td></tr>`}
        </tbody>
      </table>
      ${txns.length ? `<div class="gl-ending-balance"><span>${t('Ending balance')}</span><span>${fmt(acct.total)}</span></div>` : ''}
    </div>
  `;
  $('#printRegisterBtn').onclick = () => window.print();
}

// ---------- Journal Entries ----------
async function renderJournalEntries() {
  main.innerHTML = `<h1 class="page-title">${t('Journal Entries')}</h1><p class="page-sub">${t('Loading…')}</p>`;
  const entries = await api('/journal-entries?business_id=' + state.currentBusinessId);

  main.innerHTML = `
    <h1 class="page-title">${t('Journal Entries')}</h1>
    <p class="page-sub">${t('Manually move amounts between accounts — each entry must balance to zero.')}</p>

    <div class="card">
      <h2>${t('New journal entry')}</h2>
      <div class="field-row">
        <div class="field" style="max-width:200px;"><label class="field-label">${t('Date')}</label><input type="date" id="jeDate" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="field"><label class="field-label">${t('Memo')}</label><input type="text" id="jeMemo" placeholder="${t('e.g. Purchased equipment with cash')}"></div>
      </div>
      <label class="field-label" style="margin-top:6px;">${t('Lines')}</label>
      <table class="ledger" id="jeLinesTable">
        <thead><tr><th>${t('Account')}</th><th class="amount" style="width:160px;">${t('Amount (+ debit / − credit)')}</th><th></th></tr></thead>
        <tbody id="jeLinesBody"></tbody>
      </table>
      <button class="btn secondary" id="addJeLineBtn" style="margin-top:8px; padding:6px 12px; font-size:12.5px;">${t('+ Add line')}</button>
      <div style="text-align:right; margin-top:12px; font-family:var(--font-mono); font-size:13px;">
        ${t('Net total: ')}<span id="jeNetTotal">$0.00</span>
      </div>
      <button class="btn" id="saveJeBtn" style="margin-top:10px;">${t('Save journal entry')}</button>
    </div>

    <div class="card">
      <h2>${t('Recent entries')}</h2>
      ${entries.length ? entries.map(e => `
        <div style="border-bottom:1px solid var(--rule); padding:10px 0;">
          <div style="display:flex; justify-content:space-between; align-items:baseline;">
            <span style="font-weight:500;">${e.date} — ${escapeHtml(e.memo || t('Journal entry'))}</span>
            <button class="btn secondary" style="padding:3px 8px; font-size:11px;" onclick="deleteJournalEntry('${e.id}')">${t('Delete')}</button>
          </div>
          ${e.lines.map(l => `<div class="pl-line" style="padding-left:12px;"><span>${escapeHtml(l.account_name)}</span><span class="amt">${fmt(l.amount)}</span></div>`).join('')}
        </div>
      `).join('') : `<p style="color:var(--ink-soft); font-size:13px;">${t('No journal entries yet.')}</p>`}
    </div>
  `;

  const body = $('#jeLinesBody');
  function addJeLine() {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><select class="form-input je-account">${accountOptionsGrouped(null).replace('<option value="__new__">' + t('+ Add new account…') + '</option>', '')}</select></td>
      <td><input type="number" step="0.01" class="je-amount" style="width:100%; text-align:right;" placeholder="0.00"></td>
      <td><button class="btn secondary" style="padding:3px 8px; font-size:11px;" onclick="this.closest('tr').remove(); recalcJeTotal();">✕</button></td>
    `;
    body.appendChild(row);
    row.querySelector('.je-amount').addEventListener('input', recalcJeTotal);
    recalcJeTotal();
  }
  window.recalcJeTotal = function () {
    let total = 0;
    body.querySelectorAll('.je-amount').forEach(inp => { total += parseFloat(inp.value) || 0; });
    total = Math.round(total * 100) / 100;
    const el = $('#jeNetTotal');
    el.textContent = fmt(total);
    el.style.color = Math.abs(total) < 0.005 ? 'var(--ledger-green)' : 'var(--brick)';
  };
  addJeLine();
  addJeLine();
  $('#addJeLineBtn').onclick = addJeLine;

  $('#saveJeBtn').onclick = async () => {
    const date = $('#jeDate').value;
    const memo = $('#jeMemo').value.trim();
    const lines = [...body.querySelectorAll('tr')].map(row => ({
      account_id: row.querySelector('.je-account').value,
      amount: parseFloat(row.querySelector('.je-amount').value) || 0,
    })).filter(l => l.amount !== 0);

    if (lines.length < 2) return toast(t('Add at least two lines'), true);
    try {
      await api('/journal-entries', { method: 'POST', body: JSON.stringify({ business_id: state.currentBusinessId, date, memo, lines }) });
      toast(t('Journal entry saved'));
      renderJournalEntries();
    } catch (e) { toast(e.message, true); }
  };
}

async function deleteJournalEntry(id) {
  if (!confirm(t('Delete this journal entry? Both sides will be removed.'))) return;
  await api('/journal-entries/' + id, { method: 'DELETE' });
  toast(t('Journal entry deleted'));
  renderJournalEntries();
}

init();
