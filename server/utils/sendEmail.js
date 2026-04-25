const nodemailer = require('nodemailer');

/**
 * sendEmail — sends a password reset email via SMTP.
 *
 * Development fallback: if SMTP_HOST is not set, the reset link
 * is printed to the server console so you can test without email.
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_HOST) {
    console.log('\n========== EMAIL (dev console fallback) ==========');
    console.log(`TO:      ${to}`);
    console.log(`SUBJECT: ${subject}`);
    const match = html.match(/href="([^"]+)"/);
    if (match) console.log(`RESET LINK: ${match[1]}`);
    console.log('==================================================\n');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"QueueEase" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;