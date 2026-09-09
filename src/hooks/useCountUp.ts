import { useEffect, useRef, useState } from "react";

const EASE_OUT_QUINT = (t: number): number => 1 - Math.pow(1 - t, 5);

/**
 * Animates a number counting up from 0 to `target` over `durationMs`,
 * used for the stats page's big overview numbers so the page feels alive
 * on load rather than just dumping static digits. Skips straight to
 * `target` when the browser/OS requests reduced motion, or when `target`
 * is 0 (nothing to animate).
 */
export function useCountUp(target: number, durationMs = 1100): number {
  const [value, setValue] = useState(0);
  const prefersReducedMotion = useRef(
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (target <= 0 || prefersReducedMotion.current) {
      setValue(target);
      return;
    }

    let frame: number;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      setValue(Math.round(EASE_OUT_QUINT(progress) * target));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}
