import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { invitation } from "../../config/invitation";
import { OrnamentDivider } from "../OrnamentDivider/OrnamentDivider";
import { haptic } from "../../utils/haptic";
import "./OpeningEnvelope.css";

type OpeningEnvelopeProps = {
  reducedMotion: boolean;
  /** The invitation underneath should start its own entrance now (crossfade begins). */
  onReveal: () => void;
  /** The opening has fully faded out and can be removed. */
  onDone: () => void;
  /** Starts the song. The wax seal and Skip both call this; the prompt does not. */
  onPlay: () => void;
};

/**
 * Opening sequence timing, in seconds. Composition follows the reference frame
 * (flap open behind the card, card risen ~2/3 out of the pocket, seal on the
 * bottom panel). The order and durations of the motion are not visible in a
 * single frame, so they live here to be matched against a screen recording.
 */
const TIMING = {
  entrance: 0.8, // envelope settles in on load
  sealPress: 0.32, // seal dips under the tap
  flapStart: 0.22,
  flapDuration: 0.95, // flap folds open
  cardStart: 1.0,
  cardDuration: 1.4, // card rises to the reference pose
  hold: 0.55, // pause on the reference pose
  zoomDuration: 1.2, // card lifts out and fills the screen
  settle: 0.3, // still ivory moment: the invitation prepares underneath
  fadeDuration: 0.9, // card dissolves into the invitation
  skipFade: 0.5,
  reducedFade: 0.35,
};

/** Card start offset (yPercent of its own height): fully inside the pocket. */
const CARD_HIDDEN_Y = 82;

function CardFlourish({ className }: { className: string }) {
  return (
    <svg className={`env__card-flourish ${className}`} viewBox="0 0 120 120" aria-hidden="true">
      <path d="M6 112C6 52 52 6 112 6" />
      <path d="M18 100C18 58 56 20 98 18C78 26 64 40 62 56C60 70 72 76 80 66C86 58 80 48 72 50" />
      <path d="M30 92C34 72 46 60 60 56" />
      <path d="M98 18C104 10 114 8 118 12C112 18 104 20 98 18Z" className="leaf" />
      <path d="M18 100C10 104 8 114 12 118C18 112 20 104 18 100Z" className="leaf" />
      <path d="M46 40C44 30 50 22 58 20C58 30 54 36 46 40Z" className="leaf" />
      <path d="M40 46C30 44 22 50 20 58C30 58 36 54 40 46Z" className="leaf" />
    </svg>
  );
}

export function OpeningEnvelope({ reducedMotion, onReveal, onDone, onPlay }: OpeningEnvelopeProps) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const callbacks = useRef({ onReveal, onDone, onPlay });
  callbacks.current = { onReveal, onDone, onPlay };

  const { card, seal, coupleNames, wedding } = invitation;

  // Resting state + gentle entrance. Runs before paint, so nothing flashes.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(cardRef.current, { yPercent: CARD_HIDDEN_Y });
      gsap.set(flapRef.current, { rotationX: 0, zIndex: 6 });
      if (!reducedMotion) {
        gsap.fromTo(
          stageRef.current,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: TIMING.entrance, ease: "power2.out" },
        );
      }
    }, rootRef);
    return () => ctx.revert();
  }, [reducedMotion]);

  useEffect(
    () => () => {
      timeline.current?.kill();
    },
    [],
  );

  const finish = (fade: number) => {
    callbacks.current.onReveal();
    timeline.current?.kill();
    timeline.current = gsap.timeline({ onComplete: () => callbacks.current.onDone() });
    timeline.current.to(rootRef.current, { opacity: 0, duration: fade, ease: "power1.inOut" });
  };

  const open = () => {
    if (started.current) return;
    started.current = true;
    haptic(18);

    if (reducedMotion) {
      finish(TIMING.reducedFade);
      return;
    }

    const root = rootRef.current!;
    const q = gsap.utils.selector(root);
    const cardEl = cardRef.current!;
    const total =
      TIMING.cardStart +
      TIMING.cardDuration +
      TIMING.hold +
      TIMING.zoomDuration +
      TIMING.settle +
      TIMING.fadeDuration;
    const safety = window.setTimeout(() => finish(0.3), (total + 1.2) * 1000);

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => {
        window.clearTimeout(safety);
        callbacks.current.onDone();
      },
    });
    timeline.current = tl;

    // 1. The tap: prompt and glow retire, the seal dips like a pressed stamp.
    //    Skip stays available throughout, so nobody has to sit through the sequence.
    tl.to(q(".opening__prompt, .env__seal-glow"), { opacity: 0, duration: 0.3 }, 0)
      .to(q(".env__seal"), { scale: 0.93, duration: TIMING.sealPress / 2, ease: "power1.out" }, 0)
      .to(q(".env__seal"), { scale: 1, duration: TIMING.sealPress / 2, ease: "power1.in" }, TIMING.sealPress / 2);

    // 2. The flap folds open about its hinge; once edge-on it passes behind the card.
    tl.to(flapRef.current, { rotationX: 180, duration: TIMING.flapDuration }, TIMING.flapStart).set(
      flapRef.current,
      { zIndex: 2 },
      TIMING.flapStart + TIMING.flapDuration / 2,
    );

    // 3. The card rises out of the pocket to the reference pose.
    tl.to(
      cardEl,
      { yPercent: 0, duration: TIMING.cardDuration, ease: "power3.out" },
      TIMING.cardStart,
    );

    // 4. Hold, then the card lifts free and fills the screen while the envelope falls away.
    const zoomAt = TIMING.cardStart + TIMING.cardDuration + TIMING.hold;
    tl.add(() => {
      // Shadows and emboss filters would be re-rendered at every scale step; they are
      // fading out anyway, so drop them as the zoom begins to keep it smooth.
      gsap.set(q(".env__card, .env__pocket, .env__card-flourish, .env__card-frame, .env__seal img"), {
        boxShadow: "none",
        filter: "none",
      });
      // Measured at this moment, so it fits any viewport or orientation.
      const r = cardEl.getBoundingClientRect();
      const scale = Math.max(window.innerWidth / r.width, window.innerHeight / r.height) * 1.04;
      tl.to(
        cardEl,
        {
          x: window.innerWidth / 2 - (r.left + r.width / 2),
          y: window.innerHeight / 2 - (r.top + r.height / 2),
          scale,
          borderRadius: 0,
          duration: TIMING.zoomDuration,
          ease: "power2.inOut",
        },
        zoomAt,
      );
    }, zoomAt)
      .to(q(".env__card-flourish, .env__card-frame"), { opacity: 0, duration: 0.25, ease: "power1.out" }, zoomAt)
      .to(q(".env__card-content"), { opacity: 0, duration: TIMING.zoomDuration * 0.5, ease: "power1.out" }, zoomAt)
      .to(q(".env__pocket, .env__seal"), { yPercent: 22, duration: TIMING.zoomDuration * 0.6, ease: "power2.in" }, zoomAt)
      .to(
        q(".env__pocket, .env__seal"),
        { opacity: 0, duration: TIMING.zoomDuration * 0.4, ease: "power1.in" },
        zoomAt + 0.05,
      )
      .to(q(".env__back, .env__flap"), { opacity: 0, duration: TIMING.zoomDuration * 0.7, ease: "power1.in" }, zoomAt + 0.1);

    // 5. With the screen a still ivory field, the invitation starts its entrance beneath
    //    (its scroll setup happens here, unseen), then the card dissolves into it.
    const revealAt = zoomAt + TIMING.zoomDuration;
    const fadeAt = revealAt + TIMING.settle;
    tl.call(() => callbacks.current.onReveal(), [], revealAt).to(
      root,
      { opacity: 0, duration: TIMING.fadeDuration, ease: "power1.inOut" },
      fadeAt,
    );
  };

  const skip = () => {
    callbacks.current.onPlay();
    if (started.current && timeline.current?.progress() === 1) return;
    started.current = true;
    finish(reducedMotion ? TIMING.reducedFade : TIMING.skipFade);
  };

  return (
    <section ref={rootRef} className="opening" aria-label="Closed wedding invitation">
      <div className="opening__stage" ref={stageRef} onClick={open}>
        <svg className="opening__defs" aria-hidden="true">
          <defs>
            <filter id="envPaper" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" result="n" />
              <feColorMatrix
                in="n"
                type="matrix"
                values="0 0 0 0 0.62  0 0 0 0 0.42  0 0 0 0 0.4  0 0 0 0.22 0"
              />
            </filter>
            <pattern id="envDamask" width="64" height="64" patternUnits="userSpaceOnUse">
              <path d="M32 6 38 32 32 58 26 32Z" fill="none" stroke="rgba(230,211,163,0.28)" strokeWidth="0.7" />
              <circle cx="32" cy="32" r="1.5" fill="rgba(230,211,163,0.32)" />
              <circle cx="8" cy="8" r="0.7" fill="rgba(230,211,163,0.18)" />
              <circle cx="56" cy="56" r="0.7" fill="rgba(230,211,163,0.18)" />
            </pattern>
          </defs>
        </svg>

        {/* Back of the envelope, seen inside the open pocket. */}
        <svg className="env__back" viewBox="0 0 720 1280" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="envBack" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--seal)" />
              <stop offset="0.55" stopColor="var(--rose-deep)" />
              <stop offset="1" stopColor="var(--seal-shadow)" />
            </linearGradient>
            <radialGradient id="envInner" cx="0.5" cy="0.42" r="0.6">
              <stop offset="0" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="0.22" />
            </radialGradient>
          </defs>
          <rect width="720" height="1280" fill="url(#envBack)" />
          <rect width="720" height="1280" fill="url(#envInner)" />
          <rect width="720" height="1280" filter="url(#envPaper)" opacity="0.45" style={{ mixBlendMode: "overlay" }} />
        </svg>

        {/* Top flap: outer face while closed, inner face once folded open. */}
        <div className="env__flap" ref={flapRef} aria-hidden="true">
          <svg className="env__flap-face env__flap-face--outer" viewBox="0 0 720 290" preserveAspectRatio="none">
            <defs>
              <linearGradient id="envFlapOuter" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--rose-deep)" />
                <stop offset="0.55" stopColor="var(--seal)" />
                <stop offset="1" stopColor="var(--seal-light)" />
              </linearGradient>
              <radialGradient id="envFlapLight" cx="0.5" cy="0.18" r="0.7">
                <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
              <clipPath id="envFlapClip">
                <path d="M0 0H720L392 276Q360 300 328 276Z" />
              </clipPath>
            </defs>
            <path d="M0 0H720L392 276Q360 300 328 276Z" fill="url(#envFlapOuter)" />
            <rect width="720" height="290" fill="url(#envFlapLight)" clipPath="url(#envFlapClip)" />
            <rect
              width="720"
              height="290"
              filter="url(#envPaper)"
              opacity="0.4"
              clipPath="url(#envFlapClip)"
              style={{ mixBlendMode: "overlay" }}
            />
            <path
              d="M18 8H702L392 268Q360 290 328 268Z"
              fill="none"
              stroke="rgba(230,211,163,0.42)"
              strokeWidth="1.4"
            />
            <path d="M0 0L328 276Q360 300 392 276L720 0" fill="none" stroke="rgba(255,240,235,0.2)" strokeWidth="2" />
            <g transform="translate(360 108)" fill="none" stroke="rgba(230,211,163,0.78)" strokeWidth="1.3">
              <path d="M-42 0H-12" />
              <path d="M12 0H42" />
              <path d="M0 -9 8 0 0 9 -8 0Z" fill="rgba(230,211,163,0.55)" stroke="rgba(230,211,163,0.9)" />
            </g>
          </svg>
          <svg className="env__flap-face env__flap-face--inner" viewBox="0 0 720 290" preserveAspectRatio="none">
            <defs>
              <linearGradient id="envFlapInner" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="var(--seal-shadow)" />
                <stop offset="1" stopColor="var(--rose-deep)" />
              </linearGradient>
              <clipPath id="envFlapInnerClip">
                <path d="M0 290H720L392 14Q360 -10 328 14Z" />
              </clipPath>
            </defs>
            <path d="M0 290H720L392 14Q360 -10 328 14Z" fill="url(#envFlapInner)" />
            <rect width="720" height="290" fill="url(#envDamask)" clipPath="url(#envFlapInnerClip)" />
            <path d="M0 290L328 14Q360 -10 392 14L720 290" fill="none" stroke="rgba(255,240,235,0.22)" strokeWidth="2.5" />
          </svg>
        </div>

        {/* The card that rises out of the envelope. */}
        <div className="env__card" ref={cardRef} aria-hidden="true">
          <div className="env__card-frame" />
          <CardFlourish className="env__card-flourish--left" />
          <CardFlourish className="env__card-flourish--right" />
          <CardFlourish className="env__card-flourish--bottom-left" />
          <CardFlourish className="env__card-flourish--bottom-right" />
          <div className="env__card-content">
            <img className="env__card-monogram" src={invitation.logo} alt="" />
            <OrnamentDivider className="env__card-divider" />
            <p className="env__card-names">
              {coupleNames.first}
              </p>
              <span className="env__card-amp">&</span>
              <p className="env__card-names">
              {coupleNames.second}
            </p>
          </div>
        </div>

        {/* Front pocket: two side panels under a bottom panel that rises to a soft point. */}
        <svg className="env__pocket" viewBox="0 0 720 1280" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="envSide" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="var(--seal-shadow)" />
              <stop offset="1" stopColor="var(--rose-deep)" />
            </linearGradient>
            <linearGradient id="envSideR" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0" stopColor="var(--seal-shadow)" />
              <stop offset="1" stopColor="var(--rose-deep)" />
            </linearGradient>
            <linearGradient id="envBottom" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--seal)" />
              <stop offset="1" stopColor="var(--rose-deep)" />
            </linearGradient>
            <clipPath id="envPocketClip">
              <path d="M0 590L318 872Q338 890 330 905L0 1280Z" />
              <path d="M720 590L402 872Q382 890 390 905L720 1280Z" />
              <path d="M0 1135L326 884Q360 858 394 884L720 1135V1280H0Z" />
            </clipPath>
          </defs>
          <path d="M0 590L318 872Q338 890 330 905L0 1280Z" fill="url(#envSide)" />
          <path d="M720 590L402 872Q382 890 390 905L720 1280Z" fill="url(#envSideR)" />
          <path
            d="M0 1135L326 884Q360 858 394 884L720 1135V1280H0Z"
            fill="url(#envBottom)"
            stroke="rgba(255,240,235,0.14)"
            strokeWidth="2"
          />
          <path d="M8 600L310 868" fill="none" stroke="rgba(230,211,163,0.22)" strokeWidth="1.2" />
          <path d="M712 600L410 868" fill="none" stroke="rgba(230,211,163,0.22)" strokeWidth="1.2" />
          <path
            d="M24 1140L326 900Q360 876 394 900L696 1140"
            fill="none"
            stroke="rgba(230,211,163,0.28)"
            strokeWidth="1.1"
          />
          <rect
            width="720"
            height="1280"
            filter="url(#envPaper)"
            opacity="0.35"
            clipPath="url(#envPocketClip)"
            style={{ mixBlendMode: "overlay" }}
          />
        </svg>

        <button
          type="button"
          className="env__seal"
          onClick={(event) => {
            event.stopPropagation();
            callbacks.current.onPlay();
            open();
          }}
          aria-label={seal.ariaLabel}
        >
          <img className="env__seal-glow" src={card.sealImage} alt="" aria-hidden="true" />
          <img src={card.sealImage} alt="" />
        </button>

        <button
          type="button"
          className="opening__skip"
          onClick={(event) => {
            event.stopPropagation();
            skip();
          }}
        >
          {card.skipLabel}
        </button>

        <p className="opening__prompt">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              open();
            }}
          >
            {card.prompt}
          </button>
        </p>
      </div>
    </section>
  );
}
