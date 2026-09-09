import { describe, expect, it } from "vitest";
import type { Difficulty, GameState } from "./gameEngine";
import { gameKey } from "./persistence";
import { computeHistory, computeQualityDistribution, computeStats } from "./stats";

function makeGame(overrides: Partial<GameState> = {}): GameState {
  return {
    date: "2026-01-01",
    difficulty: "medium",
    start: "Germany",
    end: "Italy",
    optimalPath: ["Germany", "Austria", "Italy"],
    guesses: [{ country: "Austria", quality: "gold", isProgress: true }],
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

  it("counts a won game with extra (valid but unnecessary) steps as played but not perfect", () => {
    const games = {
      a: makeGame({
        optimalPath: ["Germany", "Austria", "Italy"], // 1 intermediate step
        // Both Switzerland and Austria are real, equally-short ("gold")
        // branches between Germany and Italy — guessing both instead of
        // just the one actually needed still wins, but uses 2 steps
        // against an optimal of 1.
        guesses: [
          { country: "Switzerland", quality: "gold", isProgress: true },
          { country: "Austria", quality: "gold", isProgress: true },
        ],
      }),
    };
    const stats = computeStats(games);
    expect(stats.totalPlayed).toBe(1);
    expect(stats.perfectSolves).toBe(0);
    expect(stats.averageStepsOverOptimal).toBe(2);
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

describe("computeQualityDistribution", () => {
  it("returns all-zero counts for an empty collection", () => {
    expect(computeQualityDistribution({})).toEqual({ gold: 0, green: 0, orange: 0, red: 0 });
  });

  it("tallies every guess across every game, including in-progress ones", () => {
    const games = {
      a: makeGame({
        isWon: false,
        guesses: [
          { country: "Austria", quality: "gold", isProgress: true },
          { country: "Poland", quality: "orange", isProgress: false },
        ],
      }),
      b: makeGame({
        guesses: [
          { country: "Switzerland", quality: "gold", isProgress: true },
          { country: "Czech Republic", quality: "green", isProgress: true },
          { country: "USA", quality: "red", isProgress: false },
        ],
      }),
    };
    expect(computeQualityDistribution(games)).toEqual({ gold: 2, green: 1, orange: 1, red: 1 });
  });
});

describe("computeHistory", () => {
  const today = "2026-01-10";

  it("returns `days` entries ending at today, oldest first, all 'none' for an empty collection", () => {
    const history = computeHistory({}, today, 5);
    expect(history.map((entry) => entry.date)).toEqual([
      "2026-01-06",
      "2026-01-07",
      "2026-01-08",
      "2026-01-09",
      "2026-01-10",
    ]);
    expect(history.every((entry) => entry.status === "none")).toBe(true);
  });

  it("defaults to 10 days when `days` is omitted", () => {
    expect(computeHistory({}, today)).toHaveLength(10);
  });

  it("marks a day 'perfect' if any difficulty was a perfect solve that day", () => {
    const games = { [gameKey(today, "easy" as Difficulty)]: makeGame({ date: today, difficulty: "easy" }) };
    const history = computeHistory(games, today, 3);
    expect(history[history.length - 1]).toEqual({ date: today, status: "perfect" });
  });

  it("marks a day 'good' if won but not a perfect solve (and no other difficulty was perfect)", () => {
    const games = {
      [gameKey(today, "easy" as Difficulty)]: makeGame({
        date: today,
        difficulty: "easy",
        optimalPath: ["Germany", "Austria", "Italy"],
        guesses: [
          { country: "Switzerland", quality: "gold", isProgress: true },
          { country: "Austria", quality: "gold", isProgress: true },
        ],
      }),
    };
    const history = computeHistory(games, today, 1);
    expect(history[0]).toEqual({ date: today, status: "good" });
  });

  it("marks a day 'gaveUp' only when nothing was won that day", () => {
    const games = {
      [gameKey(today, "medium" as Difficulty)]: makeGame({
        date: today,
        difficulty: "medium",
        isWon: false,
        isGivenUp: true,
        guesses: [],
      }),
    };
    const history = computeHistory(games, today, 1);
    expect(history[0]).toEqual({ date: today, status: "gaveUp" });
  });

  it("a perfect solve on one difficulty outranks a give-up on another the same day", () => {
    const games = {
      [gameKey(today, "easy" as Difficulty)]: makeGame({ date: today, difficulty: "easy" }),
      [gameKey(today, "hard" as Difficulty)]: makeGame({
        date: today,
        difficulty: "hard",
        isWon: false,
        isGivenUp: true,
        guesses: [],
      }),
    };
    const history = computeHistory(games, today, 1);
    expect(history[0].status).toBe("perfect");
  });
});
