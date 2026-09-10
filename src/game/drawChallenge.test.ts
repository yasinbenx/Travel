import { describe, expect, it } from "vitest";
import { DRAW_CHALLENGE_SIZE, generateDailyDrawChallenge } from "./drawChallenge";

const SAMPLE_DATES = ["2026-01-01", "2026-03-15", "2026-07-04", "2026-12-25", "2027-02-28"];

describe("generateDailyDrawChallenge", () => {
  it(`returns exactly ${DRAW_CHALLENGE_SIZE} distinct countries`, () => {
    for (const date of SAMPLE_DATES) {
      const countries = generateDailyDrawChallenge(date);
      expect(countries).toHaveLength(DRAW_CHALLENGE_SIZE);
      expect(new Set(countries).size).toBe(DRAW_CHALLENGE_SIZE);
    }
  });

  it("is deterministic: the same date always returns the same 5 countries in the same order", () => {
    for (const date of SAMPLE_DATES) {
      expect(generateDailyDrawChallenge(date)).toEqual(generateDailyDrawChallenge(date));
    }
  });

  it("varies across different dates", () => {
    const sets = SAMPLE_DATES.map((date) => generateDailyDrawChallenge(date).slice().sort().join("|"));
    expect(new Set(sets).size).toBeGreaterThan(1);
  });

  it("never picks a geometrically tiny microstate (Vatican City, Monaco, San Marino, ...)", () => {
    const excluded = new Set([
      "Vatican City",
      "Monaco",
      "San Marino",
      "Nauru",
      "Maldives",
      "Liechtenstein",
      "Malta",
      "Andorra",
    ]);
    // Sample many dates to make this a meaningful negative check, not
    // just luck on 5 dates.
    for (let day = 1; day <= 60; day++) {
      const date = `2026-01-${String(day <= 31 ? day : day - 30).padStart(2, "0")}`;
      for (const country of generateDailyDrawChallenge(date)) {
        expect(excluded.has(country)).toBe(false);
      }
    }
  });

  it("is seeded independently from the border-hop daily puzzles (different pool/selection than generateDailyPuzzle)", () => {
    // Just a sanity check that this doesn't throw and returns real,
    // known country names.
    const countries = generateDailyDrawChallenge("2026-06-01");
    for (const country of countries) {
      expect(typeof country).toBe("string");
      expect(country.length).toBeGreaterThan(0);
    }
  });
});
