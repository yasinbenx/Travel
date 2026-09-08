import { describe, expect, it } from "vitest";
import { findShortestPath } from "../lib/findShortestPath";
import {
  generateDailyPuzzle,
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
  it("erkennt den exakten kanonischen Namen unabhängig von Groß-/Kleinschreibung", () => {
    expect(resolveCountryName("Germany")).toBe("Germany");
    expect(resolveCountryName("germany")).toBe("Germany");
    expect(resolveCountryName("GERMANY")).toBe("Germany");
  });

  it("normalisiert Umlaute", () => {
    expect(resolveCountryName("Ägypten")).toBe("Egypt");
    expect(resolveCountryName("agypten")).toBe("Egypt");
    expect(resolveCountryName("Türkei")).toBe("Turkey");
  });

  it("erkennt USA-Aliase", () => {
    expect(resolveCountryName("USA")).toBe("United States");
    expect(resolveCountryName("United States")).toBe("United States");
    expect(resolveCountryName("Vereinigte Staaten")).toBe("United States");
  });

  it("erkennt UK-Aliase", () => {
    expect(resolveCountryName("UK")).toBe("United Kingdom");
    expect(resolveCountryName("Großbritannien")).toBe("United Kingdom");
    expect(resolveCountryName("Vereinigtes Königreich")).toBe("United Kingdom");
  });

  it("gibt undefined für unbekannte Länder zurück", () => {
    expect(resolveCountryName("Narnia")).toBeUndefined();
    expect(resolveCountryName("")).toBeUndefined();
  });
});

describe("submitGuess", () => {
  it("akzeptiert einen direkten Nachbarn des Starts als korrekten Versuch", () => {
    const state = makeState({ start: "France", end: "Spain", optimalPath: ["France", "Spain"] });
    const result = submitGuess(state, "Spain");
    expect(result.correctGuesses).toEqual(["Spain"]);
    expect(result.wrongGuesses).toEqual([]);
  });

  it("lehnt einen Versuch ab, der kein Nachbar ist", () => {
    const state = makeState({ start: "Germany", end: "Italy" });
    const result = submitGuess(state, "Japan");
    expect(result.correctGuesses).toEqual([]);
    expect(result.wrongGuesses).toEqual(["Japan"]);
    expect(result.isWon).toBe(false);
  });

  it("gewinnt im ersten Zug, wenn der Versuch direkt an das Ziel grenzt (Germany -> Austria -> Italy)", () => {
    const state = makeState({ start: "Germany", end: "Italy", optimalPath: ["Germany", "Austria", "Italy"] });
    const result = submitGuess(state, "Austria");
    expect(result.correctGuesses).toEqual(["Austria"]);
    expect(result.isWon).toBe(true);
  });

  it("gewinnt, wenn direkt das Zielland selbst korrekt geraten wird", () => {
    const state = makeState({ start: "Portugal", end: "Spain", optimalPath: ["Portugal", "Spain"] });
    const result = submitGuess(state, "Spain");
    expect(result.correctGuesses).toEqual(["Spain"]);
    expect(result.isWon).toBe(true);
  });

  it("baut die Kette über mehrere korrekte Rateversuche auf, bis das Ziel erreicht wird", () => {
    let state = makeState({
      start: "Portugal",
      end: "Finland",
      optimalPath: findShortestPath("Portugal", "Finland"),
    });
    // Bis einschließlich Poland grenzt noch keiner der Versuche an Finnland.
    for (const guess of ["Spain", "France", "Germany", "Poland"]) {
      state = submitGuess(state, guess);
      expect(state.isWon).toBe(false);
    }
    // Russia grenzt direkt an Finnland -> Sieg, ohne "Finland" selbst zu raten.
    state = submitGuess(state, "Russia");
    expect(state.isWon).toBe(true);
    expect(state.correctGuesses).toEqual(["Spain", "France", "Germany", "Poland", "Russia"]);
  });

  it("ist tolerant gegenüber Groß-/Kleinschreibung, Umlauten und Aliasen", () => {
    let state = makeState({ start: "Germany", end: "Italy" });
    state = submitGuess(state, "österreich");
    expect(state.correctGuesses).toEqual(["Austria"]);
    expect(state.isWon).toBe(true);
  });

  it("behandelt einen unbekannten Ländernamen als falschen Versuch, statt zu werfen", () => {
    const state = makeState({ start: "Germany", end: "Italy" });
    const result = submitGuess(state, "Absurdistan");
    expect(result.wrongGuesses).toEqual(["Absurdistan"]);
    expect(result.correctGuesses).toEqual([]);
  });

  it("wertet einen wiederholten Versuch (bereits korrekt geraten) als falschen Versuch", () => {
    let state = makeState({ start: "Germany", end: "Italy" });
    state = submitGuess(state, "Austria");
    expect(state.isWon).toBe(true);
    // Spiel ist schon gewonnen: State bleibt komplett unverändert
    const afterWin = submitGuess(state, "Switzerland");
    expect(afterWin).toEqual(state);
  });

  it("wertet ein erneutes Raten des Startlandes als falschen Versuch", () => {
    const state = makeState({ start: "Germany", end: "Italy" });
    const result = submitGuess(state, "Germany");
    expect(result.wrongGuesses).toEqual(["Germany"]);
    expect(result.correctGuesses).toEqual([]);
  });

  it("verändert den State bei einem falschen Versuch ansonsten nicht", () => {
    let state = makeState({ start: "Germany", end: "Italy" });
    state = submitGuess(state, "Poland"); // korrekt (Nachbar von Germany, grenzt nicht an Italy)
    expect(state.isWon).toBe(false);
    const before = state;
    const after = submitGuess(state, "Japan"); // falsch (kein Nachbar von Poland)
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

  it("liefert 0, wenn der unmittelbar nächste Schritt im Pfad geraten wird", () => {
    const state = makeState({
      start: "Germany",
      end: "Bosnia and Herzegovina",
      optimalPath: referencePath,
      correctGuesses: ["Austria"],
    });
    expect(getSkippedCount(state, "Slovenia")).toBe(0);
  });

  it("zählt übersprungene Länder, wenn ein weiter entfernter Pfad-Eintrag geraten wird", () => {
    const state = makeState({
      start: "Germany",
      end: "Bosnia and Herzegovina",
      optimalPath: referencePath,
      correctGuesses: ["Austria"],
    });
    // Slovenia und Croatia liegen zwischen Austria und Bosnia and Herzegovina
    expect(getSkippedCount(state, "Bosnia and Herzegovina")).toBe(2);
  });

  it("zählt den Start als erstes korrektes Land beim Überspringen mit", () => {
    const state = makeState({
      start: "Germany",
      end: "Bosnia and Herzegovina",
      optimalPath: referencePath,
      correctGuesses: [],
    });
    // Austria liegt zwischen Germany (Start) und Slovenia
    expect(getSkippedCount(state, "Slovenia")).toBe(1);
  });

  it("liefert 0, wenn der Versuch nicht Teil des Referenzpfads ist", () => {
    const state = makeState({
      start: "Germany",
      end: "Bosnia and Herzegovina",
      optimalPath: referencePath,
      correctGuesses: ["Austria"],
    });
    expect(getSkippedCount(state, "France")).toBe(0);
  });

  it("liefert 0, wenn das zuletzt korrekte Land nicht im Referenzpfad vorkommt", () => {
    const state = makeState({
      start: "Germany",
      end: "Bosnia and Herzegovina",
      optimalPath: referencePath,
      correctGuesses: ["Switzerland"],
    });
    expect(getSkippedCount(state, "Croatia")).toBe(0);
  });

  it("liefert 0 (statt negativ) bei einem Rückwärtsschritt im Pfad", () => {
    const state = makeState({
      start: "Germany",
      end: "Bosnia and Herzegovina",
      optimalPath: referencePath,
      correctGuesses: ["Croatia"],
    });
    expect(getSkippedCount(state, "Austria")).toBe(0);
  });

  it("ist ebenfalls alias-/groß-kleinschreibungstolerant", () => {
    const state = makeState({
      start: "Germany",
      end: "Bosnia and Herzegovina",
      optimalPath: referencePath,
      correctGuesses: [],
    });
    expect(getSkippedCount(state, "slovenia")).toBe(1);
  });
});

describe("generateDailyPuzzle", () => {
  it("ist deterministisch für denselben Seed", () => {
    const a = generateDailyPuzzle("2026-09-08");
    const b = generateDailyPuzzle("2026-09-08");
    expect(a).toEqual(b);
  });

  it("liefert unterschiedliche Seeds tendenziell unterschiedliche Paare", () => {
    const a = generateDailyPuzzle("2026-01-01");
    const b = generateDailyPuzzle("2099-12-31");
    expect(a).not.toEqual(b);
  });

  it("liefert für mehrere Seeds jeweils ein gültiges Länderpaar mit 4-8 Zwischenschritten", () => {
    const seeds = ["2024-01-01", "2025-06-15", "2026-09-08", "puzzle-seed", "42"];
    for (const seed of seeds) {
      const { start, end } = generateDailyPuzzle(seed);
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
});
