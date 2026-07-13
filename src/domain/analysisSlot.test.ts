import { describe, expect, it } from "vitest";
import {
  assignMissionAnalysisSlot,
  createEmptyAnalysisSlots,
  effectiveMatchAnalysisLevel,
  effectiveMissionAnalysisLevel,
  effectivePredictAnalysisLevel,
  getAnalysisBaseLevels,
  getEffectiveAnalysisLevels,
  getStationMissionAnalysisBase,
  getStationPredictAnalysisBase,
  migrateAnalysisSlots,
  tickAnalysisSlotsOnTurnAdvance,
} from "./analysisSlot";
import { createMockGameState, createMockStationState } from "../test/factories";

function stateWithStation(missionBase = 0, predictBase = 0) {
  return createMockGameState({
    stationState: createMockStationState({
      analysisMissionLv: missionBase,
      predictAnalysisLv: predictBase,
      facilityId: "work_signal_relay",
      facilityTier: 1,
      category: "업무",
    }),
    analysisSlots: createEmptyAnalysisSlots(),
  });
}

describe("analysisSlot Option B (StationRebuild)", () => {
  it("migrateAnalysisSlots: merc 필드를 버리고 mission만 남긴다", () => {
    const migrated = migrateAnalysisSlots({
      merc: { targetId: "merc_a", progress: 2 },
      mission: { targetId: "mission_x", progress: 1 },
    } as never);
    expect(migrated).toEqual({ mission: { targetId: "mission_x", progress: 1 } });
    expect((migrated as { merc?: unknown }).merc).toBeUndefined();
  });

  it("미션 슬롯 할당/해제가 동작한다", () => {
    const next = assignMissionAnalysisSlot(stateWithStation(), "mission_x");
    expect(next.analysisSlots.mission).toEqual({ targetId: "mission_x", progress: 0 });
    const cleared = assignMissionAnalysisSlot(next, null);
    expect(cleared.analysisSlots.mission).toEqual({ targetId: null, progress: 0 });
  });

  it("미션 슬롯만 progress가 증가한다", () => {
    let state = assignMissionAnalysisSlot(stateWithStation(0, 0), "mission_x");
    state = { ...state, analysisSlots: tickAnalysisSlotsOnTurnAdvance(state) };
    expect(state.analysisSlots.mission.progress).toBe(1);
  });

  it("predict는 베이스만, mission은 슬롯 보너스, match===predict", () => {
    let state = assignMissionAnalysisSlot(stateWithStation(0, 0), "mission_x");
    state = {
      ...state,
      analysisSlots: { mission: { targetId: "mission_x", progress: 2 } },
    };
    expect(getStationPredictAnalysisBase(state)).toBe(1);
    expect(getStationMissionAnalysisBase(state)).toBe(1);
    const levels = getEffectiveAnalysisLevels(state, null, "mission_x");
    expect(levels.mission).toBe(2);
    expect(levels.predict).toBe(1);
    expect(levels.match).toBe(1);
  });

  it("match는 predict와 같고 merc와 min하지 않는다", () => {
    const state = stateWithStation(0, 2);
    expect(effectivePredictAnalysisLevel(state)).toBe(2);
    expect(effectiveMissionAnalysisLevel(state, "any")).toBe(1);
    expect(effectiveMatchAnalysisLevel(state, "merc_a", "mission_x")).toBe(2);
  });

  it("getAnalysisBaseLevels: mission/predict만 반환", () => {
    const levels = getAnalysisBaseLevels(stateWithStation(0, 0));
    expect(levels).toEqual({ mission: 1, predict: 1 });
  });
});
