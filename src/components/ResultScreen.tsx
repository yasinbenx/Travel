import type { GameState } from "../game/gameEngine";
import { AppHeader } from "./AppHeader";
import { MapView } from "./MapView";
import { ResultSummary } from "./ResultSummary";
import styles from "./ResultScreen.module.css";

type ResultScreenProps = {
  state: GameState;
};

/**
 * Wird gezeigt, wenn das heutige Rätsel bereits abgeschlossen ist (frisch
 * nach dem Sieg oder nach einem erneuten Seitenaufruf aus dem
 * localStorage-Spielstand). Zeigt die Ergebnis-Zusammenfassung sowie —
 * read-only, ohne Eingabefeld — die Karte mit dem final gefundenen Pfad.
 */
export function ResultScreen({ state }: ResultScreenProps) {
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
    </div>
  );
}
