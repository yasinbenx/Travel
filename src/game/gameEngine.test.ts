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

  it("grades a neighbor as red once earlier detours have piled up a 3+ country total detour", () => {
    // Germany -> Poland directly border each other (1 hop). Taking a first
    // detour via France (2 hops from Poland via Germany, +1 country) leaves
    // the chain already 1 country behind pace. A second sideways move from
    // France to Spain (3 hops from Poland) piles on 3 more hops for one more
    // step taken, compounding the total detour to 4 countries -> red, but
    // Spain is still a real neighbor of France, so it still extends the chain.
    const optimalPath = findShortestPath("Germany", "Poland");
    let state = makeState({ start: "Germany", end: "Poland", optimalPath });

    state = submitGuess(state, "France");
    expect(state.guesses[0]).toEqual({ country: "France", quality: "orange", isNeighbor: true });

    state = submitGuess(state, "Spain");
    expect(state.guesses[1]).toEqual({ country: "Spain", quality: "red", isNeighbor: true });
    expect(getConfirmedChain(state)).toEqual(["France", "Spain"]);
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
