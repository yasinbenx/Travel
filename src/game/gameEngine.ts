import { countryAdjacency } from "../data/countryAdjacency";
import { computeDistancesFrom, findShortestPath } from "../lib/findShortestPath";
import { countryAliases } from "./countryAliases";

export type GuessQuality = "gold" | "green" | "orange" | "red";

export type Guess = {
  /** Canonical country name, or the raw trimmed input if it couldn't be resolved to one. */
  country: string;
  quality: GuessQuality;
  /**
   * True for "gold" or "green" guesses only — these count as valid
   * intermediate countries when checking whether start and target are
   * now connected through revealed countries (see
   * {@link checkWinCondition}). "orange"/"red" guesses are still shown
   * on the map and in the guess list, but never contribute to completing
   * the route.
   */
  isProgress: boolean;
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
 * Every country guessed so far that counts as a valid intermediate step
 * (quality "gold" or "green"), in the order it was guessed. Order has no
 * bearing on correctness — see {@link checkWinCondition} — this is
 * purely the list used for step counts and to keep the autocomplete from
 * suggesting an already-confirmed country again.
 */
export function getValidIntermediateCountries(state: GameState): string[] {
  return state.guesses.filter((guess) => guess.isProgress).map((guess) => guess.country);
}

// ---------------------------------------------------------------------
// Guess quality
// ---------------------------------------------------------------------

/**
 * Grades a single guess `X` purely by how much of a detour it represents
 * on the shortest possible start -> target route — independent of guess
 * order, and independent of whether `X` borders any specific
 * previously-guessed country:
 *
 *   distStartToX  = BFS distance(start, X)
 *   distXToTarget = BFS distance(X, target)
 *   totalViaX     = distStartToX + distXToTarget
 *   optimalTotal  = BFS distance(start, target)
 *   detour        = totalViaX - optimalTotal
 *
 * - detour == 0 -> "gold": X lies on *some* shortest start -> target
 *   route (there can be several equally-short branches, e.g. Austria vs
 *   Switzerland between Germany and Italy — both are gold).
 * - detour == 1 -> "green": a small, one-country detour off the
 *   shortest route.
 * - detour 2-3 -> "orange": a noticeable but survivable detour.
 * - detour >= 4, or X isn't reachable from start or target at all
 *   (no land connection) -> "red" ("big detour" / wrong direction
 *   entirely, e.g. the USA on a Germany -> Morocco route).
 *
 * Unrecognized input is also "red". Only "gold"/"green" ever count as
 * progress (`isProgress: true`) toward completing the route.
 */
export function evaluateGuessQuality(state: GameState, guessInput: string): Guess {
  const resolved = resolveCountryName(guessInput);
  const country = resolved ?? guessInput.trim();

  if (!resolved) {
    return { country, quality: "red", isProgress: false };
  }

  const distancesFromStart = computeDistancesFrom(state.start);
  const distancesFromTarget = computeDistancesFrom(state.end);

  const distStartToX = distancesFromStart.get(resolved);
  const distXToTarget = distancesFromTarget.get(resolved);
  const optimalTotal = distancesFromStart.get(state.end);

  if (distStartToX === undefined || distXToTarget === undefined || optimalTotal === undefined) {
    // No land connection between start/target and this country at all.
    return { country: resolved, quality: "red", isProgress: false };
  }

  const detour = distStartToX + distXToTarget - optimalTotal;
  const quality = gradeDetour(detour);

  return { country: resolved, quality, isProgress: quality === "gold" || quality === "green" };
}

function gradeDetour(detour: number): GuessQuality {
  if (detour <= 0) return "gold";
  if (detour === 1) return "green";
  if (detour <= 3) return "orange";
  return "red";
}

// ---------------------------------------------------------------------
// Core game logic
// ---------------------------------------------------------------------

/**
 * True once start and target are connected using only real land
 * borders, treating every "gold"/"green" guess made so far as an
 * available stepping stone — regardless of the order they were guessed
 * in. "orange"/"red" guesses are never usable as a stepping stone.
 *
 * E.g. for Togo -> Mauritania (optimal route Togo -> Burkina Faso -> Mali
 * -> Mauritania), guessing "Mali" alone doesn't win yet (Togo can't reach
 * Mali without Burkina Faso in between); guessing "Burkina Faso" too
 * completes the chain and wins, in either guessing order.
 */
function checkWinCondition(state: GameState): boolean {
  const validCountries = new Set(getValidIntermediateCountries(state));

  const reachable = new Set<string>([state.start]);
  const queue = [state.start];
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    for (const neighbor of countryAdjacency[current] ?? []) {
      if (reachable.has(neighbor)) continue;
      if (neighbor !== state.end && !validCountries.has(neighbor)) continue;
      reachable.add(neighbor);
      queue.push(neighbor);
    }
  }

  return reachable.has(state.end);
}

/**
 * Processes a guess: every guess — even a wildly wrong one — is recorded
 * and graded (see {@link evaluateGuessQuality}), shown on the map and in
 * the guess list. The round is won the moment start and target are
 * connected through the full set of "gold"/"green" guesses made so far
 * (see {@link checkWinCondition}) — independent of the order they were
 * made in, and without ever requiring the target itself to be guessed.
 *
 * If the game is already won or given up, the state is returned
 * unchanged.
 */
export function submitGuess(state: GameState, guessInput: string): GameState {
  if (state.isWon || state.isGivenUp) {
    return state;
  }

  const guess = evaluateGuessQuality(state, guessInput);
  const updated = { ...state, guesses: [...state.guesses, guess] };

  return { ...updated, isWon: checkWinCondition(updated) };
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
