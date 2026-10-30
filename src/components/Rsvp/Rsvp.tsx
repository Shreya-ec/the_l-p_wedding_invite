import { useRef, type RefObject } from "react";
import { invitation } from "../../config/invitation";
import { useRsvpReveal } from "../../animations/useRsvpReveal";
import { OrnamentDivider } from "../OrnamentDivider/OrnamentDivider";
import "./Rsvp.css";

type RsvpProps = {
  active: boolean;
  reducedMotion: boolean;
  stage: RefObject<HTMLElement | null>;
};

export function Rsvp({ active, reducedMotion, stage }: RsvpProps) {
  const rootRef = useRef<HTMLElement>(null);
  const { rsvp } = invitation;

  useRsvpReveal({ root: rootRef, stage, enabled: active, reducedMotion });

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
      </div>
    </section>
  );
}
