import { describe, expect, it } from "vitest";
import {
  canvasPointsToShape,
  computeIoU,
  iouToScore,
  normalizeShape,
  rotateShape,
  scoreDrawing,
  simplifyRing,
  type Point,
} from "./drawScoring";

function square(cx: number, cy: number, size: number): Point[] {
  const h = size / 2;
  return [
    [cx - h, cy - h],
    [cx + h, cy - h],
    [cx + h, cy + h],
    [cx - h, cy + h],
  ];
}

function circle(cx: number, cy: number, r: number, n = 40): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * 2 * Math.PI;
    points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return points;
}

describe("canvasPointsToShape", () => {
  it("flips the y-axis (canvas down-positive -> shape up-positive)", () => {
    expect(canvasPointsToShape([[3, 10], [-2, -5]])).toEqual([[3, -10], [-2, 5]]);
  });
});

describe("normalizeShape", () => {
  it("centers a shape on its bounding-box center", () => {
    const [normalized] = normalizeShape([square(100, 200, 20)]);
    const xs = normalized.map(([x]) => x);
    const ys = normalized.map(([, y]) => y);
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(0);
    expect((Math.min(...ys) + Math.max(...ys)) / 2).toBeCloseTo(0);
  });

  it("scales uniformly so the longer bounding-box dimension becomes 1, preserving aspect ratio", () => {
    const wideRect: Point[] = [[-20, -5], [20, -5], [20, 5], [-20, 5]]; // 40 wide, 10 tall
    const [normalized] = normalizeShape([wideRect]);
    const xs = normalized.map(([x]) => x);
    const ys = normalized.map(([, y]) => y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    expect(width).toBeCloseTo(1);
    expect(height).toBeCloseTo(0.25); // aspect ratio 4:1 preserved
  });
});

describe("rotateShape", () => {
  it("rotates points around the origin by the given angle", () => {
    const [rotated] = rotateShape([[[1, 0]]], 90);
    const [x, y] = rotated[0];
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(1);
  });
});

describe("simplifyRing", () => {
  it("leaves a ring under the cap unchanged", () => {
    const ring: Point[] = [[0, 0], [1, 1], [2, 2]];
    expect(simplifyRing(ring, 10)).toEqual(ring);
  });

  it("decimates a ring down to at most the requested vertex count", () => {
    const ring: Point[] = Array.from({ length: 1000 }, (_, i) => [i, i]);
    const simplified = simplifyRing(ring, 50);
    expect(simplified.length).toBeLessThanOrEqual(50);
    expect(simplified[0]).toEqual(ring[0]);
  });
});

describe("computeIoU", () => {
  it("returns 1 for identical shapes", () => {
    const shape = [square(0, 0, 10)];
    expect(computeIoU(shape, shape)).toBeCloseTo(1);
  });

  it("returns 0 for shapes with no overlap even after translation-cancelling normalization isn't applied here (raw IoU, unnormalized)", () => {
    const a = [square(0, 0, 2)];
    const b = [square(100, 100, 2)];
    expect(computeIoU(a, b)).toBe(0);
  });

  it("returns a value strictly between 0 and 1 for partially-overlapping shapes", () => {
    const a = [square(0, 0, 10)];
    const b = [square(5, 0, 10)]; // shifted right by half its own width
    const iou = computeIoU(a, b);
    expect(iou).toBeGreaterThan(0);
    expect(iou).toBeLessThan(1);
  });
});

describe("iouToScore", () => {
  it("maps 0 IoU to a score of 0", () => {
    expect(iouToScore(0)).toBe(0);
  });

  it("maps 1.0 IoU (perfect match) to a score of 10", () => {
    expect(iouToScore(1)).toBe(10);
  });

  it("is generous: ~40% overlap lands in the 6-7 range, not just ~4", () => {
    const score = iouToScore(0.4);
    expect(score).toBeGreaterThanOrEqual(6);
    expect(score).toBeLessThanOrEqual(7);
  });

  it("clamps out-of-range input defensively", () => {
    expect(iouToScore(-0.5)).toBe(0);
    expect(iouToScore(1.5)).toBe(10);
  });

  it("is monotonically increasing in IoU", () => {
    const scores = [0, 0.1, 0.2, 0.4, 0.6, 0.8, 1].map(iouToScore);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
    }
  });
});

describe("scoreDrawing (end-to-end, with the 5°-step rotation search)", () => {
  it("scores an exact match near 10.0", () => {
    const shape = square(0, 0, 10);
    expect(scoreDrawing(shape, [shape])).toBeGreaterThanOrEqual(9.5);
  });

  it("scores an exact match of a more organic (circular) shape near 10.0 too", () => {
    const shape = circle(0, 0, 5);
    expect(scoreDrawing(shape, [shape])).toBeGreaterThanOrEqual(9.5);
  });

  it("finds a good score for the same shape drawn off-center, at a different size, and rotated — position/scale/rotation shouldn't matter", () => {
    // An irregular shape rather than a perfect square: a square's own
    // 4-fold symmetry combined with bounding-box-based normalization
    // makes its bounding box grow non-trivially between 0° and 45°,
    // which is a pathological edge case bbox-normalization has to trade
    // off — not representative of real, irregular country outlines.
    const reference: Point[] = [
      [0, 6], [3, 5], [5, 2], [4, -1], [6, -4], [2, -6], [-2, -5], [-5, -3], [-6, 0], [-4, 4],
    ];
    const drawnElsewhere = rotateShape(
      [reference.map(([x, y]): Point => [x * 4 + 500, y * 4 - 300])],
      33,
    )[0];
    expect(scoreDrawing(drawnElsewhere, [reference])).toBeGreaterThanOrEqual(9);
  });

  it("scores a completely wrong/opposite shape near 0-2", () => {
    // A very thin "needle" (40:1 aspect ratio) can never align well with a
    // round blob at any rotation — genuinely low overlap, not just
    // translated out of frame (which normalization would cancel out).
    const needle: Point[] = [[-20, -0.25], [20, -0.25], [20, 0.25], [-20, 0.25]];
    const blob = circle(0, 0, 10);
    const score = scoreDrawing(needle, [blob]);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(2);
  });

  it("scores a roughly-similar, imperfect, slightly-shifted freehand-like shape in the middle range", () => {
    // An irregular decagon standing in for a "rough but recognizable"
    // freehand country sketch, compared against a jittered + shifted +
    // slightly rotated version of the same outline.
    const reference: Point[] = [
      [0, 6], [3, 5], [5, 2], [4, -1], [6, -4], [2, -6], [-2, -5], [-5, -3], [-6, 0], [-4, 4],
    ];
    const roughlyDrawn = rotateShape(
      [reference.map(([x, y]): Point => [x * 1.15 + 1.5, y * 0.85 - 1])],
      18,
    )[0];

    const score = scoreDrawing(roughlyDrawn, [reference]);
    expect(score).toBeGreaterThan(4);
    expect(score).toBeLessThan(9.5);
  });

  it("returns 0 for a degenerate drawing (fewer than 3 points)", () => {
    expect(scoreDrawing([[0, 0], [1, 1]], [square(0, 0, 10)])).toBe(0);
  });
});
