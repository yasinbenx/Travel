import { computeSkipCounts, type GameState } from "../game/gameEngine";
import styles from "./GuessList.module.css";

type GuessListProps = {
  state: GameState;
  /** Kompakte Chip-Darstellung für die kleine Übersicht neben/über der Karte. */
  compact?: boolean;
};

/**
 * Zeigt die bisher korrekt geratenen Zwischenländer. In der normalen
 * Darstellung als grün hervorgehobene Zeilen, in der kompakten Variante
 * als platzsparende Chips. Liegt ein Guess laut Referenzpfad weiter vorne
 * als der unmittelbar nächste Schritt, wird zusätzlich angezeigt, wie
 * viele Länder dabei übersprungen wurden.
 */
export function GuessList({ state, compact = false }: GuessListProps) {
  const { correctGuesses } = state;

  if (correctGuesses.length === 0) {
    return (
      <div className={compact ? styles.emptyCompact : styles.empty}>
        Noch keine Länder erraten.
      </div>
    );
  }

  const skipCounts = computeSkipCounts(state);

  if (compact) {
    return (
      <ul className={styles.chipList}>
        {correctGuesses.map((country, index) => (
          <li key={`${country}-${index}`} className={styles.chip}>
            {country}
            {skipCounts[index] > 0 && (
              <span className={styles.chipSkip}>+{skipCounts[index]}</span>
            )}
          </li>
        ))}
      </ul>
    );
  }

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
