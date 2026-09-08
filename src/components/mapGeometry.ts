import type { Feature, Geometry, Polygon } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import { feature } from "topojson-client";
import type { GeoPath } from "d3-geo";
import rawWorldTopology from "world-atlas/countries-50m.json";
import { resolveMapCountryName } from "../data/mapCountryNames";
import { MAP_HEIGHT, MAP_WIDTH, createMapPath, createMapProjection } from "./mapProjection";

const worldTopology = rawWorldTopology as unknown as Topology;
const countriesObject = worldTopology.objects.countries as GeometryCollection;

/** Alle Länder-Features (einmalig aus dem TopoJSON extrahiert). */
export const countryFeatures: Feature<Geometry>[] = feature(
  worldTopology,
  countriesObject,
).features;

/** Kanonischer Ländername -> GeoJSON-Feature, für schnellen Bounds-Lookup. */
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
/** Anteil der Kartenfläche, den die Bounding Box der aufgedeckten Länder einnehmen soll. */
const PADDING_FACTOR = 0.6;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

type Bounds = [[number, number], [number, number]];

function isFiniteBounds(bounds: Bounds): boolean {
  return bounds.every((point) => point.every((value) => Number.isFinite(value)));
}

/**
 * Liefert die Bounding Box des flächenmäßig GRÖSSTEN Teilstücks eines
 * Länder-Features. Mehrere unserer Quelldaten bündeln weit entfernte
 * Überseegebiete als zusätzliche Polygone in dieselbe MultiPolygon-Geometrie
 * (z.B. enthält Frankreichs Geometrie in diesem Datensatz auch
 * Französisch-Guayana in Südamerika). Würde man die gesamte MultiPolygon-
 * Bounding-Box verwenden, würde allein das Aufdecken Frankreichs die
 * Zoom-Ansicht auf den halben Atlantik aufspannen. Das "Hauptland" (die
 * größte zusammenhängende Fläche) ist für die Zoom-Berechnung die weitaus
 * sinnvollere Referenz.
 */
function getPrimaryBounds(path: GeoPath, geoFeature: Feature<Geometry>): Bounds | null {
  if (geoFeature.geometry.type !== "MultiPolygon") {
    const bounds = path.bounds(geoFeature) as Bounds;
    return isFiniteBounds(bounds) ? bounds : null;
  }

  let largestArea = -Infinity;
  let largestBounds: Bounds | null = null;

  for (const polygonCoordinates of geoFeature.geometry.coordinates) {
    const polygonFeature: Feature<Polygon> = {
      type: "Feature",
      properties: null,
      geometry: { type: "Polygon", coordinates: polygonCoordinates },
    };
    const area = Math.abs(path.area(polygonFeature));
    if (area <= largestArea) continue;

    const bounds = path.bounds(polygonFeature) as Bounds;
    if (!isFiniteBounds(bounds)) continue;

    largestArea = area;
    largestBounds = bounds;
  }

  return largestBounds;
}

/**
 * Berechnet Zentrum (Länge/Breite) und Zoomstufe, um die Bounding Box
 * aller genannten Länder (per kanonischem Namen) gut sichtbar in der
 * Karte darzustellen. Länder ohne eigene Geometrie in diesem Datensatz
 * (z.B. Französisch-Guayana, Tuvalu — siehe `mapCountryNames.ts`) werden
 * dabei einfach übersprungen. Gibt eine Standardansicht der ganzen Welt
 * zurück, wenn keines der Länder eine Geometrie hat.
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
