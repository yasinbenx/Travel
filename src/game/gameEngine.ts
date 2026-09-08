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
// Name normalization / alias resolution
// ---------------------------------------------------------------------

/**
 * Normalizes a country name for tolerant comparisons: casing, accents/
 * umlauts, and punctuation no longer matter. Used by both
 * `resolveCountryName` and the UI's autocomplete search so both match
 * consistently.
 */
export function normalize(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents/umlauts (after NFD decomposition)
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
 * Resolves a (possibly imprecisely typed) country input to the canonical
 * country name used in `countryAdjacency`. Ignores casing and accents/
 * umlauts, and recognizes common aliases (e.g. "USA", "Great Britain").
 * Returns `undefined` if the name isn't recognized.
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
// Core game logic
// ---------------------------------------------------------------------

/**
 * Processes a guess. A guess is correct if it resolves to a known country
 * AND is a direct land-border neighbor of the last correctly guessed
 * country (the start counts as the first correct country) — this is
 * checked purely against the real adjacency graph (`countryAdjacency`),
 * regardless of whether the guess happens to lie on `state.optimalPath`.
 * `optimalPath` is never consulted here; the player is free to take any
 * valid (possibly longer) chain of real neighbors to the target — it's
 * only used afterwards, for comparison, once the round is won.
 *
 * A correct guess that itself borders the target country (or is the
 * target itself) wins the game.
 *
 * If the game is already won, the state is returned unchanged.
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
 * Reports how many countries in the REFERENCE optimal path
 * (`state.optimalPath`) lie between the last correctly guessed country
 * and `guess`, if `guess` sits further ahead in that path than the
 * immediate next step.
 *
 * Works purely off positions within `optimalPath` (not a fresh graph
 * traversal) and does NOT check whether `guess` is actually a valid
 * neighbor — `submitGuess` already handles that. If either country isn't
 * part of `optimalPath` (e.g. because the player took an alternate route
 * not covered by this reference path), this returns 0, since "skipped"
 * isn't meaningfully defined against that reference path in that case.
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

/**
 * Computes, for each guess made so far, how many countries were skipped
 * (see {@link getSkippedCount}). Used both for the per-row display
 * (`GuessList`) and for the emoji grid in the share result
 * (`ResultSummary`), so both use the exact same logic.
 */
export function computeSkipCounts(state: GameState): number[] {
  return state.correctGuesses.map((guess, index) => {
    const stateBeforeThisGuess: GameState = {
      ...state,
      correctGuesses: state.correctGuesses.slice(0, index),
    };
    return getSkippedCount(stateBeforeThisGuess, guess);
  });
}

// ---------------------------------------------------------------------
// Random puzzle generation
// ---------------------------------------------------------------------

/**
 * Picks a random country pair whose shortest land route has between
 * {@link MIN_INTERMEDIATE_STEPS} and {@link MAX_INTERMEDIATE_STEPS}
 * intermediate countries (i.e. `optimalPath.length - 2`, not counting the
 * start and target themselves). Called fresh on every "Play"/"Play
 * again" click — there is no daily seed, every round is a new random
 * pair.
 */
export function generateRandomPuzzle(): { start: string; end: string } {
  const countries = Object.keys(countryAdjacency);
  const n = countries.length;
  const maxAttempts = n * n;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const startIndex = Math.floor(Math.random() * n);
    const endIndex = Math.floor(Math.random() * n);
    if (startIndex === endIndex) continue;

    const start = countries[startIndex];
    const end = countries[endIndex];
    const path = findShortestPath(start, end);
    if (path.length === 0) continue; // no land connection (e.g. islands)

    const intermediateSteps = path.length - 2;
    if (
      intermediateSteps >= MIN_INTERMEDIATE_STEPS &&
      intermediateSteps <= MAX_INTERMEDIATE_STEPS
    ) {
      return { start, end };
    }
  }

  throw new Error("Could not find a suitable country pair for a new puzzle");
}
