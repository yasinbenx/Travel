import { countryAdjacency } from "../data/countryAdjacency";

/**
 * Findet den kürzesten Weg zwischen zwei Ländern über gemeinsame
 * Landgrenzen mittels Breitensuche (BFS) auf der Adjazenzliste.
 *
 * @returns Array der Länder auf dem Weg (inklusive Start und Ziel).
 *          Leeres Array, wenn kein Weg existiert (z.B. Inselstaaten
 *          ohne Landverbindung).
 * @throws Error, wenn `start` oder `end` kein bekanntes Land ist.
 */
export function findShortestPath(start: string, end: string): string[] {
  if (!(start in countryAdjacency)) {
    throw new Error(`Unbekanntes Land: "${start}"`);
  }
  if (!(end in countryAdjacency)) {
    throw new Error(`Unbekanntes Land: "${end}"`);
  }

  if (start === end) {
    return [start];
  }

  const visited = new Set<string>([start]);
  const parent = new Map<string, string>();
  const queue: string[] = [start];

  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];

    for (const neighbor of countryAdjacency[current]) {
      if (visited.has(neighbor)) continue;

      visited.add(neighbor);
      parent.set(neighbor, current);

      if (neighbor === end) {
        return reconstructPath(parent, start, end);
      }

      queue.push(neighbor);
    }
  }

  return [];
}

function reconstructPath(
  parent: Map<string, string>,
  start: string,
  end: string,
): string[] {
  const path: string[] = [end];
  let node = end;
  while (node !== start) {
    const prev = parent.get(node);
    if (prev === undefined) {
      throw new Error(`Konnte Pfad nicht rekonstruieren bei "${node}"`);
    }
    path.push(prev);
    node = prev;
  }
  return path.reverse();
}
