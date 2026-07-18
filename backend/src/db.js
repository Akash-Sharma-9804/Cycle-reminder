// db.js
// -----------------------------------------------------------------------
// Turso is a hosted SQLite-compatible database (built on libSQL). It's the
// same SQL you'd write against a local .db file, but the data lives on
// Turso's servers instead of your app's disk - so it survives every
// Render restart, redeploy, and free-tier sleep cycle.
//
// You still write the same SQL (CREATE TABLE, SELECT, INSERT...) - the
// only difference from plain SQLite is that every call goes over the
// network, so it's async instead of synchronous, and you need two env
// vars: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN (see .env.example).
// -----------------------------------------------------------------------

const { createClient } = require("@libsql/client");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// ---- Schema + one-time seed -------------------------------------------
async function initDb() {
  await client.batch(
    [
      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        last_period_date TEXT NOT NULL,
        cycle_length INTEGER NOT NULL DEFAULT 28,
        period_duration INTEGER NOT NULL DEFAULT 5,
        user_email TEXT,
        guardian_email TEXT,
        user_chat_id TEXT,
        guardian_chat_id TEXT,
        reminder_days_before INTEGER NOT NULL DEFAULT 1
      )`,
      `CREATE TABLE IF NOT EXISTS period_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        period_date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS notification_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        notification_type TEXT NOT NULL,
        recipient TEXT NOT NULL,
        sent_at TEXT NOT NULL DEFAULT (datetime('now')),
        status TEXT NOT NULL
      )`,
    ],
    "write"
  );

  const existing = await client.execute("SELECT id FROM settings WHERE id = 1");
  if (existing.rows.length === 0) {
    await client.execute(
      `INSERT INTO settings (id, last_period_date, cycle_length, period_duration, reminder_days_before)
       VALUES (1, date('now'), 28, 5, 1)`
    );
  }
}

module.exports = { client, initDb };
