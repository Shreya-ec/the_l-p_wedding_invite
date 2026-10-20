import gsap from "gsap";

type Targets = gsap.TweenTarget;

type HeadingParts = {
  /** Optional soft light behind the copy. */
  glow?: Targets;
  /** Small uppercase line above the title (a date, or "The Wedding Venue"). */
  kicker: Targets;
  title: Targets;
  /** The OrnamentDivider's `.ornament__rule` elements. */
  rules: Targets;
  /** The OrnamentDivider's `.ornament__gem`. */
  gem: Targets;
};

/**
 * The invitation's shared heading entrance: light, kicker, title, then the gold
 * divider drawing outward and its centre motif settling. Returned paused; the
 * "from" state renders immediately so nothing flashes before it plays.
 */
export function buildHeadingReveal({ glow, kicker, title, rules, gem }: HeadingParts) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });

  if (glow) {
    tl.fromTo(glow, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0);
  }

  return tl
    .fromTo(kicker, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35 }, 0)
    .fromTo(
      title,
      { opacity: 0, y: 12, scale: 0.985 },
      { opacity: 1, y: 0, scale: 1, duration: 0.45 },
      0.08,
    )
    .fromTo(
      rules,
      { opacity: 0, scaleX: 0 },
      { opacity: 1, scaleX: 1, duration: 0.4, ease: "power2.inOut" },
      0.22,
    )
    .fromTo(
      gem,
      { opacity: 0, scale: 0.4, rotation: -45 },
      { opacity: 1, scale: 1, rotation: 0, duration: 0.3, transformOrigin: "50% 50%" },
      0.32,
    );
}

/**
 * The invitation's shared "detail" entrance (event titles, addresses, frames):
 * a soft fade with a slight lift and scale. Added onto an existing timeline.
 */
export function addDetailReveal(
  tl: gsap.core.Timeline,
  target: Targets,
  at: number,
  { y = 10, scale = 0.98, duration = 0.4 }: { y?: number; scale?: number; duration?: number } = {},
) {
  return tl.fromTo(
    target,
    { opacity: 0, y, scale },
    { opacity: 1, y: 0, scale: 1, duration, ease: "power2.out" },
    at,
  );
}
