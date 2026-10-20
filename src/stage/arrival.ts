import { stageSnapBeats } from "./stageLayout";

export type ArrivalHandler = (ctx: { first: boolean }) => Promise<void> | void;

const handlers = new Map<string, ArrivalHandler>();
const played = new Set<string>();
const inflight = new Map<string, Promise<void>>();

let currentBeat: string | null = null;
let skipHold = false;
let holdDepth = 0;
let listening = false;

const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

function blockScroll(event: Event) {
  if (!holdDepth) return;
  event.preventDefault();
}

function blockKeys(event: KeyboardEvent) {
  if (!holdDepth) return;
  if (SCROLL_KEYS.has(event.key)) event.preventDefault();
}

function ensureListeners() {
  if (listening) return;
  listening = true;
  window.addEventListener("wheel", blockScroll, { passive: false });
  window.addEventListener("touchmove", blockScroll, { passive: false });
  window.addEventListener("keydown", blockKeys);
}

export function setSkipScrollHold(value: boolean) {
  skipHold = value;
}

export function holdScroll() {
  ensureListeners();
  holdDepth += 1;
  document.documentElement.classList.add("is-scroll-held");
}

export function releaseScroll() {
  holdDepth = Math.max(0, holdDepth - 1);
  if (!holdDepth) document.documentElement.classList.remove("is-scroll-held");
}

export function beatIdAtProgress(progress: number) {
  const beats = stageSnapBeats();
  return beats.reduce((best, beat) =>
    Math.abs(beat.progress - progress) < Math.abs(best.progress - progress) ? beat : best,
  ).id;
}

export function noteProgress(progress: number) {
  currentBeat = beatIdAtProgress(progress);
}

export function onArrival(id: string, handler: ArrivalHandler) {
  handlers.set(id, handler);
  if (currentBeat === id) void arriveAt(id);
  return () => {
    if (handlers.get(id) === handler) handlers.delete(id);
  };
}

export async function arriveAt(id: string) {
  currentBeat = id;
  const pending = inflight.get(id);
  if (pending) return pending;

  const handler = handlers.get(id);
  if (!handler) return;

  const first = !played.has(id);
  const run = (async () => {
    if (first && !skipHold) holdScroll();
    try {
      await handler({ first });
      played.add(id);
    } finally {
      if (first && !skipHold) releaseScroll();
    }
  })();

  inflight.set(id, run);
  try {
    await run;
  } finally {
    inflight.delete(id);
  }
}

type Playable = {
  totalDuration: () => number;
  totalProgress: () => number;
  progress: (value: number) => unknown;
  play: () => unknown;
  then: () => Promise<unknown>;
};

export function playToEnd(tl: Playable) {
  if (tl.totalDuration() === 0 || tl.totalProgress() === 1) {
    tl.progress(1);
    return Promise.resolve();
  }
  tl.play();
  return tl.then().then(() => undefined);
}
