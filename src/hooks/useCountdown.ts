import { useEffect, useState } from "react";

export type TimeRemaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** True once the target instant has been reached; all units are then 0. */
  done: boolean;
};

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Whole units remaining until `targetMs`, from `nowMs`. Never negative.
 * Seconds are rounded up, so the display reads 0:00:00:00 exactly at the target
 * rather than one second early.
 */
export function getTimeRemaining(targetMs: number, nowMs: number): TimeRemaining {
  const diff = targetMs - nowMs;
  if (!(diff > 0)) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const total = Math.ceil(diff / SECOND) * SECOND;
  return {
    days: Math.floor(total / DAY),
    hours: Math.floor((total % DAY) / HOUR),
    minutes: Math.floor((total % HOUR) / MINUTE),
    seconds: Math.floor((total % MINUTE) / SECOND),
    done: false,
  };
}

/**
 * Live countdown to an ISO 8601 instant.
 *
 * Accuracy: every tick recomputes from the real clock (Date.now()), never by
 * decrementing, so errors cannot accumulate. Each tick is scheduled for just after
 * the next whole-second boundary of the remaining time, so the display changes in
 * step with real seconds. When a hidden tab becomes visible again (timers are
 * throttled in background tabs), it recomputes immediately.
 */
export function useCountdown(targetIso: string): TimeRemaining {
  const targetMs = Date.parse(targetIso);
  const [remaining, setRemaining] = useState(() => getTimeRemaining(targetMs, Date.now()));

  useEffect(() => {
    if (Number.isNaN(targetMs)) {
      console.error(`useCountdown: invalid target date "${targetIso}"`);
      return;
    }

    let timer: number | undefined;

    const tick = () => {
      const now = Date.now();
      const next = getTimeRemaining(targetMs, now);
      // Only re-render when the displayed values actually change.
      setRemaining((prev) =>
        prev.done === next.done &&
        prev.seconds === next.seconds &&
        prev.minutes === next.minutes &&
        prev.hours === next.hours &&
        prev.days === next.days
          ? prev
          : next,
      );
      if (next.done) return;
      // Wake just after the next whole-second boundary of the remaining time.
      const untilNextSecond = ((targetMs - now) % SECOND) || SECOND;
      timer = window.setTimeout(tick, untilNextSecond + 15);
    };

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      window.clearTimeout(timer);
      tick();
    };

    tick();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [targetMs, targetIso]);

  return remaining;
}
