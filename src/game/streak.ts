import { getPreviousDateString } from "./dateUtils";

export type StreakState = {
  current: number;
  longest: number;
  /** The last calendar date (local) a daily challenge was completed on, or `null` if never. */
  lastPlayedDate: string | null;
};

const STREAK_KEY = "borderhop:streak";
const EMPTY_STREAK: StreakState = { current: 0, longest: 0, lastPlayedDate: null };

function isStreakState(value: unknown): value is StreakState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.current === "number" &&
    typeof candidate.longest === "number" &&
    (candidate.lastPlayedDate === null || typeof candidate.lastPlayedDate === "string")
  );
}

export function loadStreak(): StreakState {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return EMPTY_STREAK;
    const parsed: unknown = JSON.parse(raw);
    return isStreakState(parsed) ? parsed : EMPTY_STREAK;
  } catch {
    return EMPTY_STREAK;
  }
}

function saveStreak(streak: StreakState): void {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  } catch {
    // Save skipped (e.g. private browsing or quota exceeded).
  }
}

/**
 * Records that the player completed at least one of `date`'s daily
 * challenges (any difficulty) — the streak counts a calendar day as
 * "kept" once any single challenge that day is finished, not all three.
 * Idempotent for repeat completions on the same date (e.g. finishing a
 * second difficulty the same day doesn't double-count).
 *
 * Extends the running streak by 1 if the last completed date was the
 * day immediately before `date`; otherwise (a gap, or the very first
 * completion ever) resets it to 1. `longest` tracks the best streak
 * ever reached.
 */
export function recordDailyCompletion(date: string): StreakState {
  const streak = loadStreak();
  if (streak.lastPlayedDate === date) {
    return streak;
  }

  const yesterday = getPreviousDateString(date);
  const current = streak.lastPlayedDate === yesterday ? streak.current + 1 : 1;
  const next: StreakState = {
    current,
    longest: Math.max(streak.longest, current),
    lastPlayedDate: date,
  };
  saveStreak(next);
  return next;
}
