import { findShortestPath } from "../lib/findShortestPath";
import { generateDailyPuzzle, type GameState } from "./gameEngine";

/** Heutiges Datum als deterministischer Seed, z.B. "2026-09-08". */
export function getTodaySeed(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Erzeugt einen frischen, ungespielten Spielstand für das Tagesrätsel eines Seeds. */
export function createFreshGameState(seed: string): GameState {
  const { start, end } = generateDailyPuzzle(seed);
  const optimalPath = findShortestPath(start, end);
  return {
    start,
    end,
    optimalPath,
    correctGuesses: [],
    wrongGuesses: [],
    isWon: false,
  };
}
