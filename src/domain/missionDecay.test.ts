import { describe, expect, it } from "vitest";
import type { GameState } from "../data/types";
import { createInitialState } from "./state";
import { assignMissionAnalysisSlot } from "./analysisSlot";
import { advanceTurn, advanceTurnWithMeta } from "./turn";
import {
  formatExpiredMissionNotice,
  tickMissionDecayOnTurnAdvance,
} from "./missionDecay";

describe("mission decay pause (T-DE-DECAY-PAUSE)", () => {
  it("T-DE-DECAY-PAUSE-1: 분석 슬롯 등록 미션은 방치 타이머 tick 제외", () => {
    let state: GameState = {
      ...createInitialState(),
      availableMissions: ["mission_x"],
      missionDecayTimers: { mission_x: 2 },
    };

    state = advanceTurn(state);
    expect(state.missionDecayTimers.mission_x).toBe(1);

    state = {
      ...createInitialState(),
      availableMissions: ["mission_x"],
      missionDecayTimers: { mission_x: 2 },
    };
    state = assignMissionAnalysisSlot(state, "mission_x");
    state = advanceTurn(state);
    expect(state.missionDecayTimers.mission_x).toBe(2);
  });
});

describe("mission decay expire (T-DECAY-EXPIRE)", () => {
  it("T-DECAY-EXPIRE-1: 타이머 0 도달 시 만료 ID 반환 및 보드 제거", () => {
    const state: GameState = {
      ...createInitialState(),
      availableMissions: ["mission_x"],
      missionDecayTimers: { mission_x: 1 },
    };

    const result = tickMissionDecayOnTurnAdvance(state);
    expect(result.expiredMissionIds).toEqual(["mission_x"]);
    expect(result.availableMissions).not.toContain("mission_x");
    expect(formatExpiredMissionNotice(result.expiredMissionIds)).toBe("의뢰 만료됨");
  });

  it("T-DECAY-EXPIRE-2: advanceTurnWithMeta가 만료 ID를 함께 반환한다", () => {
    const state: GameState = {
      ...createInitialState(),
      availableMissions: ["mission_x"],
      acceptedMissions: [],
      activeDispatches: [],
      completedDispatches: [],
      followupHooks: [],
      missionDecayTimers: { mission_x: 1 },
      stationState: null,
    };

    const { state: next, expiredMissionIds } = advanceTurnWithMeta(state);
    expect(expiredMissionIds).toEqual(["mission_x"]);
    expect(next.availableMissions).not.toContain("mission_x");
  });
});
