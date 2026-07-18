// notifications/email.js
// -----------------------------------------------------------------------
// Uses Brevo (https://brevo.com) HTTP API instead of Gmail SMTP, since
// Render's free tier blocks outbound SMTP ports (25, 465, 587).
// -----------------------------------------------------------------------

const fetch = require("node-fetch");

async function sendEmail({ to, subject, text }) {
  if (!to) throw new Error("No recipient email configured");

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "Period Reminder",
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo API error (${res.status}): ${body}`);
  }
}

module.exports = { sendEmail };