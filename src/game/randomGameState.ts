import { findShortestPath } from "../lib/findShortestPath";
import { generateRandomPuzzle, type Difficulty, type GameState } from "./gameEngine";

/** Creates a fresh, unplayed game state for a brand-new random puzzle. */
export function createRandomGameState(difficulty: Difficulty = "medium"): GameState {
  const { start, end } = generateRandomPuzzle(difficulty);
  const optimalPath = findShortestPath(start, end);
  return {
    start,
    end,
    optimalPath,
    guesses: [],
    isWon: false,
    difficulty,
  };
}
