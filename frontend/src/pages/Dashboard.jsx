import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Sparkles, Flower2, Utensils, Flame, Activity, Droplet } from "lucide-react";
import { useAppData } from "../DataContext.jsx";
import { api } from "../api";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Personalize here - change the name and quotes to fit whoever this is for.
const USER_NAME = "Anushka (My Kiddo)";

// A rotating set of gentle, non-clinical quotes. One is picked at random
// each time the page loads/refreshes, avoiding an immediate repeat of the
// last one shown this session.
const QUOTES = [
  "Soft days are still good days.",
  "You know your body better than any calendar does.",
  "Rest is productive too.",
  "Small comforts count for a lot this week.",
  "Be as kind to yourself as you are to everyone else.",
  "One day at a time is a perfectly good pace.",
  "You're allowed to slow down.",
  "Your body is doing quiet, important work.",
  "A warm drink and a slower morning — that's enough today.",
  "Patience with yourself is its own kind of strength.",

  "Listen to your body; it's always on your side.",
  "Healing isn't always visible, but it's happening.",
  "Take breaks without feeling guilty.",
  "Every cycle is a fresh beginning.",
  "Progress doesn't have to be perfect.",
  "You deserve the same care you give to others.",
  "Your strength isn't measured by how much you push through.",
  "Some days are for blooming, others are for resting.",
  "Gentleness is a strength, not a weakness.",
  "It's okay if today feels slower than yesterday.",

  "Your body is worthy of patience and kindness.",
  "Even cloudy days eventually pass.",
  "Take today one small step at a time.",
  "You don't have to earn your rest.",
  "Comfort is a goal worth choosing.",
  "Pause. Breathe. You're doing enough.",
  "A little self-care goes a long way.",
  "Strong doesn't always mean unstoppable.",
  "You are more than your toughest days.",
  "Honor your energy, wherever it is today.",

  "Every cycle tells a story of resilience.",
  "Your well-being comes first.",
  "Slow mornings can still be beautiful mornings.",
  "Rest now so tomorrow feels lighter.",
  "Your feelings are valid today.",
  "Drink some water, stretch a little, and be gentle with yourself.",
  "It's okay to choose comfort over productivity.",
  "Your body deserves gratitude, not criticism.",
  "Take the pressure off. You've done enough.",
  "Healing begins with listening to yourself.",

  "The strongest thing you can do today may be resting.",
  "Your pace is the right pace.",
  "You don't have to feel your best to be enough.",
  "Comfort is self-care, not laziness.",
  "A deep breath can change the next moment.",
  "Today's goal: be kind to yourself.",
  "Every new day is another chance to feel better.",
  "Little acts of self-care make a big difference.",
  "You are doing better than you think.",
  "Be patient with your body—it works hard every day.",

  "Wrap yourself in kindness today.",
  "Good days return, one moment at a time.",
  "Your worth never changes with your energy level.",
  "Take care of yourself like someone you truly love.",
  "Even resting is moving forward.",
  "Your body deserves compassion every day of the month.",
  "Choose peace over pressure today.",
  "You don't need permission to rest.",
  "You are stronger than this temporary discomfort.",
  "Tomorrow is a new page."
];

function getRandomQuote() {
  const lastIndex = Number(sessionStorage.getItem("cycle_last_quote_index"));
  let index = Math.floor(Math.random() * QUOTES.length);
  if (QUOTES.length > 1) {
    while (index === lastIndex) {
      index = Math.floor(Math.random() * QUOTES.length);
    }
  }
  sessionStorage.setItem("cycle_last_quote_index", String(index));
  return QUOTES[index];
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

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

// Personalized header: greeting + name + a daily quote card.
function PersonalHeader() {
  const quote = useMemo(() => getRandomQuote(), []);
  const [greeting, setGreeting] = useState(() => getGreeting());

  useEffect(() => {
    setGreeting(getGreeting());
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6 text-center sm:text-left"
    >
      <h1 className="font-display text-2xl sm:text-3xl text-plum-900">
        {greeting}, <br /> {USER_NAME} <span className="align-middle">❤️</span>
      </h1>
      <div className="mt-2 flex items-start justify-center sm:justify-start gap-2 text-plum-700/70">
        <Sparkles size={15} className="mt-0.5 shrink-0 text-blush" />
        <p className="text-sm italic">{quote}</p>
      </div>
    </motion.section>
  );
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
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-40"
        style={{ background: "radial-gradient(circle, #E7A8B4 0%, transparent 70%)" }}
      />
      <svg width={size} height={size} className="-rotate-90 relative">
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

// General, non-clinical comfort suggestions - not medical advice. Kept
// intentionally simple: well-known self-care habits, no dosages, no
// diagnosis language. Edit freely to match what actually helps her.
const TIPS = [
  {
    icon: Flame,
    title: "Warmth helps",
    text: "A hot water bottle or heating pad on the lower belly or back can ease cramping. A warm bath or shower works too.",
  },
  {
    icon: Utensils,
    title: "Gentle, iron-rich food",
    text: "Spinach, lentils, dates, and a bit of dark chocolate can help offset iron loss. Warm ginger or chamomile tea is soothing.",
  },
  {
    icon: Droplet,
    title: "Stay hydrated",
    text: "Water helps with bloating and headaches. Cutting back on caffeine, salty snacks, and alcohol for a few days can help too.",
  },
  {
    icon: Activity,
    title: "Light movement",
    text: "A short walk or gentle stretching can ease cramps for some people. Rest is just as valid if that's what feels right.",
  },
];

function ComfortTips() {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg text-plum-900 mb-3 flex items-center gap-2">
        <motion.span
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex"
        >
          <Flower2 size={18} className="text-blush" />
        </motion.span>
        Comfort & care ideas
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {TIPS.map((tip, i) => {
          const Icon = tip.icon;
          return (
            <motion.div
              key={tip.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.3 }}
              whileHover={{ y: -2 }}
              className="flex gap-3 bg-white/70 border border-plum-100 rounded-xl2 p-4"
            >
              <div className="shrink-0 w-9 h-9 rounded-full bg-plum-100 flex items-center justify-center text-plum-700">
                <Icon size={17} />
              </div>
              <div>
                <p className="font-display text-sm text-plum-900">{tip.title}</p>
                <p className="text-xs text-plum-700/70 mt-0.5 leading-relaxed">{tip.text}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
      <p className="text-[11px] text-plum-700/40 mt-3">
        General comfort suggestions, not medical advice — check with a doctor if pain feels
        severe or unusual.
      </p>
    </section>
  );
}

function StatCard({ label, value, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.3 }}
      whileHover={{ y: -3, boxShadow: "0 8px 20px -8px rgba(107, 63, 105, 0.25)" }}
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
      <div className="h-8 w-56 bg-plum-50 rounded-lg mb-2" />
      <div className="h-4 w-72 bg-plum-50 rounded-lg mb-6" />
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
      <PersonalHeader />

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 bg-gradient-to-br from-plum-50 to-white rounded-xl2 p-6 sm:p-8 border border-plum-100"
      >
        <CycleRing cycleLength={settings.cycle_length} daysRemaining={prediction.daysRemaining} nextPeriodDate={prediction.nextPeriodDate} />
        <div className="text-center sm:text-left">
          <p className="text-sm text-plum-700/70">Next predicted period</p>
          <p className="font-display text-2xl sm:text-3xl text-plum-900">{prediction.nextPeriodDate}</p>
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

      <ComfortTips />

      <section className="mt-8">
        <h2 className="font-display text-lg text-plum-900 mb-3 flex items-center gap-2">
          <Flower2 size={18} className="text-blush" />
          Upcoming cycles
        </h2>
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
        <h2 className="font-display text-lg text-plum-900 mb-3 flex items-center gap-2">
          <Flower2 size={18} className="text-blush" />
          Previous period history
        </h2>
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