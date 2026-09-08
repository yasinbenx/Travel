import { findShortestPath } from "../lib/findShortestPath";
import { generateRandomPuzzle, type GameState } from "./gameEngine";

/** Creates a fresh, unplayed game state for a brand-new random puzzle. */
export function createRandomGameState(): GameState {
  const { start, end } = generateRandomPuzzle();
  const optimalPath = findShortestPath(start, end);
  return {
    start,
    end,
    optimalPath,
    guesses: [],
    isWon: false,
  };
}
