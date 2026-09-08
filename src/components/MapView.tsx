import { useMemo } from "react";
import type { GeoJsonObject } from "geojson";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import rawWorldTopology from "world-atlas/countries-50m.json";
import { resolveMapCountryName } from "../data/mapCountryNames";
import type { Guess, GuessQuality } from "../game/gameEngine";
import { computeMapView, getCountryCentroid } from "./mapGeometry";
import { MAP_SCALE } from "./mapProjection";
import styles from "./MapView.module.css";

// react-simple-maps supports passing a raw TopoJSON Topology object
// directly (it detects `type === "Topology"` and converts it internally
// via topojson-client) — the published `geography` prop type just
// doesn't list that variant, hence the cast.
const worldTopology = rawWorldTopology as unknown as GeoJsonObject;

type MapViewProps = {
  start: string;
  /** Target country — always visible, but only "reached" (pulsing) once won. */
  target: string;
  /** Every guess made so far, in order, each colored by its quality on the map. */
  guesses: Guess[];
  isWon: boolean;
};

const COLORS = {
  stroke: "#f7f8fa",
  start: "#14213d",
  target: "#f0a93e",
  labelHalo: "#ffffff",
};

const QUALITY_MAP_COLORS: Record<GuessQuality, string> = {
  gold: "#caa118",
  green: "#2f9e6e",
  orange: "#d97a34",
  red: "#c0392b",
};

/**
 * SVG world map: the start and target country are visible from the very
 * first render (in distinct colors, each with an on-map label), and
 * every guess the player makes — however far off — is shown too, colored
 * by its quality (gold/green = on the shortest route, orange = a small
 * detour, red = a bad move or not even a real neighbor). Countries that
 * haven't been guessed yet are filtered out of the geographies array
 * entirely, not just subtly colored, so no outline can leak a hint about
 * what lies between start and target.
 *
 * The view automatically zooms/centers on the bounding box of the start,
 * target, and every guessed country (`computeMapView`, driven via
 * `ZoomableGroup`) — so a wildly distant guess visibly zooms the map out.
 */
export function MapView({ start, target, guesses, isWon }: MapViewProps) {
  const qualityByCountry = useMemo(() => {
    const map = new Map<string, GuessQuality>();
    for (const guess of guesses) {
      map.set(guess.country, guess.quality);
    }
    return map;
  }, [guesses]);

  const guessedNames = useMemo(() => [...qualityByCountry.keys()], [qualityByCountry]);

  const view = useMemo(
    () => computeMapView([start, target, ...guessedNames]),
    [start, target, guessedNames],
  );

  function isVisible(canonicalName: string): boolean {
    return canonicalName === start || canonicalName === target || qualityByCountry.has(canonicalName);
  }

  function fillFor(canonicalName: string): string {
    if (canonicalName === target) return COLORS.target;
    if (canonicalName === start) return COLORS.start;
    const quality = qualityByCountry.get(canonicalName);
    return quality ? QUALITY_MAP_COLORS[quality] : COLORS.start;
  }

  const inverseZoom = 1 / view.zoom;
  const startCentroid = getCountryCentroid(start);
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
          {renderLabel(start, startCentroid, COLORS.start)}
          {renderLabel(target, targetCentroid, COLORS.target)}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
