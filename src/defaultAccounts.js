// Chart of Accounts generator. The equity section changes based on how the
// business is legally structured, since that's what determines the correct
// tax treatment of money moving between the business and its owner(s).
// schedule_c_line maps expense accounts to IRS Schedule C lines where applicable
// (only relevant for sole props / single-member LLCs, which file a Schedule C).
// `code` follows conventional GL numbering: 1000s assets, 2000s liabilities,
// 3000s equity, 4000s income, 5000s+ expenses.

const COMMON_ASSETS = [
  { name: 'Business Checking', type: 'asset', subtype: 'current_asset', code: '1000' },
  { name: 'Business Savings', type: 'asset', subtype: 'current_asset', code: '1010' },
  { name: 'Accounts Receivable', type: 'asset', subtype: 'current_asset', code: '1200' },
  { name: 'Equipment', type: 'asset', subtype: 'fixed_asset', code: '1500' },
  { name: 'Fixed Assets', type: 'asset', subtype: 'fixed_asset', code: '1510' },
  { name: 'Accumulated Depreciation', type: 'asset', subtype: 'contra_asset', code: '1520' },
];

const COMMON_LIABILITIES = [
  { name: 'Accounts Payable', type: 'liability', subtype: 'current_liability', code: '2000' },
  { name: 'Credit Card Payable', type: 'liability', subtype: 'current_liability', code: '2010' },
  { name: 'Loans Payable', type: 'liability', subtype: 'long_term_liability', code: '2500' },
  { name: 'Sales Tax Payable', type: 'liability', subtype: 'current_liability', code: '2100' },
  { name: 'Payroll Liabilities', type: 'liability', subtype: 'current_liability', code: '2200' },
];

const COMMON_INCOME = [
  { name: 'Client Revenue', type: 'income', code: '4000' },
  { name: 'Product Sales', type: 'income', code: '4010' },
  { name: 'Course & Program Sales', type: 'income', code: '4020' },
  { name: 'Other Income', type: 'income', code: '4900' },
];

const COMMON_EXPENSES = [
  { name: 'Advertising & Marketing', type: 'expense', schedule_c_line: 'Line 8', code: '5000' },
  { name: 'Bank & Merchant Fees', type: 'expense', schedule_c_line: 'Line 27a', code: '5010' },
  { name: 'Contract Labor', type: 'expense', schedule_c_line: 'Line 11', code: '5020' },
  { name: 'Depreciation Expense', type: 'expense', schedule_c_line: 'Line 13', code: '5030' },
  { name: 'Insurance', type: 'expense', schedule_c_line: 'Line 15', code: '5040' },
  { name: 'Interest Expense', type: 'expense', schedule_c_line: 'Line 16b', code: '5050' },
  { name: 'Loan Payment (Principal)', type: 'expense', schedule_c_line: null, code: '5060' },
  { name: 'Legal & Professional Services', type: 'expense', schedule_c_line: 'Line 17', code: '5070' },
  { name: 'Meals (50% deductible)', type: 'expense', schedule_c_line: 'Line 24b', code: '5080' },
  { name: 'Office Supplies', type: 'expense', schedule_c_line: 'Line 22', code: '5090' },
  { name: 'Rent - Office/Studio', type: 'expense', schedule_c_line: 'Line 20b', code: '5100' },
  { name: 'Software Subscriptions', type: 'expense', schedule_c_line: 'Line 27a', code: '5110' },
  { name: 'Travel', type: 'expense', schedule_c_line: 'Line 24a', code: '5120' },
  { name: 'Utilities', type: 'expense', schedule_c_line: 'Line 25', code: '5130' },
  { name: 'Vehicle & Mileage', type: 'expense', schedule_c_line: 'Line 9', code: '5140' },
  { name: 'Home Office', type: 'expense', schedule_c_line: 'Form 8829', code: '5150' },
  { name: 'Payroll & Wages', type: 'expense', schedule_c_line: 'Line 26', code: '5160' },
  { name: 'Taxes & Licenses', type: 'expense', schedule_c_line: 'Line 23', code: '5170' },
  { name: 'Education & Training', type: 'expense', schedule_c_line: 'Line 27a', code: '5180' },
  { name: 'Equipment Financing', type: 'expense', schedule_c_line: null, code: '5190' },
  { name: 'Telephone & Fax Services', type: 'expense', schedule_c_line: 'Line 27a', code: '5200' },
  { name: 'Uncategorized', type: 'expense', code: '5999' },
];

// Equity accounts by entity type — this is the part that actually differs.
const EQUITY_BY_ENTITY = {
  sole_prop: [
    { name: "Owner's Equity", type: 'equity', code: '3000' },
    { name: "Owner's Draw", type: 'equity', code: '3010' },
    { name: 'Owner Contributions', type: 'equity', code: '3020' },
  ],
  single_member_llc: [
    { name: "Owner's Equity", type: 'equity', code: '3000' },
    { name: "Owner's Draw", type: 'equity', code: '3010' },
    { name: 'Owner Contributions', type: 'equity', code: '3020' },
  ],
  llc: [
    { name: "Members' Capital", type: 'equity', code: '3000' },
    { name: 'Member Contributions', type: 'equity', code: '3010' },
    { name: 'Member Distributions', type: 'equity', code: '3020' },
  ],
  partnership: [
    { name: "Partners' Capital", type: 'equity', code: '3000' },
    { name: 'Partner Contributions', type: 'equity', code: '3010' },
    { name: 'Partner Distributions', type: 'equity', code: '3020' },
    { name: 'Guaranteed Payments to Partners', type: 'expense', schedule_c_line: null, code: '5210' },
  ],
  s_corp: [
    { name: 'Common Stock', type: 'equity', code: '3000' },
    { name: 'Additional Paid-in Capital', type: 'equity', code: '3010' },
    { name: 'Shareholder Contributions', type: 'equity', code: '3020' },
    { name: 'Shareholder Distributions', type: 'equity', code: '3030' },
    { name: 'Retained Earnings', type: 'equity', code: '3040' },
  ],
  c_corp: [
    { name: 'Common Stock', type: 'equity', code: '3000' },
    { name: 'Additional Paid-in Capital', type: 'equity', code: '3010' },
    { name: 'Retained Earnings', type: 'equity', code: '3040' },
    { name: 'Dividends Payable', type: 'liability', subtype: 'current_liability', code: '2050' },
    { name: 'Treasury Stock', type: 'equity', code: '3050' },
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
