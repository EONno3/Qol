import { describe, expect, it } from "vitest";
import { upgradeStation, getUpgradeCost } from "./station";
import { createInitialState } from "./state";
import { GAME_CONFIG } from "../data/config";

describe("Station Logic", () => {
  it("getUpgradeCost는 레벨에 비례하는 비용을 반환한다", () => {
    expect(getUpgradeCost(1)).toBe(1 * GAME_CONFIG.station.upgradeCostMultiplier);
    expect(getUpgradeCost(2)).toBe(2 * GAME_CONFIG.station.upgradeCostMultiplier);
  });

  it("크레딧이 부족하면 업그레이드되지 않는다", () => {
    let state = createInitialState();
    state.ledger = GAME_CONFIG.station.upgradeCostMultiplier - 1000;
    state.stationState = {
      stationId: "st1",
      fixerId: "f1",
      category: "업무",
      facilityName: "Test",
      locationTier: "중층",
      locationArea: "Test Area",
      level: 1,
      operatingCostPerTurn: 500,
      analysisMercLv: 0,
      analysisMissionLv: 0
    };

    const next = upgradeStation(state);
    expect(next.ledger).toBe(GAME_CONFIG.station.upgradeCostMultiplier - 1000); // 변화 없음
    expect(next.stationState?.level).toBe(1);
  });

  it("크레딧이 충분하면 업그레이드되고 지휘력과 유지비가 상승한다", () => {
    let state = createInitialState();
    const cost = getUpgradeCost(1);
    state.ledger = cost + 5000;
    state.maxCommandPoints = 4;
    state.currentCommandPoints = 4;
    state.stationState = {
      stationId: "st1",
      fixerId: "f1",
      category: "업무",
      facilityName: "Test",
      locationTier: "중층",
      locationArea: "Test Area",
      level: 1,
      operatingCostPerTurn: 500,
      analysisMercLv: 0,
      analysisMissionLv: 0
    };

    const next = upgradeStation(state);
    expect(next.ledger).toBe(5000); // (cost + 5000) - cost
    expect(next.stationState?.level).toBe(2);
    expect(next.stationState?.operatingCostPerTurn).toBe(Math.pow(2, 2) * GAME_CONFIG.station.operatingCostBaseMultiplier);
    expect(next.stationState?.analysisMercLv).toBe(1);
    expect(next.maxCommandPoints).toBe(6);
    expect(next.currentCommandPoints).toBe(6);
  });
});

import { hireMercenary, fireMercenary, getHiringCost, replaceDestroyedGear } from "./station";

describe("Mercenary Hiring & Firing Logic", () => {
  it("getHiringCost는 commandCost * hiringCostMultiplier를 반환한다 (또는 hiringCost 우선)", () => {
    // merc_breaker_01의 commandCost는 4
    expect(getHiringCost("merc_breaker_01")).toBe(4 * GAME_CONFIG.mercenary.hiringCostMultiplier);
  });

  it("크레딧이 충분하면 고용되고 명단에 추가된다", () => {
    let state = createInitialState();
    const cost = getHiringCost("merc_breaker_01");
    state.ledger = cost + 2000;
    state.hiredMercs = []; // 명단 비우기

    const next = hireMercenary(state, "merc_breaker_01");
    expect(next.hiredMercs).toContain("merc_breaker_01");
    expect(next.ledger).toBe(2000); // (cost + 2000) - cost
  });

  it("크레딧이 부족하면 고용되지 않는다", () => {
    let state = createInitialState();
    const cost = getHiringCost("merc_breaker_01");
    state.ledger = cost - 1000;
    state.hiredMercs = [];

    const next = hireMercenary(state, "merc_breaker_01");
    expect(next.hiredMercs).not.toContain("merc_breaker_01");
    expect(next.ledger).toBe(cost - 1000);
  });

  it("이미 고용된 용병은 중복 고용되지 않으며 크레딧도 소모되지 않는다", () => {
    let state = createInitialState();
    state.ledger = 50000;
    state.hiredMercs = ["merc_breaker_01"];

    const next = hireMercenary(state, "merc_breaker_01");
    expect(next.hiredMercs.length).toBe(1);
    expect(next.ledger).toBe(50000);
  });

  it("해고하면 명단에서 지워진다", () => {
    let state = createInitialState();
    state.hiredMercs = ["merc_breaker_01", "merc_malt_01"];

    const next = fireMercenary(state, "merc_breaker_01");
    expect(next.hiredMercs).not.toContain("merc_breaker_01");
    expect(next.hiredMercs).toContain("merc_malt_01");
  });
});

import { STATUS_GEAR_DESTROYED, STATUS_GEAR_DESTROYED_JOKER } from "../data/constants";

describe("replaceDestroyedGear Logic", () => {
  it("크레딧이 충분하고 장비 파손 상태가 있으면 상태가 지워지고 크레딧이 차감되며 실제 소유 장비 상태도 normal로 복구된다", () => {
    let state = createInitialState();
    state.ledger = GAME_CONFIG.mercenary.replacementCost + 1000;
    state.mercStatuses.merc_breaker_01 = [STATUS_GEAR_DESTROYED, "status_fatigue_sleep_debt"];
    state.gearStates.gear_feet_insulated_boots_01 = "destroyed"; // 강제 파손

    const next = replaceDestroyedGear(state, "merc_breaker_01");
    expect(next.mercStatuses.merc_breaker_01).not.toContain(STATUS_GEAR_DESTROYED);
    expect(next.mercStatuses.merc_breaker_01).toContain("status_fatigue_sleep_debt");
    expect(next.gearStates.gear_feet_insulated_boots_01).toBe("normal"); // 복구 확인
    expect(next.ledger).toBe(1000);
  });

  it("크레딧이 부족하면 장비 파손 상태가 지워지지 않고 크레딧도 차감되지 않는다", () => {
    let state = createInitialState();
    state.ledger = GAME_CONFIG.mercenary.replacementCost - 500;
    state.mercStatuses.merc_breaker_01 = [STATUS_GEAR_DESTROYED_JOKER];

    const next = replaceDestroyedGear(state, "merc_breaker_01");
    expect(next.mercStatuses.merc_breaker_01).toContain(STATUS_GEAR_DESTROYED_JOKER);
    expect(next.ledger).toBe(GAME_CONFIG.mercenary.replacementCost - 500);
  });

  it("용병에게 장비 파손 상태가 없으면 장비 정비를 돌려도 크레딧이 소모되지 않고 다른 상태가 유지된다", () => {
    let state = createInitialState();
    state.ledger = GAME_CONFIG.mercenary.replacementCost + 2000;
    state.mercStatuses.merc_breaker_01 = ["status_fatigue_sleep_debt"];

    const next = replaceDestroyedGear(state, "merc_breaker_01");
    expect(next.mercStatuses.merc_breaker_01).toContain("status_fatigue_sleep_debt");
    expect(next.ledger).toBe(GAME_CONFIG.mercenary.replacementCost + 2000);
  });
});
