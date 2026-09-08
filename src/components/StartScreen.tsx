import styles from "./StartScreen.module.css";

type StartScreenProps = {
  onStart: () => void;
};

/**
 * Landing screen: BorderHop is unlimited play, so there's no puzzle to
 * preview yet — clicking "Play" is what generates the first random
 * country pair.
 */
export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <h1 className={styles.title}>BorderHop</h1>
        <p className={styles.subtitle}>
          Find a chain of shared land borders from a start country to a target country.
        </p>
        <button type="button" className={styles.playButton} onClick={onStart}>
          Play
        </button>
      </div>
    </div>
  );
}
