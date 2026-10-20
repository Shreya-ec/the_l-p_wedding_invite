import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { addDetailReveal, buildHeadingReveal } from "./reveals";
import { sceneIndex, stageLayout, stagePosition } from "../stage/stageLayout";

gsap.registerPlugin(ScrollTrigger);

type Args = {
  root: RefObject<HTMLElement | null>;
  stage: RefObject<HTMLElement | null>;
  enabled: boolean;
  reducedMotion: boolean;
};

/**
 * RSVP entrance, matching the venue: heading from the crossfade midpoint,
 * then the closing compliments as the scene completes. Plays once.
 */
export function useRsvpReveal({ root, stage, enabled, reducedMotion }: Args) {
  useLayoutEffect(() => {
    const el = root.current;
    const stageEl = stage.current;
    if (!enabled || !el || !stageEl || reducedMotion) return;

    const index = sceneIndex("rsvp");
    const arrival = stageLayout.transitions[index - 1];
    const { segment } = stageLayout.scenes[index];
    const headingAt = arrival ? arrival.start + arrival.length / 2 : segment.start;
    const detailsAt = segment.start;

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

      ScrollTrigger.create({
        trigger: stageEl,
        start: stagePosition(stageEl, headingAt),
        once: true,
        invalidateOnRefresh: true,
        onEnter: () => headingTl.play(),
      });

      ScrollTrigger.create({
        trigger: stageEl,
        start: stagePosition(stageEl, detailsAt),
        once: true,
        invalidateOnRefresh: true,
        onEnter: () => detailsTl.play(),
      });
    }, el);

    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(raf);
      ctx.revert();
    };
  }, [enabled, reducedMotion, root, stage]);
}
