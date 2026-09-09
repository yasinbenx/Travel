import { BarChart3 } from "lucide-react";
import { gameKey } from "../game/persistence";
import type { Difficulty, GameState } from "../game/gameEngine";
import { DailyChallengeTile } from "./DailyChallengeTile";
import { Footer } from "./Footer";
import { StreakBadge } from "./StreakBadge";
import { WorldSilhouette } from "./WorldSilhouette";
import styles from "./StartScreen.module.css";

type StartScreenProps = {
  today: string;
  games: Record<string, GameState>;
  currentStreak: number;
  onSelectDifficulty: (difficulty: Difficulty) => void;
  onOpenStats: () => void;
  error?: string | null;
};

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

const HOW_TO_PLAY = [
  {
    icon: "🧭",
    title: "Pick a difficulty",
    description: "Easy, Medium, or Hard — each has its own start and target country for today.",
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
 * Landing screen: BorderHop is a daily-challenge game, so there are
 * exactly three puzzles available at any time — one per difficulty, the
 * same for every player, once per calendar day. Each tile shows whether
 * that difficulty is still unplayed or already finished today.
 */
export function StartScreen({
  today,
  games,
  currentStreak,
  onSelectDifficulty,
  onOpenStats,
  error,
}: StartScreenProps) {
  return (
    <div className={styles.screen}>
      <WorldSilhouette />

      <button
        type="button"
        className={styles.statsButton}
        onClick={onOpenStats}
        aria-label="View stats"
        title="View stats"
      >
        <BarChart3 size={18} strokeWidth={2.25} />
      </button>

      <div className={styles.content}>
        <div className={styles.hero}>
          <h1 className={styles.title}>
            <span aria-hidden="true">🌐</span> BorderHop
          </h1>
          <p className={styles.subtitle}>Navigate the world, one border at a time.</p>
          {currentStreak > 0 && <StreakBadge days={currentStreak} />}
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </div>

        <div className={styles.tiles} role="group" aria-label="Today's daily challenges">
          {DIFFICULTIES.map((difficulty) => (
            <DailyChallengeTile
              key={difficulty}
              difficulty={difficulty}
              game={games[gameKey(today, difficulty)]}
              onClick={() => onSelectDifficulty(difficulty)}
            />
          ))}
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
