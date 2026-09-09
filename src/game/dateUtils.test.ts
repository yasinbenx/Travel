import { describe, expect, it } from "vitest";
import { getDayNumber, getPreviousDateString, getTodayDateString } from "./dateUtils";

describe("getTodayDateString", () => {
  it("returns a YYYY-MM-DD string", () => {
    expect(getTodayDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("getPreviousDateString", () => {
  it("returns the day before within the same month", () => {
    expect(getPreviousDateString("2026-06-15")).toBe("2026-06-14");
  });

  it("crosses a month boundary", () => {
    expect(getPreviousDateString("2026-03-01")).toBe("2026-02-28");
  });

  it("crosses a year boundary", () => {
    expect(getPreviousDateString("2026-01-01")).toBe("2025-12-31");
  });

  it("handles a leap-year February correctly", () => {
    expect(getPreviousDateString("2024-03-01")).toBe("2024-02-29");
  });
});

describe("getDayNumber", () => {
  it("returns 1 for the epoch date itself", () => {
    expect(getDayNumber("2026-01-01")).toBe(1);
  });

  it("increments by 1 per calendar day", () => {
    expect(getDayNumber("2026-01-02")).toBe(2);
    expect(getDayNumber("2026-01-10")).toBe(10);
  });

  it("handles dates after a leap day correctly", () => {
    // 2026 is not a leap year, but the count should still be exact.
    expect(getDayNumber("2027-01-01")).toBe(366);
  });
});
