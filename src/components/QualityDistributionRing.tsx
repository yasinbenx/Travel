import type { GuessQuality } from "../game/gameEngine";
import type { QualityDistribution } from "../game/stats";
import styles from "./QualityDistributionRing.module.css";

type QualityDistributionRingProps = {
  distribution: QualityDistribution;
};

const QUALITY_ORDER: GuessQuality[] = ["gold", "green", "orange", "red"];

const QUALITY_LABEL: Record<GuessQuality, string> = {
  gold: "Perfect",
  green: "Great",
  orange: "Good",
  red: "Big detour",
};

const SIZE = 120;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Small donut chart breaking down every guess ever made (across all
 * games) by quality, in the exact same gold/green/orange/red hues used
 * on the map and guess list — a lifetime "how do I usually guess" view,
 * not a per-round outcome metric.
 */
export function QualityDistributionRing({ distribution }: QualityDistributionRingProps) {
  const total = QUALITY_ORDER.reduce((sum, quality) => sum + distribution[quality], 0);

  const segments = QUALITY_ORDER.reduce<
    { quality: GuessQuality; count: number; fraction: number; length: number; offset: number }[]
  >((acc, quality) => {
    const count = distribution[quality];
    const fraction = total > 0 ? count / total : 0;
    const length = fraction * CIRCUMFERENCE;
    const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].length : 0;
    return [...acc, { quality, count, fraction, length, offset }];
  }, []);

  return (
    <div className={styles.wrapper}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} className={styles.svg}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--surface-muted)"
          strokeWidth={STROKE}
        />
        {total > 0 &&
          segments
            .filter((segment) => segment.count > 0)
            .map((segment) => (
              <circle
                key={segment.quality}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={`var(--quality-${segment.quality}-fill)`}
                strokeWidth={STROKE}
                strokeDasharray={`${segment.length} ${CIRCUMFERENCE - segment.length}`}
                strokeDashoffset={-segment.offset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              />
            ))}
        <text x="50%" y="47%" textAnchor="middle" className={styles.centerValue}>
          {total}
        </text>
        <text x="50%" y="63%" textAnchor="middle" className={styles.centerLabel}>
          guesses
        </text>
      </svg>

      <ul className={styles.legend}>
        {segments.map((segment) => (
          <li key={segment.quality} className={styles.legendRow}>
            <span
              className={styles.swatch}
              style={{ background: `var(--quality-${segment.quality}-fill)` }}
              aria-hidden="true"
            />
            <span className={styles.legendLabel}>{QUALITY_LABEL[segment.quality]}</span>
            <span className={styles.legendValue}>
              {total > 0 ? `${Math.round(segment.fraction * 100)}%` : "–"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
