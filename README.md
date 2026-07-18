# Cycle — Personal Period Reminder App

A minimal, single-user period tracker and reminder system. It predicts the
next period from a cycle length, and on the day(s) you choose, emails and/or
Telegram-messages both you and a guardian/admin. Built to run entirely on
free hosting tiers.

## Folder structure

```
period-reminder/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express app entrypoint
│   │   ├── db.js                  # SQLite connection + schema
│   │   ├── predictions.js         # Pure date-math for cycle prediction
│   │   ├── routes/
│   │   │   ├── settings.js        # GET/PUT settings + history
│   │   │   └── reminders.js       # GET /check-reminders, GET /logs
│   │   └── notifications/
│   │       ├── email.js           # Nodemailer/Gmail sender
│   │       └── telegram.js        # Telegram Bot API sender
│   ├── data/period.db             # SQLite file (created automatically)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Router + nav
│   │   ├── api.js                 # fetch wrapper for the backend
│   │   └── pages/
│   │       ├── Dashboard.jsx
│   │       └── Settings.jsx
│   ├── index.html
│   └── package.json
└── .github/workflows/daily-reminder.yml   # free scheduler option
```

## How the database works here (SQLite via Turso)

This app uses **Turso**, a hosted database built on **libSQL** (a SQLite
fork). You still write plain SQLite SQL — `CREATE TABLE`, `SELECT`,
`INSERT`, all identical to local SQLite — but the actual `.db` file lives
on Turso's servers instead of your app's disk. That's the key difference
from a locally-stored SQLite file: it survives Render restarts, redeploys,
and free-tier sleep cycles, because the data isn't tied to your web
service's (ephemeral) filesystem at all.

The trade-off versus local SQLite is that every query now goes over the
network, so the backend code uses `await client.execute(...)` instead of
synchronous calls — everything else (schema, table design, SQL syntax)
is unchanged. Because only one person (plus their guardian) ever uses this
app, SQLite/libSQL's one real limitation — limited concurrent writers —
never comes into play.

**Setting up Turso (free):**

1. Install the CLI and sign up:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   turso auth signup
   ```
2. Create a database:
   ```bash
   turso db create period-reminder
   ```
3. Get your connection URL and an auth token:
   ```bash
   turso db show period-reminder --url
   turso db tokens create period-reminder
   ```
4. Put those two values into `backend/.env` as `TURSO_DATABASE_URL` and
   `TURSO_AUTH_TOKEN` (see `.env.example`), and the same two into your
   Render environment variables when you deploy.

That's it — no server to manage, and the free tier (5 GB storage, 100
databases) is far more than this app will ever need.

The schema has three tables:

- **settings** — a single row (`id = 1`) holding your cycle configuration,
  contact emails, and Telegram chat IDs.
- **period_history** — every time you update `last_period_date` to a new
  value, the previous value is archived here automatically.
- **notification_logs** — a record of every email/Telegram send attempt
  and whether it succeeded, so you can debug delivery issues.

## How Telegram Bot integration works

1. Open Telegram, search for **@BotFather**, send `/newbot`, and follow the
   prompts. You'll receive a **bot token** like `123456789:AAF...`.
2. Message your new bot anything (e.g. "hi") so Telegram registers a chat
   with it.
3. Visit `https://api.telegram.org/bot<TOKEN>/getUpdates` in a browser. The
   JSON response contains `"chat": {"id": 123456789, ...}` — that number is
   the **chat_id** to paste into Settings for that person (do this once for
   yourself, once for your guardian, each messaging the bot from their own
   Telegram account).
4. The backend sends messages by making a plain HTTP POST to
   `https://api.telegram.org/bot<TOKEN>/sendMessage` with `chat_id` and
   `text` — no SDK required (see `notifications/telegram.js`).

## How the scheduler triggers reminders

The backend exposes one endpoint: **`GET /api/check-reminders`**. It doesn't
run on its own — something external has to call it once a day. On each
call, the backend:

1. Loads your settings row from SQLite.
2. Recalculates the next predicted period date and days remaining.
3. Compares `daysRemaining` to your configured `reminder_days_before`.
4. If they match, sends the four notifications (user email, guardian
   email, user Telegram, guardian Telegram) and logs each attempt.
5. If they don't match, it returns `{ triggered: false }` and sends
   nothing — so calling it extra times, or every hour, is harmless.

You have three free options to be the "caller"; pick one:

- **Render Cron Job** (if using Render's cron job feature on the free/starter
  tier — check current availability, as free-tier cron support has changed
  over time).
- **cron-job.org** — a free external cron service. Create a job that hits
  `https://your-backend.onrender.com/api/check-reminders?key=YOUR_API_KEY`
  once a day.
- **GitHub Actions** — the included `.github/workflows/daily-reminder.yml`
  runs on a daily `cron` schedule for free in any GitHub repo. Set repo
  secrets `BACKEND_URL` and `API_KEY` under Settings → Secrets → Actions.

The `key` query parameter (checked against `API_KEY` in your backend's
`.env`) stops random visitors from triggering notifications.

## API design

| Method | Endpoint                       | Purpose                                              |
|--------|---------------------------------|-------------------------------------------------------|
| GET    | `/api/settings`                | Returns settings, history, and computed predictions   |
| PUT    | `/api/settings`                | Updates any settings fields (partial update allowed)  |
| DELETE | `/api/settings/history/:id`    | Deletes one entry from period history                 |
| GET    | `/api/check-reminders`         | Scheduler entrypoint; sends notifications if due      |
| GET    | `/api/logs`                    | Last 50 notification attempts, for debugging           |

`GET /api/settings` response shape:

```json
{
  "settings": { "last_period_date": "2026-06-20", "cycle_length": 28, "...": "..." },
  "history": [{ "id": 1, "period_date": "2026-05-23" }],
  "prediction": {
    "nextPeriodDate": "2026-07-18",
    "daysRemaining": 7,
    "futurePeriods": ["2026-07-18", "2026-08-15", "2026-09-12"]
  }
}
```

## Period prediction logic

- `next_period_date = last_period_date + cycle_length` (days).
- If that date has already passed and you haven't logged a new
  `last_period_date` yet, the backend keeps adding `cycle_length` until it
  lands on a future date — so the dashboard never shows a stale prediction.
- `days_remaining = next_period_date - today`.
- A reminder fires the day `days_remaining` equals your configured
  `reminder_days_before` (e.g. set to `1` for a day-before nudge, `0` for
  same-day).

## Notification flow

```
Scheduler (cron-job.org / GitHub Actions / Render Cron)
        │  daily GET request
        ▼
GET /api/check-reminders?key=API_KEY
        │
        ├─ Not a reminder day → { triggered: false }, nothing sent
        │
        └─ Is a reminder day:
             ├─ Email → user_email        (Nodemailer via Gmail App Password)
             ├─ Email → guardian_email
             ├─ Telegram → user_chat_id   (Telegram Bot API sendMessage)
             ├─ Telegram → guardian_chat_id
             └─ Each attempt logged to notification_logs (success/failed)
```

## Local setup

**Backend**

```bash
cd backend
cp .env.example .env      # fill in TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, GMAIL_USER, GMAIL_APP_PASSWORD, TELEGRAM_BOT_TOKEN, API_KEY
npm install
npm start                 # runs on http://localhost:4000
```

**Frontend**

```bash
cd frontend
echo "VITE_API_URL=http://localhost:4000" > .env
npm install
npm run dev                # runs on http://localhost:5173
```

Open the app, go to Settings, fill in your cycle info, emails, and Telegram
chat IDs, and save.

## Deployment steps

**Backend → Render (free)**

1. Push this repo to GitHub.
2. On Render: New → Web Service → connect your repo, root directory
   `backend`.
3. Build command: `npm install`. Start command: `npm start`.
4. Add environment variables from `.env.example` under Render's
   Environment tab (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `GMAIL_USER`,
   `GMAIL_APP_PASSWORD`, `TELEGRAM_BOT_TOKEN`, `API_KEY`, `FRONTEND_URL` =
   your Vercel URL once you have it).
5. Since your data lives on Turso rather than Render's own disk, Render's
   free-tier ephemeral filesystem is no longer a concern — restarts,
   redeploys, and sleep/wake cycles don't touch your data at all.

**Frontend → Vercel (free)**

1. On Vercel: New Project → import the same repo, root directory
   `frontend`.
2. Framework preset: Vite. Build command: `npm run build`. Output dir:
   `dist`.
3. Add environment variable `VITE_API_URL` = your Render backend URL
   (e.g. `https://period-reminder-backend.onrender.com`).
4. Deploy. Update the backend's `FRONTEND_URL` env var to match this
   Vercel URL (for CORS) and redeploy the backend.

**Scheduler**

- Easiest: create a free account at cron-job.org, add a daily job hitting
  `https://<your-backend>.onrender.com/api/check-reminders?key=<API_KEY>`.
- Or: enable the included GitHub Actions workflow by adding `BACKEND_URL`
  and `API_KEY` as repository secrets — no external service needed.

## Notes on "no authentication" mode

Since this is single-user and both endpoints only expose your own cycle
data, the simplest approach is to skip login entirely and instead keep the
Vercel/Render URLs private (don't share them) plus keep `API_KEY` secret so
outsiders can't trigger notifications even if they find the backend URL.
If you'd rather have a lock screen, a simple shared-password check (one
password, stored as an env var, checked on the frontend before rendering)
can be added without any user table or session infrastructure — ask if
you'd like that added.
