import { getDayNumber } from "./dateUtils";
import { DIFFICULTY_LABEL, getConfirmedChain, type GameState, type GuessQuality } from "./gameEngine";

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

/**
 * Builds the full result text that gets copied to the clipboard, e.g.
 * "BorderHop Day #42 [Medium] 🔥5 - 6/6 steps" followed by the emoji
 * grid — `currentStreak` is only shown when it's actually active (> 0).
 * A given-up round has no meaningful step count, so it reports "Gave up"
 * instead of a steps ratio.
 */
export function buildShareText(state: GameState, currentStreak: number): string {
  const dayNumber = getDayNumber(state.date);
  const streakPart = currentStreak > 0 ? ` 🔥${currentStreak}` : "";
  const resultPart = state.isGivenUp
    ? "Gave up"
    : `${getConfirmedChain(state).length}/${state.optimalPath.length - 2} steps`;

  const headerLine =
    `BorderHop Day #${dayNumber} [${DIFFICULTY_LABEL[state.difficulty]}]${streakPart}` +
    ` - ${resultPart}`;

  return [headerLine, buildEmojiGrid(state)].join("\n");
}
