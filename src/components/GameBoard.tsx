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
 * Kartenzentrierte Ansicht: die Weltkarte nimmt den Großteil des
 * Bildschirms ein und deckt Land für Land den gefundenen Pfad auf. Start/
 * Ziel stehen als schlanke Kopfzeile darüber, der Fortschritt und die
 * falschen Versuche liegen als kleine, unauffällige Overlays auf der
 * Karte, die Eingabe ist unten fest angedockt. Der Fortschritt wird unter
 * einem auf das heutige Datum bezogenen Key im localStorage gesichert.
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
  const revealedCountries = [gameState.start, ...gameState.correctGuesses];

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Travle-Klon</h1>
        <StartEndBox start={gameState.start} end={gameState.end} compact />
      </header>

      <main className={styles.mapArea}>
        <MapView
          revealedCountries={revealedCountries}
          target={gameState.end}
          isWon={gameState.isWon}
        />

        <div className={`${styles.overlay} ${styles.progressOverlay}`}>
          <p className={styles.progressText}>
            {gameState.correctGuesses.length}{" "}
            {gameState.correctGuesses.length === 1 ? "Land" : "Länder"} · optimal:{" "}
            {intermediateStepsInOptimalPath}
          </p>
          <GuessList state={gameState} compact />
        </div>

        <div className={`${styles.overlay} ${styles.wrongOverlay}`}>
          <WrongGuessesPanel wrongGuesses={gameState.wrongGuesses} />
        </div>

        {gameState.isWon && (
          <div className={styles.resultOverlay}>
            <ResultSummary state={gameState} />
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <GuessInput
          onGuess={handleGuess}
          disabled={gameState.isWon}
          excludeNames={excludeNames}
        />
      </footer>
    </div>
  );
}
