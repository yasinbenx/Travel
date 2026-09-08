import type { GameState } from "./gameEngine";

const STORAGE_KEY = "borderhop:current-game";

function isGameState(value: unknown): value is GameState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.start === "string" &&
    typeof candidate.end === "string" &&
    Array.isArray(candidate.optimalPath) &&
    Array.isArray(candidate.guesses) &&
    typeof candidate.isWon === "boolean" &&
    (candidate.difficulty === "easy" ||
      candidate.difficulty === "medium" ||
      candidate.difficulty === "hard")
  );
}

/**
 * Loads the current game state from localStorage, if any. Returns `null`
 * if nothing is stored yet, or if the stored data no longer matches the
 * expected shape (e.g. after a format change) — the round then simply
 * starts fresh instead of crashing on a broken state.
 */
export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isGameState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Saves the current game state so a reload mid-round (or right after
 * winning) doesn't lose it. If saving fails (private browsing, quota
 * full, …), the error is deliberately swallowed — persistence is a
 * convenience feature, not a reason to break the game.
 */
export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Save skipped (e.g. private browsing or quota exceeded).
  }
}

