const PDFDocument = require('pdfkit');

function buildInvoiceDoc({ business, client, invoice }) {
  const doc = new PDFDocument({ margin: 50 });

  doc.fontSize(20).font('Helvetica-Bold').text(business.name, { continued: false });
  doc.fontSize(10).font('Helvetica').fillColor('#52605A').text(business.entity_type || '');
  doc.moveDown(1.5);

  doc.fontSize(16).font('Helvetica-Bold').fillColor('#1C231F').text(`Invoice ${invoice.invoice_number}`);
  doc.fontSize(10).font('Helvetica').fillColor('#52605A')
    .text(`Issued: ${invoice.issue_date}`)
    .text(`Due: ${invoice.due_date || '—'}`)
    .text(`Status: ${invoice.status}`);
  doc.moveDown(1);

  doc.fontSize(11).font('Helvetica-Bold').fillColor('#1C231F').text('Bill to');
  doc.fontSize(10).font('Helvetica').fillColor('#1C231F').text(client ? client.name : '—');
  if (client && client.email) doc.fillColor('#52605A').text(client.email);
  doc.moveDown(1.5);

  // Line items table
  const tableTop = doc.y;
  const col = { desc: 50, qty: 330, rate: 400, amount: 470 };
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#52605A');
  doc.text('DESCRIPTION', col.desc, tableTop);
  doc.text('QTY', col.qty, tableTop);
  doc.text('RATE', col.rate, tableTop);
  doc.text('AMOUNT', col.amount, tableTop);
  doc.moveTo(50, tableTop + 14).lineTo(545, tableTop + 14).strokeColor('#1C231F').lineWidth(1).stroke();

  let y = tableTop + 22;
  doc.font('Helvetica').fillColor('#1C231F').fontSize(10);
  invoice.line_items.forEach(li => {
    const amount = li.quantity * li.rate;
    doc.text(li.description, col.desc, y, { width: 260 });
    doc.text(String(li.quantity), col.qty, y);
    doc.text(`$${li.rate.toFixed(2)}`, col.rate, y);
    doc.text(`$${amount.toFixed(2)}`, col.amount, y);
    y += 20;
  });

  y += 8;
  doc.moveTo(350, y).lineTo(545, y).strokeColor('#D8DCD4').stroke();
  y += 10;
  doc.font('Helvetica').fillColor('#52605A').text('Total', col.rate, y);
  doc.font('Helvetica-Bold').fillColor('#1C231F').text(`$${invoice.total.toFixed(2)}`, col.amount, y);
  y += 18;

  const paid = invoice.total - invoice.balance_due;
  if (paid > 0) {
    doc.font('Helvetica').fillColor('#52605A').text('Paid', col.rate, y);
    doc.text(`$${paid.toFixed(2)}`, col.amount, y);
    y += 18;
  }

  doc.font('Helvetica-Bold').fillColor('#2F5D50').text('Balance Due', col.rate, y);
  doc.text(`$${invoice.balance_due.toFixed(2)}`, col.amount, y);

  if (invoice.notes) {
    doc.moveDown(3);
    doc.font('Helvetica').fontSize(9).fillColor('#52605A').text(invoice.notes, 50);
  }

  return doc;
}

// Streams a simple, clean invoice PDF directly to an HTTP response.
function renderInvoicePdf(res, data) {
  const doc = buildInvoiceDoc(data);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="invoice-${data.invoice.invoice_number}.pdf"`);
  doc.pipe(res);
  doc.end();
}

// Builds the same PDF into an in-memory buffer, for attaching to an email.
function invoicePdfBuffer(data) {
  return new Promise((resolve, reject) => {
    const doc = buildInvoiceDoc(data);
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

module.exports = { renderInvoicePdf, invoicePdfBuffer };
