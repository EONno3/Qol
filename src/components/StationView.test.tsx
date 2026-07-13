import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StationView } from "./StationView";
import { createMockGameState, createMockStationState } from "../test/factories";
import { getUpgradeCost } from "../domain/station";

// StationView는 seed.ts의 mercenaries를 내부에서 불러와 고용 목록을 렌더링한다.
// hiredMercs를 비워 seed 용병이 노출되지 않는 독립 환경에서 UI 분기를 검증한다.

const noopSlotHandlers = {
  onAssignMissionSlot: vi.fn(),
  onUpgradeFacility: vi.fn(),
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
    expect(screen.getByText("불법 통신 중계소")).toBeInTheDocument();
    expect(screen.getByText(/인프라 Lv\.1/)).toBeInTheDocument();
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

  it("case 5: roster 탭에서 소속 용병이 없으면 안내 문구가 노출된다", () => {
    renderStation();
    fireEvent.click(screen.getByTestId("station-tab-roster"));
    expect(screen.getByText("고용된 용병이 없습니다.")).toBeInTheDocument();
  });

  it("case 6: 암시장 탭에서 파손된 용병이 없으면 안내 문구가 노출된다", () => {
    renderStation();
    fireEvent.click(screen.getByText("암시장(무기 재수급)"));
    expect(screen.getByText("장비가 파괴된 용병이 없습니다.")).toBeInTheDocument();
  });

  describe("분석 기관 탭 (T-DE-UI)", () => {
    it("T-DE-UI-1: 분석 기관 탭에서 미션 슬롯 select와 매칭 예측 준비 중 카드가 렌더링된다", () => {
      renderStation();
      fireEvent.click(screen.getByText("분석 기관"));
      expect(screen.getByLabelText("미션 분석 슬롯")).toBeInTheDocument();
      expect(screen.getByText(/준비 중/)).toBeInTheDocument();
      expect(screen.queryByLabelText("용병 분석 슬롯")).not.toBeInTheDocument();
    });

    it("T-DE-UI-2: 미션 슬롯 선택 시 onAssignMissionSlot 콜백 호출", () => {
      const onAssignMissionSlot = vi.fn();
      const state = createMockGameState({
        availableMissions: ["mock_mission_01"],
        stationState: createMockStationState({ predictAnalysisLv: 0 }),
      });
      render(
        <StationView
          state={state}
          onUpgrade={vi.fn()}
          onHire={vi.fn()}
          onFire={vi.fn()}
          onReplaceGear={vi.fn()}
          onAssignMissionSlot={onAssignMissionSlot}
          onUpgradeFacility={vi.fn()}
        />
      );
      fireEvent.click(screen.getByText("분석 기관"));
      fireEvent.change(screen.getByLabelText("미션 분석 슬롯"), {
        target: { value: "mock_mission_01" },
      });
      expect(onAssignMissionSlot).toHaveBeenCalledWith("mock_mission_01");
    });

    it("T-DD-UI-BIND-1: 업무 시설 버프가 반영된 미션·매칭 예측 베이스 레벨을 표시한다", () => {
      renderStation();
      fireEvent.click(screen.getByText("분석 기관"));
      expect(screen.getAllByText(/기관 베이스 Lv\.1/)).toHaveLength(2);
      expect(screen.queryByText(/기관 베이스 Lv\.0/)).not.toBeInTheDocument();

      fireEvent.click(screen.getByText("인프라 관리"));
      expect(screen.getByText(/분석 베이스 \(미션 \/ 매칭 예측\)/)).toBeInTheDocument();
      expect(screen.getByText(/Lv\.1 \/ Lv\.1/)).toBeInTheDocument();
    });

    it("T-DE-UI-3: 슬롯 배치 중 progress·effective 표시", () => {
      const state = createMockGameState({
        stationState: createMockStationState({
          category: "숙박",
          facilityId: "lodging_patch_den",
          predictAnalysisLv: 0,
          analysisMissionLv: 0,
        }),
        analysisSlots: {
          mission: { targetId: "mock_mission_01", progress: 1 },
        },
        availableMissions: ["mock_mission_01"],
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

  describe("시설 Tier 업그레이드 (T-DD-UI)", () => {
    it("T-DD-UI-STATION-1: 시설 강화 버튼이 Tier 1에서 노출", () => {
      renderStation();
      expect(screen.getByRole("button", { name: "시설 Tier 업그레이드" })).toBeInTheDocument();
    });
  });
});
