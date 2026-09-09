import { describe, expect, it } from "vitest";
import { countryAdjacency } from "../data/countryAdjacency";
import { findShortestPath } from "../lib/findShortestPath";
import {
  evaluateGuessQuality,
  generateDailyPuzzle,
  generateDailyPuzzleSet,
  getValidIntermediateCountries,
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

describe("evaluateGuessQuality: order-independent, start<->target detour grading", () => {
  it("grades any country lying on a shortest start->target route as gold, regardless of which branch it's on", () => {
    // Germany -> Italy's real shortest path goes via Austria OR Switzerland
    // (both real Germany neighbors that directly border Italy) — both are
    // equally valid shortest routes, so both must be gold.
    const state = makeState({ start: "Germany", end: "Italy", optimalPath: findShortestPath("Germany", "Italy") });
    expect(evaluateGuessQuality(state, "Austria")).toEqual({ country: "Austria", quality: "gold", isProgress: true });
    expect(evaluateGuessQuality(state, "Switzerland")).toEqual({
      country: "Switzerland",
      quality: "gold",
      isProgress: true,
    });
  });

  it("Togo -> Mauritania: 'Mali' is gold even though it isn't a direct neighbor of Togo (order-independence)", () => {
    // Optimal route: Togo -> Burkina Faso -> Mali -> Mauritania (3 hops).
    // Mali is 2 hops from Togo and 1 hop from Mauritania: 2 + 1 = 3 = optimal
    // total, so detour == 0 -> gold, even though Mali doesn't border Togo at
    // all and hasn't been "unlocked" by guessing Burkina Faso first.
    const optimalPath = findShortestPath("Togo", "Mauritania");
    expect(optimalPath).toEqual(["Togo", "Burkina Faso", "Mali", "Mauritania"]);

    const state = makeState({ start: "Togo", end: "Mauritania", optimalPath });
    expect(evaluateGuessQuality(state, "Mali")).toEqual({ country: "Mali", quality: "gold", isProgress: true });
  });

  it("grades a one-country detour off the shortest route as green", () => {
    // Germany -> Italy is 2 hops. Czech Republic is a real Germany neighbor,
    // 1 hop from Germany and 2 hops from Italy (via Austria): 1 + 2 = 3,
    // one more than the optimal total of 2 -> green.
    const state = makeState({ start: "Germany", end: "Italy", optimalPath: findShortestPath("Germany", "Italy") });
    expect(evaluateGuessQuality(state, "Czech Republic")).toEqual({
      country: "Czech Republic",
      quality: "green",
      isProgress: true,
    });
  });

  it("grades a 2-3 country detour as orange", () => {
    // Germany and Poland directly border each other (optimal total = 1).
    // France is 1 hop from Germany and 2 hops from Poland (via Germany):
    // 1 + 2 = 3, two more than optimal -> orange.
    const state = makeState({ start: "Germany", end: "Poland", optimalPath: findShortestPath("Germany", "Poland") });
    expect(evaluateGuessQuality(state, "France")).toEqual({ country: "France", quality: "orange", isProgress: false });

    // Spain and France directly border each other (optimal total = 1).
    // Portugal's only neighbor is Spain, so it's 1 hop from Spain and 2 hops
    // from France (via Spain): 1 + 2 = 3, also two more than optimal -> orange.
    const state2 = makeState({ start: "Spain", end: "France", optimalPath: findShortestPath("Spain", "France") });
    expect(evaluateGuessQuality(state2, "Portugal")).toEqual({
      country: "Portugal",
      quality: "orange",
      isProgress: false,
    });
  });

  it("Germany -> Morocco: guessing the USA (no land connection at all) is red", () => {
    const state = makeState({ start: "Germany", end: "Morocco", optimalPath: findShortestPath("Germany", "Morocco") });
    expect(evaluateGuessQuality(state, "USA")).toEqual({ country: "United States", quality: "red", isProgress: false });
  });

  it("Canada -> Panama: guessing India (no land connection at all) is red", () => {
    const state = makeState({ start: "Canada", end: "Panama", optimalPath: findShortestPath("Canada", "Panama") });
    expect(evaluateGuessQuality(state, "India")).toEqual({ country: "India", quality: "red", isProgress: false });
  });

  it("treats an unrecognized country name as red instead of throwing", () => {
    const state = makeState({ start: "Germany", end: "Italy" });
    expect(evaluateGuessQuality(state, "Absurdistan")).toEqual({
      country: "Absurdistan",
      quality: "red",
      isProgress: false,
    });
  });

  it("is tolerant of casing, accents, and aliases", () => {
    const state = makeState({ start: "Germany", end: "Italy" });
    expect(evaluateGuessQuality(state, "österreich")).toEqual({
      country: "Austria",
      quality: "gold",
      isProgress: true,
    });
  });

  it("grading is unaffected by guess order or by which countries were already guessed", () => {
    // Guessing Mali first, or guessing Burkina Faso first, or guessing
    // neither yet — Mali's own grade never changes, since it depends only
    // on the fixed start/end distances, not on prior guesses.
    const optimalPath = findShortestPath("Togo", "Mauritania");
    const empty = makeState({ start: "Togo", end: "Mauritania", optimalPath });
    const afterBurkinaFaso = submitGuess(empty, "Burkina Faso");

    expect(evaluateGuessQuality(empty, "Mali")).toEqual(evaluateGuessQuality(afterBurkinaFaso, "Mali"));
  });
});

describe("submitGuess / win condition: connectivity through valid guesses, independent of order", () => {
  it("Togo -> Mauritania: guessing 'Mali' first is gold, but does NOT win yet (Burkina Faso still missing)", () => {
    const optimalPath = findShortestPath("Togo", "Mauritania");
    const state = makeState({ start: "Togo", end: "Mauritania", optimalPath });

    const afterMali = submitGuess(state, "Mali");
    expect(afterMali.guesses).toEqual([{ country: "Mali", quality: "gold", isProgress: true }]);
    expect(afterMali.isWon).toBe(false);

    const afterBurkinaFaso = submitGuess(afterMali, "Burkina Faso");
    expect(afterBurkinaFaso.guesses[1]).toEqual({ country: "Burkina Faso", quality: "gold", isProgress: true });
    expect(afterBurkinaFaso.isWon).toBe(true);
  });

  it("Togo -> Mauritania: the reverse guessing order (Burkina Faso, then Mali) wins identically", () => {
    const optimalPath = findShortestPath("Togo", "Mauritania");
    const state = makeState({ start: "Togo", end: "Mauritania", optimalPath });

    const afterBurkinaFaso = submitGuess(state, "Burkina Faso");
    expect(afterBurkinaFaso.isWon).toBe(false);

    const afterMali = submitGuess(afterBurkinaFaso, "Mali");
    expect(afterMali.isWon).toBe(true);
  });

  it("a gold guess that isn't connected back to start yet doesn't win, even alone with the target", () => {
    // Guessing only Mali (2 hops from Togo, with Burkina Faso missing)
    // leaves Togo unable to reach Mali or Mauritania through real borders.
    const optimalPath = findShortestPath("Togo", "Mauritania");
    let state = makeState({ start: "Togo", end: "Mauritania", optimalPath });
    state = submitGuess(state, "Mali");
    expect(state.isWon).toBe(false);
    expect(getValidIntermediateCountries(state)).toEqual(["Mali"]);
  });

  it("wins on a single guess when it directly bridges start and target", () => {
    const state = makeState({ start: "Germany", end: "Italy", optimalPath: findShortestPath("Germany", "Italy") });
    const result = submitGuess(state, "Austria");
    expect(result.isWon).toBe(true);
  });

  it("an orange or red guess never contributes to the win condition", () => {
    let state = makeState({ start: "Germany", end: "Italy", optimalPath: findShortestPath("Germany", "Italy") });
    state = submitGuess(state, "Poland"); // orange detour (2), not on any shortest route to Italy
    expect(state.isWon).toBe(false);
    expect(getValidIntermediateCountries(state)).toEqual([]);

    state = submitGuess(state, "USA"); // red, no land connection
    expect(state.isWon).toBe(false);
    expect(getValidIntermediateCountries(state)).toEqual([]);
  });

  it("builds a longer chain (Portugal -> Finland) purely through connectivity, regardless of guess order", () => {
    const optimalPath = findShortestPath("Portugal", "Finland");
    expect(optimalPath).toEqual(["Portugal", "Spain", "France", "Germany", "Poland", "Russia", "Finland"]);

    let state = makeState({ start: "Portugal", end: "Finland", optimalPath });
    // Guess out of order: Germany and Poland first (both gold, but not yet
    // connected all the way back to Portugal).
    state = submitGuess(state, "Germany");
    state = submitGuess(state, "Poland");
    expect(state.isWon).toBe(false);

    // Filling in the remaining gaps (any order) completes the chain.
    state = submitGuess(state, "Russia");
    expect(state.isWon).toBe(false); // Portugal side still disconnected
    state = submitGuess(state, "France");
    expect(state.isWon).toBe(false); // Spain still missing
    state = submitGuess(state, "Spain");
    expect(state.isWon).toBe(true);
  });

  it("a redundant equally-short branch doesn't block winning via the other branch", () => {
    // Both Austria and Switzerland are gold for Germany -> Italy. Guessing
    // the "wrong" one first doesn't prevent winning once the other is found.
    let state = makeState({ start: "Germany", end: "Italy", optimalPath: findShortestPath("Germany", "Italy") });
    state = submitGuess(state, "Switzerland");
    expect(state.isWon).toBe(true); // Switzerland alone already bridges Germany -> Italy
  });

  it("a real neighbor with a small (green) detour doesn't win by itself if it doesn't actually connect to the target", () => {
    let state = makeState({ start: "Germany", end: "Italy", optimalPath: findShortestPath("Germany", "Italy") });
    state = submitGuess(state, "Czech Republic"); // green, but doesn't border Italy
    expect(state.isWon).toBe(false);
    state = submitGuess(state, "Austria"); // now connects Germany -> Austria -> Italy
    expect(state.isWon).toBe(true);
  });

  it("treats a repeated guess after the game is already won as a complete no-op", () => {
    let state = makeState({ start: "Germany", end: "Italy", optimalPath: findShortestPath("Germany", "Italy") });
    state = submitGuess(state, "Austria");
    expect(state.isWon).toBe(true);
    const afterWin = submitGuess(state, "Switzerland");
    expect(afterWin).toEqual(state);
  });

  it("still records a non-neighbor / unreachable guess in the guess list without affecting isWon", () => {
    const state = makeState({ start: "Germany", end: "Italy" });
    const result = submitGuess(state, "Japan");
    expect(result.guesses).toEqual([{ country: "Japan", quality: "red", isProgress: false }]);
    expect(result.isWon).toBe(false);
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
    const state = submitGuess(
      makeState({ start: "Germany", end: "Italy", optimalPath: findShortestPath("Germany", "Italy") }),
      "Austria",
    );
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

describe("evaluateGuessQuality: regression property checks", () => {
  it("never returns red for any country that lies on a shortest start->target route", () => {
    const pairs: [string, string][] = [
      ["Germany", "Italy"],
      ["Germany", "Poland"],
      ["Spain", "France"],
      ["Denmark", "Italy"],
      ["Morocco", "Germany"],
      ["Canada", "Panama"],
      ["France", "Rwanda"],
      ["Togo", "Mauritania"],
    ];

    for (const [start, end] of pairs) {
      const optimalPath = findShortestPath(start, end);
      const state = makeState({ start, end, optimalPath });
      for (const country of optimalPath.slice(1, -1)) {
        const guess = evaluateGuessQuality(state, country);
        expect(guess.quality).toBe("gold");
        expect(guess.isProgress).toBe(true);
      }
    }
  });

  it("marks every guessed country visibly on the map (still recorded) even when it doesn't count as progress", () => {
    const state = makeState({ start: "Germany", end: "Morocco", optimalPath: findShortestPath("Germany", "Morocco") });
    const result = submitGuess(state, "USA");
    expect(result.guesses).toHaveLength(1);
    expect(result.guesses[0].quality).toBe("red");
  });

  it("classifies every real neighbor of a country deep inside Africa consistently: no crash, valid quality for every neighbor", () => {
    const state = makeState({ start: "Togo", end: "Mauritania", optimalPath: findShortestPath("Togo", "Mauritania") });
    for (const neighbor of countryAdjacency["Mali"] ?? []) {
      const guess = evaluateGuessQuality(state, neighbor);
      expect(["gold", "green", "orange", "red"]).toContain(guess.quality);
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
