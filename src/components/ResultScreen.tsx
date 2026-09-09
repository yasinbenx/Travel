import { useEffect } from "react";
import confetti from "canvas-confetti";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import type { GameState } from "../game/gameEngine";
import { AppHeader } from "./AppHeader";
import { MapView } from "./MapView";
import { ResultSummary } from "./ResultSummary";
import styles from "./ResultScreen.module.css";

type ResultScreenProps = {
  state: GameState;
  onPlayAgain: () => void;
  /** Returns to the start screen's difficulty picker, dropping this round. */
  onChangeDifficulty: () => void;
  /** Always-visible header action — same destination as `onChangeDifficulty`. */
  onHome: () => void;
};

/**
 * Shown once the round is won (right after winning, or after a reload
 * that restores a finished game from localStorage). Displays the result
 * summary plus — read-only, with no input field — the map of the final
 * path that was found, and a "Play again" button that starts a brand-new
 * random puzzle.
 */
export function ResultScreen({ state, onPlayAgain, onChangeDifficulty, onHome }: ResultScreenProps) {
  useEffect(() => {
    confetti({
      particleCount: 130,
      spread: 75,
      startVelocity: 45,
      origin: { y: 0.35 },
      colors: ["#14213d", "#f0a93e", "#2f9e6e"],
    });
  }, []);

  return (
    <div className={styles.app}>
      <AppHeader start={state.start} end={state.end} difficulty={state.difficulty} onHome={onHome} />

      <div className={styles.summaryArea}>
        <ResultSummary state={state} />
      </div>

      <main className={styles.mapArea}>
        <MapView start={state.start} target={state.end} guesses={state.guesses} isWon={state.isWon} />
      </main>

      <footer className={styles.footer}>
        <div className={styles.actions}>
          <button type="button" className={styles.playAgainButton} onClick={onPlayAgain}>
            <RotateCcw size={16} strokeWidth={2.5} />
            Play again
          </button>
          <button
            type="button"
            className={styles.changeDifficultyButton}
            onClick={onChangeDifficulty}
          >
            <SlidersHorizontal size={15} strokeWidth={2.5} />
            <span>Change difficulty</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
