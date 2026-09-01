const PDFDocument = require('pdfkit');

function fmt(n) {
  const v = Number(n || 0);
  const sign = v < 0 ? '-' : '';
  return sign + '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPct(n) {
  if (n === null || n === undefined) return '—';
  const sign = n < 0 ? '-' : '+';
  return sign + Math.abs(n).toFixed(1) + '%';
}

function drawLine(doc, label, value, opts = {}) {
  const y = doc.y;
  doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(opts.size || 10).fillColor(opts.color || '#1C231F');
  doc.text(label, 50, y, { continued: false, width: 350 });
  doc.text(value, 400, y, { width: 145, align: 'right' });
  doc.moveDown(0.5);
}

// Four-column comparison row: Account | Current | Prior | Change (with % below)
function drawComparisonLine(doc, label, current, prior, change, pctChange, opts = {}) {
  const y = doc.y;
  doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(opts.size || 9.5).fillColor(opts.color || '#1C231F');
  doc.text(label, 50, y, { width: 195 });
  doc.text(fmt(current), 250, y, { width: 90, align: 'right' });
  doc.text(fmt(prior), 345, y, { width: 90, align: 'right' });
  doc.fillColor(change < 0 ? '#A23B2E' : '#2F5D50').text(fmt(change), 440, y, { width: 105, align: 'right' });
  doc.fontSize(7.5).fillColor('#52605A').text(fmtPct(pctChange), 440, y + 11, { width: 105, align: 'right' });
  doc.y = y + (opts.bold ? 22 : 20);
}
function drawComparisonHeader(doc) {
  const y = doc.y;
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#52605A');
  doc.text('ACCOUNT', 50, y, { width: 195 });
  doc.text('CURRENT', 250, y, { width: 90, align: 'right' });
  doc.text('PRIOR', 345, y, { width: 90, align: 'right' });
  doc.text('CHANGE', 440, y, { width: 105, align: 'right' });
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#D8DCD4').lineWidth(0.5).stroke();
  doc.moveDown(0.3);
}

function drawSectionHeader(doc, label) {
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#52605A').text(label.toUpperCase(), 50, doc.y, { characterSpacing: 0.5 });
  doc.moveDown(0.3);
}

function buildFinancialStatementsDoc({ business, pl, bs, periodLabel, comparison }) {
  const doc = new PDFDocument({ margin: 50, size: 'letter' });

  doc.fontSize(20).font('Helvetica-Bold').fillColor('#1C231F').text(business.name);
  if (business.entity_type) {
    doc.fontSize(10).font('Helvetica').fillColor('#52605A').text(business.entity_type);
  }
  doc.moveDown(1.5);

  if (comparison) {
    // ---------- Profit & Loss (comparison) ----------
    doc.fontSize(15).font('Helvetica-Bold').fillColor('#1C231F').text('Profit & Loss — Comparison');
    doc.fontSize(9).font('Helvetica').fillColor('#52605A')
      .text(`Current: ${comparison.current_period_label}   vs   Prior: ${comparison.prior_period_label}`);
    doc.moveDown(0.8);
    drawComparisonHeader(doc);

    drawSectionHeader(doc, 'Income');
    if (comparison.income_lines.length) {
      comparison.income_lines.forEach(r => drawComparisonLine(doc, r.account_name, r.current, r.prior, r.change, r.pct_change));
    } else {
      drawComparisonLine(doc, '—', 0, 0, 0, null);
    }

    drawSectionHeader(doc, 'Expenses');
    if (comparison.expense_lines.length) {
      comparison.expense_lines.forEach(r => drawComparisonLine(doc, r.account_name, -Math.abs(r.current), -Math.abs(r.prior), -r.change, r.pct_change));
    } else {
      drawComparisonLine(doc, '—', 0, 0, 0, null);
    }

    doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).strokeColor('#1C231F').lineWidth(1).stroke();
    doc.moveDown(0.4);
    drawComparisonLine(doc, 'Net Profit', comparison.net_profit.current, comparison.net_profit.prior,
      comparison.net_profit.current - comparison.net_profit.prior,
      comparison.net_profit.prior !== 0 ? Math.round(((comparison.net_profit.current - comparison.net_profit.prior) / Math.abs(comparison.net_profit.prior)) * 1000) / 10 : null,
      { bold: true, size: 11 });

    // ---------- Balance Sheet (comparison) ----------
    if (comparison.bs) {
      doc.moveDown(1.5);
      doc.fontSize(15).font('Helvetica-Bold').fillColor('#1C231F').text('Balance Sheet — Comparison');
      doc.fontSize(9).font('Helvetica').fillColor('#52605A')
        .text(`${comparison.bs.current_label}   vs   ${comparison.bs.prior_label}`);
      doc.moveDown(0.8);
      drawComparisonHeader(doc);

      [['Assets', comparison.bs.asset_lines], ['Liabilities', comparison.bs.liability_lines], ['Equity', comparison.bs.equity_lines]].forEach(([label, lines]) => {
        drawSectionHeader(doc, label);
        if (lines.length) {
          lines.forEach(r => drawComparisonLine(doc, r.account_name, r.current, r.prior, r.change, r.pct_change));
        } else {
          drawComparisonLine(doc, '—', 0, 0, 0, null);
        }
      });

      doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).strokeColor('#1C231F').lineWidth(1).stroke();
      doc.moveDown(0.4);
      const ta = comparison.bs.total_assets;
      drawComparisonLine(doc, 'Total Assets', ta.current, ta.prior, ta.current - ta.prior,
        ta.prior !== 0 ? Math.round(((ta.current - ta.prior) / Math.abs(ta.prior)) * 1000) / 10 : null,
        { bold: true, size: 11 });
    }
  } else {
    // ---------- Profit & Loss (single period) ----------
    doc.fontSize(15).font('Helvetica-Bold').fillColor('#1C231F').text('Profit & Loss');
    doc.fontSize(9).font('Helvetica').fillColor('#52605A').text(periodLabel || 'All time');
    doc.moveDown(0.8);

    drawSectionHeader(doc, 'Income');
    if (pl.income.length) {
      pl.income.forEach(r => drawLine(doc, r.account_name, fmt(r.total)));
    } else {
      drawLine(doc, '—', fmt(0));
    }

    drawSectionHeader(doc, 'Expenses');
    if (pl.expenses.length) {
      pl.expenses.forEach(r => drawLine(doc, r.account_name, fmt(Math.abs(r.total))));
    } else {
      drawLine(doc, '—', fmt(0));
    }

    doc.moveTo(50, doc.y + 4).lineTo(545, doc.y + 4).strokeColor('#1C231F').lineWidth(1).stroke();
    doc.moveDown(0.5);
    drawLine(doc, 'Net Profit', fmt(pl.net_profit), { bold: true, size: 12 });

    // ---------- Balance Sheet (single period) ----------
    doc.moveDown(1.5);
    doc.fontSize(15).font('Helvetica-Bold').fillColor('#1C231F').text('Balance Sheet');
    doc.fontSize(9).font('Helvetica').fillColor('#52605A').text(periodLabel ? `As of ${periodLabel.split(' – ')[1] || periodLabel}` : 'All time');
    doc.moveDown(0.8);

    drawSectionHeader(doc, 'Assets');
    if (bs.assets.length) {
      bs.assets.forEach(r => drawLine(doc, r.account_name, fmt(r.total)));
    } else {
      drawLine(doc, '—', fmt(0));
    }

    drawSectionHeader(doc, 'Liabilities');
    if (bs.liabilities.length) {
      bs.liabilities.forEach(r => drawLine(doc, r.account_name, fmt(r.total)));
    } else {
      drawLine(doc, '—', fmt(0));
    }

    drawSectionHeader(doc, 'Equity');
    if (bs.equity.length) {
      bs.equity.forEach(r => drawLine(doc, r.account_name, fmt(r.total)));
    } else {
      drawLine(doc, '—', fmt(0));
    }

    doc.moveTo(50, doc.y + 4).lineTo(545, doc.y + 4).strokeColor('#1C231F').lineWidth(1).stroke();
    doc.moveDown(0.5);
    drawLine(doc, 'Total Assets', fmt(bs.total_assets), { bold: true, size: 12 });
  }

  doc.moveDown(2);
  doc.fontSize(8).font('Helvetica').fillColor('#52605A')
    .text(`Generated ${new Date().toISOString().slice(0, 10)} by Fornaris Ledger Academy.`, 50);

  return doc;
}

function renderFinancialStatementsPdf(res, data) {
  const doc = buildFinancialStatementsDoc(data);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="financial-statements-${data.business.name.replace(/[^a-z0-9]/gi, '-')}.pdf"`);
  doc.pipe(res);
  doc.end();
}

function financialStatementsPdfBuffer(data) {
  return new Promise((resolve, reject) => {
    const doc = buildFinancialStatementsDoc(data);
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

module.exports = { renderFinancialStatementsPdf, financialStatementsPdfBuffer };
