import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { haptic } from "../../utils/haptic";
import "./ScratchCard.css";

type ScratchCardProps = {
  /** Printed on the foil. */
  prompt: string;
  /** Accessible name of the card before it is revealed. */
  revealLabel: string;
  /** What the foil hides. */
  children: ReactNode;
  /** Text announced to screen readers once revealed. */
  announcement: string;
  reducedMotion: boolean;
  className?: string;
};

/** Share of foil that must be scratched away before the rest dissolves by itself. */
const REVEAL_AT = 0.45;

/**
 * A gold-foil scratch card. Scratching (finger, pen or mouse) clears the foil;
 * past REVEAL_AT the remainder dissolves. Keyboard: focus and press Enter/Space.
 * Scratching on the card does not scroll the page (touch-action: none); swiping
 * anywhere else still does.
 */
export function ScratchCard({
  prompt,
  revealLabel,
  children,
  announcement,
  reducedMotion,
  className = "",
}: ScratchCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [foilGone, setFoilGone] = useState(false);
  const scratched = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const moves = useRef(0);
  /** pointerId of the stroke in progress, or null. */
  const drawing = useRef<number | null>(null);

  const paintFoil = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || scratched.current) return;
    const { width, height } = wrap.getBoundingClientRect();
    if (!width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Gold foil, in the invitation's antique golds.
    const foil = ctx.createLinearGradient(0, 0, width, height);
    foil.addColorStop(0, "#a8823e");
    foil.addColorStop(0.28, "#e6d3a3");
    foil.addColorStop(0.5, "#c4a15c");
    foil.addColorStop(0.74, "#f1e3bd");
    foil.addColorStop(1, "#b08a45");
    ctx.fillStyle = foil;
    ctx.fillRect(0, 0, width, height);

    // A fine sparkle so it reads as foil, not a flat fill (fixed pattern: no flicker on resize).
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < (width * height) / 90; i++) {
      ctx.fillStyle = `rgba(255, 250, 235, ${0.08 + rand() * 0.22})`;
      ctx.fillRect(rand() * width, rand() * height, 1, 1);
    }

    // Inner hairline, like the gold frames used across the invitation.
    ctx.strokeStyle = "rgba(255, 248, 230, 0.55)";
    ctx.lineWidth = 1;
    ctx.strokeRect(5.5, 5.5, width - 11, height - 11);

    ctx.fillStyle = "rgba(60, 43, 46, 0.88)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `italic 500 ${Math.round(height * 0.36)}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillText(prompt, width / 2, height / 2 + 1);
  }, [prompt]);

  useLayoutEffect(() => {
    paintFoil();
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => paintFoil());
    ro.observe(wrap);
    // Repaint once the display font is ready, so the prompt is set in Cormorant.
    document.fonts?.load(`italic 500 32px "Cormorant Garamond"`).then(paintFoil, () => undefined);
    return () => ro.disconnect();
  }, [paintFoil]);

  const reveal = useCallback(() => {
    setRevealed((already) => {
      if (!already) haptic(18);
      return true;
    });
  }, []);

  // iOS will otherwise treat the foil as a scroll gesture. Native, non-passive
  // listeners are required: React's onPointerDown cannot cancel touch scrolling.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || foilGone) return;
    const blockScroll = (event: TouchEvent) => event.preventDefault();
    canvas.addEventListener("touchstart", blockScroll, { passive: false });
    canvas.addEventListener("touchmove", blockScroll, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", blockScroll);
      canvas.removeEventListener("touchmove", blockScroll);
    };
  }, [foilGone]);

  useEffect(() => {
    if (revealed && reducedMotion) setFoilGone(true);
  }, [revealed, reducedMotion]);

  const clearedShare = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return 0;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const step = 8;
    let clear = 0;
    let total = 0;
    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        total++;
        if (data[(y * canvas.width + x) * 4 + 3] < 40) clear++;
      }
    }
    return total ? clear / total : 0;
  };

  const scratchTo = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    if (!scratched.current) haptic(8);
    scratched.current = true;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // Brush in proportion to the card: two natural swipes (a thicker finger on phones).
    const finger = window.matchMedia("(pointer: coarse)").matches;
    ctx.lineWidth = Math.max(finger ? 40 : 28, rect.height * (finger ? 0.68 : 0.56));
    ctx.beginPath();
    const from = last.current ?? point;
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(point.x + 0.01, point.y);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    last.current = point;
    moves.current += 1;
    if (moves.current % 8 === 0 && clearedShare() >= REVEAL_AT) reveal();
  };

  // A stroke ends on release, cancel or lost capture; coverage is always checked then.
  const endStroke = () => {
    if (drawing.current === null) return;
    drawing.current = null;
    last.current = null;
    if (!revealed && clearedShare() >= REVEAL_AT) reveal();
  };

  return (
    <div className={`scratch ${revealed ? "is-revealed" : ""} ${className}`.trim()} ref={wrapRef}>
      <div className="scratch__content" aria-hidden={!revealed}>
        {children}
      </div>
      <p className="sr-only" aria-live="polite">
        {revealed ? announcement : ""}
      </p>

      {!foilGone ? (
        <canvas
          ref={canvasRef}
          className="scratch__foil"
          role="button"
          tabIndex={revealed ? -1 : 0}
          aria-label={revealLabel}
          aria-hidden={revealed}
          onPointerDown={(event) => {
            if (revealed) return;
            event.preventDefault();
            drawing.current = event.pointerId;
            try {
              event.currentTarget.setPointerCapture(event.pointerId);
            } catch {
              /* capture is a nicety; the stroke is tracked by pointerId regardless */
            }
            last.current = null;
            scratchTo(event);
          }}
          onPointerMove={(event) => {
            if (revealed || drawing.current !== event.pointerId) return;
            scratchTo(event);
          }}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onLostPointerCapture={endStroke}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              reveal();
            }
          }}
          onTransitionEnd={() => {
            if (revealed) setFoilGone(true);
          }}
        />
      ) : null}
    </div>
  );
}
