import type { Difficulty } from "../game/gameEngine";
import { DIFFICULTY_LABEL } from "../game/gameEngine";
import styles from "./DifficultySelector.module.css";

type DifficultySelectorProps = {
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
};

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

/** How many of the 3 meter bars are filled in for each difficulty. */
const DIFFICULTY_LEVEL: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

const DIFFICULTY_HINT: Record<Difficulty, string> = {
  easy: "2-3 steps",
  medium: "4-6 steps",
  hard: "7-10 steps",
};

/** Segmented control for picking the puzzle difficulty before starting a round. */
export function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
  return (
    <div className={styles.group} role="radiogroup" aria-label="Difficulty">
      {DIFFICULTIES.map((difficulty) => (
        <button
          key={difficulty}
          type="button"
          role="radio"
          aria-checked={value === difficulty}
          className={
            value === difficulty ? `${styles.option} ${styles.optionActive}` : styles.option
          }
          onClick={() => onChange(difficulty)}
        >
          <span className={styles.meter} aria-hidden="true">
            {[1, 2, 3].map((bar) => (
              <span
                key={bar}
                className={bar <= DIFFICULTY_LEVEL[difficulty] ? `${styles.bar} ${styles.barFilled}` : styles.bar}
              />
            ))}
          </span>
          <span className={styles.optionLabel}>{DIFFICULTY_LABEL[difficulty]}</span>
          <span className={styles.optionHint}>{DIFFICULTY_HINT[difficulty]}</span>
        </button>
      ))}
    </div>
  );
}
