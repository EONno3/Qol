import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CatchUpRunView } from "./CatchUpRunView";
import type { CatchUpRunState } from "../data/types";

function makeRun(overrides: Partial<CatchUpRunState> = {}): CatchUpRunState {
  return {
    dispatchId: "run1",
    missionId: "m1",
    mercId: "merc1",
    status: "active",
    predictAnalysisLevel: 2,
    interventionsLeft: 2,
    intervenedCount: 0,
    rngSeed: 42,
    fatigueMultiplier: 1,
    queueNodes: [
      {
        nodeInstanceId: "n1",
        nameKo: "작전 구역 진입",
        role: "entry",
        statCheck: "frame",
        nodeKind: "basic_gate",
        challengeTags: [],
        defaultPolarity: "neutral",
      },
    ],
    phase: "main",
    entryBlocked: false,
    logs: ["[작전 개시]"],
    nodeResolutions: [],
    context: {
      missionId: "m1",
      mercId: "merc1",
      flags: {},
      seizedGearIds: [],
      detectedAtNodeIndex: null,
      visibilityAccumulated: 0,
      emergencyCount: 0,
      allTriggeredTags: [],
    },
    totalFatigue: 0,
    minorFails: 0,
    objectiveSucceeded: false,
    exitOutcome: null,
    catastropheRole: null,
    nodeIndex: 0,
    catchUpBonusEarned: false,
    stars: 2,
    fatiguePerNode: 3,
    ...overrides,
  };
}

describe("CatchUpRunView 인런 드론 (T-DC2-UI)", () => {
  it("T-DC2-UI-2: 노드 화면에서 개입/패스 버튼이 노출된다", () => {
    const onAction = vi.fn();
    render(
      <CatchUpRunView
        run={makeRun()}
        currentNode={makeRun().queueNodes[0]}
        onAction={onAction}
      />,
    );
    expect(screen.getByTestId("catchup-current-node")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /\[개입\]/ }));
    expect(onAction).toHaveBeenCalledWith("intervene");
    fireEvent.click(screen.getByRole("button", { name: /\[패스\]/ }));
    expect(onAction).toHaveBeenCalledWith("pass");
  });
});
