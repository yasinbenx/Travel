import { Footer } from "./Footer";
import { WorldSilhouette } from "./WorldSilhouette";
import styles from "./StartScreen.module.css";

type StartScreenProps = {
  onStart: () => void;
  error?: string | null;
};

const HOW_TO_PLAY = [
  {
    icon: "🧭",
    title: "Get a start and a target",
    description: "Two random countries are picked — one to start from, one to reach.",
  },
  {
    icon: "🗺️",
    title: "Guess neighboring countries",
    description: "Name a country that shares a land border with your last correct guess.",
  },
  {
    icon: "🏁",
    title: "Reach the target",
    description: "Chain your way there — fewer guesses than the optimal route earns bragging rights.",
  },
];

/**
 * Landing screen: BorderHop is unlimited play, so there's no puzzle to
 * preview yet — clicking "Play" is what generates the first random
 * country pair.
 */
export function StartScreen({ onStart, error }: StartScreenProps) {
  return (
    <div className={styles.screen}>
      <WorldSilhouette />

      <div className={styles.content}>
        <div className={styles.hero}>
          <h1 className={styles.title}>
            <span aria-hidden="true">🌐</span> BorderHop
          </h1>
          <p className={styles.subtitle}>Navigate the world, one border at a time.</p>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <button type="button" className={styles.playButton} onClick={onStart}>
            Play
          </button>
        </div>

        <ol className={styles.steps}>
          {HOW_TO_PLAY.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepIcon} aria-hidden="true">
                {step.icon}
                <span className={styles.stepNumber}>{index + 1}</span>
              </span>
              <div>
                <p className={styles.stepTitle}>{step.title}</p>
                <p className={styles.stepDescription}>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <Footer />
      </div>
    </div>
  );
}
