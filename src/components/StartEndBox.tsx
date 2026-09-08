import styles from "./StartEndBox.module.css";

type StartEndBoxProps = {
  start: string;
  end: string;
};

/**
 * Zeigt Start- und Zielland fest und eingerahmt an. Beide Länder stehen
 * für die Dauer der Runde fest und sind hier nicht veränderbar.
 */
export function StartEndBox({ start, end }: StartEndBoxProps) {
  return (
    <div className={styles.wrapper}>
      <div className={`${styles.box} ${styles.start}`}>
        <span className={styles.label}>Start</span>
        <span className={styles.country}>{start}</span>
      </div>
      <span className={styles.arrow} aria-hidden="true">
        &rarr;
      </span>
      <div className={`${styles.box} ${styles.end}`}>
        <span className={styles.label}>Ziel</span>
        <span className={styles.country}>{end}</span>
      </div>
    </div>
  );
}
