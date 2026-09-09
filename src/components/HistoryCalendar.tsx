import type { DayHistoryEntry, DayStatus } from "../game/stats";
import styles from "./HistoryCalendar.module.css";

type HistoryCalendarProps = {
  history: DayHistoryEntry[];
};

const STATUS_LABEL: Record<DayStatus, string> = {
  perfect: "Perfect solve",
  good: "Solved",
  gaveUp: "Gave up",
  none: "Not played",
};

const STATUS_CLASS: Record<DayStatus, string> = {
  perfect: styles.perfect,
  good: styles.good,
  gaveUp: styles.gaveUp,
  none: styles.none,
};

function formatShortDate(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  return `${month}/${day}`;
}

/**
 * A compact strip of the last N calendar days, one dot per day, colored
 * by that day's best result across all three difficulties — a quick
 * "have I kept it up" glance rather than a full outcome breakdown.
 */
export function HistoryCalendar({ history }: HistoryCalendarProps) {
  return (
    <div className={styles.wrapper}>
      <ol className={styles.row}>
        {history.map((entry) => (
          <li key={entry.date} className={styles.day}>
            <span
              className={`${styles.dot} ${STATUS_CLASS[entry.status]}`}
              title={`${entry.date}: ${STATUS_LABEL[entry.status]}`}
            />
            <span className={styles.dayLabel}>{formatShortDate(entry.date)}</span>
          </li>
        ))}
      </ol>

      <ul className={styles.legend}>
        {(["perfect", "good", "gaveUp", "none"] as const).map((status) => (
          <li key={status} className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.legendDot} ${STATUS_CLASS[status]}`} aria-hidden="true" />
            {STATUS_LABEL[status]}
          </li>
        ))}
      </ul>
    </div>
  );
}
