import { describe, expect, it } from "vitest";
import {
  getCountryBoundsSizeDegrees,
  getCountryPrimaryRings,
  getCountryReferenceShape,
} from "./drawGeometry";

describe("getCountryPrimaryRings", () => {
  it("returns null for a country with no geometry in this dataset", () => {
    expect(getCountryPrimaryRings("Narnia")).toBeNull();
  });

  it("returns a non-empty outer ring for a well-known country", () => {
    const rings = getCountryPrimaryRings("Germany");
    expect(rings).not.toBeNull();
    expect(rings!.length).toBeGreaterThan(0);
    expect(rings![0].length).toBeGreaterThan(3);
  });

  it("picks the largest sub-polygon for a multi-part country (mainland over exclaves)", () => {
    // France's geometry in this dataset bundles French Guiana into the
    // same MultiPolygon — the primary rings should be the mainland,
    // whose longitude stays within continental-Europe bounds.
    const rings = getCountryPrimaryRings("France");
    expect(rings).not.toBeNull();
    const longitudes = rings![0].map(([lon]) => lon);
    expect(Math.min(...longitudes)).toBeGreaterThan(-10);
    expect(Math.max(...longitudes)).toBeLessThan(15);
  });
});

describe("getCountryBoundsSizeDegrees", () => {
  it("returns null for an unknown country", () => {
    expect(getCountryBoundsSizeDegrees("Narnia")).toBeNull();
  });

  it("reports a tiny bounding box for a microstate", () => {
    const size = getCountryBoundsSizeDegrees("Vatican City");
    expect(size).not.toBeNull();
    expect(Math.max(size!.width, size!.height)).toBeLessThan(0.1);
  });

  it("reports a large bounding box for a huge country", () => {
    const size = getCountryBoundsSizeDegrees("Russia");
    expect(size).not.toBeNull();
    expect(Math.max(size!.width, size!.height)).toBeGreaterThan(50);
  });
});

describe("getCountryReferenceShape", () => {
  it("returns null for an unknown country", () => {
    expect(getCountryReferenceShape("Narnia")).toBeNull();
  });

  it("returns the same point count as the raw primary rings (only longitude is rescaled)", () => {
    const raw = getCountryPrimaryRings("Canada");
    const reference = getCountryReferenceShape("Canada");
    expect(reference).not.toBeNull();
    expect(reference!.length).toBe(raw!.length);
    expect(reference![0].length).toBe(raw![0].length);
  });

  it("shrinks longitude spread relative to the raw shape for a high-latitude country", () => {
    // Canada sits far from the equator, so cos(centerLatitude) < 1 —
    // the equirectangular correction should visibly narrow its
    // longitude range relative to the uncorrected raw geometry.
    const raw = getCountryPrimaryRings("Canada")![0];
    const reference = getCountryReferenceShape("Canada")![0];
    const rawLonSpread = Math.max(...raw.map(([lon]) => lon)) - Math.min(...raw.map(([lon]) => lon));
    const refLonSpread =
      Math.max(...reference.map(([lon]) => lon)) - Math.min(...reference.map(([lon]) => lon));
    expect(refLonSpread).toBeLessThan(rawLonSpread);
  });

  it("leaves latitude untouched", () => {
    const raw = getCountryPrimaryRings("Germany")![0];
    const reference = getCountryReferenceShape("Germany")![0];
    for (let i = 0; i < raw.length; i++) {
      expect(reference[i][1]).toBe(raw[i][1]);
    }
  });
});
