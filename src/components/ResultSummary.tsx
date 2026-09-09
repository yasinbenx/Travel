import { useState } from "react";
import { Check, Flag, Link2, PartyPopper, Share2, Trophy, X } from "lucide-react";
import { getConfirmedChain, type GameState, type Guess } from "../game/gameEngine";
import { buildEmojiGrid, buildShareText } from "../game/shareResult";
import { MapView } from "./MapView";
import { StreakBadge } from "./StreakBadge";
import styles from "./ResultSummary.module.css";

type ResultSummaryProps = {
  state: GameState;
  currentStreak: number;
};

type CopyStatus = "idle" | "copied" | "error";
type CopyTarget = "text" | "link" | null;

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
 * Appears once the round is finished — either won or given up. On a win,
 * shows the player's own step count compared to the optimal step count,
 * plus a Wordle-style emoji grid that can be copied to the clipboard as
 * shareable result text. On a give-up, skips all of that (there's no
 * player route to compare) and simply shows the optimal solution.
 */
export function ResultSummary({ state, currentStreak }: ResultSummaryProps) {
  const [copyTarget, setCopyTarget] = useState<CopyTarget>(null);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  if (!state.isWon && !state.isGivenUp) {
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
    const success = await copyToClipboard(buildShareText(state, currentStreak));
    setCopyTarget("text");
    setCopyStatus(success ? "copied" : "error");
    setTimeout(() => setCopyStatus("idle"), 2000);
  }

  async function handleCopyLink() {
    const success = await copyToClipboard(window.location.origin);
    setCopyTarget("link");
    setCopyStatus(success ? "copied" : "error");
    setTimeout(() => setCopyStatus("idle"), 2000);
  }

  const shareStatus = copyTarget === "text" ? copyStatus : "idle";
  const linkStatus = copyTarget === "link" ? copyStatus : "idle";

  const ShareIcon = shareStatus === "copied" ? Check : shareStatus === "error" ? X : Share2;
  const shareLabel =
    shareStatus === "copied" ? "Copied!" : shareStatus === "error" ? "Copy failed" : "Share";

  const LinkIcon = linkStatus === "copied" ? Check : linkStatus === "error" ? X : Link2;
  const linkLabel =
    linkStatus === "copied" ? "Link copied!" : linkStatus === "error" ? "Copy failed" : "Copy link";

  return (
    <div className={styles.card} role="status">
      {state.isGivenUp ? (
        <p className={styles.heading}>
          <Flag size={20} strokeWidth={2.25} />
          You gave up
        </p>
      ) : (
        <p className={styles.heading}>
          <PartyPopper size={20} strokeWidth={2.25} />
          You made it!
        </p>
      )}
      {currentStreak > 0 && <StreakBadge days={currentStreak} />}

      {state.isWon && (
        <>
          <p className={styles.stats}>
            {steps} {steps === 1 ? "step" : "steps"} · optimal: {optimalSteps}
          </p>
          <p className={styles.grid} aria-hidden="true">
            {buildEmojiGrid(state)}
          </p>
        </>
      )}

      {state.isWon && tookOptimalRoute ? (
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

      <div className={styles.shareRow}>
        <button type="button" className={styles.shareButton} onClick={handleShare}>
          <ShareIcon size={16} strokeWidth={2.5} />
          {shareLabel}
        </button>
        <button type="button" className={styles.linkButton} onClick={handleCopyLink}>
          <LinkIcon size={15} strokeWidth={2.5} />
          {linkLabel}
        </button>
      </div>
    </div>
  );
}
