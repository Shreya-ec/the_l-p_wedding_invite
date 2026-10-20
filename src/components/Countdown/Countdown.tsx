import { useLayoutEffect, useRef, useState } from "react";
import { useCountdown } from "../../hooks/useCountdown";
import "./Countdown.css";

type CountdownProps = {
  /** ISO 8601 instant with offset, e.g. "2026-12-11T00:00:00+05:30". */
  target: string;
  /** Shown in place of the numbers once the target has passed. */
  completeMessage: string;
  reducedMotion: boolean;
  className?: string;
};

const UNITS = [
  { key: "days", label: "Days", singular: "day" },
  { key: "hours", label: "Hours", singular: "hour" },
  { key: "minutes", label: "Minutes", singular: "minute" },
  { key: "seconds", label: "Seconds", singular: "second" },
] as const;

/**
 * One character of a number. When it changes, the old glyph dissolves away as
 * the new one settles in (opacity with a whisper of lift and blur); unchanged
 * characters stay perfectly still.
 */
function Digit({ char, animate }: { char: string; animate: boolean }) {
  const [leaving, setLeaving] = useState<{ char: string; id: number } | null>(null);
  const previous = useRef(char);
  const counter = useRef(0);

  // Layout effect: the swap is applied before paint, so the new glyph never shows
  // un-animated for a frame.
  useLayoutEffect(() => {
    if (previous.current === char) return;
    if (animate) {
      counter.current += 1;
      setLeaving({ char: previous.current, id: counter.current });
    }
    previous.current = char;
  }, [char, animate]);

  return (
    <span className="countdown__digit">
      {leaving ? (
        <span
          key={`out-${leaving.id}`}
          className="countdown__glyph countdown__glyph--out"
          onAnimationEnd={() => setLeaving(null)}
        >
          {leaving.char}
        </span>
      ) : null}
      <span
        key={`in-${char}-${counter.current}`}
        className={`countdown__glyph ${leaving ? "countdown__glyph--in" : ""}`.trim()}
      >
        {char}
      </span>
    </span>
  );
}

export function Countdown({ target, completeMessage, reducedMotion, className = "" }: CountdownProps) {
  const remaining = useCountdown(target);

  if (remaining.done) {
    return (
      <div className={`countdown countdown--done ${className}`.trim()}>
        <p className="countdown__message">{completeMessage}</p>
      </div>
    );
  }

  // Screen readers get a calm summary (no per-second chatter); role="timer" is not announced live.
  const summary = UNITS.slice(0, 3)
    .map(({ key, singular }) => {
      const n = remaining[key];
      return `${n} ${singular}${n === 1 ? "" : "s"}`;
    })
    .join(", ");

  return (
    <div className={`countdown ${className}`.trim()} role="timer" aria-live="off" aria-label={`${summary} to go`}>
      {UNITS.map(({ key, label }, index) => {
        const value = String(remaining[key]).padStart(2, "0");
        return (
          <div key={key} className="countdown__unit" aria-hidden="true">
            {index > 0 ? <span className="countdown__rule" /> : null}
            <span className="countdown__value">
              {value.split("").map((char, i) => (
                // Keyed from the right so a days count dropping from 100 to 99 doesn't shift keys.
                <Digit key={value.length - i} char={char} animate={!reducedMotion} />
              ))}
            </span>
            <span className="countdown__label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
