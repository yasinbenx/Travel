import type { GameState, GuessQuality } from "../game/gameEngine";
import styles from "./GuessList.module.css";

type GuessListProps = {
  state: GameState;
};

const QUALITY_EMOJI: Record<GuessQuality, string> = {
  gold: "🟨",
  green: "🟩",
  orange: "🟧",
  red: "🟥",
};

const QUALITY_LABEL: Record<GuessQuality, string> = {
  gold: "Perfect",
  green: "Great",
  orange: "Good",
  red: "Big detour",
};

const QUALITY_CLASS: Record<GuessQuality, string> = {
  gold: styles.gold,
  green: styles.green,
  orange: styles.orange,
  red: styles.red,
};

/**
 * Every guess made so far, in order — no more separate correct/wrong
 * lists. Each guess is shown with its quality emoji, its country name
 * colored to match, and a short note: the quality label for a real
 * neighbor move, or an explicit "big detour" message for a red guess
 * (whether it's a bad neighbor choice or not a neighbor at all).
 */
export function GuessList({ state }: GuessListProps) {
  const { guesses } = state;

  if (guesses.length === 0) {
    return <div className={styles.empty}>No guesses yet.</div>;
  }

  return (
    <ul className={styles.list}>
      {guesses.map((guess, index) => (
        <li key={`${guess.country}-${index}`} className={styles.row}>
          <span className={`${styles.country} ${QUALITY_CLASS[guess.quality]}`}>
            <span aria-hidden="true">{QUALITY_EMOJI[guess.quality]}</span> {guess.country}
          </span>
          <span className={styles.note}>
            {guess.quality === "red"
              ? "Not the best move. This country is a big detour."
              : QUALITY_LABEL[guess.quality]}
          </span>
        </li>
      ))}
    </ul>
  );
}
