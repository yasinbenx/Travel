import type { GameState } from "../game/gameEngine";
import { AppHeader } from "./AppHeader";
import { MapView } from "./MapView";
import { ResultSummary } from "./ResultSummary";
import styles from "./ResultScreen.module.css";

type ResultScreenProps = {
  state: GameState;
  onPlayAgain: () => void;
};

/**
 * Shown once the round is won (right after winning, or after a reload
 * that restores a finished game from localStorage). Displays the result
 * summary plus — read-only, with no input field — the map of the final
 * path that was found, and a "Play again" button that starts a brand-new
 * random puzzle.
 */
export function ResultScreen({ state, onPlayAgain }: ResultScreenProps) {
  const revealedCountries = [state.start, ...state.correctGuesses];

  return (
    <div className={styles.app}>
      <AppHeader start={state.start} end={state.end} />

      <div className={styles.summaryArea}>
        <ResultSummary state={state} />
      </div>

      <main className={styles.mapArea}>
        <MapView revealedCountries={revealedCountries} target={state.end} isWon={state.isWon} />
      </main>

      <footer className={styles.footer}>
        <button type="button" className={styles.playAgainButton} onClick={onPlayAgain}>
          Play again
        </button>
      </footer>
    </div>
  );
}
