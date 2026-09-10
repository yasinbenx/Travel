import { describe, expect, it } from "vitest";
import { createDailyDrawState, getAverageScore, submitDrawing } from "./drawGameState";
import { getCountryReferenceShape } from "./drawGeometry";
import { canvasPointsToShape, type Point } from "./drawScoring";
import { generateDailyDrawChallenge } from "./drawChallenge";

const DATE = "2026-06-01";

describe("createDailyDrawState", () => {
  it("creates a fresh state with today's 5 countries and nothing submitted yet", () => {
    const state = createDailyDrawState(DATE);
    expect(state.date).toBe(DATE);
    expect(state.countries).toEqual(generateDailyDrawChallenge(DATE));
    expect(state.currentIndex).toBe(0);
    expect(state.scores).toEqual([]);
    expect(state.drawings).toEqual([]);
    expect(state.isCompleted).toBe(false);
  });
});

describe("submitDrawing", () => {
  it("scores the current country, records the drawing, and advances to the next one", () => {
    const state = createDailyDrawState(DATE);
    const firstCountry = state.countries[0];
    const referenceShape = getCountryReferenceShape(firstCountry)!;
    // Draw the exact reference shape (in canvas coordinates, so flip
    // back what canvasPointsToShape would normally undo) for a
    // near-perfect score.
    const perfectDrawingInCanvasSpace: Point[] = referenceShape[0].map(([x, y]) => [x, -y]);

    const after = submitDrawing(state, canvasPointsToShape(perfectDrawingInCanvasSpace));
    expect(after.currentIndex).toBe(1);
    expect(after.scores).toHaveLength(1);
    expect(after.scores[0]).toBeGreaterThanOrEqual(9.5);
    expect(after.drawings).toHaveLength(1);
    expect(after.isCompleted).toBe(false);
  });

  it("completes the round once all 5 countries are submitted", () => {
    let state = createDailyDrawState(DATE);
    for (let i = 0; i < 5; i++) {
      expect(state.isCompleted).toBe(false);
      state = submitDrawing(state, [[0, 0], [10, 0], [10, 10], [0, 10]]);
    }
    expect(state.isCompleted).toBe(true);
    expect(state.currentIndex).toBe(5);
    expect(state.scores).toHaveLength(5);
    expect(state.drawings).toHaveLength(5);
  });

  it("is a no-op once already completed", () => {
    let state = createDailyDrawState(DATE);
    for (let i = 0; i < 5; i++) {
      state = submitDrawing(state, [[0, 0], [10, 0], [10, 10], [0, 10]]);
    }
    const completed = state;
    const result = submitDrawing(completed, [[1, 1], [2, 2], [3, 3]]);
    expect(result).toBe(completed);
  });

  it("scores a degenerate (near-empty) drawing as 0 without throwing", () => {
    const state = createDailyDrawState(DATE);
    const after = submitDrawing(state, [[0, 0]]);
    expect(after.scores[0]).toBe(0);
  });
});

describe("getAverageScore", () => {
  it("returns null before any country has been submitted", () => {
    expect(getAverageScore(createDailyDrawState(DATE))).toBeNull();
  });

  it("averages the scores recorded so far, rounded to one decimal", () => {
    let state = createDailyDrawState(DATE);
    state = { ...state, scores: [8.0, 6.5, 7.0] };
    expect(getAverageScore(state)).toBeCloseTo(7.2, 5);
  });

  it("updates as more countries are submitted", () => {
    let state = createDailyDrawState(DATE);
    state = submitDrawing(state, [[0, 0], [10, 0], [10, 10], [0, 10]]);
    const afterOne = getAverageScore(state);
    expect(afterOne).toBe(state.scores[0]);
  });
});
