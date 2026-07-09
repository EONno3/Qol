import { describe, expect, it } from "vitest";
import { createInitialState } from "./state";
import { createMockStationState } from "../test/factories";
import {
  assignMercAnalysisSlot,
  assignMissionAnalysisSlot,
  createEmptyAnalysisSlots,
  effectiveMatchAnalysisLevel,
  effectiveMercAnalysisLevel,
  effectiveMissionAnalysisLevel,
  getEffectiveAnalysisLevels,
  migrateAnalysisSlots,
  tickAnalysisSlotsOnTurnAdvance,
} from "./analysisSlot";
import { advanceTurn } from "./turn";

function stateWithStation(mercBase = 0, missionBase = 0) {
  let state = createInitialState();
  state = {
    ...state,
    stationState: createMockStationState({
      category: "숙박",
      facilityId: "lodging_patch_den",
      facilityName: "땜질 소굴",
      analysisMercLv: mercBase,
      analysisMissionLv: missionBase,
    }),
    analysisSlots: createEmptyAnalysisSlots(),
  };
  return state;
}

describe("analysisSlot assign/clear (T-DE-SLOT)", () => {
  it("T-DE-SLOT-1: 용병 슬롯 배치 시 targetId 설정·progress 0 초기화", () => {
    const next = assignMercAnalysisSlot(stateWithStation(), "merc_a");
    expect(next.analysisSlots.merc).toEqual({ targetId: "merc_a", progress: 0 });
  });

  it("T-DE-SLOT-2: 용병 슬롯 해제(null) 시 progress도 0으로 리셋", () => {
    let state = assignMercAnalysisSlot(stateWithStation(), "merc_a");
    state = {
      ...state,
      analysisSlots: {
        ...state.analysisSlots,
        merc: { targetId: "merc_a", progress: 2 },
      },
    };
    const next = assignMercAnalysisSlot(state, null);
    expect(next.analysisSlots.merc).toEqual({ targetId: null, progress: 0 });
  });

  it("T-DE-SLOT-3: 미션 슬롯 배치/해제도 동일 규칙", () => {
    let state = assignMissionAnalysisSlot(stateWithStation(), "mission_x");
    expect(state.analysisSlots.mission.targetId).toBe("mission_x");
    state = assignMissionAnalysisSlot(state, null);
    expect(state.analysisSlots.mission).toEqual({ targetId: null, progress: 0 });
  });

  it("T-DE-SLOT-4: 구세이브 bonusLevel → progress 마이그레이션", () => {
    const migrated = migrateAnalysisSlots({
      merc: { targetId: "merc_a", bonusLevel: 2 } as never,
      mission: { targetId: null, progress: 1 },
    });
    expect(migrated.merc).toEqual({ targetId: "merc_a", progress: 2 });
    expect(migrated.mission).toEqual({ targetId: null, progress: 1 });
  });
});

describe("analysisSlot turn tick (T-DE-TURN)", () => {
  it("T-DE-TURN-1: 베이스 Lv0·용병 슬롯 배치 후 1턴 → progress 1", () => {
    let state = assignMercAnalysisSlot(stateWithStation(0, 0), "merc_a");
    state = advanceTurn(state);
    expect(state.analysisSlots.merc.progress).toBe(1);
    expect(getEffectiveAnalysisLevels(state, "merc_a").merc).toBe(1);
  });

  it("T-DE-TURN-2: 2턴 연속 진행 시 progress 최대 2까지 상승", () => {
    let state = assignMercAnalysisSlot(stateWithStation(0, 0), "merc_a");
    state = advanceTurn(state);
    state = advanceTurn(state);
    expect(state.analysisSlots.merc.progress).toBe(2);
    expect(getEffectiveAnalysisLevels(state, "merc_a").merc).toBe(2);
    state = advanceTurn(state);
    expect(state.analysisSlots.merc.progress).toBe(2);
    expect(getEffectiveAnalysisLevels(state, "merc_a").merc).toBe(2);
  });

  it("T-DE-TURN-3: 스테이션 베이스 Lv1이면 슬롯 보너스는 최대 +1", () => {
    let state = assignMercAnalysisSlot(stateWithStation(1, 0), "merc_a");
    state = advanceTurn(state);
    expect(state.analysisSlots.merc.progress).toBe(1);
    state = advanceTurn(state);
    expect(state.analysisSlots.merc.progress).toBe(1);
  });

  it("T-DE-TURN-4: 빈 슬롯은 턴 진행해도 progress 변화 없음", () => {
    const next = tickAnalysisSlotsOnTurnAdvance(stateWithStation());
    expect(next.merc.progress).toBe(0);
    expect(next.mission.progress).toBe(0);
  });
});

describe("effective analysis level (T-DE-EFFECTIVE)", () => {
  it("T-DE-EFFECTIVE-1: 슬롯 미배치 대상은 스테이션 베이스만 적용", () => {
    const state = stateWithStation(0, 0);
    expect(effectiveMercAnalysisLevel(state, "merc_a")).toBe(0);
    expect(effectiveMissionAnalysisLevel(state, "mission_x")).toBe(0);
  });

  it("T-DE-EFFECTIVE-2: 슬롯 배치 대상만 progress이 effective에 합산", () => {
    let state = assignMercAnalysisSlot(stateWithStation(0, 0), "merc_a");
    state = advanceTurn(state);
    const levels = getEffectiveAnalysisLevels(state, "merc_a", "mission_x");
    expect(levels.merc).toBe(1);
    expect(getEffectiveAnalysisLevels(state, "merc_b").merc).toBe(0);
    expect(effectiveMercAnalysisLevel(state, "merc_a")).toBe(levels.merc);
  });

  it("T-DE-EFFECTIVE-3: 슬롯 해제 후 보너스 소멸 → 베이스만", () => {
    let state = assignMercAnalysisSlot(stateWithStation(0, 0), "merc_a");
    state = advanceTurn(state);
    state = assignMercAnalysisSlot(state, null);
    expect(effectiveMercAnalysisLevel(state, "merc_a")).toBe(0);
  });

  it("T-DE-EFFECTIVE-4: 매칭 min 규칙 — 용병 L2·미션 L0 → effective 0", () => {
    let state = stateWithStation(0, 0);
    state = assignMercAnalysisSlot(state, "merc_a");
    state = { ...state, analysisSlots: { ...state.analysisSlots, merc: { targetId: "merc_a", progress: 2 } } };
    expect(effectiveMatchAnalysisLevel(state, "merc_a", "mission_x")).toBe(0);
  });

  it("T-DE-EFFECTIVE-5: 양쪽 슬롯 L2 달성 시 매칭 effective L2", () => {
    let state = stateWithStation(0, 0);
    state = assignMercAnalysisSlot(state, "merc_a");
    state = assignMissionAnalysisSlot(state, "mission_x");
    state = {
      ...state,
      analysisSlots: {
        merc: { targetId: "merc_a", progress: 2 },
        mission: { targetId: "mission_x", progress: 2 },
      },
    };
    const levels = getEffectiveAnalysisLevels(state, "merc_a", "mission_x");
    expect(levels.match).toBe(2);
    expect(effectiveMatchAnalysisLevel(state, "merc_a", "mission_x")).toBe(levels.match);
  });
});
