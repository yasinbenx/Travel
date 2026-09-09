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
 * Aggregates stats purely from the stored games collection. There's no
 * "fail" state in this game (a puzzle stays open until won), so the only
 * meaningful played/success metric is how many puzzles were won and how
 * efficiently, not a win/loss ratio.
 */
export function computeStats(games: Record<string, GameState>): Stats {
  const won = Object.values(games).filter((game) => game.isWon);
  const totalPlayedByDifficulty = emptyByDifficulty();
  const perfectSolvesByDifficulty = emptyByDifficulty();
  let ratioSum = 0;

  for (const game of won) {
    totalPlayedByDifficulty[game.difficulty]++;
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
    totalPlayed: won.length,
    totalPlayedByDifficulty,
    perfectSolves,
    perfectSolvesByDifficulty,
    averageStepsOverOptimal: won.length > 0 ? ratioSum / won.length : null,
  };
}
