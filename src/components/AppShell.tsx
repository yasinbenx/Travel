import { useEffect, useState } from "react";
import { createFreshGameState, getTodaySeed } from "../game/dailyGameState";
import { submitGuess, type GameState } from "../game/gameEngine";
import { loadGameState, saveGameState } from "../game/persistence";
import { GameBoard } from "./GameBoard";
import { ResultScreen } from "./ResultScreen";
import { StartScreen } from "./StartScreen";

type Phase = "start" | "playing";

function loadOrCreateGameState(): GameState {
  const seed = getTodaySeed();
  return loadGameState(seed) ?? createFreshGameState(seed);
}

/**
 * Top-Level-Komponente: lädt den Spielstand für das heutige Datum (oder
 * erzeugt ein frisches Rätsel) und schaltet je nach Zustand zwischen drei
 * Ansichten um:
 * - Ist das heutige Rätsel bereits gewonnen (egal ob gerade eben oder
 *   schon vor einem Reload) -> Ergebnis-Screen. Das wird direkt aus
 *   `gameState.isWon` abgeleitet, nicht über einen extra Zwischenschritt,
 *   damit ein Sieg sofort greift, sobald er im State steht.
 * - Sonst, falls der Spieler noch nicht auf "Spielen" getippt hat ->
 *   Startbildschirm mit "Spielen"/"Weiterspielen"-Button.
 * - Sonst das eigentliche Spielbrett.
 */
export function AppShell() {
  const [gameState, setGameState] = useState<GameState>(loadOrCreateGameState);
  const [phase, setPhase] = useState<Phase>("start");

  useEffect(() => {
    saveGameState(getTodaySeed(), gameState);
  }, [gameState]);

  function handleGuess(guess: string) {
    setGameState((prev) => submitGuess(prev, guess));
  }

  if (gameState.isWon) {
    return <ResultScreen state={gameState} />;
  }

  if (phase === "start") {
    return (
      <StartScreen
        start={gameState.start}
        end={gameState.end}
        hasProgress={gameState.correctGuesses.length > 0}
        onStart={() => setPhase("playing")}
      />
    );
  }

  return <GameBoard state={gameState} onGuess={handleGuess} />;
}
