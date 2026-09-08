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
 * Kartenzentrierte Spielansicht: die Weltkarte nimmt den Großteil des
 * Bildschirms ein und deckt Land für Land den gefundenen Pfad auf. Start/
 * Ziel stehen als schlanke Kopfzeile darüber, der Fortschritt und die
 * falschen Versuche liegen als kleine, unauffällige Overlays auf der
 * Karte, die Eingabe ist unten fest angedockt.
 *
 * Reiner Anzeige-/Eingabe-Container: hält keinen eigenen State — Laden,
 * Speichern und der Wechsel zum Ergebnis-Screen bei Sieg übernimmt
 * `AppShell`, die diese Komponente nur solange rendert, wie die Runde
 * noch läuft.
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
            {state.correctGuesses.length === 1 ? "Land" : "Länder"} · optimal:{" "}
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
