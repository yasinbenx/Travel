import type { ReactNode } from "react";
import { BarChart3, Home } from "lucide-react";
import type { Difficulty } from "../game/gameEngine";
import { DifficultyBadge } from "./DifficultyBadge";
import { StartEndBox } from "./StartEndBox";
import styles from "./AppHeader.module.css";

type AppHeaderProps = {
  /** Border-hop puzzles' default center content: a difficulty badge + compact start/target box. Ignored when `centerContent` is given. */
  start?: string;
  end?: string;
  difficulty?: Difficulty;
  /** Overrides the default difficulty badge + start/target box — e.g. Draw It's progress indicator. */
  centerContent?: ReactNode;
  /** Returns to the start screen's daily-challenge tiles. Progress is always saved, so this never loses anything. */
  onHome: () => void;
  onOpenStats: () => void;
};

/** Slim header with the app title and a compact center slot (start/target by default), shared by GameBoard, ResultScreen, and Draw It. */
export function AppHeader({ start, end, difficulty, centerContent, onHome, onOpenStats }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>BorderHop</h1>
      {centerContent ?? (
        <>
          {difficulty && <DifficultyBadge difficulty={difficulty} />}
          {start && end && <StartEndBox start={start} end={end} compact />}
        </>
      )}
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
