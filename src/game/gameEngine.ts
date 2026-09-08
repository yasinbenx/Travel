import { countryAdjacency } from "../data/countryAdjacency";
import { computeDistancesFrom, findShortestPath } from "../lib/findShortestPath";
import { countryAliases } from "./countryAliases";

export type GuessQuality = "gold" | "green" | "orange" | "red";

export type Guess = {
  /** Canonical country name, or the raw trimmed input if it couldn't be resolved to one. */
  country: string;
  quality: GuessQuality;
  /** Whether this guess is a real land-border neighbor of the country before it in the chain. */
  isNeighbor: boolean;
};

export type GameState = {
  start: string;
  end: string;
  optimalPath: string[];
  guesses: Guess[];
  isWon: boolean;
};

const MIN_INTERMEDIATE_STEPS = 4;
const MAX_INTERMEDIATE_STEPS = 8;

/** A neighbor guess that lengthens the route by this many countries or fewer is "orange"; more is "red". */
const MAX_ORANGE_DETOUR = 2;

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

// ---------------------------------------------------------------------
// Guess chain helpers
// ---------------------------------------------------------------------

/**
 * The chain of countries that actually count as progress: every guess
 * that was a real land-border neighbor of the country before it, in
 * order. A guess that wasn't a neighbor at all (however far off) is
 * still shown on the map and in the guess list, but doesn't extend this
 * chain — the player keeps guessing from wherever it currently ends.
 */
export function getConfirmedChain(state: GameState): string[] {
  return state.guesses.filter((guess) => guess.isNeighbor).map((guess) => guess.country);
}

function getLastConfirmedCountry(state: GameState): string {
  const chain = getConfirmedChain(state);
  return chain.length > 0 ? chain[chain.length - 1] : state.start;
}

// ---------------------------------------------------------------------
// Guess quality
// ---------------------------------------------------------------------

/**
 * Grades a single guess against the last confirmed country:
 *
 * - Not a real, recognized country, or not a direct land-border neighbor
 *   of the last confirmed country at all -> "red", `isNeighbor: false`.
 *   This covers both a near-miss and a wildly distant guess (e.g. the
 *   USA on a Morocco -> Germany route) equally — neither is a valid next
 *   step, so neither extends the chain.
 * - A real neighbor: graded by how much longer the total route becomes
 *   if this guess is taken, compared to the shortest possible route
 *   overall (`state.optimalPath`). 0 extra countries -> "gold" (matches
 *   the original reference path's next step) or "green" (an equally
 *   short alternative route); 1-2 extra -> "orange"; 3+ extra -> "red"
 *   (but still `isNeighbor: true`, so it still extends the chain — a bad
 *   move can still be a valid one).
 */
export function evaluateGuessQuality(state: GameState, guessInput: string): Guess {
  const resolved = resolveCountryName(guessInput);
  const country = resolved ?? guessInput.trim();

  if (!resolved) {
    return { country, quality: "red", isNeighbor: false };
  }

  const lastConfirmed = getLastConfirmedCountry(state);
  const isNeighbor = (countryAdjacency[lastConfirmed] ?? []).includes(resolved);

  if (!isNeighbor) {
    return { country: resolved, quality: "red", isNeighbor: false };
  }

  const distancesToTarget = computeDistancesFrom(state.end);
  const distanceFromGuess = distancesToTarget.get(resolved) ?? Number.POSITIVE_INFINITY;
  const stepsSoFar = getConfirmedChain(state).length;
  const optimalTotalSteps = state.optimalPath.length - 1;
  const projectedTotalSteps = stepsSoFar + 1 + distanceFromGuess;
  const detour = projectedTotalSteps - optimalTotalSteps;

  if (detour <= 0) {
    const lastIndex = state.optimalPath.indexOf(lastConfirmed);
    const referenceNextStep = lastIndex >= 0 ? state.optimalPath[lastIndex + 1] : undefined;
    return {
      country: resolved,
      quality: resolved === referenceNextStep ? "gold" : "green",
      isNeighbor: true,
    };
  }

  return {
    country: resolved,
    quality: detour <= MAX_ORANGE_DETOUR ? "orange" : "red",
    isNeighbor: true,
  };
}

// ---------------------------------------------------------------------
// Core game logic
// ---------------------------------------------------------------------

/**
 * Processes a guess: every guess — even a wildly wrong one — is recorded
 * and graded (see {@link evaluateGuessQuality}), shown on the map and in
 * the guess list. Only guesses that are real neighbors of the last
 * confirmed country extend the confirmed chain and can win the round; a
 * non-neighbor guess is simply logged without changing anything else.
 *
 * A confirmed guess that itself borders the target country (or is the
 * target itself) wins the game.
 *
 * If the game is already won, the state is returned unchanged.
 */
export function submitGuess(state: GameState, guessInput: string): GameState {
  if (state.isWon) {
    return state;
  }

  const guess = evaluateGuessQuality(state, guessInput);
  const guesses = [...state.guesses, guess];

  if (!guess.isNeighbor) {
    return { ...state, guesses };
  }

  const neighborsOfGuess = countryAdjacency[guess.country] ?? [];
  const isWon = guess.country === state.end || neighborsOfGuess.includes(state.end);

  return { ...state, guesses, isWon };
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
