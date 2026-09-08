import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { countryFeatures } from "./mapGeometry";
import styles from "./WorldSilhouette.module.css";

const worldFeatureCollection = {
  type: "FeatureCollection" as const,
  features: countryFeatures,
};

/**
 * A purely decorative, non-interactive world map silhouette used as a
 * faint background watermark (e.g. behind the start screen) so it
 * doesn't feel empty, without competing with foreground content.
 */
export function WorldSilhouette() {
  return (
    <div className={styles.wrapper} aria-hidden="true">
      <ComposableMap className={styles.svg} projectionConfig={{ scale: 140 }}>
        <Geographies geography={worldFeatureCollection}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography key={geo.rsmKey} geography={geo} className={styles.geography} />
            ))
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}
