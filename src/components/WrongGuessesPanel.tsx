import { useState } from "react";
import styles from "./WrongGuessesPanel.module.css";

type WrongGuessesPanelProps = {
  wrongGuesses: string[];
};

/**
 * Collapsed list of wrong guesses. The header always shows the count;
 * clicking it expands/collapses the list of countries.
 */
export function WrongGuessesPanel({ wrongGuesses }: WrongGuessesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const count = wrongGuesses.length;
  const hasEntries = count > 0;

  return (
    <div className={styles.panel}>
      <button
        type="button"
        className={styles.toggle}
        disabled={!hasEntries}
        aria-expanded={isOpen && hasEntries}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{count} wrong {count === 1 ? "guess" : "guesses"}</span>
        {hasEntries && (
          <span
            className={isOpen ? `${styles.chevron} ${styles.chevronOpen}` : styles.chevron}
            aria-hidden="true"
          >
            &#9660;
          </span>
        )}
      </button>
      {isOpen && hasEntries && (
        <div className={styles.content}>
          {wrongGuesses.map((country, index) => (
            <span key={`${country}-${index}`} className={styles.chip}>
              {country}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
