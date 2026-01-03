function todayKey() {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

// Milliseconds until the next occurrence of the given local time (hour:minute)
function msUntilTime(hour, minute) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next - now;
}

function normalizeDate(input) {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  const m = trimmed.match(/^([0-9]{1,2})[-/ ]([0-9]{1,2})$/);
  if (!m) return null;
  let month = parseInt(m[1], 10);
  let day = parseInt(m[2], 10);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

module.exports = { todayKey, msUntilMidnight, msUntilTime, normalizeDate };
