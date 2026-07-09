import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DroneCatchUpView } from "./DroneCatchUpView";

function renderDrone(overrides: Partial<Parameters<typeof DroneCatchUpView>[0]> = {}) {
  const defaults = {
    visible: true,
    catchUpOn: false,
    onCatchUpChange: vi.fn(),
    baseCommandCost: 3,
    effectiveCommandCost: 5,
    canPickNodes: true,
    selectableNodeNames: ["작전 구역 진입", "목표"],
    pickedNodes: [] as string[],
    onToggleNodePick: vi.fn(),
    interventionCap: 1,
    catchUpNeedsNodes: false,
  };
  return render(<DroneCatchUpView {...defaults} {...overrides} />);
}

describe("DroneCatchUpView 관제 드론 UI (T-DC-UI)", () => {
  it("T-DC-UI-1: 토글 ON 시 관제 드론 뷰 레이어가 렌더링된다", () => {
    renderDrone({ catchUpOn: true });
    expect(screen.getByTestId("drone-catchup-active")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "관제 드론" })).toBeInTheDocument();
  });

  it("T-DC-UI-2: L<2(canPickNodes=false) 시 Glitch 패널로 무작위 개입 강제가 시각화된다", () => {
    renderDrone({ catchUpOn: true, canPickNodes: false });
    const glitch = screen.getByTestId("drone-l0-glitch");
    expect(glitch).toBeInTheDocument();
    expect(glitch).toHaveClass("drone-glitch");
    expect(screen.getByText(/SIGNAL DEGRADED/i)).toBeInTheDocument();
    expect(screen.getByText(/무작위 30%/)).toBeInTheDocument();
    expect(screen.queryByText(/개입할 노드 선택/)).not.toBeInTheDocument();
  });
});
