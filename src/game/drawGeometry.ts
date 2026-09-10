import type { Feature, Geometry } from "geojson";
import { countryFeatures } from "../components/mapGeometry";
import { resolveMapCountryName } from "../data/mapCountryNames";

/** A closed (or implicitly-closed) ring of [longitude, latitude] pairs. */
export type Ring = [number, number][];

const featureByCanonicalName = new Map<string, Feature<Geometry>>();
for (const geoFeature of countryFeatures) {
  const rawName = String(geoFeature.properties?.name ?? "");
  featureByCanonicalName.set(resolveMapCountryName(rawName), geoFeature);
}

/** Shoelace-formula area of a ring, in raw (lon, lat) degree-space — not a real-world area, just enough to compare which sub-polygon of a country is biggest. */
function ringArea(ring: Ring): number {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

/**
 * The primary (largest, by raw lon/lat area) polygon of a country's
 * geometry, as `[outerRing, ...holeRings]` in raw [lon, lat] degrees —
 * picking just the largest sub-polygon out of a MultiPolygon means a
 * player isn't implicitly expected to also draw tiny offshore exclaves
 * bundled into the same geometry (e.g. France's overseas territories).
 * Returns `null` for a country with no geometry in this dataset (some
 * very small countries aren't included at this map resolution).
 */
export function getCountryPrimaryRings(name: string): Ring[] | null {
  const geoFeature = featureByCanonicalName.get(name);
  if (!geoFeature) return null;

  const { geometry } = geoFeature;
  if (geometry.type === "Polygon") {
    return geometry.coordinates as Ring[];
  }

  if (geometry.type === "MultiPolygon") {
    let largest: Ring[] | null = null;
    let largestArea = -Infinity;
    for (const polygon of geometry.coordinates) {
      const area = ringArea(polygon[0] as Ring);
      if (area > largestArea) {
        largestArea = area;
        largest = polygon as Ring[];
      }
    }
    return largest;
  }

  return null;
}

/**
 * A country's primary polygon, ready for shape scoring: longitude is
 * scaled by cos(center latitude) — the standard equirectangular
 * correction — so a country far from the equator (e.g. Canada, Russia)
 * isn't artificially stretched east-west relative to how it actually
 * looks, which would otherwise unfairly punish an accurately-drawn
 * shape. Returns `null` for a country with no geometry in this dataset.
 */
export function getCountryReferenceShape(name: string): Ring[] | null {
  const rings = getCountryPrimaryRings(name);
  if (!rings || rings.length === 0) return null;

  const outer = rings[0];
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [, y] of outer) {
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const centerLatRadians = ((minY + maxY) / 2) * (Math.PI / 180);
  const longitudeScale = Math.cos(centerLatRadians);

  return rings.map((ring) => ring.map(([x, y]): [number, number] => [x * longitudeScale, y]));
}

/**
 * Bounding-box size (in raw degrees) of a country's primary polygon —
 * used to filter geometrically tiny countries (e.g. Vatican City,
 * Monaco) out of Draw It's daily pool, since they're nearly impossible
 * to draw as a recognizable, freehand shape at any zoom level.
 */
export function getCountryBoundsSizeDegrees(name: string): { width: number; height: number } | null {
  const rings = getCountryPrimaryRings(name);
  if (!rings || rings.length === 0) return null;

  const outer = rings[0];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of outer) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return { width: maxX - minX, height: maxY - minY };
}
