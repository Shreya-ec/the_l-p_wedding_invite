import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { addDetailReveal, buildHeadingReveal } from "./reveals";
import { sceneIndex, stageLayout, stagePosition } from "../stage/stageLayout";

gsap.registerPlugin(ScrollTrigger);

type Args = {
  root: RefObject<HTMLElement | null>;
  /** The fixed stage the venue is the final layer of. */
  stage: RefObject<HTMLElement | null>;
  enabled: boolean;
  reducedMotion: boolean;
};

/**
 * Venue entrance, built from the same reveal helpers as the programme days.
 * The venue arrives after the programme days:
 * - Heading, venue name, pin divider and address play from the midpoint of the
 *   crossfade that brings the venue in.
 * - The map frame and directions link follow as the scene completes.
 * Each plays once; with reduced motion nothing is hidden or animated.
 */
export function useVenueReveal({ root, stage, enabled, reducedMotion }: Args) {
  useLayoutEffect(() => {
    const el = root.current;
    const stageEl = stage.current;
    if (!enabled || !el || !stageEl || reducedMotion) return;

    const index = sceneIndex("venue");
    const arrival = stageLayout.transitions[index - 1];
    const { segment } = stageLayout.scenes[index];
    // Heading from the crossfade's midpoint; map and details as the scene completes.
    const headingAt = arrival ? arrival.start + arrival.length / 2 : segment.start;
    const detailsAt = segment.start;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(el);
      const frame = q(".venue__map-frame");

      const headingTl = buildHeadingReveal({
        kicker: q(".venue__kicker"),
        title: q(".venue__name"),
        rules: q(".venue__divider .ornament__rule"),
        gem: q(".venue__divider .ornament__gem"),
      });
      addDetailReveal(headingTl, q(".venue__address"), 0.5, { y: 8, scale: 1, duration: 0.4 });

      const mapTl = gsap.timeline({ paused: true });
      addDetailReveal(mapTl, frame, 0, { y: 16, scale: 0.99, duration: 0.6 });
      addDetailReveal(mapTl, q(".venue__directions"), 0.2, { y: 8, scale: 1, duration: 0.4 });
      // Leave the map frame without a transform once settled, so the iframe renders crisply.
      mapTl.eventCallback("onComplete", () => {
        gsap.set(frame, { clearProps: "transform" });
      });

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
        onEnter: () => mapTl.play(),
      });
    }, el);

    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(raf);
      ctx.revert();
    };
  }, [enabled, reducedMotion, root, stage]);
}
