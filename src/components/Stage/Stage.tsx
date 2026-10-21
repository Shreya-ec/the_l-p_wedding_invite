import { useState, type ReactNode, type RefObject } from "react";
import { STAGE_STEPS } from "../../stage/stageSteps";
import { useStageTransitions } from "../../stage/useStageTransitions";
import "./Stage.css";

type StageProps = {
  stageRef: RefObject<HTMLDivElement | null>;
  active: boolean;
  reducedMotion: boolean;
  onSceneChange?: (sceneId: string) => void;
  children: ReactNode;
};

/**
 * Fixed 100dvh full-bleed stage with 120fps one-stroke transitions.
 * Features subtle, elegant gilded pagination dots on the right edge.
 */
export function Stage({ stageRef, active, reducedMotion, onSceneChange, children }: StageProps) {
  const [activeStep, setActiveStep] = useState(0);

  const { goToStep, nextStep } = useStageTransitions({
    stage: stageRef,
    enabled: active,
    reducedMotion,
    onSceneChange,
    onStepChange: setActiveStep,
  });

  return (
    <div ref={stageRef} className="stage">
      <div className="stage__viewport">
        {children}

        {/* Elegant gold pagination dots */}
        <nav className="stage__nav" aria-label="Invitation chapters">
          {STAGE_STEPS.map((step, idx) => (
            <button
              key={step.id}
              type="button"
              className={`stage__nav-dot ${activeStep === idx ? "is-active" : ""}`}
              onClick={() => goToStep(idx)}
              aria-label={`Go to ${step.label}`}
              aria-current={activeStep === idx ? "step" : undefined}
            />
          ))}
        </nav>

        {/* Persistent gilded scroll cue on every page */}
        <button
          type="button"
          className={`scroll-cue is-visible${reducedMotion ? " scroll-cue--reduced" : ""}`}
          onClick={() => {
            if (activeStep < STAGE_STEPS.length - 1) {
              nextStep();
            } else {
              goToStep(0);
            }
          }}
          aria-label={activeStep < STAGE_STEPS.length - 1 ? "Scroll to next page" : "Scroll to top"}
        >
          <span className="scroll-cue__mark">
            <span className="scroll-cue__rule" aria-hidden="true" />
            <span className="scroll-cue__word">scroll</span>
            <span className="scroll-cue__rule" aria-hidden="true" />
          </span>
          <svg className="scroll-cue__chevron" viewBox="0 0 24 16" aria-hidden="true">
            <path d="M3 2.2 12 9.2 21 2.2" />
            <path d="M3 7.2 12 14.2 21 7.2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
