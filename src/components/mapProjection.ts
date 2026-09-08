import { geoEqualEarth, geoPath, type GeoPath, type GeoProjection } from "d3-geo";

/**
 * Einzige Quelle der Wahrheit für die Kartenprojektion: `ComposableMap`
 * bekommt exakt dieselbe `projectionConfig`/Größe, damit die unabhängig
 * (außerhalb von react-simple-maps) berechnete Projektion hier — für die
 * Bounding-Box-/Zoom-Berechnung in `MapView` — pixelgenau mit der intern
 * von react-simple-maps genutzten Projektion übereinstimmt.
 */
export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 600;
export const MAP_SCALE = 160;

export function createMapProjection(): GeoProjection {
  return geoEqualEarth()
    .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2])
    .scale(MAP_SCALE);
}

export function createMapPath(): GeoPath {
  return geoPath(createMapProjection());
}
