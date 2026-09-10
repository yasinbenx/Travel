import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Check, RotateCcw, Trash2 } from "lucide-react";
import { canvasPointsToShape, type Point } from "../game/drawScoring";
import styles from "./DrawCanvas.module.css";

type DrawCanvasProps = {
  /** The country the player is currently asked to draw. */
  countryName: string;
  /** Called with the finished drawing, already converted to "shape" (y-up) coordinates and ready for scoring. */
  onSubmit: (points: Point[]) => void;
};

const STROKE_WIDTH = 4;
/** Moving-average smoothing window (in points) applied to a finished stroke — mainly helps touch input, which tends to be jittery. */
const SMOOTHING_WINDOW = 5;

function smoothStroke(points: Point[], windowSize: number): Point[] {
  if (points.length <= 2) return points;
  const half = Math.floor(windowSize / 2);
  return points.map((_, i) => {
    const start = Math.max(0, i - half);
    const end = Math.min(points.length, i + half + 1);
    const slice = points.slice(start, end);
    const sumX = slice.reduce((sum, [x]) => sum + x, 0);
    const sumY = slice.reduce((sum, [, y]) => sum + y, 0);
    return [sumX / slice.length, sumY / slice.length] as Point;
  });
}

/** Renders one stroke as a smooth curve, using the classic "quadratic curve through consecutive midpoints" freehand-smoothing technique. */
function drawStroke(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length === 0) return;

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0][0], points[0][1], STROKE_WIDTH / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i][0] + points[i + 1][0]) / 2;
    const midY = (points[i][1] + points[i + 1][1]) / 2;
    ctx.quadraticCurveTo(points[i][0], points[i][1], midX, midY);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last[0], last[1]);
  ctx.stroke();
}

/**
 * Freehand drawing surface for Draw It: an empty, neutral canvas (no
 * outline template, no grid) the player traces a country's shape onto
 * with mouse or touch. Strokes are recorded as point lists (for later
 * scoring), rendered smoothed rather than as raw jagged pixels.
 */
export function DrawCanvas({ countryName, onSubmit }: DrawCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const isDrawingRef = useRef(false);

  // Size the canvas to fill its container at the device's actual pixel
  // density, so lines stay crisp instead of blurry on high-DPI screens.
  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Redraw every stroke from scratch whenever the stroke list changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Canvas 2D fillStyle/strokeStyle can't take a CSS var() reference
    // directly (unlike a DOM/SVG style property) — read the resolved
    // color from the cascade instead, with a literal fallback in case
    // the variable somehow isn't defined.
    const inkColor = getComputedStyle(canvas).getPropertyValue("--color-primary").trim() || "#390099";
    ctx.strokeStyle = inkColor;
    ctx.fillStyle = inkColor;
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokes) {
      drawStroke(ctx, stroke);
    }
    drawStroke(ctx, currentStroke);
  }, [strokes, currentStroke]);

  function getRelativePoint(event: ReactPointerEvent<HTMLCanvasElement>): Point {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    setCurrentStroke([getRelativePoint(event)]);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    setCurrentStroke((prev) => [...prev, getRelativePoint(event)]);
  }

  function finishStroke() {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setCurrentStroke((prev) => {
      if (prev.length >= 2) {
        setStrokes((strokesPrev) => [...strokesPrev, smoothStroke(prev, SMOOTHING_WINDOW)]);
      }
      return [];
    });
  }

  function handleUndo() {
    setStrokes((prev) => prev.slice(0, -1));
  }

  function handleClear() {
    setStrokes([]);
    setCurrentStroke([]);
  }

  function handleSubmit() {
    const allPoints = strokes.flat();
    onSubmit(canvasPointsToShape(allPoints));
  }

  const hasDrawing = strokes.length > 0;

  return (
    <div className={styles.wrapper}>
      <p className={styles.hint}>{countryName}</p>

      <div ref={containerRef} className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerLeave={finishStroke}
          onPointerCancel={finishStroke}
        />
      </div>

      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.toolButton}
          onClick={handleUndo}
          disabled={!hasDrawing}
        >
          <RotateCcw size={16} strokeWidth={2.25} />
          Undo
        </button>
        <button
          type="button"
          className={styles.toolButton}
          onClick={handleClear}
          disabled={!hasDrawing}
        >
          <Trash2 size={16} strokeWidth={2.25} />
          Clear
        </button>
        <button
          type="button"
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={!hasDrawing}
        >
          <Check size={16} strokeWidth={2.5} />
          Submit
        </button>
      </div>
    </div>
  );
}
