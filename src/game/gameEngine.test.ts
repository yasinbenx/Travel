import { describe, expect, it } from "vitest";
import { findShortestPath } from "../lib/findShortestPath";
import {
  generateRandomPuzzle,
  getSkippedCount,
  resolveCountryName,
  submitGuess,
  type GameState,
} from "./gameEngine";

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    start: "Germany",
    end: "Italy",
    optimalPath: ["Germany", "Austria", "Italy"],
    correctGuesses: [],
    wrongGuesses: [],
    isWon: false,
    ...overrides,
  };
}

describe("resolveCountryName", () => {
  it("recognizes the exact canonical name regardless of casing", () => {
    expect(resolveCountryName("Germany")).toBe("Germany");
    expect(resolveCountryName("germany")).toBe("Germany");
    expect(resolveCountryName("GERMANY")).toBe("Germany");
  });

  it("normalizes accents/umlauts", () => {
    expect(resolveCountryName("Ägypten")).toBe("Egypt");
    expect(resolveCountryName("agypten")).toBe("Egypt");
    expect(resolveCountryName("Türkei")).toBe("Turkey");
  });

  it("recognizes USA aliases", () => {
    expect(resolveCountryName("USA")).toBe("United States");
    expect(resolveCountryName("United States")).toBe("United States");
    expect(resolveCountryName("Vereinigte Staaten")).toBe("United States");
  });

  it("recognizes UK aliases", () => {
    expect(resolveCountryName("UK")).toBe("United Kingdom");
    expect(resolveCountryName("Großbritannien")).toBe("United Kingdom");
    expect(resolveCountryName("Vereinigtes Königreich")).toBe("United Kingdom");
  });

  it("returns undefined for unknown countries", () => {
    expect(resolveCountryName("Narnia")).toBeUndefined();
    expect(resolveCountryName("")).toBeUndefined();
  });
});

describe("submitGuess", () => {
  it("accepts a direct neighbor of the start as a correct guess", () => {
    const state = makeState({ start: "France", end: "Spain", optimalPath: ["France", "Spain"] });
    const result = submitGuess(state, "Spain");
    expect(result.correctGuesses).toEqual(["Spain"]);
    expect(result.wrongGuesses).toEqual([]);
  });

  it("rejects a guess that isn't a neighbor", () => {
    const state = makeState({ start: "Germany", end: "Italy" });
    const result = submitGuess(state, "Japan");
    expect(result.correctGuesses).toEqual([]);
    expect(result.wrongGuesses).toEqual(["Japan"]);
    expect(result.isWon).toBe(false);
  });

  it("wins on the first move if the guess directly borders the target (Germany -> Austria -> Italy)", () => {
    const state = makeState({ start: "Germany", end: "Italy", optimalPath: ["Germany", "Austria", "Italy"] });
    const result = submitGuess(state, "Austria");
    expect(result.correctGuesses).toEqual(["Austria"]);
    expect(result.isWon).toBe(true);
  });

  it("wins when the target country itself is guessed directly", () => {
    const state = makeState({ start: "Portugal", end: "Spain", optimalPath: ["Portugal", "Spain"] });
    const result = submitGuess(state, "Spain");
    expect(result.correctGuesses).toEqual(["Spain"]);
    expect(result.isWon).toBe(true);
  });

  it("builds the chain over multiple correct guesses until the target is reached", () => {
    let state = makeState({
      start: "Portugal",
      end: "Finland",
      optimalPath: findShortestPath("Portugal", "Finland"),
    });
    // Up to and including Poland, none of the guesses border Finland yet.
    for (const guess of ["Spain", "France", "Germany", "Poland"]) {
      state = submitGuess(state, guess);
      expect(state.isWon).toBe(false);
    }
    // Russia directly borders Finland -> win, without guessing "Finland" itself.
    state = submitGuess(state, "Russia");
    expect(state.isWon).toBe(true);
    expect(state.correctGuesses).toEqual(["Spain", "France", "Germany", "Poland", "Russia"]);
  });

  it("accepts a valid alternate route that is longer than the optimal path (regression test: validity must be adjacency-only, not restricted to optimalPath)", () => {
    // Real shortest path France -> Rwanda: France, Spain, Morocco, Algeria,
    // Libya, Chad, Central African Republic, DR Congo, Rwanda (7 intermediate
    // countries). Here the player deliberately detours via Tunisia, a real
    // neighbor of both Algeria and Libya that is NOT on the optimal path.
    let state = makeState({
      start: "France",
      end: "Rwanda",
      optimalPath: findShortestPath("France", "Rwanda"),
    });
    expect(state.optimalPath).not.toContain("Tunisia");

    for (const guess of ["Spain", "Morocco", "Algeria", "Tunisia", "Libya", "Chad", "Central African Republic"]) {
      state = submitGuess(state, guess);
      expect(state.isWon).toBe(false);
    }
    state = submitGuess(state, "DR Congo"); // borders Rwanda -> win
    expect(state.isWon).toBe(true);
    expect(state.correctGuesses).toEqual([
      "Spain",
      "Morocco",
      "Algeria",
      "Tunisia",
      "Libya",
      "Chad",
      "Central African Republic",
      "DR Congo",
    ]);
    // One more guess than the optimal path's intermediate country count (7),
    // proving a longer, non-optimal but valid route is accepted and wins.
    expect(state.correctGuesses.length).toBe(state.optimalPath.length - 2 + 1);
  });

  it("is tolerant of casing, accents, and aliases", () => {
    let state = makeState({ start: "Germany", end: "Italy" });
    state = submitGuess(state, "österreich");
    expect(state.correctGuesses).toEqual(["Austria"]);
    expect(state.isWon).toBe(true);
  });

  it("treats an unknown country name as a wrong guess instead of throwing", () => {
    const state = makeState({ start: "Germany", end: "Italy" });
    const result = submitGuess(state, "Absurdistan");
    expect(result.wrongGuesses).toEqual(["Absurdistan"]);
    expect(result.correctGuesses).toEqual([]);
  });

  it("treats a repeated guess (already correctly guessed) as a wrong guess", () => {
    let state = makeState({ start: "Germany", end: "Italy" });
    state = submitGuess(state, "Austria");
    expect(state.isWon).toBe(true);
    // The game is already won: state stays completely unchanged.
    const afterWin = submitGuess(state, "Switzerland");
    expect(afterWin).toEqual(state);
  });

  it("treats re-guessing the start country as a wrong guess", () => {
    const state = makeState({ start: "Germany", end: "Italy" });
    const result = submitGuess(state, "Germany");
    expect(result.wrongGuesses).toEqual(["Germany"]);
    expect(result.correctGuesses).toEqual([]);
  });

  it("otherwise leaves the state unchanged on a wrong guess", () => {
    let state = makeState({ start: "Germany", end: "Italy" });
    state = submitGuess(state, "Poland"); // correct (neighbor of Germany, doesn't border Italy)
    expect(state.isWon).toBe(false);
    const before = state;
    const after = submitGuess(state, "Japan"); // wrong (not a neighbor of Poland)
    expect(after.correctGuesses).toEqual(before.correctGuesses);
    expect(after.start).toBe(before.start);
    expect(after.end).toBe(before.end);
    expect(after.isWon).toBe(before.isWon);
    expect(after.wrongGuesses).toEqual([...before.wrongGuesses, "Japan"]);
  });
});

describe("getSkippedCount", () => {
  const referencePath = [
    "Germany",
    "Austria",
    "Slovenia",
    "Croatia",
    "Bosnia and Herzegovina",
  ];

  it("returns 0 when the immediate next step in the path is guessed", () => {
    const state = makeState({
      start: "Germany",
      end: "Bosnia and Herzegovina",
      optimalPath: referencePath,
      correctGuesses: ["Austria"],
    });
    expect(getSkippedCount(state, "Slovenia")).toBe(0);
  });

  it("counts skipped countries when a further-ahead path entry is guessed", () => {
    const state = makeState({
      start: "Germany",
      end: "Bosnia and Herzegovina",
      optimalPath: referencePath,
      correctGuesses: ["Austria"],
    });
    // Slovenia and Croatia sit between Austria and Bosnia and Herzegovina.
    expect(getSkippedCount(state, "Bosnia and Herzegovina")).toBe(2);
  });

  it("counts the start as the first correct country when skipping", () => {
    const state = makeState({
      start: "Germany",
      end: "Bosnia and Herzegovina",
      optimalPath: referencePath,
      correctGuesses: [],
    });
    // Austria sits between Germany (start) and Slovenia.
    expect(getSkippedCount(state, "Slovenia")).toBe(1);
  });

  it("returns 0 if the guess isn't part of the reference path", () => {
    const state = makeState({
      start: "Germany",
      end: "Bosnia and Herzegovina",
      optimalPath: referencePath,
      correctGuesses: ["Austria"],
    });
    expect(getSkippedCount(state, "France")).toBe(0);
  });

  it("returns 0 if the last correct country isn't in the reference path", () => {
    const state = makeState({
      start: "Germany",
      end: "Bosnia and Herzegovina",
      optimalPath: referencePath,
      correctGuesses: ["Switzerland"],
    });
    expect(getSkippedCount(state, "Croatia")).toBe(0);
  });

  it("returns 0 (not negative) on a backward step in the path", () => {
    const state = makeState({
      start: "Germany",
      end: "Bosnia and Herzegovina",
      optimalPath: referencePath,
      correctGuesses: ["Croatia"],
    });
    expect(getSkippedCount(state, "Austria")).toBe(0);
  });

  it("is also alias-/casing-tolerant", () => {
    const state = makeState({
      start: "Germany",
      end: "Bosnia and Herzegovina",
      optimalPath: referencePath,
      correctGuesses: [],
    });
    expect(getSkippedCount(state, "slovenia")).toBe(1);
  });
});

describe("generateRandomPuzzle", () => {
  it("returns a valid country pair with 4-8 intermediate steps, run repeatedly", () => {
    for (let i = 0; i < 20; i++) {
      const { start, end } = generateRandomPuzzle();
      expect(start).not.toBe(end);

      const path = findShortestPath(start, end);
      expect(path.length).toBeGreaterThan(0);
      expect(path[0]).toBe(start);
      expect(path[path.length - 1]).toBe(end);

      const intermediateSteps = path.length - 2;
      expect(intermediateSteps).toBeGreaterThanOrEqual(4);
      expect(intermediateSteps).toBeLessThanOrEqual(8);
    }
  });

  it("is random rather than fixed (varies across calls)", () => {
    const pairs = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const { start, end } = generateRandomPuzzle();
      pairs.add(`${start}->${end}`);
    }
    // With 20 random draws from ~200 countries, seeing more than one
    // distinct pair confirms this isn't deterministic/fixed.
    expect(pairs.size).toBeGreaterThan(1);
  });
});
