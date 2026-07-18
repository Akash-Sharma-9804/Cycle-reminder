const express = require("express");
const { client } = require("../db");
const { getUpcomingPeriodDate, getDaysRemaining } = require("../predictions");
const { sendEmail } = require("../notifications/email");
const { sendTelegramMessage } = require("../notifications/telegram");

const router = express.Router();

async function logNotification(type, recipient, status) {
  await client.execute({
    sql: "INSERT INTO notification_logs (notification_type, recipient, sent_at, status) VALUES (?, ?, datetime('now'), ?)",
    args: [type, recipient, status],
  });
}

async function sendAndLog(type, recipient, sendFn) {
  if (!recipient) return; // skip silently if not configured
  try {
    await sendFn();
    await logNotification(type, recipient, "success");
  } catch (err) {
    console.error(`Failed to send ${type} to ${recipient}:`, err.message);
    await logNotification(type, recipient, "failed");
  }
}

// GET /api/check-reminders
// -----------------------------------------------------------------------
// The single endpoint an external daily scheduler calls (Render Cron Job,
// cron-job.org, or GitHub Actions). Safe to call more than once a day:
// if today isn't a reminder day, it just returns without sending anything.
// -----------------------------------------------------------------------
router.get("/check-reminders", async (req, res) => {
  const providedKey = req.query.key || req.headers["x-api-key"];
  if (process.env.API_KEY && providedKey !== process.env.API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const settingsResult = await client.execute("SELECT * FROM settings WHERE id = 1");
    const settings = settingsResult.rows[0];

    const upcoming = getUpcomingPeriodDate(settings.last_period_date, settings.cycle_length);
    const daysRemaining = getDaysRemaining(upcoming);

    const isReminderDay = daysRemaining === settings.reminder_days_before;

    if (!isReminderDay) {
      return res.json({
        triggered: false,
        nextPeriodDate: upcoming,
        daysRemaining,
        message: "Not a reminder day, nothing sent.",
      });
    }

    const dayPhrase =
      daysRemaining === 0 ? "today" : daysRemaining === 1 ? "tomorrow" : `in ${daysRemaining} days`;

    const userSubject = "Period Reminder";
    const userText = `Your predicted period is ${dayPhrase} (${upcoming}). Please stay prepared.`;

    const guardianSubject = "Period Reminder (Guardian Notice)";
    const guardianText = `Reminder: The predicted period is ${dayPhrase} (${upcoming}).`;

    await sendAndLog("email", settings.user_email, () =>
      sendEmail({ to: settings.user_email, subject: userSubject, text: userText })
    );

    await sendAndLog("email", settings.guardian_email, () =>
      sendEmail({ to: settings.guardian_email, subject: guardianSubject, text: guardianText })
    );

    await sendAndLog("telegram", settings.user_chat_id, () =>
      sendTelegramMessage({ chatId: settings.user_chat_id, text: userText })
    );

    await sendAndLog("telegram", settings.guardian_chat_id, () =>
      sendTelegramMessage({ chatId: settings.guardian_chat_id, text: guardianText })
    );

    res.json({
      triggered: true,
      nextPeriodDate: upcoming,
      daysRemaining,
      message: "Reminders sent.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to check reminders" });
  }
});

// GET /api/logs -> view recent notification history (handy for debugging)
router.get("/logs", async (req, res) => {
  try {
    const result = await client.execute(
      "SELECT * FROM notification_logs ORDER BY sent_at DESC LIMIT 50"
    );
    res.json({ logs: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load logs" });
  }
});

module.exports = router;
