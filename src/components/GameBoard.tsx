import { useEffect, useRef, useState } from "react";
import { getConfirmedChain, type GameState } from "../game/gameEngine";
import { AppHeader } from "./AppHeader";
import { GuessInput } from "./GuessInput";
import { GuessList } from "./GuessList";
import { MapView } from "./MapView";
import styles from "./GameBoard.module.css";

type GameBoardProps = {
  state: GameState;
  onGuess: (guess: string) => void;
  onRestart: () => void;
};

type GuessFeedback = "correct" | "wrong" | null;

/**
 * Map-centric game view: the world map takes up most of the screen and
 * reveals every guess made so far, color-coded by quality. Start/target
 * sit in a slim header above it, the step counter and unified guess list
 * float as a small, unobtrusive overlay on the map, and the input is
 * docked at the bottom.
 *
 * A plain display/input container: holds no state of its own beyond a
 * transient guess-feedback flash — loading, saving, and switching to the
 * result screen on a win are all handled by `AppShell`, which only
 * renders this component while the round is still in progress.
 */
export function GameBoard({ state, onGuess, onRestart }: GameBoardProps) {
  const [feedback, setFeedback] = useState<GuessFeedback>(null);
  const previousGuessCount = useRef(state.guesses.length);

  useEffect(() => {
    if (state.guesses.length > previousGuessCount.current) {
      const lastGuess = state.guesses[state.guesses.length - 1];
      setFeedback(lastGuess.isNeighbor ? "correct" : "wrong");
    }
    previousGuessCount.current = state.guesses.length;
  }, [state.guesses]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 500);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const confirmedChain = getConfirmedChain(state);
  const intermediateStepsInOptimalPath = state.optimalPath.length - 2;
  const excludeNames = [state.start, ...confirmedChain];

  return (
    <div className={styles.app}>
      <AppHeader start={state.start} end={state.end} difficulty={state.difficulty} onRestart={onRestart} />

      <main className={styles.mapArea}>
        <MapView start={state.start} target={state.end} guesses={state.guesses} isWon={state.isWon} />

        <div className={`${styles.overlay} ${styles.progressOverlay}`}>
          <p className={styles.stepCounter}>
            Step {confirmedChain.length}
            <span className={styles.stepOptimal}>optimal: {intermediateStepsInOptimalPath}</span>
          </p>
          <GuessList state={state} />
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
