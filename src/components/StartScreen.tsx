import { StartEndBox } from "./StartEndBox";
import styles from "./StartScreen.module.css";

type StartScreenProps = {
  start: string;
  end: string;
  /** true, wenn für heute schon (unfertiger) Fortschritt gespeichert ist. */
  hasProgress: boolean;
  onStart: () => void;
};

/**
 * Startbildschirm des Tagesrätsels: zeigt Start- und Zielland als Vorschau
 * und einen zentralen Button, der ins Spiel führt. Gibt es für heute
 * bereits (unfertigen) Fortschritt, wird stattdessen "Weiterspielen"
 * angezeigt.
 */
export function StartScreen({ start, end, hasProgress, onStart }: StartScreenProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <h1 className={styles.title}>Travle-Klon</h1>
        <p className={styles.subtitle}>
          Finde eine Kette von Landgrenzen von Start bis Ziel.
        </p>
        <StartEndBox start={start} end={end} compact />
        <button type="button" className={styles.playButton} onClick={onStart}>
          {hasProgress ? "Weiterspielen" : "Spielen"}
        </button>
      </div>
    </div>
  );
}
