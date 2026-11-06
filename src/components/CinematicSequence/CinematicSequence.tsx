import { useRef, useState, type CSSProperties, type RefObject } from "react";
import { invitation } from "../../config/invitation";
import { haptic } from "../../utils/haptic";
import { useSceneScroll } from "../../animations/useSceneScroll";
import { Countdown } from "../Countdown/Countdown";
import { OrnamentDivider } from "../OrnamentDivider/OrnamentDivider";
import { ScratchCard } from "../ScratchCard/ScratchCard";
import { SeamlessVideoBackground } from "./SeamlessVideoBackground";
import countdownVideo from "../../assests/videos/gemini_generated_video_15ad4f22.mp4";
import pavilionVideo from "../../assests/videos/gemini_generated_video_710ea71f.mp4";
import "./CinematicSequence.css";

/** Quiet gold sparks around the names card. Positions are fixed so nothing jumps between renders. */
const ROYAL_SPARKS = [
  { x: "6%", y: "22%", delay: "0s", size: 3 },
  { x: "92%", y: "18%", delay: "0.8s", size: 2.5 },
  { x: "12%", y: "72%", delay: "1.4s", size: 2 },
  { x: "88%", y: "68%", delay: "0.4s", size: 3 },
  { x: "4%", y: "46%", delay: "1.9s", size: 2 },
  { x: "96%", y: "44%", delay: "1.1s", size: 2.5 },
];

function CopyableDates({ label, dateTime }: { label: string; dateTime: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(label);
      setCopied(true);
      haptic(10);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* Clipboard can be denied; the dates remain visible. */
    }
  };

  return (
    <button
      type="button"
      className="scene-two__dates-btn"
      onClick={copy}
      aria-label={copied ? "Dates copied" : `Copy the wedding dates, ${label}`}
    >
      <time className="scene-two__dates" dateTime={dateTime}>
        {copied ? "Copied" : label}
      </time>
    </button>
  );
}

type CinematicSequenceProps = {
  active: boolean;
  /** The envelope has cleared, so the title scene is the screen in front of the guest. */
  settled: boolean;
  reducedMotion: boolean;
  /** The fixed stage this scene is a layer of. */
  stage: RefObject<HTMLElement | null>;
};

export function CinematicSequence({
  active,
  settled,
  reducedMotion,
  stage,
}: CinematicSequenceProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [sceneOne, sceneTwo, ...later] = invitation.scenes;
  const { wedding } = invitation;
  const framed = Boolean(sceneTwo.artAspect);
  // "Countdown to Forever" → main word, a small linking word ("to"), and the rest.
  const [headingMain, ...headingWords] = sceneTwo.title.split(" ");
  const headingLink = headingWords.length > 1 && headingWords[0].length <= 3 ? headingWords[0] : "";
  const headingRest = (headingLink ? headingWords.slice(1) : headingWords).join(" ");
  const frameStyle = { "--art-aspect": sceneTwo.artAspect ?? 1 } as CSSProperties;

  useSceneScroll({
    root: rootRef,
    stage,
    enabled: active,
    settled,
    reducedMotion,
  });

  return (
    <section
      ref={rootRef}
      className={`cinema stage__layer ${active ? "is-active" : ""}`}
      data-stage-scene="cinema"
      aria-label="Wedding title sequence"
      aria-hidden={!active}
      inert={!active}
    >
      <div className="cinema__viewport">
        {/* Pages 1 & 2 (The P&L Wedding & Bride & Groom): Seamless looping video background */}
        <div className="scene-bg scene-bg--one">
          <SeamlessVideoBackground
            src={pavilionVideo}
            active={active}
            crossfadeDuration={1.4}
          />
        </div>
        {/* Scene 2 (Countdown & Scratch): Seamless looping video background */}
        <div className="scene-bg scene-bg--two">
          <SeamlessVideoBackground
            src={countdownVideo}
            active={active}
            crossfadeDuration={1.4}
          />
        </div>
        <div className="cinema__veil" />

        {/* All of this scene's text: faded out by the stage as the next scene arrives. */}
        <div className="cinema__copy" data-stage-copy>
        <div className="scene-copy scene-copy--one">
          <h1 className={`scene-title ${sceneOne.titleImage ? "scene-title--lettering" : ""}`.trim()}>
            {sceneOne.titleImage ? (
              <img className="scene-lettering" src={sceneOne.titleImage} alt={sceneOne.title} />
            ) : (
              sceneOne.title
            )}
          </h1>
          {sceneOne.supportingText ? (
            <p className="scene-support">{sceneOne.supportingText}</p>
          ) : null}
        </div>

        {/* Names on a half-clear ivory arch, centred on the pavilion. */}
        <div className="scene-names" aria-labelledby="scene-names-title">
          <span className="scene-names__glow" aria-hidden="true" />
          <img className="scene-names__logo" src={invitation.logo} alt="P and L monogram" />
          <p className="scene-names__kicker">{invitation.coupleNames.withFamilies}</p>
          <OrnamentDivider className="scene-names__ornament" />
          <div className="scene-names__lockup">
            <span className="scene-names__jewel scene-names__jewel--top" aria-hidden="true" />
            <span className="scene-names__jewel scene-names__jewel--bottom" aria-hidden="true" />
            {ROYAL_SPARKS.map((spark) => (
              <span
                key={`${spark.x}-${spark.y}`}
                className="scene-names__spark"
                style={{
                  left: spark.x,
                  top: spark.y,
                  width: spark.size,
                  height: spark.size,
                  animationDelay: spark.delay,
                }}
                aria-hidden="true"
              />
            ))}
            <h2 id="scene-names-title" className="scene-names__title">
              <span className="scene-names__person">
                <span className="scene-names__name">{invitation.coupleNames.first}</span>
                <span className="scene-names__parents">{invitation.coupleNames.firstFamily}</span>
              </span>
              <span className="scene-names__amp">&amp;</span>
              <span className="scene-names__person">
                <span className="scene-names__name">{invitation.coupleNames.second}</span>
                <span className="scene-names__parents">{invitation.coupleNames.secondFamily}</span>
              </span>
            </h2>
          </div>
          <p className="scene-names__line">{invitation.coupleNames.invitationLine}</p>
        </div>

        <div
          className={`scene-copy scene-copy--two ${framed ? "scene-copy--framed" : ""}`.trim()}
          style={framed ? frameStyle : undefined}
        >
          <div className="scene-two__inner">
            {/* Above the centre: invitation line and the scratch-to-reveal dates. */}
            <div className="scene-two__lead">
              {sceneTwo.kicker ? <p className="scene-kicker">{sceneTwo.kicker}</p> : null}
              {/* Typographic lockup: "COUNTDOWN" in spaced capitals over an italic "to Forever". */}
              <h2 className="scene-title scene-title--second scene-two__heading">
                <span className="scene-two__heading-main">{headingMain}</span>{" "}
                <span className="scene-two__heading-tail">
                  {headingLink ? <span className="scene-two__heading-link">{headingLink}</span> : null}
                  {headingLink ? " " : null}
                  {headingRest}
                </span>
              </h2>
              {sceneTwo.supportingText ? <p className="scene-support">{sceneTwo.supportingText}</p> : null}
              <OrnamentDivider className="scene-two__divider" />
              <ScratchCard
                className="scene-two__scratch"
                prompt={wedding.scratchLabel}
                revealLabel={`${wedding.scratchLabel}: reveal the wedding dates`}
                announcement={`The wedding is on ${wedding.datesLabel}.`}
                reducedMotion={reducedMotion}
              >
                <CopyableDates label={wedding.datesLabel} dateTime={wedding.startsAt} />
              </ScratchCard>
            </div>
            {/* The centre of the screen: the countdown, highlighted. */}
            <div className="scene-two__countdown-panel">
              <Countdown
                className="scene-two__countdown"
                target={wedding.startsAt}
                completeMessage={wedding.celebrationMessage}
                reducedMotion={reducedMotion}
              />
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Extension point: later cinematic chapters are declared in invitation.scenes */}
      {later.length > 0 ? (
        <ol className="cinema__later sr-only">
          {later.map((scene) => (
            <li key={scene.id}>{scene.title}</li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
