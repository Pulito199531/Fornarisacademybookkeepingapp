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

// Parses a bank-exported CSV. Handles the common column layouts:
//  - Date, Description, Amount  (single signed amount column)
//  - Date, Description, Debit, Credit  (separate columns; debit becomes negative)
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

  const header = records[0].map(h => String(h).trim().toLowerCase());
  const looksLikeHeader = header.some(h => ['date', 'description', 'amount', 'debit', 'credit', 'memo'].includes(h));
  const dataRows = looksLikeHeader ? records.slice(1) : records;

  const idx = {
    date: header.indexOf('date'),
    description: header.indexOf('description') !== -1 ? header.indexOf('description') : header.indexOf('memo'),
    amount: header.indexOf('amount'),
    debit: header.indexOf('debit'),
    credit: header.indexOf('credit'),
  };

  // If we couldn't confidently find columns, fall back to treating each row as loose text.
  if (!looksLikeHeader || idx.date === -1) {
    return parseStatementText(dataRows.map(r => r.join(' ')).join('\n'));
  }

  const rows = [];
  const skipped = [];
  for (const r of dataRows) {
    const rawDate = r[idx.date];
    const date = parseDate(rawDate) || (rawDate ? parseDate(String(rawDate)) : null);
    const description = idx.description !== -1 ? String(r[idx.description] || '').trim() : '(no description)';

    let amount = null;
    if (idx.amount !== -1 && r[idx.amount]) {
      amount = parseAmount(String(r[idx.amount]));
    } else if (idx.debit !== -1 || idx.credit !== -1) {
      const debit = idx.debit !== -1 ? parseAmount(String(r[idx.debit] || '')) : null;
      const credit = idx.credit !== -1 ? parseAmount(String(r[idx.credit] || '')) : null;
      if (credit) amount = Math.abs(credit);
      else if (debit) amount = -Math.abs(debit);
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
