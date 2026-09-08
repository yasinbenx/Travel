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
};

/**
 * Map-centric game view: the world map takes up most of the screen and
 * reveals the found path country by country. Start/target sit in a slim
 * header above it, progress and wrong guesses float as small, unobtrusive
 * overlays on the map, and the input is docked at the bottom.
 *
 * A plain display/input container: holds no state of its own — loading,
 * saving, and switching to the result screen on a win are all handled by
 * `AppShell`, which only renders this component while the round is still
 * in progress.
 */
export function GameBoard({ state, onGuess }: GameBoardProps) {
  const intermediateStepsInOptimalPath = state.optimalPath.length - 2;
  const excludeNames = [state.start, ...state.correctGuesses];
  const revealedCountries = [state.start, ...state.correctGuesses];

  return (
    <div className={styles.app}>
      <AppHeader start={state.start} end={state.end} />

      <main className={styles.mapArea}>
        <MapView
          revealedCountries={revealedCountries}
          target={state.end}
          isWon={state.isWon}
        />

        <div className={`${styles.overlay} ${styles.progressOverlay}`}>
          <p className={styles.progressText}>
            {state.correctGuesses.length}{" "}
            {state.correctGuesses.length === 1 ? "country" : "countries"} · optimal:{" "}
            {intermediateStepsInOptimalPath}
          </p>
          <GuessList state={state} compact />
        </div>

        <div className={`${styles.overlay} ${styles.wrongOverlay}`}>
          <WrongGuessesPanel wrongGuesses={state.wrongGuesses} />
        </div>
      </main>

      <footer className={styles.footer}>
        <GuessInput onGuess={onGuess} disabled={state.isWon} excludeNames={excludeNames} />
      </footer>
    </div>
  );
}
