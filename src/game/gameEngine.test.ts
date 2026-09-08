import { describe, expect, it } from "vitest";
import { findShortestPath } from "../lib/findShortestPath";
import {
  evaluateGuessQuality,
  generateRandomPuzzle,
  getConfirmedChain,
  resolveCountryName,
  submitGuess,
  type GameState,
} from "./gameEngine";

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    start: "Germany",
    end: "Italy",
    optimalPath: ["Germany", "Austria", "Italy"],
    guesses: [],
    isWon: false,
    difficulty: "medium",
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

describe("submitGuess: neighbor vs. non-neighbor", () => {
  it("accepts a direct neighbor of the start and extends the confirmed chain", () => {
    const state = makeState({ start: "France", end: "Spain", optimalPath: ["France", "Spain"] });
    const result = submitGuess(state, "Spain");
    expect(getConfirmedChain(result)).toEqual(["Spain"]);
    expect(result.guesses).toEqual([{ country: "Spain", quality: "gold", isNeighbor: true }]);
  });

  it("still shows a non-neighbor guess in the guess list, but doesn't extend the chain", () => {
    const state = makeState({ start: "Germany", end: "Italy" });
    const result = submitGuess(state, "Japan");
    expect(result.guesses).toEqual([{ country: "Japan", quality: "red", isNeighbor: false }]);
    expect(getConfirmedChain(result)).toEqual([]);
    expect(result.isWon).toBe(false);
  });

  it("Morocco -> Germany: guessing the USA shows up as a red, non-neighbor guess and doesn't move the chain off Morocco", () => {
    const optimalPath = findShortestPath("Morocco", "Germany");
    let state = makeState({ start: "Morocco", end: "Germany", optimalPath });
    state = submitGuess(state, "USA");

    expect(state.guesses).toEqual([
      { country: "United States", quality: "red", isNeighbor: false },
    ]);
    expect(getConfirmedChain(state)).toEqual([]);
    expect(state.isWon).toBe(false);

    // The next guess still has to be a real neighbor of Morocco (the chain never moved).
    state = submitGuess(state, "Spain");
    expect(getConfirmedChain(state)).toEqual(["Spain"]);
  });

  it("wins on the first move if the guess directly borders the target (Germany -> Austria -> Italy)", () => {
    const state = makeState({ start: "Germany", end: "Italy", optimalPath: ["Germany", "Austria", "Italy"] });
    const result = submitGuess(state, "Austria");
    expect(getConfirmedChain(result)).toEqual(["Austria"]);
    expect(result.isWon).toBe(true);
  });

  it("wins when the target country itself is guessed directly", () => {
    const state = makeState({ start: "Portugal", end: "Spain", optimalPath: ["Portugal", "Spain"] });
    const result = submitGuess(state, "Spain");
    expect(getConfirmedChain(result)).toEqual(["Spain"]);
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
    expect(getConfirmedChain(state)).toEqual(["Spain", "France", "Germany", "Poland", "Russia"]);
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
      expect(state.guesses[state.guesses.length - 1].isNeighbor).toBe(true);
    }
    state = submitGuess(state, "DR Congo"); // borders Rwanda -> win
    expect(state.isWon).toBe(true);
    expect(getConfirmedChain(state)).toEqual([
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
    expect(getConfirmedChain(state).length).toBe(state.optimalPath.length - 2 + 1);
  });

  it("is tolerant of casing, accents, and aliases", () => {
    let state = makeState({ start: "Germany", end: "Italy" });
    state = submitGuess(state, "österreich");
    expect(getConfirmedChain(state)).toEqual(["Austria"]);
    expect(state.isWon).toBe(true);
  });

  it("treats an unrecognized country name as a red, non-neighbor guess instead of throwing", () => {
    const state = makeState({ start: "Germany", end: "Italy" });
    const result = submitGuess(state, "Absurdistan");
    expect(result.guesses).toEqual([{ country: "Absurdistan", quality: "red", isNeighbor: false }]);
    expect(getConfirmedChain(result)).toEqual([]);
  });

  it("treats a repeated guess (the game is already won) as a complete no-op", () => {
    let state = makeState({ start: "Germany", end: "Italy" });
    state = submitGuess(state, "Austria");
    expect(state.isWon).toBe(true);
    const afterWin = submitGuess(state, "Switzerland");
    expect(afterWin).toEqual(state);
  });

  it("treats re-guessing the start country as a red, non-neighbor guess (a country isn't its own neighbor)", () => {
    const state = makeState({ start: "Germany", end: "Italy" });
    const result = submitGuess(state, "Germany");
    expect(result.guesses).toEqual([{ country: "Germany", quality: "red", isNeighbor: false }]);
    expect(getConfirmedChain(result)).toEqual([]);
  });

  it("otherwise leaves the confirmed chain unchanged on a non-neighbor guess", () => {
    let state = makeState({ start: "Germany", end: "Italy" });
    state = submitGuess(state, "Poland"); // real neighbor of Germany, doesn't border Italy
    expect(state.isWon).toBe(false);
    const before = state;
    const after = submitGuess(state, "Japan"); // not a neighbor of Poland
    expect(getConfirmedChain(after)).toEqual(getConfirmedChain(before));
    expect(after.start).toBe(before.start);
    expect(after.end).toBe(before.end);
    expect(after.isWon).toBe(before.isWon);
    expect(after.guesses).toEqual([
      ...before.guesses,
      { country: "Japan", quality: "red", isNeighbor: false },
    ]);
  });
});

describe("evaluateGuessQuality", () => {
  it("grades a neighbor that matches the reference optimal path's next step as gold", () => {
    const state = makeState({ start: "Germany", end: "Italy", optimalPath: ["Germany", "Austria", "Italy"] });
    expect(evaluateGuessQuality(state, "Austria")).toEqual({
      country: "Austria",
      quality: "gold",
      isNeighbor: true,
    });
  });

  it("grades a neighbor that keeps the route equally short, but isn't the reference path's next step, as green", () => {
    // Germany -> Italy's real shortest path goes via Austria or Switzerland
    // (both are real Germany neighbors that directly border Italy). Whichever
    // one findShortestPath picked as the reference, the other one is an
    // equally short — but different — next step.
    const optimalPath = findShortestPath("Germany", "Italy");
    const referenceNextStep = optimalPath[1];
    const alternateNeighbor = referenceNextStep === "Austria" ? "Switzerland" : "Austria";

    const state = makeState({ start: "Germany", end: "Italy", optimalPath });
    expect(evaluateGuessQuality(state, alternateNeighbor)).toEqual({
      country: alternateNeighbor,
      quality: "green",
      isNeighbor: true,
    });
  });

  it("grades a neighbor with a 1-2 country detour as orange", () => {
    // Germany -> Italy is 2 hops (via Austria/Switzerland). Czech Republic is
    // a real Germany neighbor, but is itself 2 hops from Italy (via Austria),
    // making this guess 1 country longer than the shortest possible route.
    const optimalPath = findShortestPath("Germany", "Italy");
    const state = makeState({ start: "Germany", end: "Italy", optimalPath });
    expect(evaluateGuessQuality(state, "Czech Republic")).toEqual({
      country: "Czech Republic",
      quality: "orange",
      isNeighbor: true,
    });
  });

  it("grades a neighbor with a 2+ country detour as red, even though it's still a valid, chain-extending move", () => {
    // Germany and Poland directly border each other (1 hop) — the best
    // possible remaining distance from Germany is therefore 0. France is a
    // real Germany neighbor, but is 2 hops from Poland (via Germany again),
    // which is 2 more than the best possible remaining distance -> red.
    // France is still a real neighbor of Germany, so it still extends the
    // chain (isNeighbor: true) — a bad move can still be a valid one.
    const optimalPath = findShortestPath("Germany", "Poland");
    const state = makeState({ start: "Germany", end: "Poland", optimalPath });

    expect(evaluateGuessQuality(state, "France")).toEqual({
      country: "France",
      quality: "red",
      isNeighbor: true,
    });
  });

  it("Denmark -> Italy: guessing Austria or Switzerland right after Germany is graded gold/green, never a 'big detour' red, even though neither is the exact array position originally computed for the missing step", () => {
    // Denmark's only land neighbor is Germany, so Germany is the only
    // possible (and gold) first move. From Germany, Austria and
    // Switzerland are both real neighbors that directly border Italy —
    // equally short alternatives — so guessing either one must never come
    // out as a "big detour", regardless of which one the precomputed
    // reference path happened to pick.
    const optimalPath = findShortestPath("Denmark", "Italy");
    expect(optimalPath).toEqual(["Denmark", "Germany", expect.any(String), "Italy"]);

    let state = makeState({ start: "Denmark", end: "Italy", optimalPath });
    state = submitGuess(state, "Germany");
    expect(state.guesses[0]).toEqual({ country: "Germany", quality: "gold", isNeighbor: true });

    const referenceNextStep = optimalPath[2]; // "Austria" or "Switzerland"

    const austriaResult = submitGuess(state, "Austria");
    expect(austriaResult.guesses[1].isNeighbor).toBe(true);
    expect(austriaResult.guesses[1].quality).toBe(referenceNextStep === "Austria" ? "gold" : "green");

    const switzerlandResult = submitGuess(state, "Switzerland");
    expect(switzerlandResult.guesses[1].isNeighbor).toBe(true);
    expect(switzerlandResult.guesses[1].quality).toBe(
      referenceNextStep === "Switzerland" ? "gold" : "green",
    );
  });

  it("grades a guess that isn't a real neighbor at all as red, regardless of how close or far it is", () => {
    const state = makeState({ start: "Morocco", end: "Germany", optimalPath: findShortestPath("Morocco", "Germany") });
    expect(evaluateGuessQuality(state, "United States")).toEqual({
      country: "United States",
      quality: "red",
      isNeighbor: false,
    });
  });
});

describe("generateRandomPuzzle", () => {
  it("defaults to medium (4-6 intermediate steps) when no difficulty is given", () => {
    for (let i = 0; i < 20; i++) {
      const { start, end } = generateRandomPuzzle();
      const intermediateSteps = findShortestPath(start, end).length - 2;
      expect(intermediateSteps).toBeGreaterThanOrEqual(4);
      expect(intermediateSteps).toBeLessThanOrEqual(6);
    }
  });

  const ranges: Record<"easy" | "medium" | "hard", { min: number; max: number }> = {
    easy: { min: 2, max: 3 },
    medium: { min: 4, max: 6 },
    hard: { min: 7, max: 10 },
  };

  for (const [difficulty, { min, max }] of Object.entries(ranges) as [
    "easy" | "medium" | "hard",
    { min: number; max: number },
  ][]) {
    it(`"${difficulty}" returns a valid country pair with ${min}-${max} intermediate steps, run repeatedly`, () => {
      for (let i = 0; i < 20; i++) {
        const { start, end } = generateRandomPuzzle(difficulty);
        expect(start).not.toBe(end);

        const path = findShortestPath(start, end);
        expect(path.length).toBeGreaterThan(0);
        expect(path[0]).toBe(start);
        expect(path[path.length - 1]).toBe(end);

        const intermediateSteps = path.length - 2;
        expect(intermediateSteps).toBeGreaterThanOrEqual(min);
        expect(intermediateSteps).toBeLessThanOrEqual(max);
      }
    });
  }

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
