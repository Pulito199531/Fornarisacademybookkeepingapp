const nodemailer = require('nodemailer');

const configured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
if (configured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendInvoiceEmail({ to, subject, text, pdfBuffer, pdfFilename }) {
  if (!configured) throw new Error('Email is not configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASS to .env.');
  return transporter.sendMail({
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    to, subject, text,
    attachments: [{ filename: pdfFilename, content: pdfBuffer }],
  });
}

module.exports = { configured, sendInvoiceEmail };
