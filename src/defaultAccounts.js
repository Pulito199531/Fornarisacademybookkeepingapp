// Default Chart of Accounts for a self-employed / small business owner.
// schedule_c_line maps expense accounts to IRS Schedule C lines where applicable.
module.exports = [
  { name: 'Business Checking', type: 'asset', subtype: 'current_asset' },
  { name: 'Business Savings', type: 'asset', subtype: 'current_asset' },
  { name: 'Accounts Receivable', type: 'asset', subtype: 'current_asset' },
  { name: 'Equipment', type: 'asset', subtype: 'fixed_asset' },

  { name: 'Credit Card Payable', type: 'liability', subtype: 'current_liability' },
  { name: 'Loans Payable', type: 'liability', subtype: 'long_term_liability' },
  { name: 'Sales Tax Payable', type: 'liability', subtype: 'current_liability' },

  { name: "Owner's Equity", type: 'equity' },
  { name: "Owner's Draw", type: 'equity' },
  { name: 'Shareholder Distribution', type: 'equity' },

  { name: 'Client Revenue', type: 'income' },
  { name: 'Product Sales', type: 'income' },
  { name: 'Course & Program Sales', type: 'income' },
  { name: 'Other Income', type: 'income' },

  { name: 'Advertising & Marketing', type: 'expense', schedule_c_line: 'Line 8' },
  { name: 'Bank & Merchant Fees', type: 'expense', schedule_c_line: 'Line 27a' },
  { name: 'Contract Labor', type: 'expense', schedule_c_line: 'Line 11' },
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
