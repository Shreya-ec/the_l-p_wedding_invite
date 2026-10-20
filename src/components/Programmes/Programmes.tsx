import type { RefObject } from "react";
import { invitation } from "../../config/invitation";
import { ProgrammeDay } from "./ProgrammeDay";

type ProgrammesProps = {
  active: boolean;
  reducedMotion: boolean;
  /** The fixed stage the days are layers of. */
  stage: RefObject<HTMLElement | null>;
};

/** Renders one consecutive programme section per day in `invitation.programmes.days`. */
export function Programmes({ active, reducedMotion, stage }: ProgrammesProps) {
  const { kicker, background, surround, artAspect, copyArea, days } = invitation.programmes;

  return (
    <>
      {days.map((day) => (
        <ProgrammeDay
          key={day.id}
          id={day.id}
          date={day.date}
          kicker={day.kicker ?? kicker}
          background={day.background ?? background}
          surround={day.surround ?? (day.background ? undefined : surround)}
          artAspect={day.artAspect ?? artAspect}
          copyArea={day.copyArea ?? copyArea}
          events={day.events}
          revealAt={day.revealAt ?? invitation.motion.programmeRevealAt}
          stage={stage}
          active={active}
          reducedMotion={reducedMotion}
        />
      ))}
    </>
  );
}
