import { describe, expect, it } from "vitest";
import type { GameState } from "../data/types";
import { createInitialState } from "./state";
import { assignMissionAnalysisSlot } from "./analysisSlot";
import { advanceTurn } from "./turn";

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
