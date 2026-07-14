import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DeskView } from "./DeskView";
import { createMockResultReport } from "../test/factories";

describe("DeskView 서사 동기화 상태 (T-DUX-DESK-UI)", () => {
  const completed = [{ dispatchId: "d1", missionId: "m1", mercId: "merc1" }];

  it("T-DUX-DESK-UI-1: GENERATING이면 동기화 중이며 열람 버튼 비활성", () => {
    render(
      <DeskView
        activeDispatches={[]}
        completedDispatches={completed}
        settledReports={[]}
        generatedReports={{
          d1: createMockResultReport({
            reportId: "r1",
            missionId: "m1",
            mercId: "merc1",
            aiNarrativeKo: "GENERATING",
            catchUpActive: true,
          }),
        }}
        onViewReport={vi.fn()}
      />,
    );
    expect(screen.getByTestId("desk-status-d1")).toHaveTextContent(/관제 로그 동기화/);
    expect(screen.getByRole("button", { name: /보고서 동기화 중/ })).toBeDisabled();
  });

  it("T-DUX-DESK-UI-2: 서사 준비되면 열람 가능", () => {
    render(
      <DeskView
        activeDispatches={[]}
        completedDispatches={completed}
        settledReports={[]}
        generatedReports={{
          d1: createMockResultReport({
            reportId: "r1",
            missionId: "m1",
            mercId: "merc1",
            aiNarrativeKo: "관제 로그 본문",
            catchUpActive: true,
          }),
        }}
        onViewReport={vi.fn()}
      />,
    );
    expect(screen.getByTestId("desk-pending-d1")).toHaveAttribute("data-narrative-ready", "true");
    expect(screen.getByRole("button", { name: "보고서 열람" })).toBeEnabled();
  });
});
