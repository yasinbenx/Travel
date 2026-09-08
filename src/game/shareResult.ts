import { computeSkipCounts, type GameState } from "./gameEngine";

const CORRECT_EMOJI = "🟩";
const SKIPPED_EMOJI = "🟨";
const WRONG_EMOJI = "⬜";

/**
 * Baut das Wordle-artige Emoji-Grid für ein gewonnenes Spiel: ein Feld pro
 * korrektem Versuch (grün = direkter nächster Schritt, gelb = dabei wurden
 * Länder übersprungen), gefolgt von einem grauen Feld pro falschem Versuch.
 *
 * Hinweis: `GameState` speichert korrekte und falsche Versuche in
 * getrennten Arrays (keine gemeinsame Zeitreihenfolge), daher werden die
 * grauen Felder für falsche Versuche hier angehängt statt chronologisch
 * zwischen die grün/gelben Felder gemischt.
 */
export function buildEmojiGrid(state: GameState): string {
  const skipCounts = computeSkipCounts(state);
  const correctSquares = skipCounts.map((skipped) =>
    skipped > 0 ? SKIPPED_EMOJI : CORRECT_EMOJI,
  );
  const wrongSquares = state.wrongGuesses.map(() => WRONG_EMOJI);
  return [...correctSquares, ...wrongSquares].join("");
}

/** Baut den vollständigen, in die Zwischenablage kopierbaren Ergebnistext. */
export function buildShareText(state: GameState): string {
  const steps = state.correctGuesses.length;
  const optimalSteps = state.optimalPath.length - 2;
  const wrongCount = state.wrongGuesses.length;

  const statsLine =
    `${steps} ${steps === 1 ? "Schritt" : "Schritte"} · optimal: ${optimalSteps}` +
    (wrongCount > 0
      ? ` · ${wrongCount} falsche${wrongCount === 1 ? "r Versuch" : " Versuche"}`
      : "");

  return [
    `Travle-Klon – ${state.start} → ${state.end}`,
    statsLine,
    buildEmojiGrid(state),
  ].join("\n");
}
