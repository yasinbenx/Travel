import { useMemo } from "react";
import type { GeoJsonObject } from "geojson";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import rawWorldTopology from "world-atlas/countries-50m.json";
import { resolveMapCountryName } from "../data/mapCountryNames";
import styles from "./MapView.module.css";

// react-simple-maps supports passing a raw TopoJSON Topology object
// directly (it detects `type === "Topology"` and converts it internally
// via topojson-client) — the published `geography` prop type just
// doesn't list that variant, hence the cast.
const worldTopology = rawWorldTopology as unknown as GeoJsonObject;

type MapViewProps = {
  start: string;
  end: string;
  correctGuesses: string[];
};

const COLORS = {
  default: "#e3e1da",
  stroke: "#ffffff",
  start: "#a9c6e8",
  end: "#e8b892",
  correct: "#79c290",
};

/**
 * SVG-Weltkarte, die den aktuellen Spielfortschritt farblich anzeigt:
 * Start und Ziel sind fest eingefärbt, korrekt geratene Länder werden
 * grün hervorgehoben, alle übrigen Länder bleiben neutral grau.
 */
export function MapView({ start, end, correctGuesses }: MapViewProps) {
  const correctSet = useMemo(() => new Set(correctGuesses), [correctGuesses]);

  function fillFor(topoName: string): string {
    const canonicalName = resolveMapCountryName(topoName);
    if (correctSet.has(canonicalName)) return COLORS.correct;
    if (canonicalName === start) return COLORS.start;
    if (canonicalName === end) return COLORS.end;
    return COLORS.default;
  }

  return (
    <div className={styles.wrapper}>
      <ComposableMap className={styles.svg} projectionConfig={{ scale: 130 }}>
        <Geographies geography={worldTopology}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                className={styles.geography}
                fill={fillFor(String(geo.properties?.name ?? ""))}
                stroke={COLORS.stroke}
                strokeWidth={0.4}
              />
            ))
          }
        </Geographies>
      </ComposableMap>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.swatch} style={{ background: COLORS.start }} />
          Start
        </span>
        <span className={styles.legendItem}>
          <span className={styles.swatch} style={{ background: COLORS.end }} />
          Ziel
        </span>
        <span className={styles.legendItem}>
          <span className={styles.swatch} style={{ background: COLORS.correct }} />
          Erraten
        </span>
      </div>
    </div>
  );
}
