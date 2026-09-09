import { findShortestPath } from "../lib/findShortestPath";
import { generateDailyPuzzle, type Difficulty, type GameState } from "./gameEngine";

/** Creates a fresh, unplayed game state for `date`'s daily puzzle at `difficulty`. */
export function createDailyGameState(date: string, difficulty: Difficulty): GameState {
  const { start, end } = generateDailyPuzzle(date, difficulty);
  const optimalPath = findShortestPath(start, end);
  return {
    date,
    difficulty,
    start,
    end,
    optimalPath,
    guesses: [],
    isWon: false,
  };
}
