const PDFDocument = require('pdfkit');

function fmt(n) {
  const v = Number(n || 0);
  const sign = v < 0 ? '-' : '';
  return sign + '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function drawLine(doc, label, value, opts = {}) {
  const y = doc.y;
  doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(opts.size || 10).fillColor(opts.color || '#1C231F');
  doc.text(label, 50, y, { continued: false, width: 350 });
  doc.text(value, 400, y, { width: 145, align: 'right' });
  doc.moveDown(0.5);
}

function drawSectionHeader(doc, label) {
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#52605A').text(label.toUpperCase(), 50, doc.y, { characterSpacing: 0.5 });
  doc.moveDown(0.3);
}

function buildFinancialStatementsDoc({ business, pl, bs, periodLabel }) {
  const doc = new PDFDocument({ margin: 50 });

  doc.fontSize(20).font('Helvetica-Bold').fillColor('#1C231F').text(business.name);
  if (business.entity_type) {
    doc.fontSize(10).font('Helvetica').fillColor('#52605A').text(business.entity_type);
  }
  doc.moveDown(1.5);

  // ---------- Profit & Loss ----------
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

  // ---------- Balance Sheet ----------
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
