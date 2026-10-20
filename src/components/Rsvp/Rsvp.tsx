import { useRef, useState, type RefObject } from "react";
import { haptic } from "../../utils/haptic";
import { invitation } from "../../config/invitation";
import { useRsvpReveal } from "../../animations/useRsvpReveal";
import { OrnamentDivider } from "../OrnamentDivider/OrnamentDivider";
import "./Rsvp.css";

type RsvpProps = {
  active: boolean;
  reducedMotion: boolean;
  stage: RefObject<HTMLElement | null>;
};

function PawIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <ellipse cx="6.2" cy="7.1" rx="2.15" ry="2.7" />
      <ellipse cx="12" cy="5.1" rx="2.3" ry="2.85" />
      <ellipse cx="17.8" cy="7.1" rx="2.15" ry="2.7" />
      <ellipse cx="3.9" cy="12.1" rx="1.85" ry="2.4" />
      <path d="M12 11.1c-4.2 0-7 3.2-7 6.2 0 2.3 1.8 3.7 4.15 3.7 1.15 0 2.1-.35 2.7-1.05.6.7 1.55 1.05 2.7 1.05 2.35 0 4.15-1.4 4.15-3.7 0-3-2.8-6.2-7-6.2Z" />
    </svg>
  );
}

export function Rsvp({ active, reducedMotion, stage }: RsvpProps) {
  const rootRef = useRef<HTMLElement>(null);
  const { rsvp } = invitation;
  const [waving, setWaving] = useState(false);

  useRsvpReveal({ root: rootRef, stage, enabled: active, reducedMotion });

  const wave = () => {
    haptic(12);
    setWaving(false);
    requestAnimationFrame(() => setWaving(true));
  };

  return (
    <section
      ref={rootRef}
      className="rsvp stage__layer"
      data-stage-scene="rsvp"
      aria-labelledby="rsvp-heading"
      aria-hidden={!active}
      inert={!active}
    >
      <div className="rsvp__backdrop" style={{ backgroundImage: `url(${rsvp.background})` }} />
      <div className="rsvp__veil" />

      <div className="rsvp__inner" data-stage-copy>
        <header className="rsvp__header">
          <img className="rsvp__monogram" src={invitation.logo} alt="" aria-hidden="true" />
          <p className="rsvp__kicker">{rsvp.heading}</p>
          <h2 id="rsvp-heading" className="rsvp__title">
            {rsvp.hosts}
          </h2>
          <OrnamentDivider className="rsvp__divider" />
        </header>

        <p className="rsvp__closing">
          {rsvp.closing}{" "}
          <button
            type="button"
            className={`rsvp__alex ${waving ? "is-waving" : ""}`.trim()}
            onClick={wave}
            onAnimationEnd={() => setWaving(false)}
            aria-label="A special hello from Alex"
          >
            {rsvp.closingFrom}
            <PawIcon className="rsvp__paw" />
          </button>
        </p>
      </div>
    </section>
  );
}
