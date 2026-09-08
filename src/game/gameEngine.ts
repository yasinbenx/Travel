import { countryAdjacency } from "../data/countryAdjacency";
import { findShortestPath } from "../lib/findShortestPath";
import { countryAliases } from "./countryAliases";

export type GameState = {
  start: string;
  end: string;
  optimalPath: string[];
  correctGuesses: string[];
  wrongGuesses: string[];
  isWon: boolean;
};

const MIN_INTERMEDIATE_STEPS = 4;
const MAX_INTERMEDIATE_STEPS = 8;

// ---------------------------------------------------------------------
// Namens-Normalisierung / Alias-Auflösung
// ---------------------------------------------------------------------

/**
 * Normalisiert einen Ländernamen für tolerante Vergleiche: Groß-/
 * Kleinschreibung, Umlaute/Akzente sowie Satzzeichen spielen keine Rolle
 * mehr. Wird sowohl von `resolveCountryName` als auch von der
 * Autocomplete-Suche im UI genutzt, damit beide konsistent matchen.
 */
export function normalize(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Umlaute/Akzente entfernen (nach NFD-Zerlegung)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const normalizedNameToCanonical = new Map<string, string>();
for (const canonicalName of Object.keys(countryAdjacency)) {
  normalizedNameToCanonical.set(normalize(canonicalName), canonicalName);
}
for (const [alias, canonicalName] of Object.entries(countryAliases)) {
  normalizedNameToCanonical.set(normalize(alias), canonicalName);
}

/**
 * Löst eine (möglicherweise ungenau geschriebene) Länder-Eingabe auf den
 * kanonischen Ländernamen aus `countryAdjacency` auf. Ignoriert dabei
 * Groß-/Kleinschreibung, Umlaute/Akzente und erkennt gängige Aliase
 * (z.B. "USA", "Großbritannien"). Gibt `undefined` zurück, wenn der Name
 * nicht erkannt wird.
 */
export function resolveCountryName(input: string): string | undefined {
  return normalizedNameToCanonical.get(normalize(input));
}

function getLastCorrectCountry(state: GameState): string {
  return state.correctGuesses.length > 0
    ? state.correctGuesses[state.correctGuesses.length - 1]
    : state.start;
}

// ---------------------------------------------------------------------
// Kern-Spiellogik
// ---------------------------------------------------------------------

/**
 * Verarbeitet einen Rateversuch. Ein Versuch ist korrekt, wenn er sich zu
 * einem bekannten Land auflösen lässt UND ein direkter Landnachbar des
 * zuletzt korrekt geratenen Landes ist (der Start zählt dabei als erstes
 * korrektes Land). Ein korrekter Versuch, der seinerseits an das Zielland
 * grenzt (oder das Zielland selbst ist), gewinnt das Spiel.
 *
 * Ist das Spiel bereits gewonnen, wird der State unverändert zurückgegeben.
 */
export function submitGuess(state: GameState, guess: string): GameState {
  if (state.isWon) {
    return state;
  }

  const resolved = resolveCountryName(guess);

  if (!resolved) {
    return { ...state, wrongGuesses: [...state.wrongGuesses, guess] };
  }

  const alreadyGuessed =
    resolved === state.start || state.correctGuesses.includes(resolved);
  if (alreadyGuessed) {
    return { ...state, wrongGuesses: [...state.wrongGuesses, resolved] };
  }

  const lastCorrect = getLastCorrectCountry(state);
  const neighborsOfLastCorrect = countryAdjacency[lastCorrect] ?? [];

  if (!neighborsOfLastCorrect.includes(resolved)) {
    return { ...state, wrongGuesses: [...state.wrongGuesses, resolved] };
  }

  const correctGuesses = [...state.correctGuesses, resolved];
  const neighborsOfGuess = countryAdjacency[resolved] ?? [];
  const isWon = resolved === state.end || neighborsOfGuess.includes(state.end);

  return { ...state, correctGuesses, isWon };
}

/**
 * Gibt an, wie viele Länder im REFERENZ-Optimalpfad (`state.optimalPath`)
 * zwischen dem zuletzt korrekt geratenen Land und `guess` liegen, falls
 * `guess` weiter vorne im Pfad liegt als der unmittelbar nächste Schritt.
 *
 * Arbeitet rein über die Positionen in `optimalPath` (nicht über eine
 * erneute Graph-Traversierung) und prüft NICHT, ob `guess` tatsächlich
 * ein gültiger Nachbar ist — das übernimmt `submitGuess`. Ist eines der
 * beiden Länder nicht Teil von `optimalPath` (z.B. weil der Spieler über
 * eine alternative, nicht im Referenzpfad enthaltene Route gelaufen ist),
 * wird 0 zurückgegeben, da sich ein Überspringen dann nicht sinnvoll
 * gegenüber diesem Referenzpfad bestimmen lässt.
 */
export function getSkippedCount(state: GameState, guess: string): number {
  const resolved = resolveCountryName(guess) ?? guess;
  const lastCorrect = getLastCorrectCountry(state);

  const lastIndex = state.optimalPath.indexOf(lastCorrect);
  const guessIndex = state.optimalPath.indexOf(resolved);

  if (lastIndex === -1 || guessIndex === -1) {
    return 0;
  }

  return Math.max(0, guessIndex - lastIndex - 1);
}

// ---------------------------------------------------------------------
// Deterministisches Tagesrätsel
// ---------------------------------------------------------------------

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(hash, 31) + seed.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

/** Deterministischer PRNG (mulberry32), liefert Zahlen in [0, 1). */
function mulberry32(seed: number): () => number {
  let state = seed;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Wählt deterministisch (basierend auf `seed`, z.B. dem heutigen Datum)
 * ein Länderpaar aus, dessen kürzester Landweg zwischen
 * {@link MIN_INTERMEDIATE_STEPS} und {@link MAX_INTERMEDIATE_STEPS}
 * Zwischenländer hat (also `optimalPath.length - 2`, ohne Start und Ziel
 * selbst zu zählen).
 */
export function generateDailyPuzzle(seed: string): { start: string; end: string } {
  const countries = Object.keys(countryAdjacency).sort();
  const rng = mulberry32(hashSeed(seed));
  const n = countries.length;
  const maxAttempts = n * n;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const startIndex = Math.floor(rng() * n);
    const endIndex = Math.floor(rng() * n);
    if (startIndex === endIndex) continue;

    const start = countries[startIndex];
    const end = countries[endIndex];
    const path = findShortestPath(start, end);
    if (path.length === 0) continue; // keine Landverbindung (z.B. Inseln)

    const intermediateSteps = path.length - 2;
    if (
      intermediateSteps >= MIN_INTERMEDIATE_STEPS &&
      intermediateSteps <= MAX_INTERMEDIATE_STEPS
    ) {
      return { start, end };
    }
  }

  throw new Error(`Konnte für Seed "${seed}" kein passendes Länderpaar finden`);
}
