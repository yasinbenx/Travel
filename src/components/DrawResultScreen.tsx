import { Palette, Trophy } from "lucide-react";
import type { DrawGameState } from "../game/drawGameState";
import { getAverageScore } from "../game/drawGameState";
import { getCountryReferenceShape } from "../game/drawGeometry";
import { normalizeShape, rotateShape, type Shape } from "../game/drawScoring";
import { AppHeader } from "./AppHeader";
import styles from "./DrawResultScreen.module.css";

type DrawResultScreenProps = {
  state: DrawGameState;
  onHome: () => void;
  onOpenStats: () => void;
};

/** Renders a normalized (roughly unit-scale, centered-at-origin) shape's outer ring as a filled SVG polygon. */
function ShapePreview({ shape, colorVar, label }: { shape: Shape | null; colorVar: string; label: string }) {
  const outer = shape?.[0];
  return (
    <div className={styles.previewBox}>
      <svg viewBox="0 0 100 100" className={styles.previewSvg} aria-hidden="true">
        {outer && outer.length >= 3 && (
          <polygon
            points={outer.map(([x, y]) => `${(x + 0.5) * 100},${(0.5 - y) * 100}`).join(" ")}
            fill={`var(${colorVar})`}
            fillOpacity={0.85}
          />
        )}
      </svg>
      <span className={styles.previewLabel}>{label}</span>
    </div>
  );
}

/**
 * Shown once all 5 of the day's countries have been drawn and scored:
 * the overall average plus a per-country breakdown, each with a small
 * drawn-vs-actual shape comparison so the player can see where they were
 * off — rotated to the same best-fit angle that was actually scored, not
 * however it happened to be drawn on the canvas.
 */
export function DrawResultScreen({ state, onHome, onOpenStats }: DrawResultScreenProps) {
  const average = getAverageScore(state);

  return (
    <div className={styles.app}>
      <AppHeader
        centerContent={<span className={styles.headerLabel}>Draw It</span>}
        onHome={onHome}
        onOpenStats={onOpenStats}
      />

      <div className={styles.content}>
        <div className={styles.summaryCard}>
          <p className={styles.heading}>
            <Trophy size={20} strokeWidth={2.25} />
            Today's drawings are in!
          </p>
          <p className={styles.average}>
            Average: <strong>{average !== null ? average.toFixed(1) : "–"}</strong>/10
          </p>
        </div>

        <ul className={styles.list}>
          {state.countries.map((country, index) => {
            const referenceShape = getCountryReferenceShape(country);
            const normalizedReference = referenceShape ? normalizeShape(referenceShape) : null;
            const drawnPoints = state.drawings[index];
            const rotation = state.rotations[index] ?? 0;
            const normalizedDrawn =
              drawnPoints && drawnPoints.length >= 3
                ? rotateShape(normalizeShape([drawnPoints]), rotation)
                : null;

            return (
              <li key={country} className={styles.row}>
                <div className={styles.rowHeader}>
                  <span className={styles.country}>{country}</span>
                  <span className={styles.score}>{state.scores[index]?.toFixed(1) ?? "–"}/10</span>
                </div>
                <div className={styles.previews}>
                  <ShapePreview shape={normalizedDrawn} colorVar="--color-primary" label="Yours" />
                  <ShapePreview shape={normalizedReference} colorVar="--coral-sky" label="Actual" />
                </div>
              </li>
            );
          })}
        </ul>

        <p className={styles.footnote}>
          <Palette size={13} strokeWidth={2.25} />
          Come back tomorrow for 5 new countries.
        </p>
      </div>
    </div>
  );
}
