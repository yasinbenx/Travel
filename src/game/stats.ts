import { getConfirmedChain, type Difficulty, type GameState } from "./gameEngine";

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
    const steps = getConfirmedChain(game).length;
    const optimalSteps = game.optimalPath.length - 2;
    if (steps <= optimalSteps) {
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
