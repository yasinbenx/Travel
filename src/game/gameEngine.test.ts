import { describe, expect, it } from "vitest";
import { countryAdjacency } from "../data/countryAdjacency";
import { findShortestPath } from "../lib/findShortestPath";
import {
  evaluateGuessQuality,
  generateDailyPuzzle,
  generateDailyPuzzleSet,
  getConfirmedChain,
  giveUp,
  resolveCountryName,
  submitGuess,
  type GameState,
} from "./gameEngine";

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    date: "2026-01-01",
    start: "Germany",
    end: "Italy",
    optimalPath: ["Germany", "Austria", "Italy"],
    guesses: [],
    isWon: false,
    isGivenUp: false,
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

describe("giveUp", () => {
  it("marks an in-progress game as given up, without touching isWon or existing guesses", () => {
    const state = submitGuess(makeState(), "Czech Republic"); // Germany -> Italy, not won yet
    expect(state.isWon).toBe(false);
    const result = giveUp(state);
    expect(result.isGivenUp).toBe(true);
    expect(result.isWon).toBe(false);
    expect(result.guesses).toEqual(state.guesses);
  });

  it("is a no-op once the game is already won", () => {
    const state = submitGuess(makeState({ start: "France", end: "Spain", optimalPath: ["France", "Spain"] }), "Spain");
    expect(state.isWon).toBe(true);
    const result = giveUp(state);
    expect(result).toEqual(state);
    expect(result.isGivenUp).toBe(false);
  });

  it("is a no-op if already given up", () => {
    const state = giveUp(makeState());
    const result = giveUp(state);
    expect(result).toBe(state);
  });

  it("blocks further guesses once given up", () => {
    const state = giveUp(makeState({ start: "France", end: "Spain" }));
    const result = submitGuess(state, "Spain");
    expect(result).toBe(state);
    expect(result.guesses).toEqual([]);
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

  it("grades a real neighbor with a 2-country detour as orange, NEVER red — red is exclusively for non-neighbors", () => {
    // Germany and Poland directly border each other (1 hop) — the best
    // possible remaining distance from Germany is therefore 0. France is a
    // real Germany neighbor, but is 2 hops from Poland (via Germany again),
    // which is 2 more than the best possible remaining distance. A real
    // neighbor can never be red, no matter how bad the detour — only
    // "not a neighbor at all" is red.
    const optimalPath = findShortestPath("Germany", "Poland");
    const state = makeState({ start: "Germany", end: "Poland", optimalPath });

    expect(evaluateGuessQuality(state, "France")).toEqual({
      country: "France",
      quality: "orange",
      isNeighbor: true,
    });
  });

  it("grades a real dead-end neighbor (leads nowhere useful) as orange, never red", () => {
    // Spain directly borders France (1 hop) — best possible remaining
    // distance from Spain is 0. Portugal is a real Spain neighbor, but
    // Portugal's ONLY neighbor is Spain itself (a literal dead end), so
    // it's 2 hops from France (Portugal -> Spain -> France). Still a real
    // neighbor, so still orange, never red.
    const optimalPath = findShortestPath("Spain", "France");
    const state = makeState({ start: "Spain", end: "France", optimalPath });

    expect(evaluateGuessQuality(state, "Portugal")).toEqual({
      country: "Portugal",
      quality: "orange",
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

  it("Germany -> Morocco: guessing the USA (not a neighbor of Germany) is red", () => {
    const state = makeState({ start: "Germany", end: "Morocco", optimalPath: findShortestPath("Germany", "Morocco") });
    expect(evaluateGuessQuality(state, "USA")).toEqual({
      country: "United States",
      quality: "red",
      isNeighbor: false,
    });
  });

  it("Canada -> Panama: guessing India (not a neighbor of Canada) is red", () => {
    const state = makeState({ start: "Canada", end: "Panama", optimalPath: findShortestPath("Canada", "Panama") });
    expect(evaluateGuessQuality(state, "India")).toEqual({
      country: "India",
      quality: "red",
      isNeighbor: false,
    });
  });

  it("never returns red for a real neighbor, across every difficulty and detour size (property check)", () => {
    const pairs: [string, string][] = [
      ["Germany", "Italy"],
      ["Germany", "Poland"],
      ["Spain", "France"],
      ["Denmark", "Italy"],
      ["Morocco", "Germany"],
      ["Canada", "Panama"],
      ["France", "Rwanda"],
    ];

    for (const [start, end] of pairs) {
      const optimalPath = findShortestPath(start, end);
      const state = makeState({ start, end, optimalPath });
      for (const neighbor of countryAdjacency[start] ?? []) {
        const guess = evaluateGuessQuality(state, neighbor);
        expect(guess.isNeighbor).toBe(true);
        expect(guess.quality).not.toBe("red");
      }
    }
  });
});

describe("generateDailyPuzzle / generateDailyPuzzleSet", () => {
  const ranges: Record<"easy" | "medium" | "hard", { min: number; max: number }> = {
    easy: { min: 2, max: 3 },
    medium: { min: 4, max: 6 },
    hard: { min: 7, max: 10 },
  };

  const sampleDates = ["2026-01-01", "2026-03-15", "2026-07-04", "2026-12-25", "2027-02-28"];

  for (const [difficulty, { min, max }] of Object.entries(ranges) as [
    "easy" | "medium" | "hard",
    { min: number; max: number },
  ][]) {
    it(`"${difficulty}" returns a valid country pair with ${min}-${max} intermediate steps, across several dates`, () => {
      for (const date of sampleDates) {
        const { start, end } = generateDailyPuzzle(date, difficulty);
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

  it("is deterministic: the same date and difficulty always returns the same pair", () => {
    for (const date of sampleDates) {
      const first = generateDailyPuzzle(date, "medium");
      const second = generateDailyPuzzle(date, "medium");
      expect(second).toEqual(first);
    }
  });

  it("varies across different dates (not a fixed pair)", () => {
    const pairs = new Set(
      sampleDates.map((date) => {
        const { start, end } = generateDailyPuzzle(date, "medium");
        return `${start}->${end}`;
      }),
    );
    expect(pairs.size).toBeGreaterThan(1);
  });

  it("gives each of the three difficulties a mutually distinct country pair on the same date", () => {
    for (const date of sampleDates) {
      const set = generateDailyPuzzleSet(date);
      const keys = (["easy", "medium", "hard"] as const).map((difficulty) => {
        const { start, end } = set[difficulty];
        return [start, end].sort().join("::");
      });
      expect(new Set(keys).size).toBe(3);
    }
  });

  it("generateDailyPuzzle for a single difficulty matches the value from the full set", () => {
    const date = "2026-05-17";
    const set = generateDailyPuzzleSet(date);
    expect(generateDailyPuzzle(date, "hard")).toEqual(set.hard);
  });
});
