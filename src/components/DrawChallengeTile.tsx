import { Check, Palette, Play } from "lucide-react";
import { getAverageScore, type DrawGameState } from "../game/drawGameState";
import styles from "./DailyChallengeTile.module.css";

type DrawChallengeTileProps = {
  /** Today's stored Draw It state, if the player has started or finished it. */
  drawState: DrawGameState | undefined;
  onClick: () => void;
};

/**
 * The 4th daily-challenge tile, alongside Easy/Medium/Hard: draw 5
 * random countries freehand. Same "Play" -> "Completed" behavior as the
 * others, but shows the day's average score once done instead of a step
 * count, since Draw It doesn't have an optimal-path notion.
 */
export function DrawChallengeTile({ drawState, onClick }: DrawChallengeTileProps) {
  const isCompleted = drawState?.isCompleted ?? false;
  const average = drawState ? getAverageScore(drawState) : null;

  return (
    <button
      type="button"
      className={isCompleted ? `${styles.tile} ${styles.completed}` : styles.tile}
      onClick={onClick}
    >
      <span className={styles.icon} aria-hidden="true">
        <Palette size={16} strokeWidth={2.25} />
      </span>
      <span className={styles.label}>Draw It</span>
      {isCompleted ? (
        <span className={styles.status}>
          <Check size={13} strokeWidth={3} />
          {average !== null ? `${average.toFixed(1)}/10` : "Done"}
        </span>
      ) : (
        <>
          <span className={styles.status}>
            <Play size={11} strokeWidth={2.5} fill="currentColor" />
            Play
          </span>
          <span className={styles.hint}>5 countries</span>
        </>
      )}
    </button>
  );
}
