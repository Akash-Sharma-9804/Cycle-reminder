require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { initDb } = require("./db");
const settingsRoutes = require("./routes/settings");
const reminderRoutes = require("./routes/reminders");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "period-reminder-backend" });
});

app.use("/api/settings", settingsRoutes);
app.use("/api", reminderRoutes); // exposes /api/check-reminders and /api/logs

const PORT = process.env.PORT || 4000;

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Period Reminder backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
