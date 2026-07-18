import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useAppData } from "../DataContext.jsx";
import { api } from "../api";

const FIELDS = [
  { key: "last_period_date", label: "Last period date", type: "date" },
  { key: "cycle_length", label: "Cycle length (days)", type: "number" },
  { key: "period_duration", label: "Period duration (days)", type: "number" },
  { key: "reminder_days_before", label: "Remind me (days before)", type: "number" },
  { key: "user_email", label: "Your email", type: "email" },
  { key: "guardian_email", label: "Guardian/admin email", type: "email" },
  { key: "user_chat_id", label: "Your Telegram chat ID", type: "text" },
  { key: "guardian_chat_id", label: "Guardian Telegram chat ID", type: "text" },
];

function SettingsSkeleton() {
  return (
    <div className="mt-6 animate-pulse grid sm:grid-cols-2 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-14 bg-plum-50 rounded-lg" />
      ))}
    </div>
  );
}

export default function Settings() {
  const { data, loading, refresh } = useAppData();
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (data?.settings) setForm(data.settings);
  }, [data]);

  function handleChange(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("saving");
    try {
      await api.updateSettings(form);
      await refresh(); // updates the shared cache so Dashboard reflects changes instantly
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }

  if (loading || !form) return <SettingsSkeleton />;

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        {FIELDS.map(({ key, label, type }, i) => (
          <motion.label
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 * i }}
            className="block"
          >
            <span className="text-xs uppercase tracking-wide text-plum-700/60">{label}</span>
            <input
              type={type}
              value={form[key] ?? ""}
              onChange={(e) => handleChange(key, e.target.value)}
              className="mt-1 w-full rounded-lg border border-plum-100 bg-white/80 px-3 py-2 text-plum-900 focus:outline-none focus:ring-2 focus:ring-plum-500 transition-shadow"
            />
          </motion.label>
        ))}
      </div>

      <div className="flex items-center gap-4 pt-2">
        <motion.button
          type="submit"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          disabled={status === "saving"}
          className="px-5 py-2.5 rounded-full bg-plum-700 text-moon font-medium hover:bg-plum-900 transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {status === "saving" && <Loader2 size={16} className="animate-spin" />}
          {status === "saving" ? "Saving…" : "Save changes"}
        </motion.button>

        <AnimatePresence mode="wait">
          {status === "saved" && (
            <motion.span
              key="saved"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-sm text-plum-700"
            >
              <Check size={16} /> Saved
            </motion.span>
          )}
          {status === "error" && (
            <motion.span
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-blush"
            >
              Error: {errorMsg}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <p className="text-xs text-plum-700/50 pt-4">
        Tip: to find a Telegram chat ID, message your bot once, then visit
        https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates in a browser.
      </p>
    </form>
  );
}
