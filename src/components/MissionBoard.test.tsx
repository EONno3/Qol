import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MissionBoard } from "./MissionBoard";
import { createMockMission } from "../test/factories";

const missionA = createMockMission({
  missionId: "mission_a",
  displayNameKo: "테스트 의뢰 A",
});
const missionB = createMockMission({
  missionId: "mission_b",
  displayNameKo: "테스트 의뢰 B",
});

const decayContext = {
  missionDecayTimers: { mission_a: 2, mission_b: 1 },
  analysisMissionSlotId: null as string | null,
};

describe("MissionBoard Decay 표시 (T-DECAY-UI)", () => {
  it("T-DECAY-UI-1: 미션 카드에 남은 방치 턴이 렌더링된다", () => {
    render(
      <MissionBoard
        missions={[missionA, missionB]}
        decayContext={decayContext}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("방치 2턴")).toBeInTheDocument();
    expect(screen.getByText("방치 1턴")).toBeInTheDocument();
  });

  it("T-DECAY-UI-2: 분석 슬롯 등록 미션은 만료 정지 문구를 표시한다", () => {
    render(
      <MissionBoard
        missions={[missionA, missionB]}
        decayContext={{
          ...decayContext,
          analysisMissionSlotId: "mission_a",
        }}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("분석 중 (만료 정지)")).toBeInTheDocument();
    expect(screen.getByText("방치 1턴")).toBeInTheDocument();
    expect(screen.queryByText("방치 2턴")).not.toBeInTheDocument();
  });
});
