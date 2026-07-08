/**
 * T-DC-SETTLE: 캐치업 보상 → 정산 크레딧 통합 (RED → GREEN)
 *
 * catchUpBonusEarned 런타임 플래그가 extraRewardCredits / netCredits / ledger에
 * 반영되는지 executeMissionRun → applySettlement 파이프라인으로 검증한다.
 */
import { describe, expect, it } from "vitest";
import { createMockMercenary, createMockMission } from "../test/factories";
import { executeMissionRun } from "./missionRunExecutor";
import { resetNodeInstanceCounter } from "./nodeQueue";
import { applySettlement, netCredits } from "./settlement";
import { createInitialState } from "./state";
import { GAME_CONFIG } from "../data/config";

function makeCatchUpMission(rewardCredits = 10_000) {
  return createMockMission({
    rewardCredits,
    difficultyStars: 2,
    nodes: [
      { nameKo: "진입", role: "entry", statCheck: "frame" },
      { nameKo: "목표", role: "objective", statCheck: "frame" },
      { nameKo: "이탈", role: "exit", statCheck: "frame" },
    ],
  });
}

function calcCatchUpBonus(rewardCredits: number): number {
  return Math.floor(rewardCredits * (GAME_CONFIG.catchUp.bonusRewardPercent / 100));
}

describe("catchUp settlement integration (T-DC-SETTLE)", () => {
  it("T-DC-SETTLE-1: catchUp 개입 성공 시 extraRewardCredits 반영 → netCredits가 무개입 성공 대비 높다", () => {
    resetNodeInstanceCounter();
    const withCatchUp = executeMissionRun({
      mission: makeCatchUpMission(),
      merc: createMockMercenary(),
      rng: () => 0.01,
      catchUp: { interventionNodeNamesKo: ["목표"] },
    });
    resetNodeInstanceCounter();
    const withoutCatchUp = executeMissionRun({
      mission: makeCatchUpMission(),
      merc: createMockMercenary(),
      rng: () => 0.01,
    });

    expect(withCatchUp.report.catchUpBonusEarned).toBe(true);
    expect(withCatchUp.report.resultType).toBe("success");
    expect(withoutCatchUp.report.resultType).toBe("success");

    const expectedBonus = calcCatchUpBonus(withCatchUp.report.rewardCredits);
    expect(withCatchUp.report.extraRewardCredits).toBe(expectedBonus);
    expect(netCredits(withCatchUp.report)).toBe(
      withCatchUp.report.rewardCredits + expectedBonus - withCatchUp.report.lostCredits,
    );
    expect(netCredits(withCatchUp.report)).toBeGreaterThan(netCredits(withoutCatchUp.report));
  });

  it("T-DC-SETTLE-2: applySettlement — catchUp 보너스가 ledger·totalCreditsEarned에 반영된다", () => {
    resetNodeInstanceCounter();
    const { report } = executeMissionRun({
      mission: makeCatchUpMission(10_000),
      merc: createMockMercenary(),
      rng: () => 0.01,
      catchUp: { interventionNodeNamesKo: ["목표"] },
    });

    expect(report.catchUpBonusEarned).toBe(true);

    const expectedNet = 10_000 + calcCatchUpBonus(10_000);
    expect(netCredits(report)).toBe(expectedNet);

    const next = applySettlement(createInitialState(), report);
    expect(next.ledger).toBe(expectedNet);
    expect(next.playerBehavioralStats.totalCreditsEarned).toBe(expectedNet);
  });

  it("T-DC-SETTLE-3: catchUp 활성이나 개입 노드 실패 시 extraRewardCredits는 0", () => {
    resetNodeInstanceCounter();
    const { report } = executeMissionRun({
      mission: makeCatchUpMission(),
      merc: createMockMercenary({
        stats: { frame: 1, cool: 1, wire: 1, cypher: 1, pulse: 1 },
      }),
      rng: () => 0.99,
      catchUp: { interventionNodeNamesKo: ["목표"] },
    });

    expect(report.catchUpActive).toBe(true);
    expect(report.catchUpBonusEarned).toBe(false);
    expect(report.extraRewardCredits).toBe(0);
    expect(netCredits(report)).toBe(report.rewardCredits - report.lostCredits);
  });
});
