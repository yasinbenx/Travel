import { countryAdjacency } from "../data/countryAdjacency";

/**
 * Finds the shortest path between two countries via shared land borders,
 * using breadth-first search (BFS) over the adjacency list.
 *
 * @returns Array of countries on the path (including start and end).
 *          Empty array if no path exists (e.g. island states with no
 *          land connection).
 * @throws Error if `start` or `end` isn't a known country.
 */
export function findShortestPath(start: string, end: string): string[] {
  if (!(start in countryAdjacency)) {
    throw new Error(`Unknown country: "${start}"`);
  }
  if (!(end in countryAdjacency)) {
    throw new Error(`Unknown country: "${end}"`);
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

/**
 * Computes the BFS shortest-hop distance from `origin` to every country
 * reachable from it via land borders (the adjacency graph is symmetric,
 * so this also gives the distance *to* `origin` from anywhere). Used to
 * grade how much of a detour a guess is, relative to the shortest
 * possible remaining route to a target.
 *
 * @throws Error if `origin` isn't a known country.
 */
export function computeDistancesFrom(origin: string): Map<string, number> {
  if (!(origin in countryAdjacency)) {
    throw new Error(`Unknown country: "${origin}"`);
  }

  const distances = new Map<string, number>([[origin, 0]]);
  const queue: string[] = [origin];

  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    const currentDistance = distances.get(current)!;

    for (const neighbor of countryAdjacency[current]) {
      if (distances.has(neighbor)) continue;
      distances.set(neighbor, currentDistance + 1);
      queue.push(neighbor);
    }
  }

  return distances;
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
      throw new Error(`Could not reconstruct path at "${node}"`);
    }
    path.push(prev);
    node = prev;
  }
  return path.reverse();
}
