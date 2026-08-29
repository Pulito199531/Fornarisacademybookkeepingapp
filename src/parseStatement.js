// Parses loosely-formatted pasted bank statement text into transaction rows.
// Accepts lines like:
//   08/03/2026  AMAZON MKTPLACE PMTS   -42.19
//   2026-08-03, Client Payment - Acme LLC, 1500.00
//   08/03/2026\tSTARBUCKS #4021\t-6.75
// Also handles statements that give a date with no year (03/01) plus a running
// balance column instead of a signed amount (very common bank export format):
//   03/02 ACH Deposit - Client Lambda   9,400.00   128,516.60
// In that case the transaction's sign is derived from how the balance changed
// versus the previous row, rather than guessed from the number itself.

const FULL_DATE_PATTERNS = [
  /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
  /(\d{4}-\d{1,2}-\d{1,2})/,
];
const SHORT_DATE_PATTERN = /\b(\d{1,2})\/(\d{1,2})\b(?!\/)/;
const MONEY_TOKEN = /\(?-?\$?[\d,]+\.\d{2}\)?/g;
const BALANCE_LABEL = /\b(beginning|opening|ending|closing|previous|new|current)\s+balance\b/i;

// Some banks (Truist among them) don't put a sign or separate debit/credit
// column on each line at all — instead the whole statement is split into two
// blocks under plain-text headers, and every line in a block shares that
// block's sign. A header line is recognized by matching one of these phrases
// with NO dollar amount on the same line (a summary/total line with the same
// wording but a trailing amount is a different thing and is handled elsewhere).
const NEGATIVE_SECTION_HEADER = /\b(withdrawals?|debits?(?!\s+card)|checks?\s+paid)\b/i;
const POSITIVE_SECTION_HEADER = /\b(deposits?|credits?)\b/i;

function findFallbackYear(fullText) {
  // Prefer a year that appears near the word "period" or a date range at the
  // top of the statement; fall back to the first plausible year anywhere.
  const periodMatch = fullText.match(/period[^\n]*?(20\d{2})/i);
  if (periodMatch) return periodMatch[1];
  const anyYear = fullText.match(/\b(20\d{2})\b/);
  return anyYear ? anyYear[1] : String(new Date().getFullYear());
}

function parseDate(str, fallbackYear) {
  for (const pat of FULL_DATE_PATTERNS) {
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
  if (fallbackYear) {
    const m = str.match(SHORT_DATE_PATTERN);
    if (m) {
      const [, mo, da] = m;
      const d = new Date(`${fallbackYear}-${mo.padStart(2, '0')}-${da.padStart(2, '0')}`);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
  }
  return null;
}

function stripDatePattern(str) {
  let out = str;
  for (const pat of FULL_DATE_PATTERNS) out = out.replace(pat, '');
  out = out.replace(SHORT_DATE_PATTERN, '');
  return out;
}

function moneyTokenToNumber(token) {
  let negative = false;
  let t = token;
  if (t.startsWith('(') && t.endsWith(')')) { negative = true; t = t.slice(1, -1); }
  t = t.replace(/[$,]/g, '');
  let val = parseFloat(t);
  if (isNaN(val)) return null;
  return negative ? -Math.abs(val) : val;
}

function parseAmount(str) {
  const matches = str.match(MONEY_TOKEN);
  if (!matches || matches.length === 0) return null;
  return moneyTokenToNumber(matches[matches.length - 1]);
}

function parseStatementText(text) {
  const fallbackYear = findFallbackYear(text);
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const rows = [];
  const skipped = [];
  let lastBalance = null; // tracks running balance for delta-based sign detection
  let sectionSign = null; // +1 / -1 / null — set by a plain-text section header line

  for (const line of lines) {
    const hasMoney = MONEY_TOKEN.test(line);
    MONEY_TOKEN.lastIndex = 0; // reset since MONEY_TOKEN is a global regex reused across .test() calls

    // A standalone header line (no dollar amount on it) like "Deposits, credits
    // and interest" sets the sign for every transaction line that follows,
    // until the next section header changes it.
    if (!hasMoney) {
      if (NEGATIVE_SECTION_HEADER.test(line)) { sectionSign = -1; continue; }
      if (POSITIVE_SECTION_HEADER.test(line)) { sectionSign = 1; continue; }
    }

    const date = parseDate(line, fallbackYear);
    if (date === null) {
      if (hasMoney) skipped.push(line);
      continue;
    }

    const moneyTokens = line.match(MONEY_TOKEN) || [];
    let desc = stripDatePattern(line);
    let amount = null;

    if (moneyTokens.length === 0) {
      skipped.push(line);
      continue;
    } else if (moneyTokens.length === 1) {
      const isBalanceMarkerRow = BALANCE_LABEL.test(line);
      const value = moneyTokenToNumber(moneyTokens[0]);
      if (isBalanceMarkerRow) {
        // "Beginning/Ending Balance" row — not a real transaction, just seeds
        // the running balance for delta calculations on the rows that follow.
        lastBalance = value;
        desc = desc.replace(moneyTokens[0], '');
        continue;
      }
      // If we're inside a signed section (all-withdrawals or all-deposits
      // block) and the raw token had no explicit sign of its own, the section
      // decides the sign rather than defaulting to positive.
      const tokenHadExplicitSign = /^-|^\(/.test(moneyTokens[0]);
      amount = (sectionSign !== null && !tokenHadExplicitSign) ? Math.abs(value) * sectionSign : value;
      desc = desc.replace(moneyTokens[0], '');
    } else {
      // Two (or more) numbers on the line: assume the pattern is
      // [transaction amount, ...,  running balance] — the last token is the
      // running balance. Derive the signed amount from how the balance moved
      // versus the previous row, which is more reliable than guessing which
      // column (debit/credit) the first number came from.
      const magnitude = Math.abs(moneyTokenToNumber(moneyTokens[0]));
      const balance = moneyTokenToNumber(moneyTokens[moneyTokens.length - 1]);
      if (lastBalance !== null && balance !== null) {
        const delta = Math.round((balance - lastBalance) * 100) / 100;
        // Sanity check: the balance change should roughly match the stated
        // amount; if it doesn't, the line isn't in the format we assumed, so
        // fall back to the plain "last token is the amount" behavior.
        amount = Math.abs(Math.abs(delta) - magnitude) < 0.02 ? delta : moneyTokenToNumber(moneyTokens[moneyTokens.length - 1]);
      } else {
        // No prior balance to compare against (no "Beginning Balance" row
        // found) — best effort: assume the first transaction is a credit.
        amount = magnitude;
      }
      lastBalance = balance;
      moneyTokens.forEach(tok => { desc = desc.replace(tok, ''); });
    }

    if (amount === null) {
      skipped.push(line);
      continue;
    }

    desc = desc.replace(/[,\t]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!desc) desc = '(no description)';

    rows.push({ date, description: desc, amount });
  }

  return { rows, skipped };
}

// Parses a bank-exported CSV. Handles the common column layouts:
//  - Date, Description, Amount  (single signed amount column)
//  - Date, Description, Debit, Credit  (separate columns; debit becomes negative)
//  - Date, Description, Debit, Credit, Balance  (derives sign from balance change)
// Falls back to the loose text parser per-row if headers aren't recognized.
function parseStatementCsv(csvText) {
  const { parse } = require('csv-parse/sync');
  let records;
  try {
    records = parse(csvText, { columns: false, skip_empty_lines: true, relax_column_count: true });
  } catch (e) {
    return parseStatementText(csvText);
  }
  if (records.length === 0) return { rows: [], skipped: [] };

  const fallbackYear = findFallbackYear(csvText);
  const header = records[0].map(h => String(h).trim().toLowerCase());
  const looksLikeHeader = header.some(h => ['date', 'description', 'amount', 'debit', 'credit', 'memo', 'balance'].includes(h));
  const dataRows = looksLikeHeader ? records.slice(1) : records;

  const idx = {
    date: header.indexOf('date'),
    description: header.indexOf('description') !== -1 ? header.indexOf('description') : header.indexOf('memo'),
    amount: header.indexOf('amount'),
    debit: header.indexOf('debit'),
    credit: header.indexOf('credit'),
    balance: header.indexOf('balance'),
  };

  // If we couldn't confidently find columns, fall back to treating each row as loose text.
  if (!looksLikeHeader || idx.date === -1) {
    return parseStatementText(dataRows.map(r => r.join(' ')).join('\n'));
  }

  const rows = [];
  const skipped = [];
  let lastBalance = null;

  for (const r of dataRows) {
    const rawDate = r[idx.date];
    const date = rawDate ? parseDate(String(rawDate), fallbackYear) : null;
    const description = idx.description !== -1 ? String(r[idx.description] || '').trim() : '(no description)';

    let amount = null;
    if (idx.amount !== -1 && r[idx.amount]) {
      amount = parseAmount(String(r[idx.amount]));
    } else if (idx.debit !== -1 || idx.credit !== -1) {
      const debit = idx.debit !== -1 ? parseAmount(String(r[idx.debit] || '')) : null;
      const credit = idx.credit !== -1 ? parseAmount(String(r[idx.credit] || '')) : null;
      if (credit) amount = Math.abs(credit);
      else if (debit) amount = -Math.abs(debit);
      else if (idx.balance !== -1 && r[idx.balance]) {
        // Neither debit nor credit populated on this row but there's a balance
        // column — likely a "Beginning/Ending Balance" style row. Just seed
        // lastBalance and skip it as a non-transaction.
        lastBalance = parseAmount(String(r[idx.balance]));
        continue;
      }
    }

    if (idx.balance !== -1 && r[idx.balance]) {
      lastBalance = parseAmount(String(r[idx.balance]));
    }

    if (!date || amount === null) {
      skipped.push(r.join(', '));
      continue;
    }
    rows.push({ date, description: description || '(no description)', amount });
  }

  return { rows, skipped };
}

// Extracts text from a PDF bank statement, then runs it through the loose text
// parser. Works well for statements with simple date/description/amount lines
// per row; complex multi-column PDF layouts may need manual paste instead.
async function parseStatementPdf(buffer) {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({ data, useWorkerFetch: false, isEvalSupported: false });
  const doc = await loadingTask.promise;

  let fullText = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    // Group text items into lines by their vertical position (transform[5] = y),
    // since pdf.js gives us individual words/fragments with no line breaks otherwise.
    const linesByY = new Map();
    for (const item of content.items) {
      const y = Math.round(item.transform[5]);
      if (!linesByY.has(y)) linesByY.set(y, []);
      linesByY.get(y).push(item);
    }
    // Sort lines top-to-bottom (higher y = higher on the page), then each
    // line's words left-to-right by x position.
    const sortedYs = [...linesByY.keys()].sort((a, b) => b - a);
    for (const y of sortedYs) {
      const lineItems = linesByY.get(y).sort((a, b) => a.transform[4] - b.transform[4]);
      fullText += lineItems.map(it => it.str).join(' ') + '\n';
    }
  }

  return parseStatementText(fullText);
}

module.exports = { parseStatementText, parseStatementCsv, parseStatementPdf };
