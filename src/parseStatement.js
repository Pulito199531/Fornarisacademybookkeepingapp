// Parses loosely-formatted pasted bank statement text into transaction rows.
// Accepts lines like:
//   08/03/2026  AMAZON MKTPLACE PMTS   -42.19
//   2026-08-03, Client Payment - Acme LLC, 1500.00
//   08/03/2026\tSTARBUCKS #4021\t-6.75

const DATE_PATTERNS = [
  /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
  /(\d{4}-\d{1,2}-\d{1,2})/,
];

function parseDate(str) {
  for (const pat of DATE_PATTERNS) {
    const m = str.match(pat);
    if (m) {
      const raw = m[1];
      let d;
      if (raw.includes('-')) {
        d = new Date(raw);
      } else {
        const [mo, da, yr] = raw.split('/');
        const year = yr.length === 2 ? `20${yr}` : yr;
        d = new Date(`${year}-${mo.padStart(2, '0')}-${da.padStart(2, '0')}`);
      }
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
  }
  return null;
}

function parseAmount(str) {
  // last number-looking token on the line, allow $, commas, parens for negatives
  const matches = str.match(/\(?-?\$?[\d,]+\.\d{2}\)?/g);
  if (!matches || matches.length === 0) return null;
  let token = matches[matches.length - 1];
  let negative = false;
  if (token.startsWith('(') && token.endsWith(')')) {
    negative = true;
    token = token.slice(1, -1);
  }
  token = token.replace(/[$,]/g, '');
  let val = parseFloat(token);
  if (isNaN(val)) return null;
  if (negative) val = -Math.abs(val);
  return val;
}

function parseStatementText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const rows = [];
  const skipped = [];

  for (const line of lines) {
    const date = parseDate(line);
    const amount = parseAmount(line);
    if (date === null || amount === null) {
      skipped.push(line);
      continue;
    }
    // description = whatever's left after stripping date and the final amount token
    let desc = line;
    for (const pat of DATE_PATTERNS) desc = desc.replace(pat, '');
    const amtMatches = desc.match(/\(?-?\$?[\d,]+\.\d{2}\)?/g);
    if (amtMatches && amtMatches.length) {
      desc = desc.replace(amtMatches[amtMatches.length - 1], '');
    }
    desc = desc.replace(/[,\t]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!desc) desc = '(no description)';

    rows.push({ date, description: desc, amount });
  }

  return { rows, skipped };
}

module.exports = { parseStatementText };
