const db = require('./db');

let openai = null;
if (process.env.OPENAI_API_KEY) {
  const OpenAI = require('openai');
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// --- Rule-based fallback (works with zero API key, zero cost) ---
const KEYWORD_RULES = [
  [/amazon|staples|office depot/i, 'Office Supplies'],
  [/uber|lyft|delta|united|southwest|airbnb|hotel|marriott/i, 'Travel'],
  [/starbucks|restaurant|doordash|grubhub|cafe|coffee/i, 'Meals (50% deductible)'],
  [/aws|google cloud|microsoft|adobe|zoom|slack|notion|dropbox|quickbooks|subscription|saas/i, 'Software Subscriptions'],
  [/shell|chevron|exxon|gas station|mileage/i, 'Vehicle & Mileage'],
  [/state farm|geico|progressive|insurance/i, 'Insurance'],
  [/electric|gas company|water|internet|comcast|at&t|verizon/i, 'Utilities'],
  [/rent|lease/i, 'Rent - Office/Studio'],
  [/irs|state tax|dept of revenue|license fee/i, 'Taxes & Licenses'],
  [/payroll|gusto|adp/i, 'Payroll & Wages'],
  [/attorney|law firm|cpa|accountant|consulting/i, 'Legal & Professional Services'],
  [/facebook ads|google ads|instagram|marketing/i, 'Advertising & Marketing'],
  [/course|udemy|coursera|training|conference/i, 'Education & Training'],
  [/paypal fee|stripe fee|bank fee|service charge/i, 'Bank & Merchant Fees'],
  [/deposit|client payment|invoice paid|payment received/i, 'Client Revenue'],
];

function ruleBasedCategorize(description, accountsByName) {
  for (const [pattern, accountName] of KEYWORD_RULES) {
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
      ...ruleBasedCategorize(t.description, accountsByName),
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
      ...ruleBasedCategorize(t.description, accountsByName),
    }));
  }
}

module.exports = { categorizeTransactions };
