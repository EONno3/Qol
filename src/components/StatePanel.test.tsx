import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StatePanel } from "./StatePanel";
import { createMockGameState } from "../test/factories";

describe("StatePanel 컴포넌트 단위 테스트", () => {
  it("case 1: 현재 크레딧이 잔고에 올바르게 렌더링된다", () => {
    const state = createMockGameState({ ledger: 55000 });
    render(<StatePanel state={state} onTimeSkip={vi.fn()} />);
    expect(screen.getByText("55,000 cr")).toBeInTheDocument();
  });

  it("case 2: 지휘력(currentCommandPoints / maxCommandPoints)이 올바르게 렌더링된다", () => {
    const state = createMockGameState({ currentCommandPoints: 7, maxCommandPoints: 12 });
    render(<StatePanel state={state} onTimeSkip={vi.fn()} />);
    expect(screen.getByText("7 / 12 OP")).toBeInTheDocument();
  });

  it("case 3: 팩션 평판이 0이 아닌 경우에만 목록에 노출된다", () => {
    const state = createMockGameState({
      factionReputation: {
        faction_lower_fuse: 10,
        faction_mid_lanada: -5,
        faction_corp_bairui: 0, // 0은 노출 안 됨
      },
    });
    render(<StatePanel state={state} onTimeSkip={vi.fn()} />);
    expect(screen.getByText("+10")).toBeInTheDocument();
    expect(screen.getByText("-5")).toBeInTheDocument();
    // 0인 팩션은 렌더링되지 않아야 함 (표시 불필요 조건)
    expect(screen.queryByText("+0")).not.toBeInTheDocument();
  });

  it("case 4: canAdvanceTurn=false일 때 다음 날 버튼이 비활성화되고 경고 문구가 나온다", () => {
    const state = createMockGameState();
    render(
      <StatePanel
        state={state}
        onTimeSkip={vi.fn()}
        onNextTurn={vi.fn()}
        canAdvanceTurn={false}
      />
    );
    expect(screen.getByText("⚠️ 파견 중인 미션 대기 필요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음 날로 넘어가기" })).toBeDisabled();
  });

  it("case 5: canAdvanceTurn=true일 때 다음 날 버튼이 활성화되고 클릭 시 콜백이 호출된다", () => {
    const state = createMockGameState();
    const onNextTurn = vi.fn();
    render(
      <StatePanel
        state={state}
        onTimeSkip={vi.fn()}
        onNextTurn={onNextTurn}
        canAdvanceTurn={true}
      />
    );
    const btn = screen.getByRole("button", { name: "다음 날로 넘어가기" });
    expect(btn).toBeEnabled();
    fireEvent.click(btn);
    expect(onNextTurn).toHaveBeenCalledTimes(1);
  });

  it("case 6: 고용된 용병이 없으면 '고용된 용병 없음' 안내가 노출된다", () => {
    const state = createMockGameState({ hiredMercs: [] });
    render(<StatePanel state={state} onTimeSkip={vi.fn()} />);
    expect(screen.getByText("고용된 용병 없음")).toBeInTheDocument();
  });

  it("case 7: AI 브리핑 토글 체크박스 변경 시 onToggleAiNarrator 콜백이 호출된다", () => {
    const onToggleAiNarrator = vi.fn();
    const state = createMockGameState({ aiNarratorEnabled: false });
    render(
      <StatePanel
        state={state}
        onTimeSkip={vi.fn()}
        onToggleAiNarrator={onToggleAiNarrator}
      />
    );
    const checkbox = screen.getByRole("checkbox", { name: /로컬 AI 브리핑 활성화/ });
    fireEvent.click(checkbox);
    expect(onToggleAiNarrator).toHaveBeenCalledWith(true);
  });
});
