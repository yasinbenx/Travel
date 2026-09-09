import { BarChart3, Home } from "lucide-react";
import type { Difficulty } from "../game/gameEngine";
import { DifficultyBadge } from "./DifficultyBadge";
import { StartEndBox } from "./StartEndBox";
import styles from "./AppHeader.module.css";

type AppHeaderProps = {
  start: string;
  end: string;
  difficulty: Difficulty;
  /** Returns to the start screen's daily-challenge tiles. Progress is always saved, so this never loses anything. */
  onHome: () => void;
  onOpenStats: () => void;
};

/** Slim header with the app title and a compact start/target display, shared by GameBoard and ResultScreen. */
export function AppHeader({ start, end, difficulty, onHome, onOpenStats }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>BorderHop</h1>
      <DifficultyBadge difficulty={difficulty} />
      <StartEndBox start={start} end={end} compact />
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onOpenStats}
          aria-label="View stats"
          title="View stats"
        >
          <BarChart3 size={16} strokeWidth={2.25} />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onHome}
          aria-label="Back to today's challenges"
          title="Back to today's challenges"
        >
          <Home size={16} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
}
