import { X } from "lucide-react";
import { DIFFICULTY_LABEL, type Difficulty, type GameState } from "../game/gameEngine";
import { computeStats } from "../game/stats";
import styles from "./StatsPanel.module.css";

type StatsPanelProps = {
  games: Record<string, GameState>;
  currentStreak: number;
  longestStreak: number;
  onClose: () => void;
};

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

/** Full-screen stats overlay: big, glanceable tiles plus a per-difficulty breakdown. */
export function StatsPanel({ games, currentStreak, longestStreak, onClose }: StatsPanelProps) {
  const stats = computeStats(games);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Your Stats</h1>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close stats"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </header>

      <div className={styles.content}>
        <div className={styles.grid}>
          <div className={styles.tile}>
            <p className={styles.tileValue}>{stats.totalPlayed}</p>
            <p className={styles.tileLabel}>Played</p>
          </div>
          <div className={styles.tile}>
            <p className={styles.tileValue}>{stats.perfectSolves}</p>
            <p className={styles.tileLabel}>Perfect solves</p>
          </div>
          <div className={styles.tile}>
            <p className={styles.tileValue}>{currentStreak}</p>
            <p className={styles.tileLabel}>Current streak</p>
          </div>
          <div className={styles.tile}>
            <p className={styles.tileValue}>{longestStreak}</p>
            <p className={styles.tileLabel}>Longest streak</p>
          </div>
          <div className={`${styles.tile} ${styles.tileWide}`}>
            <p className={styles.tileValue}>
              {stats.averageStepsOverOptimal !== null
                ? `${stats.averageStepsOverOptimal.toFixed(2)}×`
                : "–"}
            </p>
            <p className={styles.tileLabel}>Avg. steps vs. optimal</p>
          </div>
        </div>

        <div className={styles.breakdown}>
          <p className={styles.breakdownHeading}>By difficulty</p>
          <ul className={styles.breakdownList}>
            {DIFFICULTIES.map((difficulty) => (
              <li key={difficulty} className={styles.breakdownRow}>
                <span className={styles.breakdownDifficulty}>{DIFFICULTY_LABEL[difficulty]}</span>
                <span className={styles.breakdownStat}>
                  {stats.totalPlayedByDifficulty[difficulty]} played
                </span>
                <span className={styles.breakdownStat}>
                  {stats.perfectSolvesByDifficulty[difficulty]} perfect
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
