import { describe, expect, it } from "vitest";
import {
  DEFAULT_FACILITY_BY_CATEGORY,
  FACILITY_DEFINITIONS,
  getFacilityEffectsForTier,
} from "../data/stationFacilities";
import { createDefaultStation } from "./state";
import { createMockGameState, createMockStationState } from "../test/factories";
import {
  getDefaultFacilityIdForCategory,
  getStationAnalysisFacilityBonus,
  getStationModifiers,
} from "./stationModifiers";
import {
  getFacilityUpgradeCost,
  upgradeFacilityTier,
} from "./station";
import { getStationPredictAnalysisBase } from "./analysisSlot";
import { getReplacementCost, getUpgradedStation } from "./station";
import { calcDissatisfactionGain } from "./mercCompensation";
import { computeDispatchCommandCost } from "./mission";
import { executeMissionRun } from "./missionRunExecutor";
import { createMockMercenary, createMockMission } from "../test/factories";
import { applySettlement } from "./settlement";
import { createMockResultReport } from "../test/factories";

describe("stationFacilities schema (T-DD-SCHEMA)", () => {
  it("T-DD-SCHEMA-1: 5대 카테고리마다 기본 facilityId 1종씩 존재", () => {
    const categories = ["숙박", "유흥", "식사", "장비", "업무"] as const;
    expect(Object.keys(DEFAULT_FACILITY_BY_CATEGORY)).toHaveLength(5);
    for (const cat of categories) {
      expect(DEFAULT_FACILITY_BY_CATEGORY[cat]).toBeTruthy();
      expect(FACILITY_DEFINITIONS[DEFAULT_FACILITY_BY_CATEGORY[cat]].category).toBe(cat);
    }
  });

  it("T-DD-SCHEMA-2: 카테고리별 createDefaultStation이 맞는 facilityId·이름을 설정", () => {
    const work = createDefaultStation("f1", "업무");
    expect(work.facilityId).toBe("work_signal_relay");
    expect(work.facilityName).toBe("불법 통신 중계소");
    expect(work.facilityTier).toBe(1);

    const lodging = createDefaultStation("f2", "숙박");
    expect(lodging.facilityId).toBe("lodging_patch_den");
  });
});

describe("getStationModifiers (T-DD-MOD)", () => {
  it("T-DD-MOD-1: 숙박 T1 → fatigueMultiplier 0.8", () => {
    const state = createMockGameState({
      stationState: createMockStationState({
        category: "숙박",
        facilityId: "lodging_patch_den",
        facilityTier: 1,
      }),
    });
    expect(getStationModifiers(state).fatigueMultiplier).toBe(0.8);
  });

  it("T-DD-MOD-2: 식사 T2 → dispatchCommandDiscount 2", () => {
    const state = createMockGameState({
      stationState: createMockStationState({
        category: "식사",
        facilityId: "meal_field_kitchen",
        facilityTier: 2,
      }),
    });
    expect(getStationModifiers(state).dispatchCommandDiscount).toBe(2);
  });

  it("T-DD-MOD-3: 장비 T1 → replacementCostMultiplier 0.8", () => {
    const state = createMockGameState({
      stationState: createMockStationState({
        category: "장비",
        facilityId: "gear_shadow_pawn",
        facilityTier: 1,
      }),
    });
    expect(getStationModifiers(state).replacementCostMultiplier).toBe(0.8);
  });

  it("T-DD-MOD-4: 유흥 T1 → dissatisfactionGainMultiplier 0.5", () => {
    const state = createMockGameState({
      stationState: createMockStationState({
        category: "유흥",
        facilityId: "entertainment_alley_bar",
        facilityTier: 1,
      }),
    });
    expect(getStationModifiers(state).dissatisfactionGainMultiplier).toBe(0.5);
  });

  it("T-DD-MOD-5: 업무 T2 → analysisBaseBonus +2", () => {
    const state = createMockGameState({
      stationState: createMockStationState({
        category: "업무",
        facilityId: "work_signal_relay",
        facilityTier: 2,
      }),
    });
    expect(getStationAnalysisFacilityBonus(state)).toBe(2);
  });

  it("T-DD-MOD-6: 비업무 카테고리는 analysisBaseBonus 0 (시설 데이터와 무관)", () => {
    const effects = getFacilityEffectsForTier("work_signal_relay", 2);
    expect(effects.analysisBaseBonus).toBe(2);
    const state = createMockGameState({
      stationState: createMockStationState({
        category: "숙박",
        facilityId: "lodging_patch_den",
        facilityTier: 1,
      }),
    });
    expect(getStationModifiers(state).analysisBaseBonus).toBe(0);
  });
});

describe("facility tier upgrade (T-DD-UPGRADE)", () => {
  it("T-DD-UPGRADE-1: 크레딧 충분 시 facilityTier 1→2", () => {
    const cost = getFacilityUpgradeCost(1);
    let state = createMockGameState({
      ledger: cost + 1000,
      stationState: createMockStationState({ facilityTier: 1 }),
    });
    const next = upgradeFacilityTier(state);
    expect(next.stationState?.facilityTier).toBe(2);
    expect(next.ledger).toBe(1000);
  });

  it("T-DD-UPGRADE-2: 크레딧 부족 시 변화 없음", () => {
    const cost = getFacilityUpgradeCost(1);
    let state = createMockGameState({
      ledger: cost - 1,
      stationState: createMockStationState({ facilityTier: 1 }),
    });
    const next = upgradeFacilityTier(state);
    expect(next.stationState?.facilityTier).toBe(1);
    expect(next.ledger).toBe(cost - 1);
  });

  it("T-DD-UPGRADE-3: 이미 Tier 2면 추가 업그레이드 불가", () => {
    let state = createMockGameState({
      ledger: 100_000,
      stationState: createMockStationState({ facilityTier: 2 }),
    });
    const next = upgradeFacilityTier(state);
    expect(next.stationState?.facilityTier).toBe(2);
    expect(next.ledger).toBe(100_000);
  });
});

describe("infra upgrade without analysis (T-DD-INFRA)", () => {
  it("T-DD-INFRA-1: getUpgradedStation은 analysis 레벨을 올리지 않음", () => {
    const state = createMockGameState({
      stationState: createMockStationState({
        level: 1,
        predictAnalysisLv: 0,
        analysisMissionLv: 0,
      }),
    });
    const preview = getUpgradedStation(state);
    expect(preview?.level).toBe(2);
    expect(preview?.predictAnalysisLv).toBe(0);
    expect(preview?.analysisMissionLv).toBe(0);
  });
});

describe("facility effect wiring (T-DD-WIRE)", () => {
  it("T-DD-WIRE-ANALYSIS-1: 업무 T1 → getStationPredictAnalysisBase = 1", () => {
    const state = createMockGameState({
      stationState: createMockStationState({
        category: "업무",
        facilityId: "work_signal_relay",
        facilityTier: 1,
        predictAnalysisLv: 0,
      }),
    });
    expect(getStationPredictAnalysisBase(state)).toBe(1);
  });

  it("T-DD-WIRE-ANALYSIS-2: rawBase 1 + 업무 T1 bonus → cap 2", () => {
    const state = createMockGameState({
      stationState: createMockStationState({
        category: "업무",
        facilityId: "work_signal_relay",
        facilityTier: 2,
        predictAnalysisLv: 1,
      }),
    });
    expect(getStationPredictAnalysisBase(state)).toBe(2);
  });

  it("T-DD-WIRE-DISPATCH-1: 식사 T1 discount로 OP 비용 -1 (최소 1)", () => {
    const state = createMockGameState({
      stationState: createMockStationState({
        category: "식사",
        facilityId: "meal_field_kitchen",
        facilityTier: 1,
      }),
    });
    expect(computeDispatchCommandCost(state, 4, false)).toBe(3);
    expect(computeDispatchCommandCost(state, 1, false)).toBe(1);
  });

  it("T-DD-WIRE-GEAR-1: 장비 T1 → replacementCost 20% 할인", () => {
    const state = createMockGameState({
      stationState: createMockStationState({
        category: "장비",
        facilityId: "gear_shadow_pawn",
        facilityTier: 1,
      }),
    });
    expect(getReplacementCost(state)).toBe(12_000);
  });

  it("T-DD-WIRE-COMP-1: 유흥 T1 → 불만도 증가 50%", () => {
    const plain = calcDissatisfactionGain(0.4, 0.25, 10_000);
    const discounted = calcDissatisfactionGain(0.4, 0.25, 10_000, 0.5);
    expect(discounted).toBe(Math.floor(plain * 0.5));
  });

  it("T-DD-WIRE-FATIGUE-1: 숙박 T1 → 피로도 20% 감소", () => {
    const mission = createMockMission({ difficultyStars: 2, nodeCount: 3 });
    const merc = createMockMercenary();
    const base = executeMissionRun({ mission, merc, rng: () => 0.99 });
    const reduced = executeMissionRun({
      mission,
      merc,
      rng: () => 0.99,
      fatigueMultiplier: 0.8,
    });
    const baseFatigue = base.report.statusChanges.find(
      (s) => s.statusId === "status_fatigue_plus",
    )?.noteKo;
    const reducedFatigue = reduced.report.statusChanges.find(
      (s) => s.statusId === "status_fatigue_plus",
    )?.noteKo;
    expect(baseFatigue).toBeTruthy();
    expect(reducedFatigue).toBeTruthy();
    const baseVal = Number(baseFatigue!.match(/\+(\d+)/)?.[1]);
    const reducedVal = Number(reducedFatigue!.match(/\+(\d+)/)?.[1]);
    expect(reducedVal).toBe(Math.round(baseVal * 0.8));
  });
});

describe("D-E cross (T-DD-XDE)", () => {
  it("T-DD-XDE-1: 업무 T2 베이스 L2 → 슬롯 max bonus 0", () => {
    const state = createMockGameState({
      stationState: createMockStationState({
        category: "업무",
        facilityId: "work_signal_relay",
        facilityTier: 2,
        predictAnalysisLv: 0,
      }),
    });
    expect(getStationPredictAnalysisBase(state)).toBe(2);
  });
});

describe("category default helper (T-DD-CREATE)", () => {
  it("T-DD-CREATE-1: getDefaultFacilityIdForCategory 일치", () => {
    expect(getDefaultFacilityIdForCategory("장비")).toBe("gear_shadow_pawn");
  });
});

describe("settlement dissatisfaction wiring (T-DD-WIRE-COMP apply)", () => {
  it("유흥 시설 상태에서 applySettlement 불만도 감소", () => {
    const state = createMockGameState({
      stationState: createMockStationState({
        category: "유흥",
        facilityId: "entertainment_alley_bar",
        facilityTier: 1,
      }),
      mercDissatisfactionStacks: {},
    });
    const report = createMockResultReport({
      mercId: "merc_breaker_01",
      rewardCredits: 10_000,
      extraRewardCredits: 0,
      lostCredits: 0,
    });
    const next = applySettlement(state, report, {
      mercShareRate: 0.25,
      mercExpectedShareRate: 0.4,
    });
    expect(next.mercDissatisfactionStacks["merc_breaker_01"]).toBe(7);
  });
});
