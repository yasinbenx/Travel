import { useState } from "react";
import { getValidIntermediateCountries, submitGuess, type GameState } from "../game/gameEngine";
import { GuessInput } from "./GuessInput";
import { MapView } from "./MapView";
import styles from "./OnboardingTutorial.module.css";

type OnboardingTutorialProps = {
  onDone: () => void;
};

/**
 * A throwaway, never-persisted puzzle: Germany and France are direct
 * land-border neighbors, so a single correct guess wins instantly —
 * about as gentle an example as the real game allows.
 */
function createTutorialState(): GameState {
  return {
    date: "tutorial",
    difficulty: "easy",
    start: "Germany",
    end: "France",
    optimalPath: ["Germany", "France"],
    guesses: [],
    isWon: false,
    isGivenUp: false,
  };
}

/**
 * First-visit mini walkthrough: a real (but fixed, disposable) 2-country
 * puzzle using the actual game components — GuessInput and MapView — so
 * the demo behaves exactly like the real game, just with training
 * wheels. Shown once, then never again (see `markTutorialSeen`).
 */
export function OnboardingTutorial({ onDone }: OnboardingTutorialProps) {
  const [state, setState] = useState<GameState>(createTutorialState);

  function handleGuess(guess: string) {
    setState((prev) => submitGuess(prev, guess));
  }

  function handleReset() {
    setState(createTutorialState());
  }

  const wrongGuessMade = state.guesses.length > 0 && !state.isWon;

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Quick tutorial</p>
        <h1 className={styles.title}>How to play</h1>
        <p className={styles.text}>
          <strong className={styles.start}>Germany</strong> is your start, {" "}
          <strong className={styles.target}>France</strong> is the target. Type a country that
          shares a land border to chain your way there.
        </p>

        <div className={styles.mapWrapper}>
          <MapView start={state.start} target={state.end} guesses={state.guesses} isWon={state.isWon} />
        </div>

        {state.isWon ? (
          <div className={styles.success}>
            <p className={styles.successText}>
              🎉 That's it! France directly borders Germany, so that single guess reached the
              target and won the round.
            </p>
            <p className={styles.successText}>
              Every guess gets colored by quality: <span className={styles.gold}>gold</span>/
              <span className={styles.green}>green</span> = perfect route,{" "}
              <span className={styles.orange}>orange</span> = a small detour,{" "}
              <span className={styles.red}>red</span> = a bad move.
            </p>
            <button type="button" className={styles.primaryButton} onClick={onDone}>
              Start playing
            </button>
          </div>
        ) : (
          <>
            <GuessInput
              onGuess={handleGuess}
              excludeNames={[state.start, ...getValidIntermediateCountries(state)]}
            />
            {wrongGuessMade && (
              <p className={styles.hint}>
                That's not the way to France from here — try{" "}
                <button type="button" className={styles.resetLink} onClick={handleReset}>
                  resetting the example
                </button>{" "}
                and guessing France directly.
              </p>
            )}
          </>
        )}

        <button type="button" className={styles.skipButton} onClick={onDone}>
          Skip tutorial
        </button>
      </div>
    </div>
  );
}
