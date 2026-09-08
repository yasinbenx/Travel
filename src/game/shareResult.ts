import { computeSkipCounts, type GameState } from "./gameEngine";

const CORRECT_EMOJI = "🟩";
const SKIPPED_EMOJI = "🟨";
const WRONG_EMOJI = "⬜";

/**
 * Builds the Wordle-style emoji grid for a won game: one tile per correct
 * guess (green = direct next step, yellow = countries were skipped),
 * followed by one gray tile per wrong guess.
 *
 * Note: `GameState` stores correct and wrong guesses in separate arrays
 * (no shared chronological order), so the gray tiles for wrong guesses
 * are appended here rather than interleaved chronologically with the
 * green/yellow tiles.
 */
export function buildEmojiGrid(state: GameState): string {
  const skipCounts = computeSkipCounts(state);
  const correctSquares = skipCounts.map((skipped) =>
    skipped > 0 ? SKIPPED_EMOJI : CORRECT_EMOJI,
  );
  const wrongSquares = state.wrongGuesses.map(() => WRONG_EMOJI);
  return [...correctSquares, ...wrongSquares].join("");
}

/** Builds the full result text that gets copied to the clipboard. */
export function buildShareText(state: GameState): string {
  const steps = state.correctGuesses.length;
  const optimalSteps = state.optimalPath.length - 2;
  const wrongCount = state.wrongGuesses.length;

  const statsLine =
    `${steps} ${steps === 1 ? "step" : "steps"} · optimal: ${optimalSteps}` +
    (wrongCount > 0 ? ` · ${wrongCount} wrong ${wrongCount === 1 ? "guess" : "guesses"}` : "");

  return [`BorderHop – ${state.start} → ${state.end}`, statsLine, buildEmojiGrid(state)].join(
    "\n",
  );
}
