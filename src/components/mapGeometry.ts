import type { Feature, Geometry, Polygon } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import { feature } from "topojson-client";
import { geoCentroid, type GeoPath } from "d3-geo";
import rawWorldTopology from "world-atlas/countries-50m.json";
import { resolveMapCountryName } from "../data/mapCountryNames";
import { MAP_HEIGHT, MAP_WIDTH, createMapPath, createMapProjection } from "./mapProjection";

const worldTopology = rawWorldTopology as unknown as Topology;
const countriesObject = worldTopology.objects.countries as GeometryCollection;

/** All country features (extracted from the TopoJSON once). */
export const countryFeatures: Feature<Geometry>[] = feature(
  worldTopology,
  countriesObject,
).features;

/** Canonical country name -> GeoJSON feature, for fast bounds lookups. */
const featureByCanonicalName = new Map<string, Feature<Geometry>>();
for (const geoFeature of countryFeatures) {
  const rawName = String(geoFeature.properties?.name ?? "");
  featureByCanonicalName.set(resolveMapCountryName(rawName), geoFeature);
}

export type MapView = {
  center: [number, number];
  zoom: number;
};

const DEFAULT_VIEW: MapView = { center: [10, 20], zoom: 1 };
const MIN_ZOOM = 1;
const MAX_ZOOM = 12;
/** Share of the map area the revealed countries' bounding box should occupy. */
const PADDING_FACTOR = 0.6;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

type Bounds = [[number, number], [number, number]];

function isFiniteBounds(bounds: Bounds): boolean {
  return bounds.every((point) => point.every((value) => Number.isFinite(value)));
}

/**
 * Returns the LARGEST (by projected area) sub-piece of a country's
 * feature, as a standalone feature. Several of our source geometries
 * bundle far-flung overseas territories as extra polygons into the same
 * MultiPolygon (e.g. France's geometry in this dataset also includes
 * French Guiana in South America). Using the whole MultiPolygon for
 * bounds or centroid purposes would, for example, stretch France's zoom
 * view across half the Atlantic, or place its label somewhere in the mid-
 * Atlantic. The "mainland" (the single largest contiguous area) is by far
 * the more sensible reference for both.
 */
function getPrimaryFeature(
  path: GeoPath,
  geoFeature: Feature<Geometry>,
): Feature<Polygon> | Feature<Geometry> | null {
  if (geoFeature.geometry.type !== "MultiPolygon") {
    return geoFeature;
  }

  let largestArea = -Infinity;
  let largestFeature: Feature<Polygon> | null = null;

  for (const polygonCoordinates of geoFeature.geometry.coordinates) {
    const polygonFeature: Feature<Polygon> = {
      type: "Feature",
      properties: null,
      geometry: { type: "Polygon", coordinates: polygonCoordinates },
    };
    const area = Math.abs(path.area(polygonFeature));
    if (area > largestArea) {
      largestArea = area;
      largestFeature = polygonFeature;
    }
  }

  return largestFeature;
}

function getPrimaryBounds(path: GeoPath, geoFeature: Feature<Geometry>): Bounds | null {
  const primary = getPrimaryFeature(path, geoFeature);
  if (!primary) return null;
  const bounds = path.bounds(primary) as Bounds;
  return isFiniteBounds(bounds) ? bounds : null;
}

/**
 * Returns the [longitude, latitude] centroid of a country's mainland (see
 * {@link getPrimaryFeature}), for placing an on-map label. Returns `null`
 * for countries with no geometry in this dataset.
 */
export function getCountryCentroid(name: string): [number, number] | null {
  const geoFeature = featureByCanonicalName.get(name);
  if (!geoFeature) return null;

  const primary = getPrimaryFeature(createMapPath(), geoFeature);
  if (!primary) return null;

  const centroid = geoCentroid(primary);
  return Number.isFinite(centroid[0]) && Number.isFinite(centroid[1]) ? centroid : null;
}

/**
 * Computes a center (longitude/latitude) and zoom level to display the
 * bounding box of all named countries (by canonical name) nicely on the
 * map. Countries with no geometry in this dataset (e.g. French Guiana,
 * Tuvalu — see `mapCountryNames.ts`) are simply skipped. Returns a
 * default whole-world view if none of the countries have a geometry.
 */
export function computeMapView(countryNames: string[]): MapView {
  const path = createMapPath();

  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;

  for (const name of countryNames) {
    const geoFeature = featureByCanonicalName.get(name);
    if (!geoFeature) continue;

    const bounds = getPrimaryBounds(path, geoFeature);
    if (!bounds) continue;

    x0 = Math.min(x0, bounds[0][0]);
    y0 = Math.min(y0, bounds[0][1]);
    x1 = Math.max(x1, bounds[1][0]);
    y1 = Math.max(y1, bounds[1][1]);
  }

  if (!Number.isFinite(x0) || !Number.isFinite(y0) || !Number.isFinite(x1) || !Number.isFinite(y1)) {
    return DEFAULT_VIEW;
  }

  const boxWidth = Math.max(x1 - x0, 1);
  const boxHeight = Math.max(y1 - y0, 1);
  const zoom = clamp(
    Math.min((MAP_WIDTH * PADDING_FACTOR) / boxWidth, (MAP_HEIGHT * PADDING_FACTOR) / boxHeight),
    MIN_ZOOM,
    MAX_ZOOM,
  );

  const midX = (x0 + x1) / 2;
  const midY = (y0 + y1) / 2;
  const projection = createMapProjection();
  const center = projection.invert?.([midX, midY]) ?? DEFAULT_VIEW.center;

  return { center: center as [number, number], zoom };
}
