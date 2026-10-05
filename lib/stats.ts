// Small game-like stats helpers: streaks, awareness level, accuracy.

export function dayKey(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

/** Consecutive days (ending today or yesterday) with at least one logged thought. */
export function computeStreak(dates: Date[]) {
  const days = new Set(dates.map(dayKey));
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export const LEVEL_TITLES = [
  "Newcomer",
  "Observer",
  "Listener",
  "Namer",
  "Steward",
  "Elder",
  "Sage",
  "Village Keeper",
];

export function levelFor(totalThoughts: number) {
  const level = Math.floor(totalThoughts / 10) + 1;
  const xp = totalThoughts % 10;
  const title =
    LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] ??
    LEVEL_TITLES[LEVEL_TITLES.length - 1];
  return { level, xp, xpNeeded: 10, title };
}

export function accuracyFrom(feedbacks: (string | null)[]) {
  const correct = feedbacks.filter((f) => f === "correct").length;
  const partial = feedbacks.filter((f) => f === "partial").length;
  const wrong = feedbacks.filter((f) => f === "wrong").length;
  const total = correct + partial + wrong;
  const percent = total
    ? Math.round(((correct + partial * 0.5) / total) * 100)
    : 0;
  return { correct, partial, wrong, total, percent };
}
