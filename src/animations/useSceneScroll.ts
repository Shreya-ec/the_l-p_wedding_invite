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

      // Initial state: Step 0 ("The P&L Wedding" title screen)
      gsap.set(bgOne, { opacity: 1, scale: 1 });
      gsap.set(bgTwo, { opacity: 0 });
      gsap.set(titleOne, { opacity: 1, pointerEvents: "auto" });
      gsap.set(copyTwo, { opacity: 0, pointerEvents: "none" });
      gsap.set(names, { opacity: 0, pointerEvents: "none" });

      const nameEls = names.querySelectorAll(".scene-names__name");
      const coupleImg = names.querySelector(".scene-names__couple");
      const arch = names.querySelector(".scene-names__arch");
      const line = names.querySelector(".scene-names__line");
      const amp = names.querySelector(".scene-names__amp");
      const logo = names.querySelector(".scene-logo");
      const portrait = names.querySelector<HTMLElement>(".scene-names__portrait");
      const petals = gsap.utils.toArray<HTMLElement>(names.querySelectorAll(".scene-names__petal"));
      const lettering = titleOne.querySelector(".scene-lettering");

      // Names & couple: the classic joyful reveal from the earliest design.
      // Arch glows in → couple is unveiled from feet up as they settle from slight zoom →
      // LP monogram floats in → "Lakshay" letter spacing & blur clearing → gold "&" bounce →
      // "Prerna" letter spacing & blur clearing → petal burst fans out & drifts down → invitation line.
      const namesReveal = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });

      if (!reducedMotion) {
        namesReveal
          .fromTo(
            arch,
            { opacity: 0, scale: 0.92, transformOrigin: "50% 100%" },
            { opacity: 1, scale: 1, duration: 0.55 },
            0,
          )
          .fromTo(
            coupleImg,
            { opacity: 0, scale: 1.08, clipPath: "inset(100% 0% 0% 0%)" },
            { opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.85, ease: "power3.out" },
            0.08,
          )
          .fromTo(
            logo,
            { opacity: 0, scale: 0.85, y: -8 },
            { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "power2.out" },
            0.18,
          )
          .fromTo(
            nameEls[0],
            { opacity: 0, letterSpacing: "0.34em", filter: "blur(4px)" },
            { opacity: 1, letterSpacing: "0.04em", filter: "blur(0px)", duration: 0.7, ease: "power3.out" },
            0.28,
          )
          .fromTo(
            amp,
            { opacity: 0, scale: 0.3, rotation: -18 },
            { opacity: 1, scale: 1, rotation: 0, duration: 0.4, ease: "back.out(2.2)" },
            0.48,
          )
          .fromTo(
            nameEls[1],
            { opacity: 0, letterSpacing: "0.34em", filter: "blur(4px)" },
            { opacity: 1, letterSpacing: "0.04em", filter: "blur(0px)", duration: 0.7, ease: "power3.out" },
            0.58,
          )
          .fromTo(line, { opacity: 0 }, { opacity: 1, duration: 0.45 }, 0.85)
          .set(nameEls, { clearProps: "filter" })
          .set(coupleImg, { clearProps: "clipPath" });

        // Petal burst: fanning out around the couple and drifting down with gravity
        namesReveal.add(() => {
          const width = portrait?.getBoundingClientRect().width || 300;
          gsap.killTweensOf(petals);
          gsap.set(petals, { opacity: 0, x: 0, y: 0, scale: 0.3 });
          petals.forEach((petal, i) => {
            const angle = (Number(petal.dataset.angle) * Math.PI) / 180;
            const distance = (Number(petal.dataset.distance) / 100) * width;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;
            const spin = Number(petal.dataset.spin);
            gsap
              .timeline({ delay: (i % 7) * 0.035 })
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
        }, 0.4);
      } else {
        namesReveal.to([arch, coupleImg, logo, amp, line, ...nameEls], { opacity: 1, duration: 0.3 });
      }

      // Initial state: ready to reveal
      namesReveal.pause(0);
      gsap.set(petals, { opacity: 0, x: 0, y: 0, scale: 0.3 });

      // Title lettering soft blur-to-clear entrance
      if (lettering && !reducedMotion) {
        gsap.fromTo(
          lettering,
          { opacity: 0, filter: "blur(3px)" },
          { opacity: 1, filter: "blur(0px)", duration: 0.75, ease: "power1.out", clearProps: "filter", delay: 0.1 },
        );
      }

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
          gsap.set([arch, coupleImg, logo, amp, line, ...nameEls], { opacity: 1 });
          return;
        }
        if (namesReveal.isActive()) return;
        gsap.killTweensOf(petals);
        gsap.set(petals, { opacity: 0, x: 0, y: 0, scale: 0.3 });
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
        gsap.killTweensOf(petals);
        unsubCouple();
        unsubCountdown();
      };
    }, root);

    return () => ctx.revert();
  }, [enabled, reducedMotion, root]);
}
