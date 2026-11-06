import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { onArrival, playToEnd } from "../stage/arrival";
import { buildHeadingReveal } from "./reveals";

type Args = {
  root: RefObject<HTMLElement | null>;
  stage: RefObject<HTMLElement | null>;
  enabled: boolean;
  reducedMotion: boolean;
};

/**
 * RSVP entrance: the heading reveals smoothly on arrival.
 */
export function useRsvpReveal({ root, enabled, reducedMotion }: Args) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!enabled || !el || reducedMotion) return;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(el);

      const headingTl = buildHeadingReveal({
        kicker: q(".rsvp__kicker"),
        title: q(".rsvp__title"),
        rules: q(".rsvp__divider .ornament__rule"),
        gem: q(".rsvp__divider .ornament__gem"),
      });
      const unsub = onArrival("rsvp", async ({ first }) => {
        if (!first) {
          headingTl.progress(1);
          return;
        }
        await playToEnd(headingTl);
      });

      return () => {
        unsub();
        headingTl.kill();
      };
    }, el);

    return () => ctx.revert();
  }, [enabled, reducedMotion, root]);
}
