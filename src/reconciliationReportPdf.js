const PDFDocument = require('pdfkit');

function fmt(n) {
  const v = Number(n || 0);
  const sign = v < 0 ? '-' : '';
  return sign + '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function drawTxnTable(doc, title, txns, color) {
  if (doc.y > 650) doc.addPage();
  doc.fontSize(11).font('Helvetica-Bold').fillColor(color || '#1C231F').text(title);
  doc.moveDown(0.3);

  if (!txns.length) {
    doc.fontSize(9).font('Helvetica').fillColor('#52605A').text('None.');
    doc.moveDown(0.8);
    return;
  }

  const tableTop = doc.y;
  const col = { date: 50, desc: 130, account: 350, amount: 470 };
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#52605A');
  doc.text('DATE', col.date, tableTop);
  doc.text('DESCRIPTION', col.desc, tableTop);
  doc.text('ACCOUNT', col.account, tableTop);
  doc.text('AMOUNT', col.amount, tableTop);
  doc.moveTo(50, tableTop + 12).lineTo(545, tableTop + 12).strokeColor('#D8DCD4').lineWidth(0.5).stroke();

  let y = tableTop + 18;
  doc.font('Helvetica').fontSize(8.5).fillColor('#1C231F');
  let subtotal = 0;
  txns.forEach(t => {
    if (y > 720) { doc.addPage(); y = 50; }
    doc.fillColor('#1C231F').text(t.date, col.date, y);
    doc.text(t.description, col.desc, y, { width: 215, ellipsis: true });
    doc.fillColor('#52605A').text(t.account_name || 'Uncategorized', col.account, y, { width: 115, ellipsis: true });
    doc.fillColor(t.amount < 0 ? '#A23B2E' : '#1C231F').text(fmt(t.amount), col.amount, y, { width: 75, align: 'right' });
    subtotal += t.amount;
    y += 15;
  });
  doc.y = y + 4;
  doc.moveTo(400, doc.y).lineTo(545, doc.y).strokeColor('#1C231F').lineWidth(0.5).stroke();
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#1C231F')
    .text('Subtotal', col.account, doc.y, { width: 115 })
    .text(fmt(subtotal), col.amount, doc.y - 11, { width: 75, align: 'right' });
  doc.moveDown(1);
}

function buildReconciliationReportDoc({ business, report }) {
  const doc = new PDFDocument({ margin: 50, size: 'letter' });
  const s = report.statement;

  doc.fontSize(20).font('Helvetica-Bold').fillColor('#1C231F').text(business.name);
  doc.fontSize(15).font('Helvetica-Bold').text('Reconciliation Report');
  doc.fontSize(9).font('Helvetica').fillColor('#52605A')
    .text(`${s.source_name || 'Statement'} — ${s.period_start} to ${s.period_end}`);
  if (report.locked_at) doc.text(`Reconciled on ${report.locked_at.slice(0, 10)}`);
  doc.moveDown(1);

  // Summary box
  const summaryTop = doc.y;
  doc.fontSize(9).font('Helvetica').fillColor('#52605A');
  const rows = [
    ['Beginning balance', fmt(report.beginning_balance)],
    ['Ending balance (target)', fmt(report.ending_balance)],
    ['Cleared transactions total', fmt(report.cleared_total)],
    ['Uncleared transactions total', fmt(report.uncleared_total)],
    ['Difference', report.difference !== null ? fmt(report.difference) : 'N/A'],
    ['Status', report.is_balanced ? 'Balanced' : 'Discrepancy — review uncleared items below'],
  ];
  rows.forEach(([label, value]) => {
    doc.font('Helvetica').fillColor('#52605A').text(label, 50, doc.y, { width: 250, continued: false });
    doc.font('Helvetica-Bold').fillColor(label === 'Status' && !report.is_balanced ? '#A23B2E' : '#1C231F')
      .text(value, 300, doc.y - doc.currentLineHeight(), { width: 245, align: 'right' });
    doc.moveDown(0.4);
  });
  doc.moveDown(1);

  drawTxnTable(doc, `Cleared Transactions (${report.cleared.length})`, report.cleared, '#2F5D50');
  drawTxnTable(doc, `Uncleared Transactions — Discrepancy Items (${report.uncleared.length})`, report.uncleared, '#A23B2E');

  doc.fontSize(8).font('Helvetica').fillColor('#52605A')
    .text(`Generated ${new Date().toISOString().slice(0, 10)} by Fornaris Ledger Academy.`, 50, doc.page.height - 40);

  return doc;
}

function renderReconciliationReportPdf(res, data) {
  const doc = buildReconciliationReportDoc(data);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="reconciliation-report-${data.report.statement.period_end}.pdf"`);
  doc.pipe(res);
  doc.end();
}

module.exports = { renderReconciliationReportPdf };
