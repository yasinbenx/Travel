import { useMemo } from "react";
import type { GeoJsonObject } from "geojson";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import rawWorldTopology from "world-atlas/countries-50m.json";
import { resolveMapCountryName } from "../data/mapCountryNames";
import { computeMapView, getCountryCentroid } from "./mapGeometry";
import { MAP_SCALE } from "./mapProjection";
import styles from "./MapView.module.css";

// react-simple-maps supports passing a raw TopoJSON Topology object
// directly (it detects `type === "Topology"` and converts it internally
// via topojson-client) — the published `geography` prop type just
// doesn't list that variant, hence the cast.
const worldTopology = rawWorldTopology as unknown as GeoJsonObject;

type MapViewProps = {
  /** Start country + correctly guessed countries so far, in order. */
  revealedCountries: string[];
  /** Target country — always visible, but only reached once won (see below). */
  target: string;
  isWon: boolean;
};

const COLORS = {
  stroke: "#f7f8fa",
  revealed: "#2f9e6e",
  start: "#14213d",
  target: "#f0a93e",
  labelHalo: "#ffffff",
};

/**
 * SVG world map in a "path reveal" style: the start country AND the
 * target country are visible from the very first render (in distinct
 * colors, each with an on-map label), so the player always knows where
 * they're starting from and navigating to. Only the countries in between
 * stay hidden until correctly guessed — every other country is filtered
 * out of the geographies array entirely, not just subtly colored, so no
 * outline can leak a hint about what lies between them.
 *
 * The view automatically zooms/centers on the bounding box of the start,
 * target, and all revealed countries (`computeMapView`, driven via
 * `ZoomableGroup`).
 */
export function MapView({ revealedCountries, target, isWon }: MapViewProps) {
  const revealedSet = useMemo(() => new Set(revealedCountries), [revealedCountries]);
  const startCountry = revealedCountries[0];

  const view = useMemo(
    () => computeMapView([...revealedCountries, target]),
    [revealedCountries, target],
  );

  function isVisible(canonicalName: string): boolean {
    return revealedSet.has(canonicalName) || canonicalName === target;
  }

  function fillFor(canonicalName: string): string {
    if (canonicalName === target) return COLORS.target;
    if (canonicalName === startCountry) return COLORS.start;
    return COLORS.revealed;
  }

  const inverseZoom = 1 / view.zoom;
  const startCentroid = getCountryCentroid(startCountry);
  const targetCentroid = getCountryCentroid(target);

  function renderLabel(name: string, centroid: [number, number] | null, color: string) {
    if (!centroid) return null;
    return (
      <Marker coordinates={centroid}>
        <g transform={`scale(${inverseZoom})`} className={styles.label}>
          <circle r={4} fill={color} stroke={COLORS.labelHalo} strokeWidth={1.5} />
          <text
            textAnchor="middle"
            y={-9}
            className={styles.labelText}
            fill={color}
            stroke={COLORS.labelHalo}
            strokeWidth={3}
            paintOrder="stroke"
          >
            {name}
          </text>
        </g>
      </Marker>
    );
  }

  return (
    <div className={styles.wrapper}>
      <ComposableMap className={styles.svg} projectionConfig={{ scale: MAP_SCALE }}>
        <ZoomableGroup
          center={view.center}
          zoom={view.zoom}
          minZoom={1}
          maxZoom={12}
          // Zoom is driven entirely automatically by game progress (no
          // manual pan/zoom via mouse/touch), so the map view doesn't fight
          // page scrolling on mobile devices.
          filterZoomEvent={() => false}
          className={styles.zoomGroup}
        >
          <Geographies geography={worldTopology}>
            {({ geographies }) =>
              geographies
                .map((geo) => ({
                  geo,
                  canonicalName: resolveMapCountryName(String(geo.properties?.name ?? "")),
                }))
                .filter(({ canonicalName }) => isVisible(canonicalName))
                .map(({ geo, canonicalName }) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    className={
                      canonicalName === target && isWon
                        ? `${styles.geography} ${styles.geographyReached}`
                        : styles.geography
                    }
                    fill={fillFor(canonicalName)}
                    stroke={COLORS.stroke}
                    strokeWidth={0.4}
                  />
                ))
            }
          </Geographies>
          {renderLabel(startCountry, startCentroid, COLORS.start)}
          {renderLabel(target, targetCentroid, COLORS.target)}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
