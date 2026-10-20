import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { arriveAt, beatIdAtProgress, noteProgress } from "./arrival";
import { stageLayout, stageScrollTop, stageSnapProgresses } from "./stageLayout";

gsap.registerPlugin(ScrollTrigger);

type Args = {
  stage: RefObject<HTMLElement | null>;
  enabled: boolean;
  reducedMotion: boolean;
  onSceneChange?: (sceneId: string) => void;
};

/** Share of a transition over which the outgoing scene's text fades out. */
const OUTGOING_COPY_SHARE = 0.4;

/**
 * Scene-to-scene crossfades on the fixed stage, scrubbed by scroll.
 *
 * For each transition the incoming layer (stacked above) fades 0 → 1 while the
 * outgoing layer stays fully opaque beneath it, so the picture never dips or
 * flashes; once covered, the outgoing layer is hidden. The outgoing scene's
 * text ([data-stage-copy]) fades out over the first part of the transition, so
 * two scenes' text never overlap; the incoming scene reveals its own text from
 * the midpoint (see each scene's hook).
 *
 * Only the current scene (switching at each transition's midpoint) receives
 * pointer input. If keyboard focus moves into another scene, the page scrolls
 * to it, so nothing is ever operated while invisible.
 */
export function useStageTransitions({ stage, enabled, reducedMotion, onSceneChange }: Args) {
  useLayoutEffect(() => {
    const stageEl = stage.current;
    if (!enabled || !stageEl) return;

    const layers = stageLayout.scenes.map((scene) =>
      stageEl.querySelector<HTMLElement>(`[data-stage-scene="${scene.id}"]`),
    );
    const copies = layers.map((layer) => layer?.querySelector<HTMLElement>("[data-stage-copy]") ?? null);
    const midpoints = stageLayout.transitions.map((t) => t.start + t.length / 2);

    let current = -1;
    const setCurrent = (index: number) => {
      if (index === current) return;
      current = index;
      layers.forEach((layer, i) => layer?.classList.toggle("is-current", i === index));
      onSceneChange?.(stageLayout.scenes[index].id);
    };
    const sceneAt = (vh: number) => midpoints.filter((mid) => vh >= mid).length;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none", immediateRender: false },
        scrollTrigger: {
          trigger: stageEl,
          start: "top top",
          end: "bottom bottom",
          scrub: reducedMotion ? 0.12 : 0.28,
          invalidateOnRefresh: true,
          // Settle on the next section after a flick, without pulling the finger back.
          snap: {
            snapTo: stageSnapProgresses(),
            duration: reducedMotion ? 0.12 : { min: 0.18, max: 0.38 },
            delay: 0,
            ease: "power1.out",
            directional: true,
          },
          onUpdate: (self) => {
            setCurrent(sceneAt(self.progress * stageLayout.totalVh));
            noteProgress(self.progress);
          },
          onRefresh: (self) => {
            setCurrent(sceneAt(self.progress * stageLayout.totalVh));
            noteProgress(self.progress);
          },
          onSnapComplete: (self) => {
            noteProgress(self.progress);
            void arriveAt(beatIdAtProgress(self.progress));
          },
        },
      });
      // Timeline positions are runway positions (vh units).
      tl.set({}, {}, stageLayout.totalVh);

      stageLayout.transitions.forEach((t, i) => {
        const outgoing = layers[i];
        const incoming = layers[i + 1];
        if (!outgoing || !incoming) return;
        tl.fromTo(incoming, { opacity: 0 }, { opacity: 1, duration: t.length }, t.start);
        const copy = copies[i];
        if (copy) tl.fromTo(copy, { opacity: 1 }, { opacity: 0, duration: t.length * OUTGOING_COPY_SHARE }, t.start);
        tl.set(outgoing, { opacity: 0 }, t.start + t.length);
      });
    }, stageEl);

    setCurrent(0);

    const onFocusIn = (event: FocusEvent) => {
      const layer = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-stage-scene]");
      const index = layer ? layers.indexOf(layer) : -1;
      if (index < 0 || index === current) return;
      const { start } = stageLayout.scenes[index].segment;
      window.scrollTo({ top: stageScrollTop(stageEl, index === 0 ? 0 : start + 1), behavior: "instant" });
    };
    stageEl.addEventListener("focusin", onFocusIn);

    return () => {
      stageEl.removeEventListener("focusin", onFocusIn);
      layers.forEach((layer) => layer?.classList.remove("is-current"));
      ctx.revert();
    };
  }, [enabled, reducedMotion, stage, onSceneChange]);
}
