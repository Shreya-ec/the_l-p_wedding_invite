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

  const { goToStep } = useStageTransitions({
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
      </div>
    </div>
  );
}
