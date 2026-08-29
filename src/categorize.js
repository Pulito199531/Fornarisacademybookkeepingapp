const db = require('./db');

let openai = null;
if (process.env.OPENAI_API_KEY) {
  const OpenAI = require('openai');
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// --- Rule-based fallback (works with zero API key, zero cost) ---
// Each rule is [pattern, account name, optional sign filter]. Sign filter lets
// the same vendor name mean different things depending on direction — e.g.
// a Stripe deposit is revenue, but a Stripe debit transfer is a fee/refund.
const KEYWORD_RULES = [
  [/amazon|staples|office depot/i, 'Office Supplies'],
  [/uber|lyft|delta|united|southwest|airbnb|hotel|marriott/i, 'Travel'],
  [/starbucks|restaurant|doordash|grubhub|cafe|coffee/i, 'Meals (50% deductible)'],
  [/aws|google cloud|google one|microsoft|adobe|zoom|slack|notion|dropbox|quickbooks|canva|kaltura|taxbandits|labitax|subscription|saas/i, 'Software Subscriptions'],
  [/shell|chevron|exxon|gas station|mileage/i, 'Vehicle & Mileage'],
  [/state farm|geico|progressive|insurance|insura\b/i, 'Insurance'],
  [/electric|gas company|water utility|internet service|comcast|at&t|verizon/i, 'Utilities'],
  [/humblefax|efax|telephone/i, 'Telephone & Fax Services'],
  [/^rent\b|monthly rent|lease payment/i, 'Rent - Office/Studio'],
  [/irs |state tax|dept of revenue|license fee/i, 'Taxes & Licenses'],
  [/payroll|gusto|\badp\b/i, 'Payroll & Wages'],
  [/attorney|law firm|\bcpa\b|accountant|consulting/i, 'Legal & Professional Services'],
  [/facebook ads|facebk|google ads|google \*ads|tiktok promote|instagram|marketing/i, 'Advertising & Marketing'],
  [/\budemy\b|coursera|training|conference|online training/i, 'Education & Training'],
  [/paypal fee|stripe fee|bank fee|service charge/i, 'Bank & Merchant Fees'],
  [/affirm/i, 'Equipment Financing'],
  [/sba loan payment|loan payment/i, 'Loan Payment (Principal)'],
  [/credit crd|credit card payment/i, 'Credit Card Payable'],
  [/transfer to savings/i, 'Business Savings'],
  [/zelle.*payment to|zelle.*to\b/i, 'Contract Labor', 'negative'],
  [/zelle.*payment from|zelle.*from\b/i, 'Client Revenue', 'positive'],
  [/stripe|visa money transfer credit/i, 'Course & Program Sales', 'positive'],
  [/ach corp debit transfer.*stripe|stripe.*fee/i, 'Bank & Merchant Fees', 'negative'],
  [/deposit|client payment|invoice paid|payment received/i, 'Client Revenue'],
];

function ruleBasedCategorize(description, amount, accountsByName) {
  const sign = amount > 0 ? 'positive' : amount < 0 ? 'negative' : null;
  for (const [pattern, accountName, signFilter] of KEYWORD_RULES) {
    if (signFilter && signFilter !== sign) continue;
    if (pattern.test(description) && accountsByName[accountName]) {
      return { account_name: accountName, confidence: 0.6, reasoning: 'keyword match' };
    }
  }
  return { account_name: 'Uncategorized', confidence: 0.0, reasoning: 'no rule matched' };
}

// Pull recent corrections for this business as few-shot examples (this is the
// "learns your business" hook mentioned in planning — corrections feed back in)
function getRecentCorrections(businessId, limit = 15) {
  return db.prepare(`
    SELECT t.description, a.name AS corrected_account_name
    FROM categorization_corrections c
    JOIN transactions t ON t.id = c.transaction_id
    JOIN accounts a ON a.id = c.corrected_account_id
    WHERE t.business_id = ?
    ORDER BY c.corrected_at DESC
    LIMIT ?
  `).all(businessId, limit);
}

async function categorizeTransactions(businessId, transactions, accounts) {
  const accountsByName = {};
  accounts.forEach(a => { accountsByName[a.name] = a; });

  if (!openai) {
    return transactions.map(t => ({
      ...t,
      ...ruleBasedCategorize(t.description, t.amount, accountsByName),
    }));
  }

  const examples = getRecentCorrections(businessId);
  const accountList = accounts.map(a => `- ${a.name} (${a.type})`).join('\n');
  const exampleText = examples.length
    ? `\nThis business's past corrections (learn from these patterns):\n` +
      examples.map(e => `"${e.description}" -> ${e.corrected_account_name}`).join('\n')
    : '';

  const prompt = `You are a bookkeeping assistant categorizing bank transactions for a small business/self-employed owner.

CHART OF ACCOUNTS (only choose from these):
${accountList}
${exampleText}

TASK:
For each transaction below, assign the single best matching account from the Chart of Accounts above.
If none fit well, respond with "Uncategorized".

Return ONLY valid JSON array, no preamble, no markdown fences, in this format:
[{"index": 0, "account_name": "...", "confidence": 0.0, "reasoning": "short phrase"}]

TRANSACTIONS:
${transactions.map((t, i) => `${i}: ${t.date} | ${t.description} | ${t.amount}`).join('\n')}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    });
    const raw = completion.choices[0].message.content.trim()
      .replace(/^```json/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(raw);
    return transactions.map((t, i) => {
      const match = parsed.find(p => p.index === i) || {};
      return {
        ...t,
        account_name: accountsByName[match.account_name] ? match.account_name : 'Uncategorized',
        confidence: match.confidence ?? 0,
        reasoning: match.reasoning ?? '',
      };
    });
  } catch (err) {
    console.error('OpenAI categorization failed, falling back to rules:', err.message);
    return transactions.map(t => ({
      ...t,
      ...ruleBasedCategorize(t.description, t.amount, accountsByName),
    }));
  }
}

module.exports = { categorizeTransactions };
