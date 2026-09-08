import { useEffect, useRef, useState } from "react";
import type { GameState } from "../game/gameEngine";
import { AppHeader } from "./AppHeader";
import { GuessInput } from "./GuessInput";
import { GuessList } from "./GuessList";
import { MapView } from "./MapView";
import { WrongGuessesPanel } from "./WrongGuessesPanel";
import styles from "./GameBoard.module.css";

type GameBoardProps = {
  state: GameState;
  onGuess: (guess: string) => void;
  onRestart: () => void;
};

type GuessFeedback = "correct" | "wrong" | null;

/**
 * Map-centric game view: the world map takes up most of the screen and
 * reveals the found path country by country. Start/target sit in a slim
 * header above it, progress and wrong guesses float as small, unobtrusive
 * overlays on the map, and the input is docked at the bottom.
 *
 * A plain display/input container: holds no state of its own beyond a
 * transient guess-feedback flash — loading, saving, and switching to the
 * result screen on a win are all handled by `AppShell`, which only
 * renders this component while the round is still in progress.
 */
export function GameBoard({ state, onGuess, onRestart }: GameBoardProps) {
  const [feedback, setFeedback] = useState<GuessFeedback>(null);
  const previousCounts = useRef({
    correct: state.correctGuesses.length,
    wrong: state.wrongGuesses.length,
  });

  useEffect(() => {
    const previous = previousCounts.current;
    if (state.correctGuesses.length > previous.correct) {
      setFeedback("correct");
    } else if (state.wrongGuesses.length > previous.wrong) {
      setFeedback("wrong");
    }
    previousCounts.current = {
      correct: state.correctGuesses.length,
      wrong: state.wrongGuesses.length,
    };
  }, [state.correctGuesses.length, state.wrongGuesses.length]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 500);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const intermediateStepsInOptimalPath = state.optimalPath.length - 2;
  const excludeNames = [state.start, ...state.correctGuesses];
  const revealedCountries = [state.start, ...state.correctGuesses];

  return (
    <div className={styles.app}>
      <AppHeader start={state.start} end={state.end} onRestart={onRestart} />

      <main className={styles.mapArea}>
        <MapView
          revealedCountries={revealedCountries}
          target={state.end}
          isWon={state.isWon}
        />

        <div className={styles.overlayBar}>
          <div className={`${styles.overlay} ${styles.progressOverlay}`}>
            <p className={styles.stepCounter}>
              Step {state.correctGuesses.length}
              <span className={styles.stepOptimal}>optimal: {intermediateStepsInOptimalPath}</span>
            </p>
            <GuessList state={state} compact />
          </div>

          <div className={`${styles.overlay} ${styles.wrongOverlay}`}>
            <WrongGuessesPanel wrongGuesses={state.wrongGuesses} />
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <GuessInput
          onGuess={onGuess}
          disabled={state.isWon}
          excludeNames={excludeNames}
          feedback={feedback}
        />
      </footer>
    </div>
  );
}
