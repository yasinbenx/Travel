import { describe, expect, it } from "vitest";
import { countryAdjacency } from "../data/countryAdjacency";
import { findShortestPath } from "./findShortestPath";

/**
 * Checks that every consecutive country pair in the path actually shares
 * a land border according to the adjacency list.
 */
function expectValidPath(path: string[], start: string, end: string) {
  expect(path[0]).toBe(start);
  expect(path[path.length - 1]).toBe(end);
  for (let i = 0; i < path.length - 1; i++) {
    const [a, b] = [path[i], path[i + 1]];
    expect(countryAdjacency[a], `"${a}" doesn't exist in the adjacency list`).toBeDefined();
    expect(
      countryAdjacency[a].includes(b),
      `"${a}" and "${b}" aren't neighbors according to the adjacency list, but appear back-to-back in the path`,
    ).toBe(true);
  }
}

describe("findShortestPath", () => {
  it("Portugal -> Finland (via Spain, France, Germany, Poland, Russia)", () => {
    const path = findShortestPath("Portugal", "Finland");
    expectValidPath(path, "Portugal", "Finland");
    expect(path.length).toBe(7);
  });

  it("Germany -> Italy (directly via Austria or Switzerland)", () => {
    const path = findShortestPath("Germany", "Italy");
    expectValidPath(path, "Germany", "Italy");
    expect(path.length).toBe(3);
  });

  it("Morocco -> Egypt (via Algeria and Libya)", () => {
    const path = findShortestPath("Morocco", "Egypt");
    expectValidPath(path, "Morocco", "Egypt");
    expect(path.length).toBe(4);
  });

  it("Spain -> Russia (via France, Germany, Poland)", () => {
    const path = findShortestPath("Spain", "Russia");
    expectValidPath(path, "Spain", "Russia");
    expect(path.length).toBe(5);
  });

  it("Thailand -> Turkey (via South/Central Asia and Iran)", () => {
    const path = findShortestPath("Thailand", "Turkey");
    expectValidPath(path, "Thailand", "Turkey");
    expect(path.length).toBe(6);
  });

  it("Brazil -> Chile (via Bolivia or Argentina)", () => {
    const path = findShortestPath("Brazil", "Chile");
    expectValidPath(path, "Brazil", "Chile");
    expect(path.length).toBe(3);
  });

  it("South Africa -> Egypt (along East Africa)", () => {
    const path = findShortestPath("South Africa", "Egypt");
    expectValidPath(path, "South Africa", "Egypt");
    expect(path.length).toBe(7);
  });

  it("Norway -> India (via Russia and China)", () => {
    const path = findShortestPath("Norway", "India");
    expectValidPath(path, "Norway", "India");
    expect(path.length).toBe(4);
  });

  it("start === end returns just that one country", () => {
    const path = findShortestPath("France", "France");
    expect(path).toEqual(["France"]);
  });

  it("returns an empty array when no land route exists (Ireland/UK are isolated from the mainland)", () => {
    const path = findShortestPath("Ireland", "Poland");
    expect(path).toEqual([]);
  });

  it("throws an error for unknown country names", () => {
    expect(() => findShortestPath("Narnia", "Germany")).toThrow();
    expect(() => findShortestPath("Germany", "Narnia")).toThrow();
  });
});

describe("countryAdjacency data integrity", () => {
  it("is symmetric: if A lists B as a neighbor, B also lists A", () => {
    for (const [country, neighbors] of Object.entries(countryAdjacency)) {
      for (const neighbor of neighbors) {
        expect(
          countryAdjacency[neighbor],
          `Neighbor "${neighbor}" of "${country}" isn't a key in the adjacency list`,
        ).toBeDefined();
        expect(
          countryAdjacency[neighbor].includes(country),
          `${country} lists ${neighbor} as a neighbor, but not the other way around`,
        ).toBe(true);
      }
    }
  });

  it("contains no self-loops", () => {
    for (const [country, neighbors] of Object.entries(countryAdjacency)) {
      expect(neighbors.includes(country)).toBe(false);
    }
  });

  it("contains island states with no land neighbors", () => {
    expect(countryAdjacency["Japan"]).toEqual([]);
    expect(countryAdjacency["Australia"]).toEqual([]);
    expect(countryAdjacency["Madagascar"]).toEqual([]);
  });

  it("correctly represents the Russian exclave of Kaliningrad (Poland and Lithuania as neighbors)", () => {
    expect(countryAdjacency["Russia"]).toContain("Poland");
    expect(countryAdjacency["Russia"]).toContain("Lithuania");
  });
});
