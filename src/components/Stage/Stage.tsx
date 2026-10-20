import type { ReactNode, RefObject } from "react";
import { stageLayout } from "../../stage/stageLayout";
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
 * A fixed-viewport stage: every scene is a stacked full-screen layer inside a
 * sticky viewport, and a tall runway beneath it carries the page's natural
 * scroll. Scrolling advances the film (crossfades and reveals) while the
 * picture itself never slides.
 */
export function Stage({ stageRef, active, reducedMotion, onSceneChange, children }: StageProps) {
  useStageTransitions({ stage: stageRef, enabled: active, reducedMotion, onSceneChange });

  return (
    <div
      ref={stageRef}
      className="stage"
      style={{ height: `calc(100vh + ${stageLayout.totalVh}vh)` }}
    >
      <div className="stage__viewport">{children}</div>
    </div>
  );
}
