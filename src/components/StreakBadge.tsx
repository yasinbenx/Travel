import { Flame } from "lucide-react";
import styles from "./StreakBadge.module.css";

type StreakBadgeProps = {
  days: number;
  /** Renders a larger, pulsing version for the stats page's overview section. */
  size?: "default" | "large";
};

/** "🔥 N day streak" pill — only rendered by callers when `days > 0`. */
export function StreakBadge({ days, size = "default" }: StreakBadgeProps) {
  return (
    <span className={size === "large" ? `${styles.badge} ${styles.large}` : styles.badge}>
      <Flame
        className={styles.flame}
        size={size === "large" ? 22 : 14}
        strokeWidth={2.5}
        fill="currentColor"
      />
      {days} day{days === 1 ? "" : "s"} streak
    </span>
  );
}
