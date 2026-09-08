import { DIFFICULTY_LABEL, type Difficulty } from "../game/gameEngine";
import styles from "./DifficultyBadge.module.css";

type DifficultyBadgeProps = {
  difficulty: Difficulty;
};

/** Small, dimmed badge showing which difficulty a round was played on. */
export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  return <span className={`${styles.badge} ${styles[difficulty]}`}>{DIFFICULTY_LABEL[difficulty]}</span>;
}
