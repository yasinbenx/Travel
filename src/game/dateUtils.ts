/**
 * All dates in this module are the BROWSER'S LOCAL calendar date (not
 * UTC) — "today" for the daily challenge is whatever day it is on the
 * player's own clock, so two players in different time zones may see
 * different puzzles roll over at different moments, matching how they'd
 * expect a paper newspaper's daily puzzle to behave.
 */

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Today's local calendar date as "YYYY-MM-DD". */
export function getTodayDateString(): string {
  return formatDate(new Date());
}

/** The calendar date immediately before `date` (also "YYYY-MM-DD"). */
export function getPreviousDateString(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const previous = new Date(year, month - 1, day);
  previous.setDate(previous.getDate() - 1);
  return formatDate(previous);
}

/** BorderHop's "Day #1" reference point, for the share text's day counter. */
const EPOCH_DATE = "2026-01-01";

/** The daily challenge's 1-based day number (e.g. "Day #42"), counted from {@link EPOCH_DATE}. */
export function getDayNumber(date: string): number {
  const [epochYear, epochMonth, epochDay] = EPOCH_DATE.split("-").map(Number);
  const [year, month, day] = date.split("-").map(Number);
  const epoch = new Date(epochYear, epochMonth - 1, epochDay);
  const target = new Date(year, month - 1, day);
  const diffDays = Math.round((target.getTime() - epoch.getTime()) / 86_400_000);
  return diffDays + 1;
}
