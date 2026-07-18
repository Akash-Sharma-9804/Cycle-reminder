// predictions.js
// -----------------------------------------------------------------------
// Pure date-math functions. No DB or network calls here, which makes this
// file trivial to test and reason about.
// -----------------------------------------------------------------------

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDate(dateStr) {
  // Treat as a plain calendar date (no time-zone surprises).
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

/**
 * Given the last known period start date and the cycle length, compute
 * the next predicted period start date.
 */
function getNextPeriodDate(lastPeriodDateStr, cycleLength) {
  const last = parseDate(lastPeriodDateStr);
  const next = addDays(last, cycleLength);
  return toDateStr(next);
}

/**
 * Roll the prediction forward if the "next" date has already passed,
 * so the dashboard always shows a future (or today's) date even if the
 * user hasn't logged a new period yet.
 */
function getUpcomingPeriodDate(lastPeriodDateStr, cycleLength, today = new Date()) {
  let next = parseDate(getNextPeriodDate(lastPeriodDateStr, cycleLength));
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  while (next.getTime() < todayUTC.getTime()) {
    next = addDays(next, cycleLength);
  }
  return toDateStr(next);
}

/**
 * List the next N predicted period dates after the last logged one.
 */
function getFuturePeriods(lastPeriodDateStr, cycleLength, count = 3) {
  const results = [];
  let cursor = parseDate(lastPeriodDateStr);
  for (let i = 0; i < count; i++) {
    cursor = addDays(cursor, cycleLength);
    results.push(toDateStr(cursor));
  }
  return results;
}

function getDaysRemaining(upcomingPeriodDateStr, today = new Date()) {
  const upcoming = parseDate(upcomingPeriodDateStr);
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  return daysBetween(todayUTC, upcoming);
}

/**
 * Get detailed time remaining until the next period (days, hours, minutes, seconds).
 */
function getTimeRemaining(upcomingPeriodDateStr, today = new Date()) {
  const upcoming = parseDate(upcomingPeriodDateStr); // midnight at start of upcoming day

  const now = today instanceof Date ? today : new Date(today);
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

module.exports = {
  getNextPeriodDate,
  getUpcomingPeriodDate,
  getFuturePeriods,
  getDaysRemaining,
  getTimeRemaining,
  parseDate,
  toDateStr,
  addDays,
};
