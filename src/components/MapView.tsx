import { useMemo } from "react";
import type { GeoJsonObject } from "geojson";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import rawWorldTopology from "world-atlas/countries-50m.json";
import { resolveMapCountryName } from "../data/mapCountryNames";
import { computeMapView } from "./mapGeometry";
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
  /** Target country — stays hidden until the win (see comment below). */
  target: string;
  isWon: boolean;
};

const COLORS = {
  stroke: "#f8f7f3",
  revealed: "#5fae7c",
  start: "#3f7f5c",
  target: "#d98a4a",
};

/**
 * SVG world map in a "path reveal" style: ONLY the start country and the
 * countries correctly guessed so far are rendered at all (outline + fill).
 * Every other country is filtered out of the geographies array entirely
 * — not just subtly colored — so its outline can't give away the target's
 * location or shape. The background is a plain, neutral fill with no
 * outlines at all.
 *
 * The target country deliberately stays unmarked until the win: in the
 * real travle.earth, the target's outline is likewise hidden by default
 * and only revealed through an optional, actively-requested hint ("Show
 * next/all country outline") — there's no automatic target marker there
 * either. This is handled the same way here on purpose.
 *
 * The view automatically zooms/centers on the bounding box of all
 * revealed countries (`computeMapView`, driven via `ZoomableGroup`).
 */
export function MapView({ revealedCountries, target, isWon }: MapViewProps) {
  const revealedSet = useMemo(() => new Set(revealedCountries), [revealedCountries]);
  const startCountry = revealedCountries[0];

  const view = useMemo(
    () => computeMapView(isWon ? [...revealedCountries, target] : revealedCountries),
    [revealedCountries, target, isWon],
  );

  function isVisible(canonicalName: string): boolean {
    return revealedSet.has(canonicalName) || (isWon && canonicalName === target);
  }

  function fillFor(canonicalName: string): string {
    if (isWon && canonicalName === target) return COLORS.target;
    if (canonicalName === startCountry) return COLORS.start;
    return COLORS.revealed;
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
                    className={styles.geography}
                    fill={fillFor(canonicalName)}
                    stroke={COLORS.stroke}
                    strokeWidth={0.4}
                  />
                ))
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
