import { useRef, type RefObject } from "react";
import { invitation } from "../../config/invitation";
import { useVenueReveal } from "../../animations/useVenueReveal";
import { OrnamentDivider } from "../OrnamentDivider/OrnamentDivider";
import "./Venue.css";

type VenueProps = {
  active: boolean;
  reducedMotion: boolean;
  /** The fixed stage this scene is a layer of. */
  stage: RefObject<HTMLElement | null>;
};

/**
 * Google is asked to find the supplied name and address; no coordinates are
 * hard-coded. Both links open Google Maps (app or browser).
 */
function mapUrls(query: string) {
  const q = encodeURIComponent(query);
  return {
    directions: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
    search: `https://www.google.com/maps/search/?api=1&query=${q}`,
  };
}

export function Venue({ active, reducedMotion, stage }: VenueProps) {
  const rootRef = useRef<HTMLElement>(null);
  const { heading, name, address, background, mapQuery, mapImage } = invitation.venue;
  const urls = mapUrls(mapQuery);

  useVenueReveal({ root: rootRef, stage, enabled: active, reducedMotion });

  return (
    <section
      ref={rootRef}
      className="venue stage__layer"
      data-stage-scene="venue"
      aria-labelledby="venue-heading"
      aria-hidden={!active}
      inert={!active}
    >
      <div className="venue__backdrop" style={{ backgroundImage: `url(${background})` }} />
      <div className="venue__veil" />

      <div className="venue__inner" data-stage-copy>
        <header className="venue__header">
          <p className="venue__kicker">{heading}</p>
          <h2 id="venue-heading" className="venue__name">
            {name}
          </h2>
          <OrnamentDivider gem="pin" className="venue__divider" />
          {/* Name and address are plain text, so they remain whatever happens to the map. */}
          <address className="venue__address">{address}</address>
        </header>

        <figure className="venue__map">
          <div className="venue__map-frame">
            {/* A still of the venue on Google Maps, with one way in: open the live map. */}
            <a
              className="venue__map-window"
              href={urls.search}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${name}, ${address} in Google Maps (opens in a new tab)`}
            >
              <img className="venue__map-image" src={mapImage} alt="" />
              <span className="venue__map-open" aria-hidden="true">
                Open in Google Maps
              </span>
            </a>
          </div>
        </figure>

        <a
          className="venue__directions"
          href={urls.directions}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg className="venue__directions-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M8 1.6c-2.4 0-4.3 1.9-4.3 4.2 0 3.1 4.3 7.6 4.3 7.6s4.3-4.5 4.3-7.6c0-2.3-1.9-4.2-4.3-4.2Z" />
            <circle cx="8" cy="5.9" r="1.45" />
          </svg>
          Get Directions
          <span className="sr-only"> to {name} (opens Google Maps in a new tab)</span>
        </a>
      </div>
    </section>
  );
}
