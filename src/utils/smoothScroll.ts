import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "lenis/dist/lenis.css";

let lenisInstance: Lenis | null = null;
let tickerCallback: ((time: number) => void) | null = null;

/**
 * Initializes Lenis smooth inertial scrolling unified with GSAP's ticker at 120fps.
 */
export function initSmoothScroll(): Lenis {
  if (lenisInstance) return lenisInstance;

  lenisInstance = new Lenis({
    lerp: 0.085, // Smooth inertial interpolation
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential decay curve
    orientation: "vertical",
    gestureOrientation: "vertical",
    smoothWheel: true,
    syncTouch: false, // Mobile touch is handled via discrete 120fps gesture transitions
    touchMultiplier: 1,
    wheelMultiplier: 1,
    autoResize: true,
    prevent: (node) =>
      node.hasAttribute("data-lenis-prevent") ||
      Boolean(node.closest("[data-lenis-prevent]")),
  });

  // Keep ScrollTrigger synchronized with Lenis virtual scroll
  lenisInstance.on("scroll", ScrollTrigger.update);

  // Hook Lenis into GSAP's internal RAF ticker for locked 120fps alignment
  tickerCallback = (time: number) => {
    lenisInstance?.raf(time * 1000);
  };
  gsap.ticker.add(tickerCallback);

  // Eliminate GSAP lag smoothing jumps on 120Hz high-refresh displays
  gsap.ticker.lagSmoothing(0);

  if (typeof window !== "undefined") {
    (window as unknown as { lenis: Lenis }).lenis = lenisInstance;
  }

  return lenisInstance;
}

export function getLenis(): Lenis | null {
  return lenisInstance;
}

/**
 * Programmatic smooth scroll helper that coordinates with Lenis's virtual scroll state.
 */
export function smoothScrollTo(
  target: number | string | HTMLElement,
  options?: { immediate?: boolean; duration?: number; offset?: number }
) {
  if (lenisInstance) {
    lenisInstance.scrollTo(target, {
      immediate: options?.immediate ?? false,
      duration: options?.duration,
      offset: options?.offset ?? 0,
      lock: options?.immediate,
    });
  } else if (typeof window !== "undefined") {
    if (typeof target === "number") {
      window.scrollTo({
        top: target + (options?.offset ?? 0),
        behavior: options?.immediate ? "instant" : "smooth",
      });
    } else if (target instanceof HTMLElement) {
      target.scrollIntoView({
        behavior: options?.immediate ? "instant" : "smooth",
      });
    }
  }
}

export function destroySmoothScroll() {
  if (tickerCallback) {
    gsap.ticker.remove(tickerCallback);
    tickerCallback = null;
  }
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }
}
