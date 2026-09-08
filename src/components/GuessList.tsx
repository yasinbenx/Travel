import { computeSkipCounts, type GameState } from "../game/gameEngine";
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

  const skipCounts = computeSkipCounts(state);

  return (
    <ul className={styles.list}>
      {correctGuesses.map((country, index) => (
        <li key={`${country}-${index}`} className={styles.row}>
          <span className={styles.country}>{country}</span>
          {skipCounts[index] > 0 && (
            <span className={styles.skipped}>{skipCounts[index]} Länder übersprungen</span>
          )}
        </li>
      ))}
    </ul>
  );
}
