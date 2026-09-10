import type { ReactNode } from "react";
import { CalendarDays, Compass, Flame, Palette, Sparkles, Star, Trophy, X } from "lucide-react";
import type { DrawGameState } from "../game/drawGameState";
import { getTodayDateString } from "../game/dateUtils";
import type { Difficulty, GameState } from "../game/gameEngine";
import {
  computeDrawStats,
  computeHistory,
  computeQualityDistribution,
  computeStats,
} from "../game/stats";
import { DifficultyBadge } from "./DifficultyBadge";
import { HistoryCalendar } from "./HistoryCalendar";
import { QualityDistributionRing } from "./QualityDistributionRing";
import { StreakBadge } from "./StreakBadge";
import { useCountUp } from "../hooks/useCountUp";
import styles from "./StatsPanel.module.css";

type StatsPanelProps = {
  games: Record<string, GameState>;
  drawGames: Record<string, DrawGameState>;
  currentStreak: number;
  longestStreak: number;
  onClose: () => void;
};

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

type OverviewTileProps = {
  icon: ReactNode;
  value: number;
  label: string;
  wide?: boolean;
  /** Decimal places for the count-up (and its final display) — 0 for a plain integer count, 1 for a "7.2"-style score. */
  decimals?: number;
  suffix?: string;
};

/** One overview tile with a count-up animated value. */
function OverviewTile({ icon, value, label, wide, decimals = 0, suffix = "" }: OverviewTileProps) {
  const animated = useCountUp(value, 1100, decimals);
  return (
    <div className={wide ? `${styles.tile} ${styles.tileWide}` : styles.tile}>
      <span className={styles.tileIcon} aria-hidden="true">
        {icon}
      </span>
      <p className={styles.tileValue}>
        {decimals > 0 ? animated.toFixed(decimals) : animated}
        {suffix}
      </p>
      <p className={styles.tileLabel}>{label}</p>
    </div>
  );
}

/**
 * Full-screen stats overlay: an animated overview, a quality-guess
 * breakdown ring, a per-difficulty split, and a mini history calendar of
 * the last 10 days — or, if nothing has ever been played, a friendly
 * empty state instead of a wall of zeroes.
 */
export function StatsPanel({ games, drawGames, currentStreak, longestStreak, onClose }: StatsPanelProps) {
  const stats = computeStats(games);
  const distribution = computeQualityDistribution(games);
  const history = computeHistory(games, getTodayDateString(), 10);
  const drawStats = computeDrawStats(drawGames);
  const hasPlayed = stats.totalPlayed > 0 || drawStats.daysPlayed > 0;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Your Stats</h1>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close stats"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </header>

      <div className={styles.content}>
        {!hasPlayed ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <Compass size={40} strokeWidth={1.75} />
            </span>
            <p className={styles.emptyTitle}>No stats yet</p>
            <p className={styles.emptyText}>
              Play your first daily challenge to start building your streak and stats.
            </p>
            <button type="button" className={styles.emptyButton} onClick={onClose}>
              Back to today's challenges
            </button>
          </div>
        ) : (
          <>
            <section className={styles.section}>
              <p className={styles.sectionHeading}>Overview</p>

              {currentStreak > 0 ? (
                <div className={styles.streakRow}>
                  <StreakBadge days={currentStreak} size="large" />
                </div>
              ) : (
                <p className={styles.noStreak}>
                  <Flame size={16} strokeWidth={2.25} />
                  No active streak — play today to start one!
                </p>
              )}

              <div className={styles.grid}>
                <OverviewTile
                  icon={<Trophy size={20} strokeWidth={2.25} />}
                  value={stats.perfectSolves}
                  label="Perfect solves"
                />
                <OverviewTile
                  icon={<Compass size={20} strokeWidth={2.25} />}
                  value={stats.totalPlayed}
                  label="Played"
                />
                <OverviewTile
                  icon={<Flame size={20} strokeWidth={2.25} />}
                  value={longestStreak}
                  label="Longest streak"
                />
                <div className={styles.tile}>
                  <span className={styles.tileIcon} aria-hidden="true">
                    <Sparkles size={20} strokeWidth={2.25} />
                  </span>
                  <p className={styles.tileValue}>
                    {stats.averageStepsOverOptimal !== null
                      ? `${stats.averageStepsOverOptimal.toFixed(2)}×`
                      : "–"}
                  </p>
                  <p className={styles.tileLabel}>Avg. steps vs. optimal</p>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <p className={styles.sectionHeading}>Guess quality</p>
              <div className={styles.card}>
                <QualityDistributionRing distribution={distribution} />
              </div>
            </section>

            <section className={styles.section}>
              <p className={styles.sectionHeading}>By difficulty</p>
              <div className={styles.difficultyGrid}>
                {DIFFICULTIES.map((difficulty) => (
                  <div key={difficulty} className={styles.difficultyCard}>
                    <DifficultyBadge difficulty={difficulty} />
                    <p className={styles.difficultyPlayed}>
                      {stats.totalPlayedByDifficulty[difficulty]}
                      <span className={styles.difficultyPlayedLabel}>played</span>
                    </p>
                    <p className={styles.difficultyPerfect}>
                      {stats.perfectSolvesByDifficulty[difficulty]} perfect
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <p className={styles.sectionHeading}>
                <CalendarDays size={14} strokeWidth={2.5} />
                History
              </p>
              <div className={styles.card}>
                <HistoryCalendar history={history} />
              </div>
            </section>

            <section className={styles.section}>
              <p className={styles.sectionHeading}>
                <Palette size={14} strokeWidth={2.5} />
                Draw It
              </p>
              <div className={styles.grid}>
                <OverviewTile
                  icon={<Compass size={20} strokeWidth={2.25} />}
                  value={drawStats.daysPlayed}
                  label="Days played"
                />
                <OverviewTile
                  icon={<Star size={20} strokeWidth={2.25} />}
                  value={drawStats.bestScore ?? 0}
                  label="Best score"
                  decimals={drawStats.bestScore !== null ? 1 : 0}
                  suffix={drawStats.bestScore !== null ? "/10" : ""}
                />
                <OverviewTile
                  icon={<Sparkles size={20} strokeWidth={2.25} />}
                  value={drawStats.averageScore ?? 0}
                  label="Average score"
                  wide
                  decimals={drawStats.averageScore !== null ? 1 : 0}
                  suffix={drawStats.averageScore !== null ? "/10" : ""}
                />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
