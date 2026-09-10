import { intersection, union, type MultiPolygon, type Polygon as PCPolygon } from "polygon-clipping";

export type Point = [number, number];
/** A polygon as `[outerRing, ...holeRings]`, each ring an array of points. */
export type Shape = Point[][];

// ---------------------------------------------------------------------
// Coordinate-space helpers
// ---------------------------------------------------------------------

/**
 * Converts recorded canvas pointer coordinates (x right, y DOWN — normal
 * screen-space convention) into the same "y increases upward" convention
 * used by geographic (lon, lat) coordinates. Without this flip, a
 * correctly north-up-drawn country would be a mirror image of the
 * reference shape before any rotation is even considered — and no amount
 * of pure rotation can undo a mirror flip, so this step is required for
 * fair scoring, not just cosmetic.
 */
export function canvasPointsToShape(points: Point[]): Point[] {
  return points.map(([x, y]) => [x, -y]);
}

// ---------------------------------------------------------------------
// Polygon simplification (performance: keeps the 72-rotation search and
// the polygon-clipping calls fast even for high-vertex-count coastlines)
// ---------------------------------------------------------------------

/** Uniformly decimates `points` down to at most `maxPoints`, always keeping the first point. Order-preserving; not a shape-aware simplifier, just a cheap density cap. */
export function simplifyRing(points: Point[], maxPoints: number): Point[] {
  if (points.length <= maxPoints) return points;
  const stride = points.length / maxPoints;
  const result: Point[] = [];
  for (let i = 0; i < maxPoints; i++) {
    result.push(points[Math.floor(i * stride)]);
  }
  return result;
}

// ---------------------------------------------------------------------
// Normalization: center + uniform scale so two shapes become comparable
// regardless of where/how large they were originally drawn or projected
// ---------------------------------------------------------------------

function boundsOf(ring: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of ring) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Centers a shape on its outer ring's bounding-box center, then scales
 * it UNIFORMLY (same factor on both axes) so its longer bounding-box
 * dimension becomes exactly 1. Uniform scaling — rather than stretching
 * width and height independently to force a unit square — is what makes
 * this a fair "same bounding-box size" comparison: it normalizes scale
 * without warping either shape's proportions, which would make an
 * elongated country look artificially similar to a round one.
 */
export function normalizeShape(shape: Shape): Shape {
  const outer = shape[0];
  if (!outer || outer.length === 0) return shape;

  const { minX, minY, maxX, maxY } = boundsOf(outer);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const size = Math.max(maxX - minX, maxY - minY) || 1;
  const scale = 1 / size;

  return shape.map((ring) => ring.map(([x, y]): Point => [(x - cx) * scale, (y - cy) * scale]));
}

/**
 * Rotates a shape by `angleDegrees` around the origin. Only meaningful
 * on an already-centered (see {@link normalizeShape}) shape, since
 * rotation is always around (0, 0).
 */
export function rotateShape(shape: Shape, angleDegrees: number): Shape {
  const radians = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return shape.map((ring) =>
    ring.map(([x, y]): Point => [x * cos - y * sin, x * sin + y * cos]),
  );
}

// ---------------------------------------------------------------------
// Area / IoU
// ---------------------------------------------------------------------

/** Shoelace-formula area of a single ring (need not be pre-closed). */
function ringArea(ring: Point[]): number {
  if (ring.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

/** A polygon's area is its outer ring's area minus every hole's area (standard GeoJSON-style `[outer, ...holes]` convention). */
function polygonArea(polygon: Point[][]): number {
  if (polygon.length === 0) return 0;
  const outer = ringArea(polygon[0]);
  const holes = polygon.slice(1).reduce((sum, ring) => sum + ringArea(ring), 0);
  return Math.max(outer - holes, 0);
}

function multiPolygonArea(multiPolygon: Point[][][]): number {
  return multiPolygon.reduce((sum, polygon) => sum + polygonArea(polygon), 0);
}

function closeRing(ring: Point[]): Point[] {
  if (ring.length === 0) return ring;
  const [firstX, firstY] = ring[0];
  const [lastX, lastY] = ring[ring.length - 1];
  return firstX === lastX && firstY === lastY ? ring : [...ring, ring[0]];
}

/** Intersection-over-union of two shapes' areas — 0 (no overlap) to 1 (identical). */
export function computeIoU(a: Shape, b: Shape): number {
  const polygonA = a.map(closeRing) as PCPolygon;
  const polygonB = b.map(closeRing) as PCPolygon;

  let intersectionResult: MultiPolygon;
  let unionResult: MultiPolygon;
  try {
    intersectionResult = intersection(polygonA, polygonB);
    unionResult = union(polygonA, polygonB);
  } catch {
    // A self-intersecting freehand scribble can occasionally trip up the
    // clipping library; treat it as "no measurable overlap" rather than
    // crashing the whole scoring flow.
    return 0;
  }

  const unionArea = multiPolygonArea(unionResult);
  if (unionArea <= 0) return 0;

  const intersectionArea = multiPolygonArea(intersectionResult);
  return Math.min(intersectionArea / unionArea, 1);
}

// ---------------------------------------------------------------------
// IoU -> generous 0-10 score curve
// ---------------------------------------------------------------------

/**
 * Exponent for `score = 10 * iou ^ GENEROSITY_EXPONENT`.
 *
 * A plain linear mapping (`score = 10 * iou`) feels punishing for a
 * casual freehand-drawing game: a recognizable-but-rough sketch might
 * only overlap ~40% with the real shape (a perfect trace is much harder
 * to freehand than to recognize by eye), yet should still feel like a
 * solid, encouraging result rather than "you failed".
 *
 * Since 0 <= iou <= 1, raising it to a power < 1 pulls all scores up
 * (sqrt-like), with the pull strongest for low-to-mid IoU and tapering
 * off as iou -> 1 (where 10^1 = 10 regardless of the exponent). The
 * exact exponent was picked by solving `0.4 ^ k = 0.65` — i.e. "40%
 * overlap should land around 6.5/10" — which gives k ≈ 0.47. To
 * re-tune the curve later, just re-solve for whatever (iou, score/10)
 * anchor point feels right and swap in the new exponent.
 */
const GENEROSITY_EXPONENT = 0.47;

/** Converts a raw 0-1 IoU into a generous 0-10 score, rounded to one decimal. */
export function iouToScore(iou: number): number {
  const clamped = Math.min(Math.max(iou, 0), 1);
  const score = 10 * Math.pow(clamped, GENEROSITY_EXPONENT);
  return Math.round(score * 10) / 10;
}

// ---------------------------------------------------------------------
// Putting it together
// ---------------------------------------------------------------------

/** Vertex cap applied to both shapes before the rotation search, purely for performance (see {@link simplifyRing}). */
const MAX_SCORING_VERTICES = 90;
/** Rotation search step, in degrees, per the "test several rotation angles" requirement. */
const ROTATION_STEP_DEGREES = 5;

/**
 * Scores a freehand drawing against a reference country shape:
 * 1. Close the drawn stroke into a polygon.
 * 2. Normalize both shapes (center + uniform scale) so position/size
 *    differences don't affect the score.
 * 3. Try rotating the drawn shape in 5° steps across all 360° and keep
 *    the best-aligned IoU, so an otherwise-correct but rotated drawing
 *    isn't unfairly punished.
 * 4. Map the best IoU onto a generous 0-10 scale (see
 *    {@link iouToScore}).
 *
 * `referenceShape` is `[outerRing, ...holeRings]` in the SAME coordinate
 * convention as the (already y-flipped, see {@link canvasPointsToShape})
 * drawn points — any lon/lat aspect-ratio correction is expected to
 * already have been applied by the caller.
 */
export type ScoringDetail = {
  score: number;
  bestIoU: number;
  /** The rotation (degrees) that produced `bestIoU` — reused by the result screen to show a fairly-aligned drawn-vs-actual comparison. */
  bestRotationDegrees: number;
};

export function scoreDrawingDetailed(drawnPoints: Point[], referenceShape: Shape): ScoringDetail {
  if (drawnPoints.length < 3) {
    return { score: 0, bestIoU: 0, bestRotationDegrees: 0 };
  }

  const drawnShape: Shape = [simplifyRing(drawnPoints, MAX_SCORING_VERTICES)];
  const simplifiedReference: Shape = referenceShape.map((ring) => simplifyRing(ring, MAX_SCORING_VERTICES));

  const normalizedDrawn = normalizeShape(drawnShape);
  const normalizedReference = normalizeShape(simplifiedReference);

  let bestIoU = 0;
  let bestRotationDegrees = 0;
  for (let angle = 0; angle < 360; angle += ROTATION_STEP_DEGREES) {
    const rotated = rotateShape(normalizedDrawn, angle);
    const iou = computeIoU(rotated, normalizedReference);
    if (iou > bestIoU) {
      bestIoU = iou;
      bestRotationDegrees = angle;
    }
  }

  return { score: iouToScore(bestIoU), bestIoU, bestRotationDegrees };
}

export function scoreDrawing(drawnPoints: Point[], referenceShape: Shape): number {
  return scoreDrawingDetailed(drawnPoints, referenceShape).score;
}
