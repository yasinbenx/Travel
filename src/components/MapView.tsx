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
  /** Startland + bisher korrekt geratene Länder, in Reihenfolge. */
  revealedCountries: string[];
  /** Zielland — bleibt bis zum Sieg unsichtbar (siehe Kommentar unten). */
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
 * SVG-Weltkarte im "Pfad-Reveal"-Stil: NUR das Startland und die bisher
 * korrekt geratenen Länder werden überhaupt gerendert (Umriss + Füllung).
 * Alle anderen Länder werden komplett aus dem Geographien-Array gefiltert
 * — nicht nur unauffällig eingefärbt — damit ihre Umrisse keinerlei
 * Hinweis auf Lage oder Form des Ziellandes geben können. Der Hintergrund
 * ist eine einfarbige, neutrale Fläche ohne jede Kontur.
 *
 * Das Zielland bleibt bis zum Sieg absichtlich unmarkiert: im echten
 * travle.earth ist die Kontur des Ziellandes ebenfalls standardmäßig
 * verborgen und nur über einen optionalen, aktiv anzufordernden Hinweis
 * ("Show next/all country outline") einsehbar — es gibt dort keinen
 * automatischen Zielland-Marker. Das wird hier bewusst genauso gehandhabt.
 *
 * Die Ansicht zoomt/zentriert sich automatisch auf die Bounding Box aller
 * aufgedeckten Länder (`computeMapView`, via `ZoomableGroup` gesteuert).
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
          // Der Zoom wird ausschließlich automatisch anhand des Spielfortschritts
          // gesteuert (kein manuelles Verschieben/Zoomen per Maus/Touch), damit
          // die Kartenansicht auf Mobilgeräten nicht mit dem Seiten-Scrollen kollidiert.
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
