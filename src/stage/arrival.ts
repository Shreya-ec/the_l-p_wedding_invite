import { stageSnapBeats } from "./stageLayout";

export type ArrivalHandler = (ctx: { first: boolean }) => Promise<void> | void;

const handlers = new Map<string, Set<ArrivalHandler>>();
const played = new Set<string>();
const inflight = new Map<string, Promise<void>>();

let currentBeat: string | null = null;
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
  let set = handlers.get(id);
  if (!set) {
    set = new Set();
    handlers.set(id, set);
  }
  set.add(handler);
  if (currentBeat === id) void arriveAt(id);
  return () => {
    set.delete(handler);
    if (set.size === 0) handlers.delete(id);
  };
}

export async function arriveAt(id: string) {
  currentBeat = id;
  const pending = inflight.get(id);
  if (pending) return pending;

  const set = handlers.get(id);
  if (!set || set.size === 0) return;

  const first = !played.has(id);
  const run = (async () => {
    const list = Array.from(set);
    for (const handler of list) {
      try {
        await handler({ first });
      } catch (err) {
        console.error("Arrival handler error:", err);
      }
    }
    played.add(id);
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
