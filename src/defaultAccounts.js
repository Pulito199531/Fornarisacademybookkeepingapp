// Chart of Accounts generator. The equity section changes based on how the
// business is legally structured, since that's what determines the correct
// tax treatment of money moving between the business and its owner(s).
// schedule_c_line maps expense accounts to IRS Schedule C lines where applicable
// (only relevant for sole props / single-member LLCs, which file a Schedule C).

const COMMON_ASSETS = [
  { name: 'Business Checking', type: 'asset', subtype: 'current_asset' },
  { name: 'Business Savings', type: 'asset', subtype: 'current_asset' },
  { name: 'Accounts Receivable', type: 'asset', subtype: 'current_asset' },
  { name: 'Equipment', type: 'asset', subtype: 'fixed_asset' },
  { name: 'Fixed Assets', type: 'asset', subtype: 'fixed_asset' },
  { name: 'Accumulated Depreciation', type: 'asset', subtype: 'contra_asset' },
];

const COMMON_LIABILITIES = [
  { name: 'Accounts Payable', type: 'liability', subtype: 'current_liability' },
  { name: 'Credit Card Payable', type: 'liability', subtype: 'current_liability' },
  { name: 'Loans Payable', type: 'liability', subtype: 'long_term_liability' },
  { name: 'Sales Tax Payable', type: 'liability', subtype: 'current_liability' },
  { name: 'Payroll Liabilities', type: 'liability', subtype: 'current_liability' },
];

const COMMON_INCOME = [
  { name: 'Client Revenue', type: 'income' },
  { name: 'Product Sales', type: 'income' },
  { name: 'Course & Program Sales', type: 'income' },
  { name: 'Other Income', type: 'income' },
];

const COMMON_EXPENSES = [
  { name: 'Advertising & Marketing', type: 'expense', schedule_c_line: 'Line 8' },
  { name: 'Bank & Merchant Fees', type: 'expense', schedule_c_line: 'Line 27a' },
  { name: 'Contract Labor', type: 'expense', schedule_c_line: 'Line 11' },
  { name: 'Depreciation Expense', type: 'expense', schedule_c_line: 'Line 13' },
  { name: 'Insurance', type: 'expense', schedule_c_line: 'Line 15' },
  { name: 'Interest Expense', type: 'expense', schedule_c_line: 'Line 16b' },
  { name: 'Loan Payment (Principal)', type: 'expense', schedule_c_line: null },
  { name: 'Legal & Professional Services', type: 'expense', schedule_c_line: 'Line 17' },
  { name: 'Meals (50% deductible)', type: 'expense', schedule_c_line: 'Line 24b' },
  { name: 'Office Supplies', type: 'expense', schedule_c_line: 'Line 22' },
  { name: 'Rent - Office/Studio', type: 'expense', schedule_c_line: 'Line 20b' },
  { name: 'Software Subscriptions', type: 'expense', schedule_c_line: 'Line 27a' },
  { name: 'Travel', type: 'expense', schedule_c_line: 'Line 24a' },
  { name: 'Utilities', type: 'expense', schedule_c_line: 'Line 25' },
  { name: 'Vehicle & Mileage', type: 'expense', schedule_c_line: 'Line 9' },
  { name: 'Home Office', type: 'expense', schedule_c_line: 'Form 8829' },
  { name: 'Payroll & Wages', type: 'expense', schedule_c_line: 'Line 26' },
  { name: 'Taxes & Licenses', type: 'expense', schedule_c_line: 'Line 23' },
  { name: 'Education & Training', type: 'expense', schedule_c_line: 'Line 27a' },
  { name: 'Equipment Financing', type: 'expense', schedule_c_line: null },
  { name: 'Telephone & Fax Services', type: 'expense', schedule_c_line: 'Line 27a' },
  { name: 'Uncategorized', type: 'expense' },
];

// Equity accounts by entity type — this is the part that actually differs.
const EQUITY_BY_ENTITY = {
  sole_prop: [
    { name: "Owner's Equity", type: 'equity' },
    { name: "Owner's Draw", type: 'equity' },
    { name: 'Owner Contributions', type: 'equity' },
  ],
  single_member_llc: [
    { name: "Owner's Equity", type: 'equity' },
    { name: "Owner's Draw", type: 'equity' },
    { name: 'Owner Contributions', type: 'equity' },
  ],
  llc: [
    { name: "Members' Capital", type: 'equity' },
    { name: 'Member Contributions', type: 'equity' },
    { name: 'Member Distributions', type: 'equity' },
  ],
  partnership: [
    { name: "Partners' Capital", type: 'equity' },
    { name: 'Partner Contributions', type: 'equity' },
    { name: 'Partner Distributions', type: 'equity' },
    { name: 'Guaranteed Payments to Partners', type: 'expense', schedule_c_line: null },
  ],
  s_corp: [
    { name: 'Common Stock', type: 'equity' },
    { name: 'Additional Paid-in Capital', type: 'equity' },
    { name: 'Shareholder Contributions', type: 'equity' },
    { name: 'Shareholder Distributions', type: 'equity' },
    { name: 'Retained Earnings', type: 'equity' },
  ],
  c_corp: [
    { name: 'Common Stock', type: 'equity' },
    { name: 'Additional Paid-in Capital', type: 'equity' },
    { name: 'Retained Earnings', type: 'equity' },
    { name: 'Dividends Payable', type: 'liability', subtype: 'current_liability' },
    { name: 'Treasury Stock', type: 'equity' },
  ],
};

const ENTITY_TYPE_LABELS = {
  sole_prop: 'Sole Proprietor',
  single_member_llc: 'Single-Member LLC',
  llc: 'LLC (multi-member)',
  partnership: 'Partnership',
  s_corp: 'S Corporation',
  c_corp: 'C Corporation',
};

function getDefaultAccounts(entityType) {
  const equity = EQUITY_BY_ENTITY[entityType] || EQUITY_BY_ENTITY.sole_prop;
  return [...COMMON_ASSETS, ...COMMON_LIABILITIES, ...equity, ...COMMON_INCOME, ...COMMON_EXPENSES];
}

// The full master catalog across every entity type, deduplicated by name, for
// a "browse and add from the standard list" picker. Equity/expense accounts
// that only apply to certain entity types (e.g. Shareholder Distributions)
// are tagged with which ones, so the UI can show that context.
function getAllStandardAccounts() {
  const byName = new Map();
  const addAll = (list, entityTag) => {
    for (const a of list) {
      if (!byName.has(a.name)) {
        byName.set(a.name, { ...a, entityTypes: entityTag ? [entityTag] : [] });
      } else if (entityTag) {
        byName.get(a.name).entityTypes.push(entityTag);
      }
    }
  };
  addAll(COMMON_ASSETS);
  addAll(COMMON_LIABILITIES);
  addAll(COMMON_INCOME);
  addAll(COMMON_EXPENSES);
  for (const [entityType, list] of Object.entries(EQUITY_BY_ENTITY)) {
    addAll(list, entityType);
  }
  return [...byName.values()];
}

module.exports = { getDefaultAccounts, getAllStandardAccounts, ENTITY_TYPE_LABELS };
