import { getPreviousDateString } from "./dateUtils";
import type { DrawGameState } from "./drawGameState";
import {
  getValidIntermediateCountries,
  type Difficulty,
  type GameState,
  type GuessQuality,
} from "./gameEngine";
import { gameKey } from "./persistence";

export type Stats = {
  totalPlayed: number;
  totalPlayedByDifficulty: Record<Difficulty, number>;
  perfectSolves: number;
  perfectSolvesByDifficulty: Record<Difficulty, number>;
  /** Average (steps taken / optimal steps) across all won puzzles; `null` if none played yet. */
  averageStepsOverOptimal: number | null;
};

function emptyByDifficulty(): Record<Difficulty, number> {
  return { easy: 0, medium: 0, hard: 0 };
}

/** A won game whose step count matched (or beat) the optimal route's length. */
function isPerfectSolve(game: GameState): boolean {
  return getValidIntermediateCountries(game).length <= game.optimalPath.length - 2;
}

/**
 * Aggregates stats purely from the stored games collection. A round
 * finishes either by winning or by giving up; both count as "played" for
 * the completion count, but only actual wins ever count as a "perfect
 * solve" or contribute to the average-steps-over-optimal ratio — a
 * given-up round has no player route worth measuring.
 */
export function computeStats(games: Record<string, GameState>): Stats {
  const finished = Object.values(games).filter((game) => game.isWon || game.isGivenUp);
  const won = finished.filter((game) => game.isWon);
  const totalPlayedByDifficulty = emptyByDifficulty();
  const perfectSolvesByDifficulty = emptyByDifficulty();
  let ratioSum = 0;

  for (const game of finished) {
    totalPlayedByDifficulty[game.difficulty]++;
  }

  for (const game of won) {
    const steps = getValidIntermediateCountries(game).length;
    const optimalSteps = game.optimalPath.length - 2;
    if (isPerfectSolve(game)) {
      perfectSolvesByDifficulty[game.difficulty]++;
    }
    ratioSum += optimalSteps > 0 ? steps / optimalSteps : 1;
  }

  const perfectSolves =
    perfectSolvesByDifficulty.easy +
    perfectSolvesByDifficulty.medium +
    perfectSolvesByDifficulty.hard;

  return {
    totalPlayed: finished.length,
    totalPlayedByDifficulty,
    perfectSolves,
    perfectSolvesByDifficulty,
    averageStepsOverOptimal: won.length > 0 ? ratioSum / won.length : null,
  };
}

export type QualityDistribution = Record<GuessQuality, number>;

/**
 * Counts every guess ever made, across every stored game, by its
 * quality — the "gold/green/orange/red" breakdown shown as a small ring
 * chart on the stats page. Includes guesses from in-progress rounds too,
 * not just finished ones, since it's a lifetime tally of guessing
 * behavior rather than a per-round outcome metric.
 */
export function computeQualityDistribution(games: Record<string, GameState>): QualityDistribution {
  const distribution: QualityDistribution = { gold: 0, green: 0, orange: 0, red: 0 };
  for (const game of Object.values(games)) {
    for (const guess of game.guesses) {
      distribution[guess.quality]++;
    }
  }
  return distribution;
}

export type DayStatus = "perfect" | "good" | "gaveUp" | "none";

/**
 * One calendar day's best result across all three difficulties, for the
 * stats page's mini history calendar — a single representative dot per
 * day rather than one per difficulty, ranked best-to-worst: a perfect
 * solve beats a non-perfect win, which beats a give-up, which beats an
 * untouched day.
 */
function computeDayStatus(games: Record<string, GameState>, date: string): DayStatus {
  const difficulties: Difficulty[] = ["easy", "medium", "hard"];
  const dayGames = difficulties.map((difficulty) => games[gameKey(date, difficulty)]).filter(Boolean);

  if (dayGames.some((game) => game.isWon && isPerfectSolve(game))) return "perfect";
  if (dayGames.some((game) => game.isWon)) return "good";
  if (dayGames.some((game) => game.isGivenUp)) return "gaveUp";
  return "none";
}

export type DayHistoryEntry = { date: string; status: DayStatus };

/**
 * The last `days` calendar days (oldest first, ending at `today`) with
 * each day's best result — powers the stats page's "History" mini
 * calendar strip.
 */
export function computeHistory(
  games: Record<string, GameState>,
  today: string,
  days = 10,
): DayHistoryEntry[] {
  const entries: DayHistoryEntry[] = [];
  let date = today;
  for (let i = 0; i < days; i++) {
    entries.unshift({ date, status: computeDayStatus(games, date) });
    date = getPreviousDateString(date);
  }
  return entries;
}

export type DrawStats = {
  daysPlayed: number;
  /** Average of each completed day's own average score, rounded to one decimal; `null` if never completed. */
  averageScore: number | null;
  /** The single best score ever recorded across all completed days, rounded to one decimal; `null` if never completed. */
  bestScore: number | null;
};

/**
 * Aggregates Draw It stats purely from its own stored games collection.
 * Only completed days (all 5 countries drawn) count — a day abandoned
 * partway through has no meaningful "day average" yet.
 */
export function computeDrawStats(drawGames: Record<string, DrawGameState>): DrawStats {
  const completed = Object.values(drawGames).filter((game) => game.isCompleted);

  if (completed.length === 0) {
    return { daysPlayed: 0, averageScore: null, bestScore: null };
  }

  let overallSum = 0;
  let bestScore = -Infinity;
  for (const game of completed) {
    const daySum = game.scores.reduce((total, score) => total + score, 0);
    overallSum += daySum / game.scores.length;
    bestScore = Math.max(bestScore, ...game.scores);
  }

  return {
    daysPlayed: completed.length,
    averageScore: Math.round((overallSum / completed.length) * 10) / 10,
    bestScore: Math.round(bestScore * 10) / 10,
  };
}
