import { useRef, type CSSProperties, type RefObject } from "react";
import type { ArtCopyArea, ProgrammeEvent } from "../../config/invitation";
import { useProgrammeScroll } from "../../animations/useProgrammeScroll";
import { OrnamentDivider } from "../OrnamentDivider/OrnamentDivider";
import "./Programmes.css";

export type ProgrammeDayProps = {
  /** Stable id; used for the accessible heading id. */
  id: string;
  /** The day's date: the section's display title. */
  date: string;
  /** Small-capitals line above the date. */
  kicker: string;
  background: string;
  /** Small pre-blurred copy of the artwork; without it the surround is blurred live with CSS. */
  surround?: string;
  /** Artwork width ÷ height. */
  artAspect: number;
  /** Open area of the artwork that holds the copy, as % insets. */
  copyArea: ArtCopyArea;
  events: ProgrammeEvent[];
  /** Progress (0–1) through this day's stretch of the stage at which each event is revealed. */
  revealAt: number[];
  /** The fixed stage this day is a layer of. */
  stage: RefObject<HTMLElement | null>;
  active: boolean;
  reducedMotion: boolean;
};

/**
 * One day of the wedding programme: a pinned, full-viewport scene whose copy
 * sits inside the gilded arch of the artwork. Every day shares this exact
 * layout and choreography; only the props change.
 */
export function ProgrammeDay({
  id,
  date,
  kicker,
  background,
  surround,
  artAspect,
  copyArea,
  events,
  revealAt: _revealAt,
  stage,
  active,
  reducedMotion,
}: ProgrammeDayProps) {
  const rootRef = useRef<HTMLElement>(null);
  const headingId = `programme-heading-${id}`;
  const kickerId = `programme-kicker-${id}`;
  const art = { backgroundImage: `url(${background})` };
  // Geometry of this day's artwork, consumed by Programmes.css.
  const geometry = {
    "--art-aspect": artAspect,
    "--copy-top": `${copyArea.top}%`,
    "--copy-right": `${copyArea.right}%`,
    "--copy-bottom": `${copyArea.bottom}%`,
    "--copy-left": `${copyArea.left}%`,
  } as CSSProperties;

  useProgrammeScroll({
    root: rootRef,
    stage,
    sceneId: `day-${id}`,
    enabled: active,
    reducedMotion,
  });

  return (
    <section
      ref={rootRef}
      className="programme stage__layer"
      data-stage-scene={`day-${id}`}
      data-day={id}
      style={geometry}
      aria-labelledby={`${kickerId} ${headingId}`}
      aria-hidden={!active}
      inert={!active}
    >
      <div className="programme__viewport">
        {/* Soft, blurred continuation of the artwork for screens wider than the portrait art. */}
        <div
          className={`programme__surround ${surround ? "programme__surround--soft" : ""}`.trim()}
          style={surround ? { backgroundImage: `url(${surround})` } : art}
        />
        <div className="programme__surround-veil" />

        {/* The portrait artwork; the copy is laid out inside its empty gilded arch. */}
        <div className="programme__panel">
          <div className="programme__art" style={art} />
          <div className="programme__glow" />

          <div className="programme__copy" data-stage-copy>
            <header className="programme__header">
              <p id={kickerId} className="programme__kicker">
                {kicker}
              </p>
              <h2 id={headingId} className="programme__title">
                {date}
              </h2>
              <OrnamentDivider className="programme__divider" />
            </header>

            <ol className="programme__events">
              {events.map((event, index) => (
                <li key={event.id} className="programme__event" data-event={event.id}>
                  {index > 0 ? (
                    <span className="programme__connector" aria-hidden="true" />
                  ) : null}
                  <span className="programme__node" aria-hidden="true" />
                  <h3 className="programme__event-title">{event.label}</h3>
                  <p className="programme__time">
                    <time dateTime={event.dateTime}>{event.time}</time>
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
