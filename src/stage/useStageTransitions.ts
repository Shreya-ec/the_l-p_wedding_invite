import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import gsap from "gsap";
import { arriveAt } from "./arrival";
import { STAGE_STEPS } from "./stageSteps";
import { haptic } from "../utils/haptic";

type Args = {
  stage: RefObject<HTMLElement | null>;
  enabled: boolean;
  reducedMotion: boolean;
  onSceneChange?: (sceneId: string) => void;
  onStepChange?: (stepIndex: number) => void;
};

/**
 * Master One-Stroke Chapter Controller.
 *
 * 6-Chapter Flow:
 * 0: Bride & Groom (Hero portrait, arch, names & petal burst)
 * 1: Countdown to Forever (Dusk gateway, scratch card & live timer)
 * 2: 11 December (Sagai, Mehndi, Dinner)
 * 3: 12 December (Haldi, Sehra Bandi, Dinner)
 * 4: Venue (Chopra Farms & Resorts, Google Maps)
 * 5: RSVP (Kriti & Ajinkya, Alex compliments)
 */
export function useStageTransitions({
  stage,
  enabled,
  reducedMotion,
  onSceneChange,
  onStepChange,
}: Args) {
  const [currentStep, setCurrentStep] = useState(0);
  const currentStepRef = useRef(0);
  const isTransitioningRef = useRef(false);

  // Store latest props in a ref for safe, zero-dependency callbacks
  const propsRef = useRef({ stage, enabled, reducedMotion, onSceneChange, onStepChange });
  useEffect(() => {
    propsRef.current = { stage, enabled, reducedMotion, onSceneChange, onStepChange };
  });

  // Direct programmatic jump to any step
  const goToStep = useCallback((targetStep: number, force = false) => {
    const { stage: stageRef, enabled: isEnabled, reducedMotion: isReduced, onSceneChange: notifyScene, onStepChange: notifyStep } = propsRef.current;
    const stageEl = stageRef.current;
    if (!isEnabled || !stageEl) return;
    if (targetStep < 0 || targetStep >= STAGE_STEPS.length) return;
    if (targetStep === currentStepRef.current && !force) return;
    if (isTransitioningRef.current && !force) return;

    isTransitioningRef.current = true;
    const from = currentStepRef.current;
    const to = targetStep;
    currentStepRef.current = to;
    setCurrentStep(to);
    notifyStep?.(to);

    // DOM layer references
    const cinemaEl = stageEl.querySelector<HTMLElement>('[data-stage-scene="cinema"]');
    const day11El = stageEl.querySelector<HTMLElement>('[data-stage-scene="day-dec-11"]');
    const day12El = stageEl.querySelector<HTMLElement>('[data-stage-scene="day-dec-12"]');
    const venueEl = stageEl.querySelector<HTMLElement>('[data-stage-scene="venue"]');
    const rsvpEl = stageEl.querySelector<HTMLElement>('[data-stage-scene="rsvp"]');

    const bgTwo = cinemaEl?.querySelector<HTMLElement>(".scene-bg--two");
    const names = cinemaEl?.querySelector<HTMLElement>(".scene-names");
    const copyTwo = cinemaEl?.querySelector<HTMLElement>(".scene-copy--two");

    const layerMap: Record<number, HTMLElement | null> = {
      0: cinemaEl,
      1: cinemaEl,
      2: day11El,
      3: day12El,
      4: venueEl,
      5: rsvpEl,
    };

    const fromLayer = layerMap[from];
    const toLayer = layerMap[to];
    const duration = isReduced ? 0.22 : 0.52;
    const ease = "power2.out";
    const isForward = to > from;

    const tl = gsap.timeline({
      onComplete: () => {
        isTransitioningRef.current = false;
        // Ensure non-active layers are strictly hidden and inert
        const allLayers = [cinemaEl, day11El, day12El, venueEl, rsvpEl];
        allLayers.forEach((layer) => {
          if (!layer) return;
          const isCurrent = layer === toLayer;
          layer.classList.toggle("is-current", isCurrent);
          if (!isCurrent) {
            gsap.set(layer, { autoAlpha: 0, opacity: 0, pointerEvents: "none" });
          } else {
            gsap.set(layer, { autoAlpha: 1, opacity: 1, pointerEvents: "auto" });
          }
        });

        // Inform arrival triggers
        const targetStepObj = STAGE_STEPS[to];
        notifyScene?.(targetStepObj.sceneId);
        void arriveAt(targetStepObj.id);
      },
    });

    // CASE 1: Moving within Cinema (0: Bride & Groom <-> 1: Countdown)
    if (fromLayer === cinemaEl && toLayer === cinemaEl) {
      if (cinemaEl) {
        gsap.set(cinemaEl, { autoAlpha: 1, opacity: 1, pointerEvents: "auto" });
      }

      // Leaving step 0 (Bride & Groom) -> Entering step 1 (Countdown)
      if (from === 0 && to === 1) {
        if (names) {
          tl.to(names, { opacity: 0, y: -14, duration: duration * 0.7, ease: "power2.inOut" }, 0);
          tl.set(names, { pointerEvents: "none" });
        }
        if (bgTwo) {
          tl.to(bgTwo, { opacity: 1, duration: duration * 0.8, ease: "power2.inOut" }, 0);
        }
        if (copyTwo) {
          tl.fromTo(copyTwo, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration, ease }, duration * 0.2);
          tl.set(copyTwo, { pointerEvents: "auto" });
          copyTwo.classList.add("is-interactive");
        }
      }
      // Leaving step 1 (Countdown) -> Entering step 0 (Bride & Groom)
      else if (from === 1 && to === 0) {
        if (copyTwo) {
          copyTwo.classList.remove("is-interactive");
          tl.to(copyTwo, { opacity: 0, y: 14, duration: duration * 0.7, ease: "power2.inOut" }, 0);
          tl.set(copyTwo, { pointerEvents: "none" });
        }
        if (bgTwo) {
          tl.to(bgTwo, { opacity: 0, duration: duration * 0.8, ease: "power2.inOut" }, 0);
        }
        if (names) {
          tl.fromTo(names, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration, ease }, duration * 0.2);
          tl.set(names, { pointerEvents: "auto" });
        }
      }
    } else {
      // CASE 2: Moving across full stage layers
      if (fromLayer) {
        // When leaving cinema for celebration days, hide internal couple photo immediately so nothing ghosts through
        if (fromLayer === cinemaEl) {
          if (names) gsap.set(names, { opacity: 0, pointerEvents: "none" });
        }
        tl.to(
          fromLayer,
          {
            opacity: 0,
            scale: isReduced ? 1 : isForward ? 0.98 : 1.02,
            duration: duration * 0.85,
            ease: "power2.inOut",
          },
          0,
        );
      }

      if (toLayer) {
        gsap.set(toLayer, { autoAlpha: 1, pointerEvents: "auto" });

        // If entering cinema, configure sub-views for the target step
        if (toLayer === cinemaEl) {
          if (to === 0) {
            if (bgTwo) gsap.set(bgTwo, { opacity: 0 });
            if (copyTwo) gsap.set(copyTwo, { opacity: 0, pointerEvents: "none" });
            if (names) gsap.set(names, { opacity: 1, pointerEvents: "auto" });
          } else if (to === 1) {
            if (names) gsap.set(names, { opacity: 0, pointerEvents: "none" });
            if (bgTwo) gsap.set(bgTwo, { opacity: 1 });
            if (copyTwo) {
              gsap.set(copyTwo, { opacity: 1, pointerEvents: "auto" });
              copyTwo.classList.add("is-interactive");
            }
          }
        }

        tl.fromTo(
          toLayer,
          {
            opacity: 0,
            scale: isReduced ? 1 : isForward ? 1.02 : 0.98,
          },
          {
            opacity: 1,
            scale: 1,
            duration,
            ease,
          },
          duration * 0.15,
        );
      }
    }

    haptic(8);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepRef.current < STAGE_STEPS.length - 1) {
      goToStep(currentStepRef.current + 1);
    }
  }, [goToStep]);

  const prevStep = useCallback(() => {
    if (currentStepRef.current > 0) {
      goToStep(currentStepRef.current - 1);
    }
  }, [goToStep]);

  // Set initial state and attach listeners
  useEffect(() => {
    const stageEl = stage.current;
    if (!enabled || !stageEl) return;

    // Initialize layers: Step 0 (Bride & Groom) is active, all others hidden
    const cinemaEl = stageEl.querySelector<HTMLElement>('[data-stage-scene="cinema"]');
    const day11El = stageEl.querySelector<HTMLElement>('[data-stage-scene="day-dec-11"]');
    const day12El = stageEl.querySelector<HTMLElement>('[data-stage-scene="day-dec-12"]');
    const venueEl = stageEl.querySelector<HTMLElement>('[data-stage-scene="venue"]');
    const rsvpEl = stageEl.querySelector<HTMLElement>('[data-stage-scene="rsvp"]');

    const nonCinema = [day11El, day12El, venueEl, rsvpEl];
    nonCinema.forEach((layer) => {
      if (layer) gsap.set(layer, { autoAlpha: 0, opacity: 0, pointerEvents: "none" });
    });

    if (cinemaEl) {
      gsap.set(cinemaEl, { autoAlpha: 1, opacity: 1, pointerEvents: "auto" });
      cinemaEl.classList.add("is-current");

      const names = cinemaEl.querySelector<HTMLElement>(".scene-names");
      const bgTwo = cinemaEl.querySelector<HTMLElement>(".scene-bg--two");
      const copyTwo = cinemaEl.querySelector<HTMLElement>(".scene-copy--two");
      const titleOne = cinemaEl.querySelector<HTMLElement>(".scene-copy--one");

      // Bride and Groom are active on step 0
      if (names) gsap.set(names, { opacity: 1, pointerEvents: "auto" });
      if (bgTwo) gsap.set(bgTwo, { opacity: 0 });
      if (copyTwo) gsap.set(copyTwo, { opacity: 0, pointerEvents: "none" });
      if (titleOne) gsap.set(titleOne, { opacity: 0, pointerEvents: "none" });
    }

    void arriveAt("couple");

    // Gesture detection: One-Stroke touch
    let touchStartY = 0;
    let touchStartX = 0;
    let touchStartTime = 0;
    let isTrackingTouch = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest(".scratch, canvas, [data-lenis-prevent], .scene-two__scratch")) {
        return;
      }
      isTrackingTouch = true;
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      touchStartTime = Date.now();
    };

    const onTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest(".scratch, canvas, [data-lenis-prevent], .scene-two__scratch")) {
        return;
      }
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isTrackingTouch) return;
      isTrackingTouch = false;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const deltaY = touch.clientY - touchStartY;
      const deltaX = touch.clientX - touchStartX;
      const duration = Date.now() - touchStartTime;

      const isQuickFlick = duration < 350 && Math.abs(deltaY) > 22;
      const isRegularSwipe = Math.abs(deltaY) > 35;

      if ((isQuickFlick || isRegularSwipe) && Math.abs(deltaY) > Math.abs(deltaX) * 0.75) {
        if (deltaY < 0) {
          nextStep();
        } else {
          prevStep();
        }
      }
    };

    // Wheel event (desktop) with 450ms debounce
    let lastWheelTime = 0;
    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest(".scratch, canvas, [data-lenis-prevent], .scene-two__scratch")) {
        return;
      }
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelTime < 450) return;
      if (Math.abs(e.deltaY) < 18) return;

      lastWheelTime = now;
      if (e.deltaY > 0) {
        nextStep();
      } else {
        prevStep();
      }
    };

    // Keyboard navigation
    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        nextStep();
      } else if (["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        prevStep();
      }
    };

    // Scroll-cue click / tap handler
    const cue = stageEl.querySelector<HTMLElement>(".scroll-cue");
    const onCueClick = () => nextStep();
    if (cue) {
      cue.style.cursor = "pointer";
      cue.style.pointerEvents = "auto";
      cue.addEventListener("click", onCueClick);
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      if (cue) cue.removeEventListener("click", onCueClick);
    };
  }, [enabled, nextStep, prevStep, stage]);

  return {
    currentStep,
    goToStep,
    nextStep,
    prevStep,
  };
}
