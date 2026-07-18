import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useAppData } from "../DataContext.jsx";
import { api } from "../api";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function getTimeRemaining(nextPeriodDateStr) {
  const upcoming = parseDate(nextPeriodDateStr); // midnight at start of upcoming day
  const now = new Date();
  const nowUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()));
  const diffMs = upcoming.getTime() - nowUTC.getTime();

  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(diffMs / MS_PER_DAY);
  const hours = Math.floor((diffMs % MS_PER_DAY) / (60 * 60 * 1000));
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((diffMs % (60 * 1000)) / 1000);

  return { days, hours, minutes, seconds };
}

// Signature element: a circular "moon phase" ring that fills as the cycle
// progresses toward the next predicted period.
function CycleRing({ cycleLength, daysRemaining, nextPeriodDate }) {
  const daysElapsed = Math.max(cycleLength - daysRemaining, 0);
  const progress = Math.min(daysElapsed / cycleLength, 1);
  const size = 176;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  const [timeRemaining, setTimeRemaining] = useState(() => getTimeRemaining(nextPeriodDate));

  useEffect(() => {
    if (!nextPeriodDate) return;
    setTimeRemaining(getTimeRemaining(nextPeriodDate));
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(nextPeriodDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [nextPeriodDate]);

  const formatTimeRemaining = () => {
    if (!timeRemaining) return "";
    const { days, hours, minutes, seconds } = timeRemaining;
    if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) return "now";
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(" ");
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#EFE2EF" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#B85C7D"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={daysRemaining}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="font-display text-4xl text-plum-900"
        >
          {daysRemaining < 0 ? "—" : daysRemaining}
        </motion.span>
        <span className="text-xs text-plum-700/70 mt-1">
          {daysRemaining === 0 ? "today" : daysRemaining === 1 ? "day left" : "days left"}
        </span>
        {daysRemaining > 0 && (
          <span className="text-xs text-plum-500 mt-1 tabular-nums">
            {formatTimeRemaining()}
          </span>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="bg-white/70 rounded-xl2 px-5 py-4 border border-plum-100 shadow-sm"
    >
      <p className="text-xs uppercase tracking-wide text-plum-700/60">{label}</p>
      <p className="font-display text-xl text-plum-900 mt-1">{value}</p>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-4 animate-pulse">
      <div className="h-40 bg-plum-50 rounded-xl2" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-plum-50 rounded-xl2" />
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, error, setData } = useAppData();
  const [deletingId, setDeletingId] = useState(null);

  async function handleDeleteHistory(id) {
    setDeletingId(id);
    try {
      await api.deleteHistoryEntry(id);
      setData((prev) => ({
        ...prev,
        history: prev.history.filter((h) => h.id !== id),
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  }

  if (error) {
    return (
      <p className="mt-10 text-center text-plum-700">
        Couldn't load your data: {error}. Check that the backend is running and
        VITE_API_URL is set correctly.
      </p>
    );
  }

  if (loading || !data) return <DashboardSkeleton />;

  const { settings, prediction, history } = data;

  return (
    <div className="mt-4">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col sm:flex-row items-center gap-8 bg-plum-50 rounded-xl2 p-8"
      >
        <CycleRing cycleLength={settings.cycle_length} daysRemaining={prediction.daysRemaining} nextPeriodDate={prediction.nextPeriodDate} />
        <div>
          <p className="text-sm text-plum-700/70">Next predicted period</p>
          <p className="font-display text-3xl text-plum-900">{prediction.nextPeriodDate}</p>
          <p className="text-sm text-plum-700/70 mt-2">
            Based on a {settings.cycle_length}-day cycle, last starting {settings.last_period_date}.
          </p>
        </div>
      </motion.section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <StatCard label="Last period" value={settings.last_period_date} index={0} />
        <StatCard label="Cycle length" value={`${settings.cycle_length} days`} index={1} />
        <StatCard label="Duration" value={`${settings.period_duration} days`} index={2} />
        <StatCard label="Reminder" value={`${settings.reminder_days_before}d before`} index={3} />
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg text-plum-900 mb-3">Upcoming cycles</h2>
        <ul className="flex flex-wrap gap-2">
          {prediction.futurePeriods.map((d, i) => (
            <motion.li
              key={d}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i }}
              className="px-3 py-1.5 rounded-full bg-plum-100 text-plum-700 text-sm"
            >
              {d}
            </motion.li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg text-plum-900 mb-3">Previous period history</h2>
        {history.length === 0 ? (
          <p className="text-sm text-plum-700/60">
            No history yet — logged automatically whenever you update the last period date in
            Settings.
          </p>
        ) : (
          <ul className="divide-y divide-plum-100 bg-white/60 rounded-xl2 border border-plum-100 overflow-hidden">
            <AnimatePresence initial={false}>
              {history.map((h) => (
                <motion.li
                  key={h.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 py-3 text-sm text-plum-900 flex items-center justify-between group"
                >
                  <span>{h.period_date}</span>
                  <button
                    onClick={() => handleDeleteHistory(h.id)}
                    disabled={deletingId === h.id}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-plum-700/50 hover:text-blush transition-all disabled:opacity-30"
                    aria-label={`Delete ${h.period_date} from history`}
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </div>
  );
}
