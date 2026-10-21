import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { onArrival } from "../stage/arrival";

type Args = {
  root: RefObject<HTMLElement | null>;
  stage: RefObject<HTMLElement | null>;
  enabled: boolean;
  reducedMotion: boolean;
};

/**
 * Scene animation controller for the cinematic sequence.
 * The Bride & Groom portrait, arch, names, and petal burst are featured
 * as the opening hero chapter.
 */
export function useSceneScroll({ root, enabled, reducedMotion }: Args) {
  useLayoutEffect(() => {
    if (!enabled || !root.current) return;

    const ctx = gsap.context(() => {
      const names = root.current!.querySelector<HTMLElement>(".scene-names");
      const bgTwo = root.current!.querySelector(".scene-bg--two");
      const titleOne = root.current!.querySelector(".scene-copy--one");
      const copyTwo = root.current!.querySelector(".scene-copy--two");
      const bgOne = root.current!.querySelector(".scene-bg--one");

      if (!names || !bgTwo || !titleOne || !copyTwo || !bgOne) return;

      // Hero Bride & Groom chapter: fully visible on load
      gsap.set(bgOne, { opacity: 1, scale: 1 });
      gsap.set(bgTwo, { opacity: 0 });
      gsap.set(titleOne, { opacity: 0, pointerEvents: "none" });
      gsap.set(copyTwo, { opacity: 0, pointerEvents: "none" });
      gsap.set(names, { opacity: 1, pointerEvents: "auto" });

      const nameEls = names.querySelectorAll(".scene-names__name");
      const coupleImg = names.querySelector(".scene-names__couple");
      const arch = names.querySelector(".scene-names__arch");
      const line = names.querySelector(".scene-names__line");
      const amp = names.querySelector(".scene-names__amp");

      // Ensure couple and typographic elements are crisp and visible
      gsap.set([arch, coupleImg, amp, line, ...nameEls], {
        opacity: 1,
        clearProps: "filter,clipPath",
      });

      // Joyful petal burst animation from behind the couple
      const playPetalBurst = () => {
        const portrait = names.querySelector<HTMLElement>(".scene-names__portrait");
        const petals = gsap.utils.toArray<HTMLElement>(names.querySelectorAll(".scene-names__petal"));
        if (!portrait || petals.length === 0 || reducedMotion) return;
        const width = portrait.getBoundingClientRect().width || 300;
        gsap.set(petals, { opacity: 0, x: 0, y: 0, scale: 0.3 });
        petals.forEach((petal, i) => {
          const angle = (Number(petal.dataset.angle) * Math.PI) / 180;
          const distance = (Number(petal.dataset.distance) / 100) * width;
          const dx = Math.cos(angle) * distance;
          const dy = Math.sin(angle) * distance;
          const spin = Number(petal.dataset.spin);
          gsap
            .timeline({ delay: 0.15 + (i % 7) * 0.035 })
            .to(petal, { x: dx, y: dy, opacity: 1, scale: 1, rotation: spin * 0.5, duration: 0.75, ease: "power2.out" })
            .to(petal, {
              x: dx * 1.15,
              y: dy + width * 0.38,
              rotation: spin,
              opacity: 0,
              duration: 1.9,
              ease: "sine.in",
            });
        });
      };

      // Play petals on initial hero load
      playPetalBurst();

      // Ensure all elements inside copyTwo (Countdown, Scratch Card, Heading) are clean, crisp, and visible
      const copyTwoElements = copyTwo.querySelectorAll(
        ".scene-title, .scene-two__lead, .scene-two__divider, .ornament__rule, .ornament__gem, .scene-two__scratch, .scene-two__countdown-panel, .countdown__unit, .countdown__glyph, .countdown__message",
      );
      gsap.set(copyTwoElements, {
        opacity: 1,
        clearProps: "filter,clipPath",
      });

      // Event listener for re-visiting the couple hero chapter
      const unsubCouple = onArrival("couple", () => {
        playPetalBurst();
      });

      // Event listener for arriving at the countdown chapter
      const unsubCountdown = onArrival("countdown", () => {
        copyTwo.classList.add("is-interactive");
        // Dispatch window resize so ScratchCard foil canvas paints perfectly
        window.dispatchEvent(new Event("resize"));
      });

      return () => {
        unsubCouple();
        unsubCountdown();
      };
    }, root);

    return () => ctx.revert();
  }, [enabled, reducedMotion, root]);
}
