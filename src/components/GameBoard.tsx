import { useState } from "react";
import { findShortestPath } from "../lib/findShortestPath";
import { generateDailyPuzzle, submitGuess, type GameState } from "../game/gameEngine";
import { GuessInput } from "./GuessInput";
import { GuessList } from "./GuessList";
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

function createInitialGameState(): GameState {
  const { start, end } = generateDailyPuzzle(getTodaySeed());
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

/**
 * Verbindet Spielzustand und Teil-Komponenten zum vollständigen Tagesrätsel:
 * Start/Ziel oben, Eingabe darunter, die geratene Länderkette in der Mitte
 * und die falschen Versuche eingeklappt am Fuß.
 */
export function GameBoard() {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState);

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

      {gameState.isWon && (
        <div className={styles.banner} role="status">
          🎉 Geschafft! {gameState.correctGuesses.length} Länder von {gameState.start} bis{" "}
          {gameState.end}.
        </div>
      )}

      <p className={styles.progress}>
        {gameState.correctGuesses.length}{" "}
        {gameState.correctGuesses.length === 1 ? "Land" : "Länder"} erraten · optimaler
        Pfad: {intermediateStepsInOptimalPath} Zwischenländer
      </p>

      <GuessList state={gameState} />

      <WrongGuessesPanel wrongGuesses={gameState.wrongGuesses} />
    </div>
  );
}
