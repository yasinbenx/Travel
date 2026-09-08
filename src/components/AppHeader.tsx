import { StartEndBox } from "./StartEndBox";
import styles from "./AppHeader.module.css";

type AppHeaderProps = {
  start: string;
  end: string;
  /** When provided, shows a restart control (only relevant during active play). */
  onRestart?: () => void;
};

/** Slim header with the app title and a compact start/target display, shared by GameBoard and ResultScreen. */
export function AppHeader({ start, end, onRestart }: AppHeaderProps) {
  function handleRestartClick() {
    if (window.confirm("Restart with a new random puzzle? Your current progress will be lost.")) {
      onRestart?.();
    }
  }

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>BorderHop</h1>
      <StartEndBox start={start} end={end} compact />
      {onRestart && (
        <button
          type="button"
          className={styles.restartButton}
          onClick={handleRestartClick}
          aria-label="Restart with a new puzzle"
          title="Restart with a new puzzle"
        >
          ↺
        </button>
      )}
    </header>
  );
}
