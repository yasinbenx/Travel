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
  /** Calendar date ("YYYY-MM-DD", browser-local) this daily puzzle belongs to. */
  date: string;
  difficulty: Difficulty;
  start: string;
  end: string;
  optimalPath: string[];
  guesses: Guess[];
  isWon: boolean;
  /** True once the player gives up on this round — distinct from `isWon`; never counts as a perfect solve. */
  isGivenUp: boolean;
};

export type Difficulty = "easy" | "medium" | "hard";

/** Range of intermediate steps (`optimalPath.length - 2`) allowed for each difficulty. */
const DIFFICULTY_INTERMEDIATE_STEPS: Record<Difficulty, { min: number; max: number }> = {
  easy: { min: 2, max: 3 },
  medium: { min: 4, max: 6 },
  hard: { min: 7, max: 10 },
};

/** Display label for each difficulty, shared by the start screen, in-game badge, and share text. */
export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};


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
 * Grades a single guess against the last confirmed country. The
 * isNeighbor check comes FIRST and is the only thing that can ever
 * produce "red":
 *
 * 1. Not a real, recognized country, or not a direct land-border
 *    neighbor of the last confirmed country AT ALL -> "red",
 *    `isNeighbor: false`, no distance computation needed. This is the
 *    ONLY way to get red — a completely unconnected guess (e.g. the USA
 *    on a Germany -> Morocco route), regardless of how far off it is.
 *    Doesn't extend the chain.
 * 2. A real neighbor: NEVER red, no matter how bad. Graded purely on
 *    this one step, by comparing the guess's own fresh BFS distance to
 *    the target against the theoretically best possible remaining
 *    distance after any optimal step from the last confirmed country
 *    (`BFS(lastConfirmed, target) - 1`) — a fresh graph computation each
 *    time, not a lookup against the exact position in the original
 *    reference path, so an equally-short alternative branch is never
 *    mistaken for a detour merely because it isn't the one specific
 *    country the reference path happened to pick next.
 *      - 0 extra -> "gold" (matches the reference path's next step) or
 *        "green" (an equally short alternative, e.g. Austria vs
 *        Switzerland).
 *      - 1+ extra -> "orange". For a real neighbor this is normally 1
 *        (never 2+, per the BFS triangle inequality), but a dead-end
 *        neighbor is still graded "orange", never "red" — red is
 *        reserved exclusively for non-neighbors (step 1).
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
  const distanceFromLastConfirmed = distancesToTarget.get(lastConfirmed) ?? Number.POSITIVE_INFINITY;
  const bestPossibleRemainingDistance = distanceFromLastConfirmed - 1;
  const detour = distanceFromGuess - bestPossibleRemainingDistance;

  if (detour <= 0) {
    const lastIndex = state.optimalPath.indexOf(lastConfirmed);
    const referenceNextStep = lastIndex >= 0 ? state.optimalPath[lastIndex + 1] : undefined;
    return {
      country: resolved,
      quality: resolved === referenceNextStep ? "gold" : "green",
      isNeighbor: true,
    };
  }

  // Any real neighbor with a detour, however large, is "orange" — never
  // "red". Red is reserved exclusively for the non-neighbor case above.
  return { country: resolved, quality: "orange", isNeighbor: true };
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
  if (state.isWon || state.isGivenUp) {
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

/**
 * Marks the round as given up: the player chose to see the solution
 * instead of finishing it. Distinct from `isWon` — a given-up round
 * still ends the day's attempt at this difficulty (no further guesses
 * accepted, and it can never be started over as "new"), but never
 * counts as a win or a perfect solve in stats. If the round is already
 * finished (won or given up), returns state unchanged.
 */
export function giveUp(state: GameState): GameState {
  if (state.isWon || state.isGivenUp) {
    return state;
  }
  return { ...state, isGivenUp: true };
}

// ---------------------------------------------------------------------
// Daily puzzle generation
// ---------------------------------------------------------------------

/** Simple string hash (32-bit) used to turn a seed string into a PRNG seed. */
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(hash, 31) + seed.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

/** Deterministic PRNG (mulberry32); returns numbers in [0, 1). */
function mulberry32(seed: number): () => number {
  let state = seed;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pairKey(pair: { start: string; end: string }): string {
  return [pair.start, pair.end].sort().join("::");
}

/**
 * Deterministically picks a country pair for `seed` whose shortest land
 * route has an intermediate-country count within `range`, skipping any
 * pair already in `excludePairKeys` (see {@link generateDailyPuzzleSet}).
 */
function generateDeterministicPuzzle(
  seed: string,
  range: { min: number; max: number },
  excludePairKeys: Set<string>,
): { start: string; end: string } {
  const countries = Object.keys(countryAdjacency).sort();
  const rng = mulberry32(hashSeed(seed));
  const n = countries.length;
  const maxAttempts = n * n * 4;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const startIndex = Math.floor(rng() * n);
    const endIndex = Math.floor(rng() * n);
    if (startIndex === endIndex) continue;

    const start = countries[startIndex];
    const end = countries[endIndex];
    const path = findShortestPath(start, end);
    if (path.length === 0) continue; // no land connection (e.g. islands)

    const intermediateSteps = path.length - 2;
    if (intermediateSteps < range.min || intermediateSteps > range.max) continue;

    const pair = { start, end };
    if (excludePairKeys.has(pairKey(pair))) continue;
    return pair;
  }

  throw new Error(`Could not find a suitable country pair for seed "${seed}"`);
}

/**
 * Generates all three of `date`'s daily puzzles (easy/medium/hard) at
 * once, guaranteeing the three country pairs are mutually distinct —
 * each difficulty is seeded from `${date}:${difficulty}`, and every
 * later difficulty in the easy -> medium -> hard order excludes the
 * pairs already picked for that same date.
 */
export function generateDailyPuzzleSet(date: string): Record<Difficulty, { start: string; end: string }> {
  const usedPairKeys = new Set<string>();
  const result = {} as Record<Difficulty, { start: string; end: string }>;

  for (const difficulty of ["easy", "medium", "hard"] as const) {
    const pair = generateDeterministicPuzzle(
      `${date}:${difficulty}`,
      DIFFICULTY_INTERMEDIATE_STEPS[difficulty],
      usedPairKeys,
    );
    result[difficulty] = pair;
    usedPairKeys.add(pairKey(pair));
  }

  return result;
}

/**
 * The single country pair for `date`'s daily puzzle at `difficulty` —
 * deterministic (same input always yields the same pair), so every
 * player sees the identical puzzle for a given calendar date and
 * difficulty, with no daily seed re-roll on repeat visits.
 */
export function generateDailyPuzzle(
  date: string,
  difficulty: Difficulty,
): { start: string; end: string } {
  return generateDailyPuzzleSet(date)[difficulty];
}
