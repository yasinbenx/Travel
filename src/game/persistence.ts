import type { GameState } from "./gameEngine";

const STORAGE_PREFIX = "travle-klon:";

function isGameState(value: unknown): value is GameState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.start === "string" &&
    typeof candidate.end === "string" &&
    Array.isArray(candidate.optimalPath) &&
    Array.isArray(candidate.correctGuesses) &&
    Array.isArray(candidate.wrongGuesses) &&
    typeof candidate.isWon === "boolean"
  );
}

/**
 * Lädt einen gespeicherten Spielstand für den gegebenen Seed (z.B. das
 * heutige Datum) aus dem localStorage. Gibt `null` zurück, wenn nichts
 * gespeichert ist oder die Daten nicht mehr zum erwarteten Format passen
 * (z.B. nach einem Format-Wechsel) — dann startet die Runde einfach neu,
 * statt mit einem defekten State abzustürzen.
 */
export function loadGameState(seed: string): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + seed);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isGameState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Speichert den Spielstand unter einem auf den Seed (heutiges Datum)
 * bezogenen Key, damit ein Reload den Fortschritt nicht verliert und an
 * einem neuen Tag automatisch wieder bei einem frischen Rätsel startet.
 * Schlägt das Speichern fehl (privater Modus, volles Kontingent, …), wird
 * der Fehler bewusst verschluckt — Persistenz ist ein Komfortfeature,
 * kein Grund, das Spiel abzubrechen.
 */
export function saveGameState(seed: string, state: GameState): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + seed, JSON.stringify(state));
  } catch {
    // Speichern übersprungen (z.B. privater Modus oder Kontingent voll).
  }
}
