import { computeSkipCounts, type GameState } from "../game/gameEngine";
import styles from "./GuessList.module.css";

type GuessListProps = {
  state: GameState;
  /** Compact chip display for the small overview next to/over the map. */
  compact?: boolean;
};

/**
 * Shows the intermediate countries guessed correctly so far. In the
 * normal view as green highlighted rows, in the compact variant as
 * space-saving chips. If a guess sits further ahead in the reference
 * path than the immediate next step, it also shows how many countries
 * were skipped.
 */
export function GuessList({ state, compact = false }: GuessListProps) {
  const { correctGuesses } = state;

  if (correctGuesses.length === 0) {
    return (
      <div className={compact ? styles.emptyCompact : styles.empty}>
        No countries guessed yet.
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
            <span className={styles.skipped}>{skipCounts[index]} countries skipped</span>
          )}
        </li>
      ))}
    </ul>
  );
}
