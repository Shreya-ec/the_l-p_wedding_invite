import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CinematicSequence } from "./components/CinematicSequence/CinematicSequence";
import { OpeningEnvelope } from "./components/OpeningEnvelope/OpeningEnvelope";
import { Stage } from "./components/Stage/Stage";
import { Programmes } from "./components/Programmes/Programmes";
import { Venue } from "./components/Venue/Venue";
import { Rsvp } from "./components/Rsvp/Rsvp";
import { invitation } from "./config/invitation";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";

type OpeningPhase = "closed" | "revealing" | "open";

/** The invitation always opens on the first cinematic section, not a restored scroll. */
function pinToFirstScene() {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

export default function App() {
  const reducedMotion = usePrefersReducedMotion();
  // closed → revealing (opening crossfades into the invitation) → open (opening removed)
  const [phase, setPhase] = useState<OpeningPhase>("closed");
  const opened = phase !== "closed";
  const stageRef = useRef<HTMLDivElement>(null);
  const songRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);

  const playSong = () => {
    const audio = songRef.current;
    if (!audio) return;
    const startAt = invitation.song.startSeconds;
    const seekToStart = () => {
      if (audio.currentTime < startAt - 0.25) audio.currentTime = startAt;
    };
    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) seekToStart();
    else audio.addEventListener("loadedmetadata", seekToStart, { once: true });
    // Some browsers begin at 0 if the seek has not landed yet; correct on the first play.
    audio.addEventListener("playing", seekToStart, { once: true });
    void audio.play();
  };

  useEffect(() => {
    const audio = songRef.current;
    if (audio) audio.muted = muted;
  }, [muted]);

  useLayoutEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    pinToFirstScene();
  }, []);

  useLayoutEffect(() => {
    if (phase === "closed") return;
    pinToFirstScene();
  }, [phase]);

  useEffect(() => {
    const lockPage = phase !== "open";
    document.documentElement.style.overflow = lockPage ? "hidden" : "";
    document.body.style.overflow = lockPage ? "hidden" : "";
    document.documentElement.classList.toggle("is-envelope", lockPage);
    // Unlocking scroll can change the scrollbar width; re-measure scroll positions.
    if (phase === "open") {
      pinToFirstScene();
      requestAnimationFrame(() => {
        pinToFirstScene();
        ScrollTrigger.refresh();
      });
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.documentElement.classList.remove("is-envelope");
    };
  }, [phase]);

  return (
    <main>
      <audio ref={songRef} src={invitation.song.src} preload="auto" />
      <button
        type="button"
        className="sound-toggle"
        aria-pressed={muted}
        aria-label={muted ? "Unmute music" : "Mute music"}
        onClick={() => setMuted((current) => !current)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 10h3.2L12 6.2v11.6L7.2 14H4z" />
          {muted ? (
            <path d="M16 9.5l5 5M21 9.5l-5 5" />
          ) : (
            <>
              <path d="M15.2 9.2a3.6 3.6 0 0 1 0 5.6" />
              <path d="M17.4 7a6.4 6.4 0 0 1 0 10" />
            </>
          )}
        </svg>
      </button>
      {phase !== "open" ? (
        <OpeningEnvelope
          reducedMotion={reducedMotion}
          onReveal={() => setPhase((current) => (current === "closed" ? "revealing" : current))}
          onDone={() => setPhase("open")}
          onPlay={playSong}
        />
      ) : null}
      {/* One fixed-viewport stage: every scene crossfades into the next as the guest scrolls. */}
      <Stage stageRef={stageRef} active={opened} reducedMotion={reducedMotion}>
        <CinematicSequence
          active={opened}
          settled={phase === "open"}
          reducedMotion={reducedMotion}
          stage={stageRef}
        />
        <Programmes active={opened} reducedMotion={reducedMotion} stage={stageRef} />
        <Venue active={opened} reducedMotion={reducedMotion} stage={stageRef} />
        <Rsvp active={opened} reducedMotion={reducedMotion} stage={stageRef} />
      </Stage>
    </main>
  );
}
