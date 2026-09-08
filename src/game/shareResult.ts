import { getConfirmedChain, type GameState, type GuessQuality } from "./gameEngine";

const QUALITY_EMOJI: Record<GuessQuality, string> = {
  gold: "🟨",
  green: "🟩",
  orange: "🟧",
  red: "🟥",
};

/**
 * Builds the Wordle-style emoji grid for a won game: one tile per guess,
 * in the exact order they were made, colored by quality (gold/green =
 * on the shortest route, orange = a small detour, red = a bad move or
 * not even a real neighbor). Unlike the old correct/wrong split, this
 * reflects the full guess history in one chronological row.
 */
export function buildEmojiGrid(state: GameState): string {
  return state.guesses.map((guess) => QUALITY_EMOJI[guess.quality]).join("");
}

/** Builds the full result text that gets copied to the clipboard. */
export function buildShareText(state: GameState): string {
  const steps = getConfirmedChain(state).length;
  const optimalSteps = state.optimalPath.length - 2;
  const detourGuesses = state.guesses.length - steps;

  const statsLine =
    `${steps} ${steps === 1 ? "step" : "steps"} · optimal: ${optimalSteps}` +
    (detourGuesses > 0
      ? ` · ${detourGuesses} off-path ${detourGuesses === 1 ? "guess" : "guesses"}`
      : "");

  return [`BorderHop – ${state.start} → ${state.end}`, statsLine, buildEmojiGrid(state)].join(
    "\n",
  );
}
