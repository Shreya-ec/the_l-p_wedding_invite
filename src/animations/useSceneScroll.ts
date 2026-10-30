import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { onArrival } from "../stage/arrival";

type Args = {
  root: RefObject<HTMLElement | null>;
  stage: RefObject<HTMLElement | null>;
  enabled: boolean;
  /** The envelope has cleared, so the title image is the picture in front of the guest. */
  settled: boolean;
  reducedMotion: boolean;
};

/**
 * Scene animation controller for the cinematic sequence.
 * The names plaque, monogram, and invitation line are the hero of this chapter.
 */
export function useSceneScroll({ root, enabled, settled, reducedMotion }: Args) {
  useLayoutEffect(() => {
    if (!enabled || !root.current) return;

    const ctx = gsap.context(() => {
      const names = root.current!.querySelector<HTMLElement>(".scene-names");
      const bgTwo = root.current!.querySelector(".scene-bg--two");
      const titleOne = root.current!.querySelector(".scene-copy--one");
      const copyTwo = root.current!.querySelector(".scene-copy--two");
      const bgOne = root.current!.querySelector(".scene-bg--one");

      if (!names || !bgTwo || !titleOne || !copyTwo || !bgOne) return;

      // Initial state: Step 0 ("The P&L Wedding" title screen)
      gsap.set(bgOne, { opacity: 1, scale: 1 });
      gsap.set(bgTwo, { opacity: 0 });
      gsap.set(titleOne, { opacity: 1, pointerEvents: "auto" });
      gsap.set(copyTwo, { opacity: 0, pointerEvents: "none" });
      gsap.set(names, { opacity: 0, pointerEvents: "none" });

      const nameEls = names.querySelectorAll(".scene-names__name");
      const lockup = names.querySelector(".scene-names__lockup");
      const line = names.querySelector(".scene-names__line");
      const amp = names.querySelector(".scene-names__amp");
      const logo = names.querySelector(".scene-logo");
      const lettering = titleOne.querySelector(".scene-lettering");

      // Lockup settles in → LP monogram floats in above it → each name clears →
      // gold "&" bounce → invitation line.
      const namesReveal = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });

      if (!reducedMotion) {
        namesReveal
          .fromTo(
            lockup,
            { opacity: 0, scale: 0.92 },
            { opacity: 1, scale: 1, duration: 0.6, ease: "power3.out" },
            0,
          )
          .fromTo(
            logo,
            { opacity: 0, scale: 0.85, y: -8 },
            { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "power2.out" },
            0.12,
          )
          .fromTo(
            nameEls[0],
            { opacity: 0, letterSpacing: "0.34em", filter: "blur(4px)" },
            { opacity: 1, letterSpacing: "0.06em", filter: "blur(0px)", duration: 0.7, ease: "power3.out" },
            0.22,
          )
          .fromTo(
            amp,
            { opacity: 0, scale: 0.3, rotation: -18 },
            { opacity: 1, scale: 1, rotation: 0, duration: 0.4, ease: "back.out(2.2)" },
            0.42,
          )
          .fromTo(
            nameEls[1],
            { opacity: 0, letterSpacing: "0.34em", filter: "blur(4px)" },
            { opacity: 1, letterSpacing: "0.06em", filter: "blur(0px)", duration: 0.7, ease: "power3.out" },
            0.52,
          )
          .fromTo(line, { opacity: 0 }, { opacity: 1, duration: 0.45 }, 0.78)
          .set(nameEls, { clearProps: "filter" });
      } else {
        namesReveal.to([lockup, logo, amp, line, ...nameEls], { opacity: 1, duration: 0.3 });
      }

      // Initial state: ready to reveal
      namesReveal.pause(0);

      // Held back until the envelope has cleared, then revealed by the entrance below.
      if (lettering) gsap.set(lettering, { opacity: 0 });

      // Ensure all elements inside copyTwo (Countdown, Scratch Card, Heading) are clean, crisp, and visible
      const copyTwoElements = copyTwo.querySelectorAll(
        ".scene-title, .scene-two__lead, .scene-two__divider, .ornament__rule, .ornament__gem, .scene-two__scratch, .scene-two__countdown-panel, .countdown__unit, .countdown__glyph, .countdown__message",
      );
      gsap.set(copyTwoElements, {
        opacity: 1,
        clearProps: "filter,clipPath",
      });

      // Play the classic bride and groom reveal when arriving at chapter 1
      const playCoupleReveal = () => {
        if (reducedMotion) {
          gsap.set([lockup, logo, amp, line, ...nameEls], { opacity: 1 });
          return;
        }
        if (namesReveal.isActive()) return;
        namesReveal.restart();
      };

      // Event listener for arriving at the couple hero chapter
      const unsubCouple = onArrival("couple", () => {
        playCoupleReveal();
      });

      // Event listener for arriving at the countdown chapter
      const unsubCountdown = onArrival("countdown", () => {
        copyTwo.classList.add("is-interactive");
        // Dispatch window resize so ScratchCard foil canvas paints perfectly
        window.dispatchEvent(new Event("resize"));
      });

      return () => {
        namesReveal.kill();
        unsubCouple();
        unsubCountdown();
      };
    }, root);

    return () => ctx.revert();
  }, [enabled, reducedMotion, root]);

  // The script image rises into place once the first section is actually on screen.
  useLayoutEffect(() => {
    if (!enabled || !settled || !root.current) return;
    const lettering = root.current.querySelector(".scene-lettering");
    if (!lettering) return;

    if (reducedMotion) {
      gsap.set(lettering, { opacity: 1, clearProps: "filter,transform" });
      return;
    }

    const tween = gsap.fromTo(
      lettering,
      { opacity: 0, y: 26, scale: 0.94, filter: "blur(8px)" },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 1.15,
        ease: "power3.out",
        delay: 0.06,
        onComplete: () => {
          gsap.set(lettering, { clearProps: "filter,transform" });
        },
      },
    );

    return () => {
      tween.kill();
    };
  }, [enabled, settled, reducedMotion, root]);
}
