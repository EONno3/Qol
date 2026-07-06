import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CharacterCreation } from "./CharacterCreation";
import { GAME_CONFIG } from "../data/config";

describe("CharacterCreation", () => {
  it("7가지 출신지 카드가 모두 렌더링된다", () => {
    render(<CharacterCreation onComplete={vi.fn()} />);
    expect(screen.getByText("하층 언존 태생")).toBeInTheDocument();
    expect(screen.getByText("살아남은 폐기체")).toBeInTheDocument();
    expect(screen.getByText("버려진 사생아")).toBeInTheDocument();
    expect(screen.getByText("추방자")).toBeInTheDocument();
    expect(screen.getByText("몰락자")).toBeInTheDocument();
    expect(screen.getByText("상실자")).toBeInTheDocument();
    expect(screen.getByText("무지한 외부인")).toBeInTheDocument();
  });

  it("이름과 코드명, 출신지가 없으면 시작 버튼이 비활성화된다", () => {
    render(<CharacterCreation onComplete={vi.fn()} />);
    expect(screen.getByRole("button", { name: "픽서 등록 완료" })).toBeDisabled();
  });

  it("이름과 코드명을 입력하고 출신지를 선택하면 시작 버튼이 활성화된다", () => {
    render(<CharacterCreation onComplete={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("본명"), { target: { value: "이태양" } });
    fireEvent.change(screen.getByPlaceholderText("거리에서 불리는 이름"), { target: { value: "상실자_코드명" } });
    fireEvent.click(screen.getByText("상실자")); // 추가 선택 불필요한 출신지
    expect(screen.getByRole("button", { name: "픽서 등록 완료" })).not.toBeDisabled();
  });

  it("추방자 선택 시 팩션 추가 선택 UI가 나타난다", () => {
    render(<CharacterCreation onComplete={vi.fn()} />);
    fireEvent.click(screen.getByText("추방자"));
    expect(screen.getByText("추방한 팩션 선택")).toBeInTheDocument();
  });

  it("버려진_사생아 선택 시 메가코프 추가 선택 UI가 나타난다", () => {
    render(<CharacterCreation onComplete={vi.fn()} />);
    fireEvent.click(screen.getByText("버려진 사생아"));
    expect(screen.getByText("혈연 메가코프 선택")).toBeInTheDocument();
  });

  it("추방자는 팩션 추가 선택 전까지 시작 버튼이 비활성화된다", () => {
    render(<CharacterCreation onComplete={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("본명"), { target: { value: "이름" } });
    fireEvent.change(screen.getByPlaceholderText("거리에서 불리는 이름"), { target: { value: "코드명" } });
    fireEvent.click(screen.getByText("추방자"));
    expect(screen.getByRole("button", { name: "픽서 등록 완료" })).toBeDisabled();
  });

  it("모든 조건이 충족되면 onComplete가 올바른 데이터로 호출된다", () => {
    const onComplete = vi.fn();
    render(<CharacterCreation onComplete={onComplete} />);
    fireEvent.change(screen.getByPlaceholderText("본명"), { target: { value: "이태양" } });
    fireEvent.change(screen.getByPlaceholderText("거리에서 불리는 이름"), { target: { value: "태양" } });
    fireEvent.click(screen.getByText("상실자"));
    fireEvent.click(screen.getByRole("button", { name: "픽서 등록 완료" }));

    expect(onComplete).toHaveBeenCalledOnce();
    const result = onComplete.mock.calls[0][0];
    expect(result.profile.origin).toBe("상실자");
    expect(result.profile.name).toBe("이태양");
    expect(result.profile.codename).toBe("태양");
    expect(result.initialCredits).toBe(GAME_CONFIG.originCredits.상실자);
  });

  it("하층_언존_태생은 onComplete 결과에 하층 팩션 호감도 +20이 포함된다", () => {
    const onComplete = vi.fn();
    render(<CharacterCreation onComplete={onComplete} />);
    fireEvent.change(screen.getByPlaceholderText("본명"), { target: { value: "김철수" } });
    fireEvent.change(screen.getByPlaceholderText("거리에서 불리는 이름"), { target: { value: "철수" } });
    fireEvent.click(screen.getByText("하층 언존 태생"));
    fireEvent.click(screen.getByRole("button", { name: "픽서 등록 완료" }));

    const result = onComplete.mock.calls[0][0];
    expect(result.factionReputation["faction_lower_valve"]).toBe(20);
    expect(result.factionReputation["faction_lower_fuse"]).toBe(20);
  });
});
