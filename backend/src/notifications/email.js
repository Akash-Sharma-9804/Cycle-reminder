// notifications/email.js
// -----------------------------------------------------------------------
// Sends email via Gmail using an "App Password" (a 16-character password
// you generate in your Google Account -> Security -> App Passwords, which
// only works for this purpose and can be revoked independently of your
// real Gmail password). Nodemailer just talks SMTP to Gmail's servers.
// -----------------------------------------------------------------------

const nodemailer = require("nodemailer");

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

async function sendEmail({ to, subject, text }) {
  if (!to) throw new Error("No recipient email configured");
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Period Reminder" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    text,
  });
}

module.exports = { sendEmail };
