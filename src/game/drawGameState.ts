import { generateDailyDrawChallenge } from "./drawChallenge";
import { getCountryReferenceShape } from "./drawGeometry";
import { scoreDrawingDetailed, type Point } from "./drawScoring";

export type DrawGameState = {
  /** Calendar date ("YYYY-MM-DD", browser-local) this daily challenge belongs to. */
  date: string;
  /** The 5 countries for the day, in drawing order. */
  countries: string[];
  /** Index into `countries` of the country currently being drawn (or, once `isCompleted`, equal to `countries.length`). */
  currentIndex: number;
  /** One score (0-10, one decimal) per country already submitted, same order as `countries`. */
  scores: number[];
  /**
   * The player's own drawn points for each already-submitted country
   * (in "shape" space — canvas-y already flipped to match geographic
   * up-positive, see `canvasPointsToShape`), kept purely so the result
   * screen can render a drawn-vs-actual comparison per country.
   */
  drawings: Point[][];
  /** The rotation (degrees) that best aligned each drawing with its reference shape — reused so the result screen's comparison view matches what was actually scored. */
  rotations: number[];
  isCompleted: boolean;
};

/** Creates a fresh, unplayed Draw It state for `date`'s 5 daily countries. */
export function createDailyDrawState(date: string): DrawGameState {
  return {
    date,
    countries: generateDailyDrawChallenge(date),
    currentIndex: 0,
    scores: [],
    drawings: [],
    rotations: [],
    isCompleted: false,
  };
}

/**
 * Scores the player's drawing for the current country and advances to
 * the next one — completing the round once all 5 have been submitted.
 * If the round is already completed, returns state unchanged.
 */
export function submitDrawing(state: DrawGameState, drawnPoints: Point[]): DrawGameState {
  if (state.isCompleted) {
    return state;
  }

  const country = state.countries[state.currentIndex];
  const referenceShape = getCountryReferenceShape(country);
  const detail = referenceShape
    ? scoreDrawingDetailed(drawnPoints, referenceShape)
    : { score: 0, bestRotationDegrees: 0 };

  const scores = [...state.scores, detail.score];
  const drawings = [...state.drawings, drawnPoints];
  const rotations = [...state.rotations, detail.bestRotationDegrees];
  const currentIndex = state.currentIndex + 1;
  const isCompleted = currentIndex >= state.countries.length;

  return { ...state, scores, drawings, rotations, currentIndex, isCompleted };
}

/** The average of all scores recorded so far, rounded to one decimal — `null` if none yet. */
export function getAverageScore(state: DrawGameState): number | null {
  if (state.scores.length === 0) return null;
  const sum = state.scores.reduce((total, score) => total + score, 0);
  return Math.round((sum / state.scores.length) * 10) / 10;
}
