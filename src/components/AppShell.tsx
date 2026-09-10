import { useMemo, useState } from "react";
import { createDailyGameState } from "../game/dailyGameState";
import { getTodayDateString } from "../game/dateUtils";
import { createDailyDrawState, submitDrawing, type DrawGameState } from "../game/drawGameState";
import type { Point } from "../game/drawScoring";
import { giveUp, submitGuess, type Difficulty, type GameState } from "../game/gameEngine";
import {
  gameKey,
  hasSeenTutorial,
  loadAllDrawGames,
  loadAllGames,
  markTutorialSeen,
  saveDrawGame,
  saveGame,
} from "../game/persistence";
import { loadStreak, recordDailyCompletion, type StreakState } from "../game/streak";
import { DrawModeScreen } from "./DrawModeScreen";
import { DrawResultScreen } from "./DrawResultScreen";
import { GameBoard } from "./GameBoard";
import { OnboardingTutorial } from "./OnboardingTutorial";
import { ResultScreen } from "./ResultScreen";
import { StartScreen } from "./StartScreen";
import { StatsPanel } from "./StatsPanel";

type Selection = { mode: "puzzle"; difficulty: Difficulty } | { mode: "draw" } | null;

/**
 * Top-level component. BorderHop has exactly four daily challenges
 * available at any time — easy/medium/hard (the border-hop puzzle) plus
 * Draw It, the same for every player, each playable exactly once per
 * calendar day:
 * - `games` holds every border-hop puzzle ever played, keyed by
 *   `${date}:${difficulty}`; `drawGames` holds every Draw It round ever
 *   played, keyed by date alone (only one per day). Both persist to
 *   localStorage on every change, so nothing is ever lost and a finished
 *   round can never be started over as "new".
 * - `selection` is which of today's four challenges the player is
 *   currently looking at (`null` -> the start screen's tile picker).
 * - Whichever screen is active, state is simply read out of `games`/
 *   `drawGames` — never regenerated once it exists for a given date.
 */
export function AppShell() {
  const today = useMemo(() => getTodayDateString(), []);
  const [games, setGames] = useState<Record<string, GameState>>(() => loadAllGames());
  const [drawGames, setDrawGames] = useState<Record<string, DrawGameState>>(() => loadAllDrawGames());
  const [streak, setStreak] = useState<StreakState>(() => loadStreak());
  const [selection, setSelection] = useState<Selection>(null);
  const [puzzleError, setPuzzleError] = useState<string | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => !hasSeenTutorial());

  function handleSelectDifficulty(difficulty: Difficulty) {
    const key = gameKey(today, difficulty);
    try {
      if (!games[key]) {
        const created = createDailyGameState(today, difficulty);
        saveGame(created);
        setGames((prev) => ({ ...prev, [key]: created }));
      }
      setPuzzleError(null);
      setSelection({ mode: "puzzle", difficulty });
    } catch (error) {
      console.error("Failed to generate today's puzzle:", error);
      setPuzzleError("Couldn't load today's puzzle. Please try again.");
    }
  }

  function handleSelectDraw() {
    try {
      if (!drawGames[today]) {
        const created = createDailyDrawState(today);
        saveDrawGame(created);
        setDrawGames((prev) => ({ ...prev, [today]: created }));
      }
      setPuzzleError(null);
      setSelection({ mode: "draw" });
    } catch (error) {
      console.error("Failed to generate today's Draw It challenge:", error);
      setPuzzleError("Couldn't load today's Draw It challenge. Please try again.");
    }
  }

  function handleGuess(guess: string) {
    if (selection?.mode !== "puzzle") return;
    const key = gameKey(today, selection.difficulty);
    const current = games[key];
    if (!current) return;

    const updated = submitGuess(current, guess);
    saveGame(updated);
    setGames((prev) => ({ ...prev, [key]: updated }));

    if (updated.isWon && !current.isWon) {
      setStreak(recordDailyCompletion(today));
    }
  }

  function handleGiveUp() {
    if (selection?.mode !== "puzzle") return;
    const key = gameKey(today, selection.difficulty);
    const current = games[key];
    if (!current) return;

    const updated = giveUp(current);
    saveGame(updated);
    setGames((prev) => ({ ...prev, [key]: updated }));

    // A given-up round still keeps the streak alive, same as a win —
    // any completed challenge counts, per the "at least one per day" rule.
    if (updated.isGivenUp && !current.isGivenUp) {
      setStreak(recordDailyCompletion(today));
    }
  }

  function handleSubmitDrawing(points: Point[]) {
    const current = drawGames[today];
    if (!current) return;

    const updated = submitDrawing(current, points);
    saveDrawGame(updated);
    setDrawGames((prev) => ({ ...prev, [today]: updated }));

    // Draw It is the 4th daily challenge — completing it (all 5
    // countries drawn) keeps the streak alive too, same as any other.
    if (updated.isCompleted && !current.isCompleted) {
      setStreak(recordDailyCompletion(today));
    }
  }

  function handleGoHome() {
    setSelection(null);
    setPuzzleError(null);
  }

  if (showTutorial) {
    return (
      <OnboardingTutorial
        onDone={() => {
          markTutorialSeen();
          setShowTutorial(false);
        }}
      />
    );
  }

  if (statsOpen) {
    return (
      <StatsPanel
        games={games}
        drawGames={drawGames}
        currentStreak={streak.current}
        longestStreak={streak.longest}
        onClose={() => setStatsOpen(false)}
      />
    );
  }

  if (!selection) {
    return (
      <StartScreen
        today={today}
        games={games}
        drawGames={drawGames}
        currentStreak={streak.current}
        onSelectDifficulty={handleSelectDifficulty}
        onSelectDraw={handleSelectDraw}
        onOpenStats={() => setStatsOpen(true)}
        error={puzzleError}
      />
    );
  }

  if (selection.mode === "draw") {
    const drawState = drawGames[today];
    if (!drawState) {
      // handleSelectDraw always creates+saves the state before setting
      // `selection`, so this is unreachable in practice — a defensive
      // fallback rather than a real code path.
      return null;
    }

    if (drawState.isCompleted) {
      return (
        <DrawResultScreen
          state={drawState}
          onHome={handleGoHome}
          onOpenStats={() => setStatsOpen(true)}
        />
      );
    }

    return (
      <DrawModeScreen
        state={drawState}
        onSubmitDrawing={handleSubmitDrawing}
        onHome={handleGoHome}
        onOpenStats={() => setStatsOpen(true)}
      />
    );
  }

  const state = games[gameKey(today, selection.difficulty)];
  if (!state) {
    // handleSelectDifficulty always creates+saves the game before setting
    // `selection`, so this is unreachable in practice — a defensive
    // fallback rather than a real code path.
    return null;
  }

  if (state.isWon || state.isGivenUp) {
    return (
      <ResultScreen
        state={state}
        currentStreak={streak.current}
        onHome={handleGoHome}
        onOpenStats={() => setStatsOpen(true)}
      />
    );
  }

  return (
    <GameBoard
      state={state}
      onGuess={handleGuess}
      onGiveUp={handleGiveUp}
      onHome={handleGoHome}
      onOpenStats={() => setStatsOpen(true)}
    />
  );
}
