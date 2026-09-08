import { geoEqualEarth, geoPath, type GeoPath, type GeoProjection } from "d3-geo";

/**
 * Single source of truth for the map projection: `ComposableMap` gets
 * the exact same `projectionConfig`/size, so the projection computed here
 * independently (outside react-simple-maps) — used for the bounding-box/
 * zoom calculation in `MapView` — matches react-simple-maps' internal
 * projection pixel-for-pixel.
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
