import type { DrawGameState } from "./drawGameState";
import type { Difficulty, GameState } from "./gameEngine";

const GAMES_KEY = "borderhop:games";
const DRAW_GAMES_KEY = "borderhop:draw-games";
const TUTORIAL_SEEN_KEY = "borderhop:tutorial-seen";

/** The storage/lookup key for one calendar date's puzzle at one difficulty. */
export function gameKey(date: string, difficulty: Difficulty): string {
  return `${date}:${difficulty}`;
}

function isGameState(value: unknown): value is GameState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.date === "string" &&
    (candidate.difficulty === "easy" ||
      candidate.difficulty === "medium" ||
      candidate.difficulty === "hard") &&
    typeof candidate.start === "string" &&
    typeof candidate.end === "string" &&
    Array.isArray(candidate.optimalPath) &&
    Array.isArray(candidate.guesses) &&
    typeof candidate.isWon === "boolean" &&
    typeof candidate.isGivenUp === "boolean"
  );
}

/**
 * Loads every daily game ever played, keyed by {@link gameKey}. Entries
 * that no longer match the expected shape (e.g. after a format change)
 * are silently dropped rather than crashing the whole load.
 */
export function loadAllGames(): Record<string, GameState> {
  try {
    const raw = localStorage.getItem(GAMES_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};

    const result: Record<string, GameState> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (isGameState(value)) {
        result[key] = value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Saves one daily game's current state (in progress or finished) into
 * the persisted collection, so a reload resumes it exactly where it was
 * left off and a finished puzzle can never be "replayed" as new.
 */
export function saveGame(state: GameState): void {
  try {
    const all = loadAllGames();
    all[gameKey(state.date, state.difficulty)] = state;
    localStorage.setItem(GAMES_KEY, JSON.stringify(all));
  } catch {
    // Save skipped (e.g. private browsing or quota exceeded).
  }
}

function isDrawGameState(value: unknown): value is DrawGameState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.date === "string" &&
    Array.isArray(candidate.countries) &&
    typeof candidate.currentIndex === "number" &&
    Array.isArray(candidate.scores) &&
    Array.isArray(candidate.drawings) &&
    Array.isArray(candidate.rotations) &&
    typeof candidate.isCompleted === "boolean"
  );
}

/**
 * Loads every Draw It daily challenge ever played, keyed by calendar
 * date (there's only ever one Draw It challenge per day, unlike the
 * difficulty-keyed border-hop games). Malformed entries are silently
 * dropped rather than crashing the whole load.
 */
export function loadAllDrawGames(): Record<string, DrawGameState> {
  try {
    const raw = localStorage.getItem(DRAW_GAMES_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};

    const result: Record<string, DrawGameState> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (isDrawGameState(value)) {
        result[key] = value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

/** Saves one day's Draw It state (in progress or finished), keyed by its own date. */
export function saveDrawGame(state: DrawGameState): void {
  try {
    const all = loadAllDrawGames();
    all[state.date] = state;
    localStorage.setItem(DRAW_GAMES_KEY, JSON.stringify(all));
  } catch {
    // Save skipped (e.g. private browsing or quota exceeded).
  }
}

/** Whether the first-visit onboarding tutorial has already been shown (completed or skipped). */
export function hasSeenTutorial(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

/** Marks the onboarding tutorial as seen, so it never shows again on this device. */
export function markTutorialSeen(): void {
  try {
    localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
  } catch {
    // Nothing to do if storage access itself fails.
  }
}
