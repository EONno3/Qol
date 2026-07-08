import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StationView } from "./StationView";
import { createMockGameState, createMockStationState } from "../test/factories";
import { createEmptyAnalysisSlots } from "../domain/analysisSlot";
import { getUpgradeCost } from "../domain/station";

// StationView는 seed.ts의 mercenaries를 내부에서 불러와 고용 목록을 렌더링한다.
// hiredMercs를 비워 seed 용병이 노출되지 않는 독립 환경에서 UI 분기를 검증한다.

const noopSlotHandlers = {
  onAssignMercSlot: vi.fn(),
  onAssignMissionSlot: vi.fn(),
};

function renderStation(overrides: Partial<Parameters<typeof StationView>[0]> = {}) {
  const state = createMockGameState({
    ledger: 200000,
    hiredMercs: [],
    stationState: createMockStationState({ level: 1 }),
  });
  return render(
    <StationView
      state={state}
      onUpgrade={vi.fn()}
      onHire={vi.fn()}
      onFire={vi.fn()}
      onReplaceGear={vi.fn()}
      {...noopSlotHandlers}
      {...overrides}
    />
  );
}

describe("StationView 컴포넌트 단위 테스트", () => {
  it("case 1: stationState가 null이면 안내 문구를 렌더링한다", () => {
    const state = createMockGameState({ stationState: null });
    render(
      <StationView
        state={state}
        onUpgrade={vi.fn()}
        onHire={vi.fn()}
        onFire={vi.fn()}
        onReplaceGear={vi.fn()}
        {...noopSlotHandlers}
      />
    );
    expect(screen.getByText(/아직 스테이션 정보가 없습니다/)).toBeInTheDocument();
  });

  it("case 2: 인프라 탭에서 현재 스테이션 이름과 레벨이 렌더링된다", () => {
    renderStation();
    expect(screen.getByText("테스트 아지트")).toBeInTheDocument();
    expect(screen.getByText(/Lv\.1/)).toBeInTheDocument();
  });

  it("case 3: 인프라 탭에서 크레딧이 충분하면 업그레이드 버튼이 활성화된다", () => {
    const upgradeCost = getUpgradeCost(1);
    const state = createMockGameState({
      ledger: upgradeCost + 1000,
      stationState: createMockStationState({ level: 1 }),
    });
    const onUpgrade = vi.fn();
    render(
      <StationView
        state={state}
        onUpgrade={onUpgrade}
        onHire={vi.fn()}
        onFire={vi.fn()}
        onReplaceGear={vi.fn()}
        {...noopSlotHandlers}
      />
    );
    const btn = screen.getByRole("button", { name: "업그레이드 진행" });
    expect(btn).toBeEnabled();
    fireEvent.click(btn);
    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });

  it("case 4: 크레딧이 부족하면 업그레이드 버튼이 비활성화된다", () => {
    const upgradeCost = getUpgradeCost(1);
    const state = createMockGameState({
      ledger: upgradeCost - 1,
      stationState: createMockStationState({ level: 1 }),
    });
    render(
      <StationView
        state={state}
        onUpgrade={vi.fn()}
        onHire={vi.fn()}
        onFire={vi.fn()}
        onReplaceGear={vi.fn()}
        {...noopSlotHandlers}
      />
    );
    expect(screen.getByRole("button", { name: "업그레이드 진행" })).toBeDisabled();
  });

  it("case 5: 용병 고용소 탭에서 소속 용병이 없으면 안내 문구가 노출된다", () => {
    renderStation();
    fireEvent.click(screen.getByText("용병 고용소"));
    expect(screen.getByText("고용된 용병이 없습니다.")).toBeInTheDocument();
  });

  it("case 6: 암시장 탭에서 파손된 용병이 없으면 안내 문구가 노출된다", () => {
    renderStation();
    fireEvent.click(screen.getByText("암시장(무기 재수급)"));
    expect(screen.getByText("장비가 파괴된 용병이 없습니다.")).toBeInTheDocument();
  });

  describe("분석 기관 탭 (T-DE-UI)", () => {
    it("T-DE-UI-1: 분석 기관 탭에서 용병·미션 슬롯 select가 렌더링된다", () => {
      renderStation();
      fireEvent.click(screen.getByText("분석 기관"));
      expect(screen.getByLabelText("용병 분석 슬롯")).toBeInTheDocument();
      expect(screen.getByLabelText("미션 분석 슬롯")).toBeInTheDocument();
    });

    it("T-DE-UI-2: 용병 슬롯 선택 시 onAssignMercSlot 콜백 호출", () => {
      const onAssignMercSlot = vi.fn();
      const state = createMockGameState({
        hiredMercs: ["merc_breaker_01"],
        stationState: createMockStationState({ analysisMercLv: 0 }),
      });
      render(
        <StationView
          state={state}
          onUpgrade={vi.fn()}
          onHire={vi.fn()}
          onFire={vi.fn()}
          onReplaceGear={vi.fn()}
          onAssignMercSlot={onAssignMercSlot}
          onAssignMissionSlot={vi.fn()}
        />
      );
      fireEvent.click(screen.getByText("분석 기관"));
      fireEvent.change(screen.getByLabelText("용병 분석 슬롯"), {
        target: { value: "merc_breaker_01" },
      });
      expect(onAssignMercSlot).toHaveBeenCalledWith("merc_breaker_01");
    });

    it("T-DE-UI-3: 슬롯 배치 중 bonusLevel·effective 표시", () => {
      const state = createMockGameState({
        stationState: createMockStationState({ analysisMercLv: 0, analysisMissionLv: 1 }),
        analysisSlots: {
          merc: { targetId: "merc_breaker_01", bonusLevel: 1 },
          mission: createEmptyAnalysisSlots().mission,
        },
        hiredMercs: ["merc_breaker_01"],
      });
      render(
        <StationView
          state={state}
          onUpgrade={vi.fn()}
          onHire={vi.fn()}
          onFire={vi.fn()}
          onReplaceGear={vi.fn()}
          {...noopSlotHandlers}
        />
      );
      fireEvent.click(screen.getByText("분석 기관"));
      expect(screen.getByText(/슬롯 보너스 \+1/)).toBeInTheDocument();
      expect(screen.getByText(/effective Lv\.\s*1/)).toBeInTheDocument();
    });
  });
});
