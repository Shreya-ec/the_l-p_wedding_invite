import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { onArrival, playToEnd } from "../stage/arrival";
import { addDetailReveal, buildHeadingReveal } from "./reveals";

type Args = {
  root: RefObject<HTMLElement | null>;
  stage: RefObject<HTMLElement | null>;
  enabled: boolean;
  reducedMotion: boolean;
};

/**
 * RSVP entrance: heading, monogram, and compliments reveal smoothly on arrival.
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
      addDetailReveal(headingTl, q(".rsvp__monogram"), 0, { y: 8, scale: 0.97, duration: 0.45 });
      const detailsTl = gsap.timeline({ paused: true });
      addDetailReveal(detailsTl, q(".rsvp__closing"), 0, { y: 8, scale: 1, duration: 0.4 });

      const unsub = onArrival("rsvp", async ({ first }) => {
        if (!first) {
          headingTl.progress(1);
          detailsTl.progress(1);
          return;
        }
        await playToEnd(headingTl);
        await playToEnd(detailsTl);
      });

      return () => {
        unsub();
        headingTl.kill();
        detailsTl.kill();
      };
    }, el);

    return () => ctx.revert();
  }, [enabled, reducedMotion, root]);
}
