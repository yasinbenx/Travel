import { useMemo, useState } from "react";
import { createDailyGameState } from "../game/dailyGameState";
import { getTodayDateString } from "../game/dateUtils";
import { submitGuess, type Difficulty, type GameState } from "../game/gameEngine";
import { gameKey, hasSeenTutorial, loadAllGames, markTutorialSeen, saveGame } from "../game/persistence";
import { loadStreak, recordDailyCompletion, type StreakState } from "../game/streak";
import { GameBoard } from "./GameBoard";
import { OnboardingTutorial } from "./OnboardingTutorial";
import { ResultScreen } from "./ResultScreen";
import { StartScreen } from "./StartScreen";
import { StatsPanel } from "./StatsPanel";

type Selection = { difficulty: Difficulty } | null;

/**
 * Top-level component. BorderHop has exactly three puzzles available at
 * any time — today's easy/medium/hard daily challenges, the same for
 * every player, each playable exactly once per calendar day:
 * - `games` holds every daily puzzle ever played (in progress or
 *   finished), keyed by `${date}:${difficulty}` and persisted to
 *   localStorage on every guess, so nothing is ever lost and a finished
 *   puzzle can never be started over as "new".
 * - `selection` is which of today's three challenges the player is
 *   currently looking at (`null` -> the start screen's tile picker).
 * - Whichever screen is active, `state` is simply read out of `games` —
 *   never regenerated once it exists for a given date+difficulty.
 */
export function AppShell() {
  const today = useMemo(() => getTodayDateString(), []);
  const [games, setGames] = useState<Record<string, GameState>>(() => loadAllGames());
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
      setSelection({ difficulty });
    } catch (error) {
      console.error("Failed to generate today's puzzle:", error);
      setPuzzleError("Couldn't load today's puzzle. Please try again.");
    }
  }

  function handleGuess(guess: string) {
    if (!selection) return;
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
        currentStreak={streak.current}
        onSelectDifficulty={handleSelectDifficulty}
        onOpenStats={() => setStatsOpen(true)}
        error={puzzleError}
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

  if (state.isWon) {
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
      onHome={handleGoHome}
      onOpenStats={() => setStatsOpen(true)}
    />
  );
}
