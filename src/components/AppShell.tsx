import { useEffect, useState } from "react";
import { submitGuess, type Difficulty, type GameState } from "../game/gameEngine";
import { clearGameState, loadGameState, saveGameState } from "../game/persistence";
import { createRandomGameState } from "../game/randomGameState";
import { GameBoard } from "./GameBoard";
import { ResultScreen } from "./ResultScreen";
import { StartScreen } from "./StartScreen";

/**
 * Top-level component: loads any in-progress/finished game from
 * localStorage (if any) and switches between three views based on that
 * state, purely derived on every render — no extra "phase" state to keep
 * in sync:
 * - No saved state yet -> start screen with a "Play" button. Clicking it
 *   generates a brand-new random puzzle (there is no daily puzzle).
 * - Saved state exists and is already won -> result screen (works
 *   identically right after winning and after a reload, since it's read
 *   straight off `gameState.isWon`).
 * - Otherwise -> the game board, resuming any in-progress guesses.
 */
export function AppShell() {
  const [gameState, setGameState] = useState<GameState | null>(() => loadGameState());
  const [puzzleError, setPuzzleError] = useState<string | null>(null);

  useEffect(() => {
    if (gameState) {
      saveGameState(gameState);
    }
  }, [gameState]);

  function handleGuess(guess: string) {
    setGameState((prev) => (prev ? submitGuess(prev, guess) : prev));
  }

  function handleNewGame(difficulty: Difficulty = gameState?.difficulty ?? "medium") {
    try {
      setGameState(createRandomGameState(difficulty));
      setPuzzleError(null);
    } catch (error) {
      console.error("Failed to generate a new puzzle:", error);
      setPuzzleError("Couldn't find a new puzzle. Please try again.");
    }
  }

  /**
   * Drops the current round entirely and returns to the start screen —
   * used by both the always-visible header "Home" button and the result
   * screen's "Change difficulty" action. Clears localStorage too, so a
   * reload doesn't resurrect the round the player just left.
   */
  function handleGoHome() {
    clearGameState();
    setGameState(null);
    setPuzzleError(null);
  }

  if (!gameState) {
    return <StartScreen onStart={handleNewGame} error={puzzleError} />;
  }

  if (gameState.isWon) {
    return (
      <ResultScreen
        state={gameState}
        onPlayAgain={() => handleNewGame()}
        onChangeDifficulty={handleGoHome}
        onHome={handleGoHome}
      />
    );
  }

  return (
    <GameBoard
      state={gameState}
      onGuess={handleGuess}
      onRestart={() => handleNewGame()}
      onHome={handleGoHome}
    />
  );
}
