import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { invitation } from "../config/invitation";
import { sceneIndex, stageLayout, stagePosition, stageScrollTop } from "../stage/stageLayout";

gsap.registerPlugin(ScrollTrigger);

type Args = {
  root: RefObject<HTMLElement | null>;
  /** The fixed stage: this scene's scroll range is the start of its runway. */
  stage: RefObject<HTMLElement | null>;
  enabled: boolean;
  reducedMotion: boolean;
};

export function useSceneScroll({ root, stage, enabled, reducedMotion }: Args) {
  useLayoutEffect(() => {
    const stageEl = stage.current;
    if (!enabled || !root.current || !stageEl) return;
    const { segment } = stageLayout.scenes[sceneIndex("cinema")];
    // The envelope hands off here: always begin on the title, never a later beat.
    window.scrollTo({ top: stageScrollTop(stageEl, segment.start), behavior: "instant" });

    const motion = invitation.motion;
    const ctx = gsap.context(() => {
      const names = root.current!.querySelector<HTMLElement>(".scene-names");
      const bgTwo = root.current!.querySelector(".scene-bg--two");
      const titleOne = root.current!.querySelector(".scene-copy--one");
      const copyTwo = root.current!.querySelector(".scene-copy--two");
      const bgOne = root.current!.querySelector(".scene-bg--one");

      if (!names || !bgTwo || !titleOne || !copyTwo || !bgOne) return;

      gsap.set(bgOne, { opacity: 1, scale: reducedMotion ? 1 : 1.04 });
      gsap.set(bgTwo, { opacity: 0 });
      gsap.set(titleOne, { opacity: 0 });
      gsap.set(copyTwo, { opacity: 0 });
      gsap.set(names, { opacity: 0 });

      // Second scene's copy: revealed in a timed sequence once, the first time the dusk
      // scene settles. Opacity, focus and scale only: the composition never slides.
      const q = gsap.utils.selector(root.current!);
      const reveal = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
      if (!reducedMotion) {
        reveal
          .fromTo(
            q(".scene-copy--two .scene-title"),
            { opacity: 0, scale: 0.985, filter: "blur(4px)" },
            { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.55 },
            0,
          )
          .fromTo(
            q(".scene-two__divider .ornament__rule"),
            { opacity: 0, scaleX: 0 },
            { opacity: 1, scaleX: 1, duration: 0.45, ease: "power2.inOut" },
            0.18,
          )
          .fromTo(q(".scene-two__divider .ornament__gem"), { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.32)
          .fromTo(q(".scene-two__scratch"), { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.45 }, 0.28)
          .fromTo(q(".scene-two__countdown-panel"), { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.42)
          .fromTo(
            q(".scene-two__countdown .countdown__unit, .scene-two__countdown .countdown__message"),
            { opacity: 0, filter: "blur(4px)" },
            { opacity: 1, filter: "blur(0px)", duration: 0.4, stagger: 0.06 },
            0.5,
          )
          // Leave no filters behind once settled (keeps the ticking digits crisp and cheap).
          .set(q(".scene-copy--two .scene-title, .scene-two__countdown .countdown__unit"), {
            clearProps: "filter",
          });
      }
      let revealed = reducedMotion;

      // Names & couple: a joyful reveal, played once when the scene arrives.
      // Arch glows in → the couple is unveiled from the feet up as they settle from
      // a slight zoom → a burst of rose and gold petals fans out and drifts down →
      // "Lakshay", a playful gold "&", "Prerna" → the invitation line.
      const namesReveal = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
      if (!reducedMotion) {
        const portrait = names.querySelector<HTMLElement>(".scene-names__portrait");
        const petals = gsap.utils.toArray<HTMLElement>(names.querySelectorAll(".scene-names__petal"));
        const nameEls = names.querySelectorAll(".scene-names__name");
        namesReveal
          .fromTo(
            q(".scene-names__arch"),
            { opacity: 0, scale: 0.92, transformOrigin: "50% 100%" },
            { opacity: 1, scale: 1, duration: 0.55 },
            0,
          )
          .fromTo(
            q(".scene-names__couple"),
            { opacity: 0, scale: 1.08, clipPath: "inset(100% 0% 0% 0%)" },
            { opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.85, ease: "power3.out" },
            0.08,
          )
          .fromTo(
            nameEls[0],
            { opacity: 0, letterSpacing: "0.34em", filter: "blur(4px)" },
            { opacity: 1, letterSpacing: "0.04em", filter: "blur(0px)", duration: 0.7, ease: "power3.out" },
            0.28,
          )
          .fromTo(
            q(".scene-names__amp"),
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
          .fromTo(q(".scene-names__line"), { opacity: 0 }, { opacity: 1, duration: 0.45 }, 0.85)
          .set(nameEls, { clearProps: "filter" });

        // Petal burst: distances are measured from the portrait when it plays, so the
        // fan fits any screen. Each petal flies out, then drifts down and fades.
        gsap.set(petals, { opacity: 0, x: 0, y: 0, scale: 0.3 });
        namesReveal.add(() => {
          const width = portrait?.getBoundingClientRect().width ?? 300;
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
      }
      let namesShown = reducedMotion;

      // The hand-lettered title fades in on its own, just after the logo.
      const lettering = root.current!.querySelector(".scene-lettering");
      if (lettering) gsap.set(lettering, { opacity: 0 });

      const intro = gsap.timeline({ defaults: { ease: "power2.out" } });
      if (reducedMotion) {
        intro
          .to(bgOne, { opacity: 1, duration: 0.2 })
          .to(titleOne, { opacity: 1, duration: 0.25 }, 0.05);
        if (lettering) intro.to(lettering, { opacity: 1, duration: 0.3 }, 0.1);
      } else {
        intro
          .to(bgOne, { opacity: 1, scale: 1, duration: 0.7 })
          .to(titleOne, { opacity: 1, duration: 0.5 }, "-=0.4");
        if (lettering) {
          intro.fromTo(
            lettering,
            { opacity: 0, filter: "blur(3px)" },
            { opacity: 1, filter: "blur(0px)", duration: 0.75, ease: "power1.out", clearProps: "filter" },
            "-=0.4",
          );
        }
      }

      // If the guest starts scrolling before the intro has finished, settle the intro
      // immediately and hand control to the scroll timeline; otherwise the intro keeps
      // forcing the first title visible while the second scene's copy fades in.
      const settleIntro = () => {
        if (intro.progress() >= 1) return;
        intro.progress(1).kill();
        scroll.render(scroll.totalTime(), true, true);
      };

      const scroll = gsap.timeline({
        scrollTrigger: {
          onUpdate: (self) => {
            // A real scroll only: at the very top ScrollTrigger can report a tiny
            // floating-point progress (~1e-7), which must not cut the intro short.
            if (self.progress > 0.004) settleIntro();
            if (!namesShown && self.progress >= motion.namesStart + 0.01) {
              namesShown = true;
              namesReveal.play();
            }
            // The scratch card takes input only while this scene's text is showing.
            copyTwo.classList.toggle("is-interactive", self.progress >= motion.sceneTwoTextStart + 0.1);
            // Just after the copy layer starts to appear, so the sequence is seen from its start.
            if (!revealed && self.progress >= motion.sceneTwoTextStart + 0.03) {
              revealed = true;
              reveal.play();
            }
          },
          // The scene stays put on the fixed stage; scroll only drives the film.
          trigger: stageEl,
          start: stagePosition(stageEl, segment.start),
          end: stagePosition(stageEl, segment.start + segment.length),
          scrub: reducedMotion ? 0.2 : 0.65,
          invalidateOnRefresh: true,
        },
      });

      scroll.fromTo(
        titleOne,
        { opacity: 1 },
        {
          opacity: 0,
          ease: "none",
          immediateRender: false,
          duration: motion.titleFadeEnd - motion.titleFadeStart,
        },
        motion.titleFadeStart,
      );
      // Names & couple: same background, so only the content changes. Gated by
      // scroll (scrolling back returns cleanly to the title); the reveal plays once.
      scroll.fromTo(names, { opacity: 0 }, { opacity: 1, ease: "none", immediateRender: false, duration: 0.06 }, motion.namesStart);
      scroll.fromTo(names, { opacity: 1 }, { opacity: 0, ease: "none", immediateRender: false, duration: 0.07 }, motion.namesEnd);
      scroll.fromTo(
        bgTwo,
        { opacity: 0 },
        {
          opacity: 1,
          ease: "none",
          immediateRender: false,
          duration: motion.backgroundCrossfadeEnd - motion.backgroundCrossfadeStart,
        },
        motion.backgroundCrossfadeStart,
      );
      // The copy layer is gated by scroll (so scrolling back returns cleanly to scene one);
      // its contents reveal once, in time, via `reveal` above.
      scroll.fromTo(
        copyTwo,
        { opacity: 0 },
        {
          opacity: 1,
          ease: "none",
          immediateRender: false,
          // Quick gate: the timed reveal handles the entrance, so the layer itself
          // should be at full strength (an opaque foil, crisp countdown) almost at once.
          duration: 0.05,
        },
        motion.sceneTwoTextStart,
      );
      // Pin the timeline's length to 1 so its positions read directly as scroll progress
      // (the reveal trigger above compares against the same numbers).
      scroll.set({}, {}, 1);

      return () => {
        namesReveal.kill();
        reveal.kill();
        intro.kill();
        scroll.scrollTrigger?.kill();
        scroll.kill();
      };
    }, root);

    return () => ctx.revert();
  }, [enabled, reducedMotion, root, stage]);
}
