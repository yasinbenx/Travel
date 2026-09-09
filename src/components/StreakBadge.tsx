import { Flame } from "lucide-react";
import styles from "./StreakBadge.module.css";

type StreakBadgeProps = {
  days: number;
};

/** "🔥 N day streak" pill — only rendered by callers when `days > 0`. */
export function StreakBadge({ days }: StreakBadgeProps) {
  return (
    <span className={styles.badge}>
      <Flame size={14} strokeWidth={2.5} fill="currentColor" />
      {days} day{days === 1 ? "" : "s"} streak
    </span>
  );
}
