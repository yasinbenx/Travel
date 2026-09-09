import { useEffect } from "react";
import confetti from "canvas-confetti";
import type { GameState } from "../game/gameEngine";
import { AppHeader } from "./AppHeader";
import { MapView } from "./MapView";
import { ResultSummary } from "./ResultSummary";
import styles from "./ResultScreen.module.css";

type ResultScreenProps = {
  state: GameState;
  currentStreak: number;
  onHome: () => void;
  onOpenStats: () => void;
};

/**
 * Shown once a daily challenge is won (right after winning, or after a
 * reload that restores a finished puzzle from localStorage). Displays
 * the result summary plus — read-only, with no input field — the map of
 * the final path that was found. There's no "play again": each
 * difficulty has exactly one puzzle per day, so the header's Home button
 * is the only way onward, back to today's other challenges.
 */
export function ResultScreen({ state, currentStreak, onHome, onOpenStats }: ResultScreenProps) {
  useEffect(() => {
    if (state.isGivenUp) return;
    confetti({
      particleCount: 130,
      spread: 75,
      startVelocity: 45,
      origin: { y: 0.35 },
      colors: ["#390099", "#00B4D8", "#FF9E00", "#FF0054"],
    });
  }, [state.isGivenUp]);

  return (
    <div className={styles.app}>
      <AppHeader
        start={state.start}
        end={state.end}
        difficulty={state.difficulty}
        onHome={onHome}
        onOpenStats={onOpenStats}
      />

      <div className={styles.summaryArea}>
        <ResultSummary state={state} currentStreak={currentStreak} />
      </div>

      <main className={styles.mapArea}>
        <MapView start={state.start} target={state.end} guesses={state.guesses} isWon={state.isWon} />
      </main>
    </div>
  );
}
