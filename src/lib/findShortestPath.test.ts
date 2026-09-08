import { describe, expect, it } from "vitest";
import { countryAdjacency } from "../data/countryAdjacency";
import { findShortestPath } from "./findShortestPath";

/**
 * Prüft, dass jedes aufeinanderfolgende Länderpaar im Pfad tatsächlich
 * eine gemeinsame Landgrenze laut Adjazenzliste hat.
 */
function expectValidPath(path: string[], start: string, end: string) {
  expect(path[0]).toBe(start);
  expect(path[path.length - 1]).toBe(end);
  for (let i = 0; i < path.length - 1; i++) {
    const [a, b] = [path[i], path[i + 1]];
    expect(countryAdjacency[a], `"${a}" existiert nicht in der Adjazenzliste`).toBeDefined();
    expect(
      countryAdjacency[a].includes(b),
      `"${a}" und "${b}" sind laut Adjazenzliste keine Nachbarn, aber im Pfad direkt hintereinander`,
    ).toBe(true);
  }
}

describe("findShortestPath", () => {
  it("Portugal -> Finland (über Spanien, Frankreich, Deutschland, Polen, Russland)", () => {
    const path = findShortestPath("Portugal", "Finland");
    expectValidPath(path, "Portugal", "Finland");
    expect(path.length).toBe(7);
  });

  it("Germany -> Italy (direkt über Österreich oder die Schweiz)", () => {
    const path = findShortestPath("Germany", "Italy");
    expectValidPath(path, "Germany", "Italy");
    expect(path.length).toBe(3);
  });

  it("Morocco -> Egypt (über Algerien und Libyen)", () => {
    const path = findShortestPath("Morocco", "Egypt");
    expectValidPath(path, "Morocco", "Egypt");
    expect(path.length).toBe(4);
  });

  it("Spain -> Russia (über Frankreich, Deutschland, Polen)", () => {
    const path = findShortestPath("Spain", "Russia");
    expectValidPath(path, "Spain", "Russia");
    expect(path.length).toBe(5);
  });

  it("Thailand -> Turkey (über Südasien/Zentralasien und den Iran)", () => {
    const path = findShortestPath("Thailand", "Turkey");
    expectValidPath(path, "Thailand", "Turkey");
    expect(path.length).toBe(6);
  });

  it("Brazil -> Chile (über Bolivien oder Argentinien)", () => {
    const path = findShortestPath("Brazil", "Chile");
    expectValidPath(path, "Brazil", "Chile");
    expect(path.length).toBe(3);
  });

  it("South Africa -> Egypt (entlang Ostafrika)", () => {
    const path = findShortestPath("South Africa", "Egypt");
    expectValidPath(path, "South Africa", "Egypt");
    expect(path.length).toBe(7);
  });

  it("Norway -> India (über Russland und China)", () => {
    const path = findShortestPath("Norway", "India");
    expectValidPath(path, "Norway", "India");
    expect(path.length).toBe(4);
  });

  it("Start === Ziel liefert nur das eine Land", () => {
    const path = findShortestPath("France", "France");
    expect(path).toEqual(["France"]);
  });

  it("liefert ein leeres Array, wenn kein Landweg existiert (Irland/UK sind vom Festland isoliert)", () => {
    const path = findShortestPath("Ireland", "Poland");
    expect(path).toEqual([]);
  });

  it("wirft einen Fehler bei unbekannten Ländernamen", () => {
    expect(() => findShortestPath("Narnia", "Germany")).toThrow();
    expect(() => findShortestPath("Germany", "Narnia")).toThrow();
  });
});

describe("countryAdjacency Datenintegrität", () => {
  it("ist symmetrisch: wenn A B als Nachbarn führt, führt B auch A", () => {
    for (const [country, neighbors] of Object.entries(countryAdjacency)) {
      for (const neighbor of neighbors) {
        expect(
          countryAdjacency[neighbor],
          `Nachbar "${neighbor}" von "${country}" ist kein Schlüssel in der Adjazenzliste`,
        ).toBeDefined();
        expect(
          countryAdjacency[neighbor].includes(country),
          `${country} listet ${neighbor} als Nachbar, aber nicht umgekehrt`,
        ).toBe(true);
      }
    }
  });

  it("enthält keine Selbstschleifen", () => {
    for (const [country, neighbors] of Object.entries(countryAdjacency)) {
      expect(neighbors.includes(country)).toBe(false);
    }
  });

  it("enthält Inselstaaten ohne Landnachbarn", () => {
    expect(countryAdjacency["Japan"]).toEqual([]);
    expect(countryAdjacency["Australia"]).toEqual([]);
    expect(countryAdjacency["Madagascar"]).toEqual([]);
  });

  it("bildet die russische Exklave Kaliningrad korrekt ab (Polen und Litauen als Nachbarn)", () => {
    expect(countryAdjacency["Russia"]).toContain("Poland");
    expect(countryAdjacency["Russia"]).toContain("Lithuania");
  });
});
