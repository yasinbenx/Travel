import { useEffect, useState } from "react";
import { findShortestPath } from "../lib/findShortestPath";
import { generateDailyPuzzle, submitGuess, type GameState } from "../game/gameEngine";
import { loadGameState, saveGameState } from "../game/persistence";
import { GuessInput } from "./GuessInput";
import { GuessList } from "./GuessList";
import { MapView } from "./MapView";
import { ResultSummary } from "./ResultSummary";
import { StartEndBox } from "./StartEndBox";
import { WrongGuessesPanel } from "./WrongGuessesPanel";
import styles from "./GameBoard.module.css";

function getTodaySeed(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createFreshGameState(seed: string): GameState {
  const { start, end } = generateDailyPuzzle(seed);
  const optimalPath = findShortestPath(start, end);
  return {
    start,
    end,
    optimalPath,
    correctGuesses: [],
    wrongGuesses: [],
    isWon: false,
  };
}

function loadOrCreateGameState(): GameState {
  const seed = getTodaySeed();
  return loadGameState(seed) ?? createFreshGameState(seed);
}

/**
 * Verbindet Spielzustand und Teil-Komponenten zum vollständigen Tagesrätsel:
 * Start/Ziel oben, Eingabe darunter, Ergebnis-Zusammenfassung bei Sieg,
 * die geratene Länderkette und Weltkarte in der Mitte, falsche Versuche
 * eingeklappt am Fuß. Der Fortschritt wird unter einem auf das heutige
 * Datum bezogenen Key im localStorage gesichert, sodass ein Reload ihn
 * nicht verliert, ein neuer Tag aber automatisch ein neues Rätsel startet.
 */
export function GameBoard() {
  const [gameState, setGameState] = useState<GameState>(loadOrCreateGameState);

  useEffect(() => {
    saveGameState(getTodaySeed(), gameState);
  }, [gameState]);

  function handleGuess(guess: string) {
    setGameState((prev) => submitGuess(prev, guess));
  }

  const intermediateStepsInOptimalPath = gameState.optimalPath.length - 2;
  const excludeNames = [gameState.start, ...gameState.correctGuesses];

  return (
    <div className={styles.board}>
      <h1 className={styles.title}>Travle-Klon</h1>
      <p className={styles.subtitle}>
        Finde eine Kette von Landgrenzen von Start bis Ziel.
      </p>

      <StartEndBox start={gameState.start} end={gameState.end} />

      <GuessInput
        onGuess={handleGuess}
        disabled={gameState.isWon}
        excludeNames={excludeNames}
      />

      <ResultSummary state={gameState} />

      <p className={styles.progress}>
        {gameState.correctGuesses.length}{" "}
        {gameState.correctGuesses.length === 1 ? "Land" : "Länder"} erraten · optimaler
        Pfad: {intermediateStepsInOptimalPath} Zwischenländer
      </p>

      <GuessList state={gameState} />

      <MapView
        start={gameState.start}
        end={gameState.end}
        correctGuesses={gameState.correctGuesses}
      />

      <WrongGuessesPanel wrongGuesses={gameState.wrongGuesses} />
    </div>
  );
}
