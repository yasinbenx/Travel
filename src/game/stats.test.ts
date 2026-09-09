import { describe, expect, it } from "vitest";
import type { GameState } from "./gameEngine";
import { computeStats } from "./stats";

function makeGame(overrides: Partial<GameState> = {}): GameState {
  return {
    date: "2026-01-01",
    difficulty: "medium",
    start: "Germany",
    end: "Italy",
    optimalPath: ["Germany", "Austria", "Italy"],
    guesses: [{ country: "Austria", quality: "gold", isNeighbor: true }],
    isWon: true,
    isGivenUp: false,
    ...overrides,
  };
}

describe("computeStats", () => {
  it("returns all-zero stats for an empty collection", () => {
    expect(computeStats({})).toEqual({
      totalPlayed: 0,
      totalPlayedByDifficulty: { easy: 0, medium: 0, hard: 0 },
      perfectSolves: 0,
      perfectSolvesByDifficulty: { easy: 0, medium: 0, hard: 0 },
      averageStepsOverOptimal: null,
    });
  });

  it("ignores unfinished (not won, not given up) games", () => {
    const games = {
      a: makeGame({ isWon: false, guesses: [] }),
    };
    expect(computeStats(games).totalPlayed).toBe(0);
  });

  it("counts a given-up game as played but never as a perfect solve", () => {
    const games = {
      a: makeGame({ isWon: false, isGivenUp: true, guesses: [] }),
    };
    const stats = computeStats(games);
    expect(stats.totalPlayed).toBe(1);
    expect(stats.totalPlayedByDifficulty.medium).toBe(1);
    expect(stats.perfectSolves).toBe(0);
    expect(stats.perfectSolvesByDifficulty.medium).toBe(0);
  });

  it("excludes given-up games from averageStepsOverOptimal", () => {
    const games = {
      a: makeGame({ isWon: false, isGivenUp: true, guesses: [] }),
    };
    expect(computeStats(games).averageStepsOverOptimal).toBeNull();
  });

  it("mixes wins and give-ups: both count as played, only the win counts as perfect", () => {
    const games = {
      a: makeGame({ difficulty: "easy" }), // won, perfect
      b: makeGame({ difficulty: "easy", isWon: false, isGivenUp: true, guesses: [] }),
    };
    const stats = computeStats(games);
    expect(stats.totalPlayed).toBe(2);
    expect(stats.totalPlayedByDifficulty.easy).toBe(2);
    expect(stats.perfectSolves).toBe(1);
    expect(stats.perfectSolvesByDifficulty.easy).toBe(1);
    expect(stats.averageStepsOverOptimal).toBe(1);
  });

  it("counts a won game that matches the optimal path as a perfect solve", () => {
    const games = { a: makeGame() }; // 1 guess, optimalPath has 1 intermediate step
    const stats = computeStats(games);
    expect(stats.totalPlayed).toBe(1);
    expect(stats.perfectSolves).toBe(1);
    expect(stats.perfectSolvesByDifficulty.medium).toBe(1);
    expect(stats.averageStepsOverOptimal).toBe(1);
  });

  it("counts a won game with extra steps as played but not perfect", () => {
    const games = {
      a: makeGame({
        optimalPath: ["Germany", "Austria", "Italy"], // 1 intermediate step
        guesses: [
          { country: "Poland", quality: "red", isNeighbor: true },
          { country: "Czech Republic", quality: "orange", isNeighbor: true },
          { country: "Austria", quality: "green", isNeighbor: true },
        ],
      }),
    };
    const stats = computeStats(games);
    expect(stats.totalPlayed).toBe(1);
    expect(stats.perfectSolves).toBe(0);
    expect(stats.averageStepsOverOptimal).toBe(3);
  });

  it("breaks totals down correctly per difficulty", () => {
    const games = {
      a: makeGame({ difficulty: "easy" }),
      b: makeGame({ difficulty: "medium" }),
      c: makeGame({ difficulty: "hard" }),
      d: makeGame({ difficulty: "easy" }),
    };
    const stats = computeStats(games);
    expect(stats.totalPlayed).toBe(4);
    expect(stats.totalPlayedByDifficulty).toEqual({ easy: 2, medium: 1, hard: 1 });
    expect(stats.perfectSolvesByDifficulty).toEqual({ easy: 2, medium: 1, hard: 1 });
  });
});
