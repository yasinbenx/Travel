import { useState } from "react";
import type { GameState } from "../game/gameEngine";
import { buildEmojiGrid, buildShareText } from "../game/shareResult";
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
    // Fällt unten auf die execCommand-Variante zurück.
  }

  // Fallback für Kontexte ohne (oder mit blockierter) Clipboard-API.
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
 * Erscheint, sobald das Rätsel gelöst ist: zeigt die eigene Schrittzahl
 * im Vergleich zur optimalen Schrittzahl sowie ein Wordle-artiges
 * Emoji-Grid, das per Klick als Ergebnistext in die Zwischenablage
 * kopiert werden kann.
 */
export function ResultSummary({ state }: ResultSummaryProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  if (!state.isWon) {
    return null;
  }

  const steps = state.correctGuesses.length;
  const optimalSteps = state.optimalPath.length - 2;
  const tookOptimalRoute = steps <= optimalSteps;

  async function handleShare() {
    const success = await copyToClipboard(buildShareText(state));
    setCopyStatus(success ? "copied" : "error");
    setTimeout(() => setCopyStatus("idle"), 2000);
  }

  const shareLabel =
    copyStatus === "copied"
      ? "✅ Kopiert!"
      : copyStatus === "error"
        ? "Kopieren fehlgeschlagen"
        : "📋 Teilen";

  return (
    <div className={styles.card} role="status">
      <p className={styles.heading}>🎉 Geschafft!</p>
      <p className={styles.stats}>
        {steps} {steps === 1 ? "Schritt" : "Schritte"} · optimal: {optimalSteps}
      </p>
      <p className={styles.grid} aria-hidden="true">
        {buildEmojiGrid(state)}
      </p>

      {tookOptimalRoute ? (
        <p className={styles.optimalMessage}>🏆 Du hast die optimale Route gewählt!</p>
      ) : (
        <div className={styles.optimalRoute}>
          <p className={styles.optimalRouteLabel}>Optimale Route wäre gewesen:</p>
          <p className={styles.optimalRoutePath}>{state.optimalPath.join(" → ")}</p>
        </div>
      )}

      <button type="button" className={styles.shareButton} onClick={handleShare}>
        {shareLabel}
      </button>
    </div>
  );
}
