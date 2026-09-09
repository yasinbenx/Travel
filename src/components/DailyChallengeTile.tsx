import { Check, Play } from "lucide-react";
import { DIFFICULTY_LABEL, getConfirmedChain, type Difficulty, type GameState } from "../game/gameEngine";
import styles from "./DailyChallengeTile.module.css";

type DailyChallengeTileProps = {
  difficulty: Difficulty;
  /** This difficulty's stored game for today, if the player has started or finished it. */
  game: GameState | undefined;
  onClick: () => void;
};

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

/**
 * One of today's three daily challenges. Shows "Play" until finished,
 * then flips to a completed state with the step count reached — clicking
 * it always goes to that same puzzle (in progress or finished), never a
 * fresh one, since each difficulty only has a single puzzle per day.
 */
export function DailyChallengeTile({ difficulty, game, onClick }: DailyChallengeTileProps) {
  const isCompleted = game?.isWon ?? false;
  const steps = game ? getConfirmedChain(game).length : 0;

  return (
    <button
      type="button"
      className={isCompleted ? `${styles.tile} ${styles.completed}` : styles.tile}
      onClick={onClick}
    >
      <span className={styles.meter} aria-hidden="true">
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={
              bar <= DIFFICULTY_LEVEL[difficulty] ? `${styles.bar} ${styles.barFilled}` : styles.bar
            }
          />
        ))}
      </span>
      <span className={styles.label}>{DIFFICULTY_LABEL[difficulty]}</span>
      {isCompleted ? (
        <span className={styles.status}>
          <Check size={13} strokeWidth={3} />
          {steps} {steps === 1 ? "step" : "steps"}
        </span>
      ) : (
        <>
          <span className={styles.status}>
            <Play size={11} strokeWidth={2.5} fill="currentColor" />
            Play
          </span>
          <span className={styles.hint}>{DIFFICULTY_HINT[difficulty]}</span>
        </>
      )}
    </button>
  );
}
