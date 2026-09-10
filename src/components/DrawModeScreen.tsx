import type { DrawGameState } from "../game/drawGameState";
import type { Point } from "../game/drawScoring";
import { AppHeader } from "./AppHeader";
import { DrawCanvas } from "./DrawCanvas";
import styles from "./DrawModeScreen.module.css";

type DrawModeScreenProps = {
  state: DrawGameState;
  onSubmitDrawing: (points: Point[]) => void;
  onHome: () => void;
  onOpenStats: () => void;
};

/**
 * Active-play screen for Draw It: one country at a time, freehand on a
 * neutral canvas. Only rendered by `AppShell` while the day's 5 countries
 * aren't all submitted yet — see `DrawResultScreen` for what comes after.
 */
export function DrawModeScreen({ state, onSubmitDrawing, onHome, onOpenStats }: DrawModeScreenProps) {
  const currentCountry = state.countries[state.currentIndex];

  return (
    <div className={styles.app}>
      <AppHeader
        centerContent={
          <span className={styles.progress}>
            Country {state.currentIndex + 1} of {state.countries.length}
          </span>
        }
        onHome={onHome}
        onOpenStats={onOpenStats}
      />

      <main className={styles.canvasArea}>
        {/* Remounts DrawCanvas for each new country, so its stroke state resets automatically instead of via an effect. */}
        <DrawCanvas key={currentCountry} countryName={currentCountry} onSubmit={onSubmitDrawing} />
      </main>
    </div>
  );
}
