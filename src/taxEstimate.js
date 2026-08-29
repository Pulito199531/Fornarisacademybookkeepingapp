// Simplified quarterly estimated tax calculator for self-employed / small business owners.
// This is an ESTIMATE for planning purposes only, not tax advice or a filing-ready figure.
// Uses approximate 2026 federal brackets and standard deduction; ignores credits, other income,
// state tax computation (state is informational only), and QBI deduction.

const SE_TAX_RATE = 0.153; // 15.3% self-employment tax (Social Security 12.4% + Medicare 2.9%)
const SE_SS_WAGE_BASE = 176100; // approx 2026 Social Security wage base
const SE_TAXABLE_PORTION = 0.9235; // only 92.35% of net SE earnings is subject to SE tax
const ADDITIONAL_MEDICARE_THRESHOLD = { single: 200000, married_joint: 250000, head_of_household: 200000 };
const ADDITIONAL_MEDICARE_RATE = 0.009;

// Approximate 2026 standard deduction (inflation-adjusted estimate)
const STANDARD_DEDUCTION = { single: 15000, married_joint: 30000, head_of_household: 22500 };

// Approximate 2026 federal income tax brackets (single / married filing jointly / head of household)
const BRACKETS = {
  single: [
    [0, 0.10], [11925, 0.12], [48475, 0.22], [103350, 0.24],
    [197300, 0.32], [250525, 0.35], [626350, 0.37],
  ],
  married_joint: [
    [0, 0.10], [23850, 0.12], [96950, 0.22], [206700, 0.24],
    [394600, 0.32], [501050, 0.35], [751600, 0.37],
  ],
  head_of_household: [
    [0, 0.10], [17000, 0.12], [64850, 0.22], [103350, 0.24],
    [197300, 0.32], [250500, 0.35], [626350, 0.37],
  ],
};

function progressiveTax(taxableIncome, brackets) {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const [floor, rate] = brackets[i];
    const nextFloor = i + 1 < brackets.length ? brackets[i + 1][0] : Infinity;
    if (taxableIncome <= floor) break;
    const taxedAtThisRate = Math.min(taxableIncome, nextFloor) - floor;
    tax += taxedAtThisRate * rate;
  }
  return tax;
}

// Simplified state income tax — planning estimate only. Flat approximate rates for
// flat/near-flat states, marginal brackets for the two biggest states (CA, NY).
// States not listed return null (no calculation), shown as "not available" in the UI.
const STATE_FLAT_RATES = {
  // no state income tax
  FL: 0, TX: 0, WA: 0, NV: 0, WY: 0, SD: 0, AK: 0, TN: 0, NH: 0,
  // flat-rate states (approximate 2026 rates)
  CO: 0.044, IL: 0.0495, PA: 0.0307, NC: 0.045, MA: 0.05, AZ: 0.025, GA: 0.0539,
};

const STATE_BRACKETS = {
  CA: [[0, 0.01], [10756, 0.02], [25499, 0.04], [40245, 0.06], [55866, 0.08], [70606, 0.093], [360659, 0.103], [432787, 0.113], [721314, 0.123]],
  NY: [[0, 0.04], [8500, 0.045], [11700, 0.0525], [13900, 0.0585], [80650, 0.0625], [215400, 0.0685], [1077550, 0.0965]],
};

function calculateStateTax(state, taxableIncome) {
  if (!state) return null;
  const st = state.toUpperCase();
  if (st in STATE_FLAT_RATES) return round2(Math.max(0, taxableIncome) * STATE_FLAT_RATES[st]);
  if (st in STATE_BRACKETS) return round2(progressiveTax(Math.max(0, taxableIncome), STATE_BRACKETS[st]));
  return null; // not in our simplified table
}

function calculateEstimate({ netProfit, filingStatus = 'single', otherIncome = 0, state = null }) {
  const fs = BRACKETS[filingStatus] ? filingStatus : 'single';

  const seTaxableEarnings = Math.max(0, netProfit) * SE_TAXABLE_PORTION;
  const socialSecurityTax = Math.min(seTaxableEarnings, SE_SS_WAGE_BASE) * 0.124;
  const medicareTax = seTaxableEarnings * 0.029;
  const additionalMedicare = Math.max(0, (seTaxableEarnings + otherIncome) - ADDITIONAL_MEDICARE_THRESHOLD[fs]) * ADDITIONAL_MEDICARE_RATE;
  const selfEmploymentTax = socialSecurityTax + medicareTax + additionalMedicare;

  // Half of SE tax is deductible above-the-line
  const adjustedGrossIncome = Math.max(0, netProfit) + otherIncome - (selfEmploymentTax / 2);
  const taxableIncome = Math.max(0, adjustedGrossIncome - STANDARD_DEDUCTION[fs]);
  const federalIncomeTax = progressiveTax(taxableIncome, BRACKETS[fs]);

  const stateIncomeTax = calculateStateTax(state, taxableIncome);
  const totalEstimatedTax = selfEmploymentTax + federalIncomeTax + (stateIncomeTax || 0);

  return {
    filing_status: fs,
    net_profit: netProfit,
    self_employment_tax: round2(selfEmploymentTax),
    federal_income_tax: round2(federalIncomeTax),
    state_income_tax: stateIncomeTax,
    state_tax_available: stateIncomeTax !== null,
    total_estimated_tax: round2(totalEstimatedTax),
    quarterly_payment: round2(totalEstimatedTax / 4),
    effective_rate: netProfit > 0 ? round2((totalEstimatedTax / netProfit) * 100) : 0,
  };
}

function round2(n) { return Math.round(n * 100) / 100; }

// IRS quarterly due dates (approximate — shifts if the date falls on a weekend/holiday)
function quarterlyDueDates(year) {
  return [
    { quarter: 'Q1', period: `Jan 1 – Mar 31, ${year}`, due: `${year}-04-15` },
    { quarter: 'Q2', period: `Apr 1 – May 31, ${year}`, due: `${year}-06-15` },
    { quarter: 'Q3', period: `Jun 1 – Aug 31, ${year}`, due: `${year}-09-15` },
    { quarter: 'Q4', period: `Sep 1 – Dec 31, ${year}`, due: `${year + 1}-01-15` },
  ];
}

module.exports = { calculateEstimate, quarterlyDueDates };
