import { Home, RotateCcw } from "lucide-react";
import type { Difficulty } from "../game/gameEngine";
import { DifficultyBadge } from "./DifficultyBadge";
import { StartEndBox } from "./StartEndBox";
import styles from "./AppHeader.module.css";

type AppHeaderProps = {
  start: string;
  end: string;
  difficulty: Difficulty;
  /** Always visible: returns to the start screen, dropping the current round. */
  onHome: () => void;
  /** When provided, shows a restart control — only relevant during active play.
   *  Its presence also means the Home button must confirm first, since there's
   *  in-progress work to lose (a finished round on the result screen has none). */
  onRestart?: () => void;
};

/** Slim header with the app title and a compact start/target display, shared by GameBoard and ResultScreen. */
export function AppHeader({ start, end, difficulty, onHome, onRestart }: AppHeaderProps) {
  function handleHomeClick() {
    if (
      !onRestart ||
      window.confirm("Are you sure you want to leave? Your progress will be lost.")
    ) {
      onHome();
    }
  }

  function handleRestartClick() {
    if (window.confirm("Restart with a new random puzzle? Your current progress will be lost.")) {
      onRestart?.();
    }
  }

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>BorderHop</h1>
      <DifficultyBadge difficulty={difficulty} />
      <StartEndBox start={start} end={end} compact />
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={handleHomeClick}
          aria-label="Back to start screen"
          title="Back to start screen"
        >
          <Home size={16} strokeWidth={2.5} />
        </button>
        {onRestart && (
          <button
            type="button"
            className={`${styles.iconButton} ${styles.spinOnHover}`}
            onClick={handleRestartClick}
            aria-label="Restart with a new puzzle"
            title="Restart with a new puzzle"
          >
            <RotateCcw size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </header>
  );
}
