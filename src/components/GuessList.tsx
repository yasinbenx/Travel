import { getSkippedCount, type GameState } from "../game/gameEngine";
import styles from "./GuessList.module.css";

type GuessListProps = {
  state: GameState;
};

/**
 * Zeigt die bisher korrekt geratenen Zwischenländer als grün hervorgehobene
 * Zeilen. Liegt ein Guess laut Referenzpfad weiter vorne als der
 * unmittelbar nächste Schritt, wird zusätzlich angezeigt, wie viele Länder
 * dabei übersprungen wurden.
 */
export function GuessList({ state }: GuessListProps) {
  const { correctGuesses } = state;

  if (correctGuesses.length === 0) {
    return <div className={styles.empty}>Noch keine Länder erraten.</div>;
  }

  return (
    <ul className={styles.list}>
      {correctGuesses.map((country, index) => {
        const stateBeforeThisGuess: GameState = {
          ...state,
          correctGuesses: correctGuesses.slice(0, index),
        };
        const skipped = getSkippedCount(stateBeforeThisGuess, country);

        return (
          <li key={`${country}-${index}`} className={styles.row}>
            <span className={styles.country}>{country}</span>
            {skipped > 0 && (
              <span className={styles.skipped}>{skipped} Länder übersprungen</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
