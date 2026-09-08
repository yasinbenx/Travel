import { useState } from "react";
import { Check, PartyPopper, Share2, Trophy, X } from "lucide-react";
import { getConfirmedChain, type GameState, type Guess } from "../game/gameEngine";
import { buildEmojiGrid, buildShareText } from "../game/shareResult";
import { MapView } from "./MapView";
import styles from "./ResultSummary.module.css";

type ResultSummaryProps = {
  state: GameState;
};

type CopyStatus = "idle" | "copied" | "error";

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Falls through to the execCommand fallback below.
  }

  // Fallback for contexts without (or with blocked) Clipboard API access.
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

/**
 * Appears once the round is won: shows the player's own step count
 * compared to the optimal step count, plus a Wordle-style emoji grid
 * that can be copied to the clipboard as shareable result text.
 */
export function ResultSummary({ state }: ResultSummaryProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  if (!state.isWon) {
    return null;
  }

  const steps = getConfirmedChain(state).length;
  const optimalSteps = state.optimalPath.length - 2;
  const tookOptimalRoute = steps <= optimalSteps;

  // Reference-only display: every intermediate country of the optimal path,
  // colored consistently (green = "on the ideal route"), regardless of what
  // the player actually guessed.
  const optimalPathGuesses: Guess[] = state.optimalPath.slice(1, -1).map((country) => ({
    country,
    quality: "green",
    isNeighbor: true,
  }));

  async function handleShare() {
    const success = await copyToClipboard(buildShareText(state));
    setCopyStatus(success ? "copied" : "error");
    setTimeout(() => setCopyStatus("idle"), 2000);
  }

  const ShareIcon = copyStatus === "copied" ? Check : copyStatus === "error" ? X : Share2;
  const shareLabel =
    copyStatus === "copied" ? "Copied!" : copyStatus === "error" ? "Copy failed" : "Share";

  return (
    <div className={styles.card} role="status">
      <p className={styles.heading}>
        <PartyPopper size={20} strokeWidth={2.25} />
        You made it!
      </p>
      <p className={styles.stats}>
        {steps} {steps === 1 ? "step" : "steps"} · optimal: {optimalSteps}
      </p>
      <p className={styles.grid} aria-hidden="true">
        {buildEmojiGrid(state)}
      </p>

      {tookOptimalRoute ? (
        <p className={styles.optimalMessage}>
          <Trophy size={16} strokeWidth={2.25} />
          You found the optimal route!
        </p>
      ) : (
        <div className={styles.optimalRoute}>
          <p className={styles.optimalRouteLabel}>The optimal route</p>
          <div className={styles.optimalRouteMap}>
            <MapView
              start={state.start}
              target={state.end}
              guesses={optimalPathGuesses}
              isWon={false}
            />
          </div>
          <p className={styles.optimalRoutePath}>{state.optimalPath.join(" → ")}</p>
        </div>
      )}

      <button type="button" className={styles.shareButton} onClick={handleShare}>
        <ShareIcon size={16} strokeWidth={2.5} />
        {shareLabel}
      </button>
    </div>
  );
}
