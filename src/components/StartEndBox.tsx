import styles from "./StartEndBox.module.css";

type StartEndBoxProps = {
  start: string;
  end: string;
  /** Slim single-line variant for the header bar above the map. */
  compact?: boolean;
};

/**
 * Shows the start and target country as a fixed, framed display. Both
 * countries are fixed for the duration of the round and can't be changed
 * here.
 */
export function StartEndBox({ start, end, compact = false }: StartEndBoxProps) {
  if (compact) {
    return (
      <div className={styles.compactWrapper}>
        <span className={styles.compactCountry}>{start}</span>
        <span className={styles.arrow} aria-hidden="true">
          &rarr;
        </span>
        <span className={styles.compactCountry}>{end}</span>
      </div>
    );
  }

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
        <span className={styles.label}>Target</span>
        <span className={styles.country}>{end}</span>
      </div>
    </div>
  );
}
