import { beforeEach, describe, expect, it } from "vitest";
import { loadStreak, recordDailyCompletion } from "./streak";

describe("streak", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts empty", () => {
    expect(loadStreak()).toEqual({ current: 0, longest: 0, lastPlayedDate: null });
  });

  it("starts a streak of 1 on the first-ever completion", () => {
    const result = recordDailyCompletion("2026-06-01");
    expect(result).toEqual({ current: 1, longest: 1, lastPlayedDate: "2026-06-01" });
  });

  it("extends the streak on the immediately following day", () => {
    recordDailyCompletion("2026-06-01");
    recordDailyCompletion("2026-06-02");
    const result = recordDailyCompletion("2026-06-03");
    expect(result).toEqual({ current: 3, longest: 3, lastPlayedDate: "2026-06-03" });
  });

  it("is idempotent for a second completion on the same day (e.g. a second difficulty)", () => {
    recordDailyCompletion("2026-06-01");
    const result = recordDailyCompletion("2026-06-01");
    expect(result).toEqual({ current: 1, longest: 1, lastPlayedDate: "2026-06-01" });
  });

  it("resets to 1 after skipping a day", () => {
    recordDailyCompletion("2026-06-01");
    recordDailyCompletion("2026-06-02");
    // Skips 2026-06-03 entirely.
    const result = recordDailyCompletion("2026-06-04");
    expect(result).toEqual({ current: 1, longest: 2, lastPlayedDate: "2026-06-04" });
  });

  it("keeps the longest streak even after it resets", () => {
    recordDailyCompletion("2026-06-01");
    recordDailyCompletion("2026-06-02");
    recordDailyCompletion("2026-06-03"); // longest now 3
    recordDailyCompletion("2026-06-10"); // gap -> resets to 1
    const result = recordDailyCompletion("2026-06-11");
    expect(result).toEqual({ current: 2, longest: 3, lastPlayedDate: "2026-06-11" });
  });

  it("correctly resets across a month boundary gap", () => {
    recordDailyCompletion("2026-01-30");
    // Skips 2026-01-31.
    const result = recordDailyCompletion("2026-02-01");
    expect(result).toEqual({ current: 1, longest: 1, lastPlayedDate: "2026-02-01" });
  });

  it("correctly extends across a month boundary with no gap", () => {
    recordDailyCompletion("2026-01-31");
    const result = recordDailyCompletion("2026-02-01");
    expect(result).toEqual({ current: 2, longest: 2, lastPlayedDate: "2026-02-01" });
  });
});
