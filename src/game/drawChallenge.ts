import { countryAdjacency } from "../data/countryAdjacency";
import { getCountryBoundsSizeDegrees } from "./drawGeometry";
import { hashSeed, mulberry32 } from "./seededRandom";

/** Number of countries drawn per daily Draw It challenge. */
export const DRAW_CHALLENGE_SIZE = 5;

/**
 * A country only qualifies for Draw It if its bounding box (in raw
 * lon/lat degrees) is at least this big in its longer dimension — this
 * excludes literal microstates (Vatican City ~0.01°, Monaco ~0.06°, San
 * Marino ~0.12°, Malta, Liechtenstein, Andorra, Singapore, ...) that are
 * essentially undrawable as a recognizable freehand shape, while still
 * keeping small-but-drawable countries like Luxembourg (~0.77°) or
 * Mauritius (~0.52°) in the pool.
 */
const MIN_COUNTRY_SIZE_DEGREES = 0.5;

let cachedEligibleCountries: string[] | null = null;

/**
 * Every country in the adjacency database that both (a) has real
 * geometry in the map dataset and (b) clears the microstate size filter
 * — computed once and cached, since neither the adjacency list nor the
 * map geometry ever change at runtime.
 */
function getEligibleCountries(): string[] {
  if (cachedEligibleCountries) return cachedEligibleCountries;

  cachedEligibleCountries = Object.keys(countryAdjacency)
    .filter((name) => {
      const size = getCountryBoundsSizeDegrees(name);
      return size !== null && Math.max(size.width, size.height) >= MIN_COUNTRY_SIZE_DEGREES;
    })
    .sort();

  return cachedEligibleCountries;
}

/**
 * Deterministically picks `DRAW_CHALLENGE_SIZE` distinct countries for
 * `date`'s Draw It challenge — seeded by `${date}:draw` (mirroring
 * `generateDailyPuzzle`'s seeding scheme), so every player draws the
 * same 5 countries on the same calendar day.
 */
export function generateDailyDrawChallenge(date: string): string[] {
  const pool = getEligibleCountries();
  const rng = mulberry32(hashSeed(`${date}:draw`));

  const remaining = [...pool];
  const picked: string[] = [];

  for (let i = 0; i < DRAW_CHALLENGE_SIZE && remaining.length > 0; i++) {
    const index = Math.floor(rng() * remaining.length);
    picked.push(remaining[index]);
    remaining.splice(index, 1);
  }

  return picked;
}
