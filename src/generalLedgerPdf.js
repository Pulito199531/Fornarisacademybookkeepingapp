const PDFDocument = require('pdfkit');

function fmt(n) {
  const v = Number(n || 0);
  const sign = v < 0 ? '-' : '';
  return sign + '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const TYPE_LABELS = { asset: 'Assets', liability: 'Liabilities', equity: 'Equity', income: 'Income', expense: 'Expenses' };

function buildGeneralLedgerDoc({ business, ledger, periodLabel }) {
  const doc = new PDFDocument({ margin: 50, size: 'letter' });

  doc.fontSize(20).font('Helvetica-Bold').fillColor('#1C231F').text(business.name);
  doc.fontSize(15).font('Helvetica-Bold').text('General Ledger');
  doc.fontSize(9).font('Helvetica').fillColor('#52605A').text(periodLabel || 'All time');
  doc.moveDown(1);

  const grouped = {};
  ledger.forEach(a => { (grouped[a.account_type] = grouped[a.account_type] || []).push(a); });

  const col = { date: 50, desc: 130, amount: 400, balance: 470 };

  Object.entries(TYPE_LABELS).forEach(([type, label]) => {
    const accounts = (grouped[type] || []).filter(a => a.transactions.length > 0);
    if (!accounts.length) return;

    if (doc.y > 680) doc.addPage();
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#2F5D50').text(label.toUpperCase());
    doc.moveDown(0.3);

    accounts.forEach(acct => {
      if (doc.y > 680) doc.addPage();
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1C231F').text(acct.account_name);
      doc.moveDown(0.2);

      const tableTop = doc.y;
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#52605A');
      doc.text('DATE', col.date, tableTop);
      doc.text('DESCRIPTION', col.desc, tableTop);
      doc.text('AMOUNT', col.amount, tableTop);
      doc.text('BALANCE', col.balance, tableTop);
      doc.moveTo(50, tableTop + 12).lineTo(545, tableTop + 12).strokeColor('#D8DCD4').lineWidth(0.5).stroke();

      let y = tableTop + 18;
      doc.font('Helvetica').fontSize(8.5).fillColor('#1C231F');
      acct.transactions.forEach(t => {
        if (y > 720) {
          doc.addPage();
          y = 50;
        }
        doc.text(t.date, col.date, y);
        doc.text(t.description, col.desc, y, { width: 265, ellipsis: true });
        doc.fillColor(t.amount < 0 ? '#A23B2E' : '#1C231F').text(fmt(t.amount), col.amount, y, { width: 65, align: 'right' });
        doc.fillColor('#1C231F').text(fmt(t.running_balance), col.balance, y, { width: 75, align: 'right' });
        y += 15;
      });

      doc.y = y + 4;
      doc.moveTo(350, doc.y).lineTo(545, doc.y).strokeColor('#1C231F').lineWidth(0.5).stroke();
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#1C231F')
        .text('Ending balance', col.amount - 60, doc.y, { width: 120, align: 'right' })
        .text(fmt(acct.total), col.balance, doc.y - 11, { width: 75, align: 'right' });
      doc.moveDown(1);
    });
  });

  doc.fontSize(8).font('Helvetica').fillColor('#52605A')
    .text(`Generated ${new Date().toISOString().slice(0, 10)} by Fornaris Ledger Academy.`, 50, doc.page.height - 40);

  return doc;
}

function renderGeneralLedgerPdf(res, data) {
  const doc = buildGeneralLedgerDoc(data);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="general-ledger-${data.business.name.replace(/[^a-z0-9]/gi, '-')}.pdf"`);
  doc.pipe(res);
  doc.end();
}

module.exports = { renderGeneralLedgerPdf };
