import { describe, expect, it } from "vitest";
import { createInitialState } from "./state";
import { advanceTurn } from "./turn";
import { missions } from "../data/seed";

describe("advanceTurn", () => {
  it("턴 수를 1 증가시키고 통제력을 최대치로 회복한다", () => {
    let state = createInitialState();
    state.turnCount = 1;
    state.maxCommandPoints = 10;
    state.currentCommandPoints = 3;

    const next = advanceTurn(state);

    expect(next.turnCount).toBe(2);
    expect(next.currentCommandPoints).toBe(10);
  });

  it("스테이션 유지비(operatingCostPerTurn)가 크레딧에서 차감된다", () => {
    let state = createInitialState();
    state.ledger = 5000;
    // 임시 스테이션 할당
    state.stationState = {
      stationId: "test_st",
      fixerId: "fixer_01",
      category: "장비",
      facilityName: "Test Facility",
      locationTier: "하층",
      locationArea: "Pipe",
      level: 2,
      operatingCostPerTurn: 1000,
      analysisMercLv: 1,
      analysisMissionLv: 1
    };

    const next = advanceTurn(state);
    expect(next.ledger).toBe(4000); // 5000 - 1000
  });

  it("후속 단서가 존재하면 연계 미션이 해금되어 availableMissions에 추가된다", () => {
    let state = createInitialState();
    // seed.ts에 있는 히든 미션(mission_hidden_fuse_ledger_01)을 해금하기 위한 단서 삽입
    state.followupHooks = ["hook_lower_fuse_power_ledger_01"];
    state.availableMissions = []; // 비워두기

    const next = advanceTurn(state);
    
    expect(next.availableMissions).toContain("mission_hidden_fuse_ledger_01");
  });
});
