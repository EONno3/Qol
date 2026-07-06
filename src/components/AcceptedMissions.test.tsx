import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AcceptedMissions } from "./AcceptedMissions";
import { createMockMission } from "../test/factories";

describe("AcceptedMissions 컴포넌트 단위 테스트", () => {
  it("case 1: 수주 미션이 없으면 빈 안내 문구가 노출된다", () => {
    render(<AcceptedMissions missions={[]} onSelect={vi.fn()} />);
    expect(screen.getByText("아직 수주한 의뢰가 없다.")).toBeInTheDocument();
  });

  it("case 2: 수주된 미션 목록이 카드로 렌더링된다", () => {
    const mission1 = createMockMission({ missionId: "m1", displayNameKo: "하층 잠입 작전" });
    const mission2 = createMockMission({ missionId: "m2", displayNameKo: "중층 암살 미션", tier: "mid" });
    render(<AcceptedMissions missions={[mission1, mission2]} onSelect={vi.fn()} />);
    expect(screen.getByText("하층 잠입 작전")).toBeInTheDocument();
    expect(screen.getByText("중층 암살 미션")).toBeInTheDocument();
  });

  it("case 3: 미션 카드 클릭 시 onSelect 콜백이 해당 missionId로 호출된다", () => {
    const onSelect = vi.fn();
    const mission = createMockMission({ missionId: "m1", displayNameKo: "테스트 미션" });
    render(<AcceptedMissions missions={[mission]} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("테스트 미션"));
    expect(onSelect).toHaveBeenCalledWith("m1");
  });

  it("case 4: 구역 필터(하층 선택) 시 다른 구역 미션이 사라진다", () => {
    const lowerMission = createMockMission({ missionId: "m1", displayNameKo: "하층 미션", tier: "lower" });
    const midMission = createMockMission({ missionId: "m2", displayNameKo: "중층 미션", tier: "mid" });
    render(<AcceptedMissions missions={[lowerMission, midMission]} onSelect={vi.fn()} />);

    // 필터 select box: 첫번째 select가 구역 필터
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "lower" } });

    expect(screen.getByText("하층 미션")).toBeInTheDocument();
    expect(screen.queryByText("중층 미션")).not.toBeInTheDocument();
  });

  it("case 5: 난이도 높은순 정렬 시 difficultyStars 높은 미션이 먼저 노출된다", () => {
    const easyMission = createMockMission({ missionId: "easy", displayNameKo: "쉬운 미션", difficultyStars: 1 });
    const hardMission = createMockMission({ missionId: "hard", displayNameKo: "어려운 미션", difficultyStars: 4 });
    render(<AcceptedMissions missions={[easyMission, hardMission]} onSelect={vi.fn()} />);

    const selects = screen.getAllByRole("combobox");
    // 마지막 select가 정렬 기준
    fireEvent.change(selects[selects.length - 1], { target: { value: "diff_desc" } });

    const cards = screen.getAllByRole("button");
    // 첫번째 카드가 어려운 미션이어야 함
    expect(cards[0]).toHaveTextContent("어려운 미션");
  });
});
