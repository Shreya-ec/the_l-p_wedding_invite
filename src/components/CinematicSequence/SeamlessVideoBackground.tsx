import { useEffect, useRef } from "react";
import "./SeamlessVideoBackground.css";

type SeamlessVideoBackgroundProps = {
  src: string;
  poster?: string;
  active?: boolean;
  crossfadeDuration?: number; // Duration of crossfade blend in seconds (default: 1.2s)
  className?: string;
};

/**
 * Ultra-smooth gapless video background with dual-player A/B crossfading.
 * Eliminates the frame-freeze / black stutter at loop boundaries by overlapping
 * the start and end of the loop across two hardware-accelerated video streams.
 */
export function SeamlessVideoBackground({
  src,
  poster,
  active = true,
  crossfadeDuration = 1.4,
  className = "",
}: SeamlessVideoBackgroundProps) {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const vidA = videoARef.current;
    const vidB = videoBRef.current;
    if (!vidA || !vidB) return;

    // Reset initial visual state: Player A is visible, Player B is hidden
    vidA.style.opacity = "1";
    vidB.style.opacity = "0";

    let primaryIndex = 0; // 0: vidA is playing, 1: vidB is playing
    let isCrossfading = false;
    let animId = 0;

    const playPrimary = () => {
      const primary = primaryIndex === 0 ? vidA : vidB;
      primary.play().catch(() => {});
    };

    if (active) {
      playPrimary();
    } else {
      vidA.pause();
      vidB.pause();
    }

    // High-precision RAF loop for seamless crossfade transition
    const tick = () => {
      if (!active) {
        animId = requestAnimationFrame(tick);
        return;
      }

      const primary = primaryIndex === 0 ? vidA : vidB;
      const secondary = primaryIndex === 0 ? vidB : vidA;

      if (!isNaN(primary.duration) && primary.duration > 0) {
        const timeRemaining = primary.duration - primary.currentTime;

        // When nearing the end of the clip, begin crossfading the secondary clip from 0s
        if (timeRemaining <= crossfadeDuration && timeRemaining > 0) {
          if (!isCrossfading) {
            isCrossfading = true;
            secondary.currentTime = 0;
            secondary.play().catch(() => {});
          }

          // Smooth S-curve cosine blend for imperceptible visual handoff
          const elapsed = crossfadeDuration - timeRemaining;
          const linear = Math.min(1, Math.max(0, elapsed / crossfadeDuration));
          const blend = (1 - Math.cos(linear * Math.PI)) / 2;

          primary.style.opacity = String(1 - blend);
          secondary.style.opacity = String(blend);
        } else if (timeRemaining <= 0.08 || primary.ended) {
          // Primary finished its cycle: complete the handoff
          if (!isCrossfading) {
            secondary.currentTime = 0;
            secondary.play().catch(() => {});
          }
          primary.pause();
          primary.currentTime = 0;
          primary.style.opacity = "0";
          secondary.style.opacity = "1";

          // Swap active roles
          primaryIndex = primaryIndex === 0 ? 1 : 0;
          isCrossfading = false;
        } else if (!isCrossfading) {
          // Standard playback before crossfade window
          primary.style.opacity = "1";
          secondary.style.opacity = "0";
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    // Visibility change handler (tab switching / mobile lock)
    const onVisibilityChange = () => {
      if (document.hidden) {
        vidA.pause();
        vidB.pause();
      } else if (active) {
        const primary = primaryIndex === 0 ? vidA : vidB;
        primary.play().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      vidA.pause();
      vidB.pause();
    };
  }, [active, crossfadeDuration, src]);

  return (
    <div className={`seamless-video ${className}`.trim()} aria-hidden="true">
      <video
        ref={videoARef}
        src={src}
        poster={poster}
        muted
        playsInline
        autoPlay
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        className="seamless-video__media"
      />
      <video
        ref={videoBRef}
        src={src}
        poster={poster}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        className="seamless-video__media"
      />
    </div>
  );
}
