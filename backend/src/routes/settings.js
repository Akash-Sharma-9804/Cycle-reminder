const express = require("express");
const { client } = require("../db");
const {
  getUpcomingPeriodDate,
  getFuturePeriods,
  getDaysRemaining,
} = require("../predictions");

const router = express.Router();

// GET /api/settings -> current settings + computed prediction fields
router.get("/", async (req, res) => {
  try {
    const settingsResult = await client.execute("SELECT * FROM settings WHERE id = 1");
    const settings = settingsResult.rows[0];

    const historyResult = await client.execute(
      "SELECT * FROM period_history ORDER BY period_date DESC"
    );
    const history = historyResult.rows;

    const upcoming = getUpcomingPeriodDate(
      settings.last_period_date,
      settings.cycle_length
    );

    res.json({
      settings,
      history,
      prediction: {
        nextPeriodDate: upcoming,
        daysRemaining: getDaysRemaining(upcoming),
        futurePeriods: getFuturePeriods(settings.last_period_date, settings.cycle_length, 3),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load settings" });
  }
});

// PUT /api/settings -> update settings
router.put("/", async (req, res) => {
  try {
    const {
      last_period_date,
      cycle_length,
      period_duration,
      user_email,
      guardian_email,
      user_chat_id,
      guardian_chat_id,
      reminder_days_before,
    } = req.body;

    const currentResult = await client.execute("SELECT * FROM settings WHERE id = 1");
    const current = currentResult.rows[0];

    // If the last_period_date changed to a new date, log the old one into history.
    if (last_period_date && last_period_date !== current.last_period_date) {
      await client.execute({
        sql: "INSERT INTO period_history (period_date) VALUES (?)",
        args: [current.last_period_date],
      });
    }

    await client.execute({
      sql: `UPDATE settings SET
        last_period_date = COALESCE(?, last_period_date),
        cycle_length = COALESCE(?, cycle_length),
        period_duration = COALESCE(?, period_duration),
        user_email = COALESCE(?, user_email),
        guardian_email = COALESCE(?, guardian_email),
        user_chat_id = COALESCE(?, user_chat_id),
        guardian_chat_id = COALESCE(?, guardian_chat_id),
        reminder_days_before = COALESCE(?, reminder_days_before)
      WHERE id = 1`,
      args: [
        last_period_date ?? null,
        cycle_length ?? null,
        period_duration ?? null,
        user_email ?? null,
        guardian_email ?? null,
        user_chat_id ?? null,
        guardian_chat_id ?? null,
        reminder_days_before ?? null,
      ],
    });

    const updatedResult = await client.execute("SELECT * FROM settings WHERE id = 1");
    res.json({ settings: updatedResult.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// DELETE /api/settings/history/:id -> remove one history entry
router.delete("/history/:id", async (req, res) => {
  try {
    await client.execute({
      sql: "DELETE FROM period_history WHERE id = ?",
      args: [req.params.id],
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete history entry" });
  }
});

module.exports = router;
