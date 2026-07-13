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
    lowHudResolution: false,
  };
  return render(<DroneCatchUpView {...defaults} {...overrides} />);
}

describe("DroneCatchUpView 관제 드론 UI (T-DC-UI)", () => {
  it("T-DC-UI-1: 토글 ON 시 관제 드론 뷰 레이어가 렌더링된다", () => {
    renderDrone({ catchUpOn: true });
    expect(screen.getByTestId("drone-catchup-active")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "관제 드론" })).toBeInTheDocument();
    expect(screen.getByText(/출격 후 드론 관제/)).toBeInTheDocument();
    expect(screen.queryByText(/개입할 노드 선택/)).not.toBeInTheDocument();
  });

  it("T-DC-UI-2: L<2(lowHudResolution) 시 Glitch 패널로 인런 HUD 저해상도가 예고된다", () => {
    renderDrone({ catchUpOn: true, lowHudResolution: true });
    const glitch = screen.getByTestId("drone-l0-glitch");
    expect(glitch).toBeInTheDocument();
    expect(glitch).toHaveClass("drone-glitch");
    expect(screen.getByText(/SIGNAL DEGRADED/i)).toBeInTheDocument();
    expect(screen.queryByText(/개입할 노드 선택/)).not.toBeInTheDocument();
  });
});
